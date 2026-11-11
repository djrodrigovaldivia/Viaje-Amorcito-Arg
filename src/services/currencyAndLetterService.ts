import { DaySchedule } from '../types/schedule';
import { ARGENTINA_CITIES, findNearestArgentineCity } from './weatherService';

export interface DailyExchangeRates {
  clpPer1000Ars: number; // How many Chilean Pesos (CLP) equal 1,000 Argentine Pesos (ARS)
  arsPer1000Clp: number; // How many Argentine Pesos (ARS) you get for 1,000 Chilean Pesos (CLP)
  arsPerUsdBlue: number; // Dólar Blue / Turista in Argentina
  arsPerUsdOfficial: number; // Dólar Oficial in Argentina
  clpPerUsd: number; // Dólar in Chile
  updatedAtIso: string;
  updatedAtLabel: string;
  source: 'live' | 'cached' | 'manual';
}

export interface DailyRodrigoLetter {
  dateKey: string;
  dayGreeting: string;
  title: string;
  content: string;
  itineraryContext: string;
  weatherNote: string;
  fashionTipOfTheDay: string;
  argentinaTipOfTheDay: string;
  isCustomFromRodrigo?: boolean;
}

const RATES_STORAGE_KEY = 'amorcito_daily_exchange_rates_v2';
const CUSTOM_LETTER_STORAGE_KEY = 'amorcito_custom_rodrigo_letter_v1';

// Realistic default fallback rates if opened offline on very first boot
const DEFAULT_RATES: DailyExchangeRates = {
  clpPer1000Ars: 880,
  arsPer1000Clp: 1136,
  arsPerUsdBlue: 1135,
  arsPerUsdOfficial: 1015,
  clpPerUsd: 980,
  updatedAtIso: new Date().toISOString(),
  updatedAtLabel: 'Tasa base guardada offline',
  source: 'cached',
};

export function getSavedExchangeRates(): DailyExchangeRates {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyExchangeRates;
      if (parsed && parsed.clpPer1000Ars > 0 && parsed.arsPerUsdBlue > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return DEFAULT_RATES;
}

export function saveExchangeRates(partial: Partial<DailyExchangeRates>): DailyExchangeRates {
  const current = getSavedExchangeRates();
  const clpPer1000Ars = partial.clpPer1000Ars ?? current.clpPer1000Ars;
  const arsPer1000Clp =
    partial.arsPer1000Clp ?? (clpPer1000Ars > 0 ? Math.round((1000 / clpPer1000Ars) * 1000) : 1136);

  const updated: DailyExchangeRates = {
    ...current,
    ...partial,
    clpPer1000Ars,
    arsPer1000Clp,
  };

  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

/**
 * Fetches live daily exchange rates (CLP <-> ARS & USD Blue/Official) from free, zero-key public APIs.
 * Automatically caches in localStorage so it works 100% offline in the street.
 */
export async function syncDailyExchangeRates(force = false): Promise<DailyExchangeRates> {
  const existing = getSavedExchangeRates();

  // If already synced within the last 4 hours and not forced, reuse to save iPhone battery
  if (!force && existing.source === 'live' && existing.updatedAtIso) {
    const ageMs = Date.now() - new Date(existing.updatedAtIso).getTime();
    if (ageMs < 4 * 60 * 60 * 1000) {
      return existing;
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return existing;
  }

  let arsPerUsdBlue = existing.arsPerUsdBlue;
  let arsPerUsdOfficial = existing.arsPerUsdOfficial;
  let clpPerUsd = existing.clpPerUsd;
  let gotLive = false;

  // 1. Fetch Argentine Dólar Blue & Oficial from DolarApi.com (100% free, no key)
  try {
    const dolarRes = await fetch('https://dolarapi.com/v1/dolares');
    if (dolarRes.ok) {
      const dolares = await dolarRes.json();
      if (Array.isArray(dolares)) {
        const blue = dolares.find((d: any) => d.casa === 'blue');
        const oficial = dolares.find((d: any) => d.casa === 'oficial');
        if (blue?.venta > 0) {
          arsPerUsdBlue = Math.round((Number(blue.compra) + Number(blue.venta)) / 2);
          gotLive = true;
        }
        if (oficial?.venta > 0) {
          arsPerUsdOfficial = Math.round((Number(oficial.compra) + Number(oficial.venta)) / 2);
          gotLive = true;
        }
      }
    }
  } catch (_) {}

  // 2. Fetch global USD -> CLP & ARS from Open ExchangeRate API (100% free, no key)
  try {
    const erRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (erRes.ok) {
      const erData = await erRes.json();
      if (erData?.rates) {
        if (erData.rates.CLP > 0) {
          clpPerUsd = Math.round(Number(erData.rates.CLP));
          gotLive = true;
        }
        if (erData.rates.ARS > 0 && !gotLive) {
          arsPerUsdOfficial = Math.round(Number(erData.rates.ARS));
          gotLive = true;
        }
      }
    }
  } catch (_) {}

  // 3. Fallback to jsDelivr Currency API if needed
  if (!gotLive) {
    try {
      const cdnRes = await fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
      );
      if (cdnRes.ok) {
        const cdnData = await cdnRes.json();
        if (cdnData?.usd?.clp > 0) {
          clpPerUsd = Math.round(Number(cdnData.usd.clp));
          gotLive = true;
        }
        if (cdnData?.usd?.ars > 0 && arsPerUsdOfficial === DEFAULT_RATES.arsPerUsdOfficial) {
          arsPerUsdOfficial = Math.round(Number(cdnData.usd.ars));
        }
      }
    } catch (_) {}
  }

  const effectiveArsPerUsd = arsPerUsdBlue > 0 ? arsPerUsdBlue : arsPerUsdOfficial;
  const clpPer1000Ars = Math.max(
    400,
    Math.min(2500, Math.round((clpPerUsd / effectiveArsPerUsd) * 1000))
  );
  const arsPer1000Clp = Math.round((effectiveArsPerUsd / clpPerUsd) * 1000);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return saveExchangeRates({
    clpPer1000Ars,
    arsPer1000Clp,
    arsPerUsdBlue,
    arsPerUsdOfficial,
    clpPerUsd,
    updatedAtIso: now.toISOString(),
    updatedAtLabel: gotLive ? `Actualizado hoy (${formattedDate})` : existing.updatedAtLabel,
    source: gotLive ? 'live' : existing.source,
  });
}

const DAILY_FASHION_TIPS_POOL: string[] = [
  '👗 **Tip de Moda & Ropa Usada (Vibe @maria_la_vintage):** En **Juan Perez Vintage** (Marcelo T. de Alvear 1355, Recoleta) tienen pisos enteros con exactamente el estilo que amas: blazers sastreros oversize, chaquetas de gamuza camel, faldas midi de cuero/satín y percheros de Zara segunda mano desde $8.000 ARS (~$7.000 CLP). ¡Pasa directo al sector de discontinuos del fondo!',
  '✨ **Tendencia Tipo Zara sin Pagar Caro (Outlets de Calle Aguirre):** En **Villa Crespo (Calle Aguirre 600 al 900 y Gurruchaga)** están los outlets de **Complot, Las Pepas, Desiderata y Ayres** con 40% a 60% de descuento. Vas a pillar tops de encaje animal print, pantalones wide-leg, faldas metalizadas y chaquetas de cuero con toda la onda europea a mitad de precio.',
  '👠 **El Secreto del "Zara Mayorista" (Calles Argerich y Helguera en Flores):** Cruzando Av. Avellaneda, las calles **Argerich, Helguera y Cuenca** están llenas de showrooms de diseño joven que fabrican la última tendencia europea (corsets, blazers, faldas midi, tejidos y sastrería) entre **$4.500 y $15.000 ARS (~$4.000 a $13.500 CLP)**. ¡Ideal para ti y hasta para sacar joyitas para @maria_la_vintage!',
  '🧥 **Zara Segunda Mano en Palermo Soho (Galpón de Ropa):** En **Galpón de Ropa** (Cabrera 4667 y Loyola 851) reponen percheros todos los días a las 11:00 AM. Es donde más llegan prendas usadas impecables de **Zara, Mango, H&M, Kosiuko y Rapsodia** a precios bajísimos, ordenadas por color.',
  '🖤 **Ruta Zara "Special Prices" + Tiendas Ver & Yagmour (Av. Santa Fe):** En el Zara de Alto Palermo busca el rincón **"Special Prices"** (rebajas permanentes), y caminando por **Av. Santa Fe** entra a las tiendas **"Ver"** y **"Yagmour"** + **Cocoliche Vintage (Santa Fe 2450)**: pura tendencia sastrera, chalecos tejidos y camisas con cuello súper baratas.',
  '🏮 **Tu Panorama Doble (Ropa Usada + Mall Chinos de Belgrano y Once):** En **Av. Cabildo 2040** tienes **Urban Luxury** (ropa usada seleccionada) a 4 cuadras del **Barrio Chino** (*Casa China*, *Asia Oriental*). Y si quieres lentes de sol rectangulares, cinturones con hebilla dorada, gorros peluditos y carteras baguette por $2.000 CLP, pasa por los **Mall Chinos de Once (Av. Pueyrredón y Pasteur)**.',
];

const DAILY_ARGENTINA_FACTS_POOL: string[] = [
  '🇦🇷 **Dato Argentino de Hoy:** En casi todas las tiendas de ropa usada, ferias americanas y locales de moda de Buenos Aires existe el **"Precio Efectivo"** (15% a 25% más barato que con tarjeta). Pregunta siempre *"¿Cuánto me queda abonando en efectivo?"* po, mi amorcito.',
  '🇦🇷 **Dato Argentino de Hoy:** En el Subte (Metro) de Buenos Aires puedes pagar con la tarjeta SUBE o acercando directamente tu iPhone / tarjeta chilena sin contacto en los molinetes habilitados para moverte rapidito entre Palermo, Recoleta y Belgrano.',
  '🇦🇷 **Dato Argentino de Hoy:** Diccionario fashion argentino para cuando vitrinees: a la chaqueta le dicen **"campera"**, al abrigo largo le dicen **"tapado"**, a la polera **"remera"**, al chaleco **"sweater" o "chaleco tejido"**, a la falda **"pollera"** y a la ropa usada **"feria americana" o "moda circular"**.',
  '🇦🇷 **Dato Argentino de Hoy:** Si te da hambre después de recorrer percheros de ropa usada, pasa por *Rapanui* (hay uno hermoso en Recoleta y Palermo) y pide los famosos **Franui** (frambuesas bañadas en chocolate blanco y leche). ¡Son el mejor premio del mundo!',
  '🇦🇷 **Dato Argentino de Hoy:** En los cafés notables de Buenos Aires, cuando pides un café con medialunas de manteca te traen siempre un vasito de soda (agua con gas) gratis para limpiar el paladar.',
  '🇦🇷 **Dato Argentino de Hoy:** Ojo con los talles en Argentina: en pantalones y faldas suelen tener una horma un poquito más chica que en Chile, así que pruébate con calma o mide la cintura con el truco del cuello antes de comprar en ferias donde no haya probador.',
];

const DAILY_LETTER_POOL: { title: string; body: string }[] = [
  {
    title: 'Para la dueña de @maria_la_vintage más hermosa del mundo 👗💕',
    body: 'Hoy desperté pensando en ti y en lo mucho que te amo. Como sé el ojo increíble que tienes para la moda, los blazers oversize, las faldas con onda, la ropa usada y las tendencias tipo Zara (pero a precios inteligentes, nada caro), hoy te actualicé tu cartita y el mapa con una ruta completa de tiendas vintage, outlets y mall chinos. ¡Disfruta cada perchero hoy, mi amorcito lindo!',
  },
  {
    title: 'Mi buscadora de tesoros favorita hoy en Argentina 🧥✨',
    body: 'Mi amorcito preciosa, nadie combina una chaqueta vintage, una camisa con onda o una falda midi tan bacán como tú. Hoy quiero que vitrinees feliz, te pruebes todo lo que te tinque y sientas que ando a tu lado sosteniéndote el café y las bolsas. ¡Te amo caleta po, mi vida!',
  },
  {
    title: 'Un besito de hoy + Ruta Tendencia, Ropa Usada & Mall Chinos 😘🛍️',
    body: '¡Hola mi amorcito! Pasaba a actualizarte tu cartita del día para decirte que te extraño un montón y que te dejé marcados en el mapa 10 puntos imperdibles: desde Juan Perez Vintage y Galpón de Ropa hasta los Outlets de Aguirre, la calle Argerich ("el Zara mayorista") y el Barrio Chino.',
  },
  {
    title: 'Contigo a cada paso en este nuevo día en Argentina 💖🇦🇷',
    body: 'Mi amorcito hermoso, hoy es otro día maravilloso para pasear a tu ritmo, sacar fotos lindas y descubrir joyitas de moda circular y bazares chinos. Mira el tip de moda y el dato argentino que te preparé aquí abajito para hoy.',
  },
  {
    title: 'El mejor look del mundo siempre es tu sonrisa, mi Amorcito 😍',
    body: 'Puedes estar en la tienda vintage más top de Palermo o en pleno Obelisco, pero para mí la mujer con más estilo y más hermosa del universo entero eres tú. ¡Te mando un abrazo apretado y miles de besos hoy!',
  },
];

export function getCustomRodrigoLetter(): { title: string; content: string; updatedAt: string } | null {
  try {
    const raw = localStorage.getItem(CUSTOM_LETTER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function saveCustomRodrigoLetter(title: string, content: string): void {
  try {
    localStorage.setItem(
      CUSTOM_LETTER_STORAGE_KEY,
      JSON.stringify({
        title,
        content,
        updatedAt: new Date().toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    );
  } catch (_) {}
}

export function clearCustomRodrigoLetter(): void {
  try {
    localStorage.removeItem(CUSTOM_LETTER_STORAGE_KEY);
  } catch (_) {}
}

/**
 * Generates Today's Auto-Updating Love Letter from Rodrigo, including:
 * - Time of day in Argentina
 * - Her current itinerary day & pending activity
 * - Today's Vintage / Ropa Usada / Zara-Trend (@maria_la_vintage style) & Mall Chino Tip
 * - Today's Curiosidad / Dato de Argentina
 */
export function getDailyRodrigoLetter(
  schedule: DaySchedule[],
  userLocation: { lat: number; lng: number } | null,
  offsetIndex = 0
): DailyRodrigoLetter {
  const now = new Date();
  const hour = now.getHours();

  let dayGreeting = '¡Buenos días, mi Amorcito lindo! ☀️';
  let timeClosing = 'Que tengas un día maravilloso hoy vitrineando y paseando, mi amorcito.';
  if (hour >= 12 && hour < 20) {
    dayGreeting = '¡Buenas tardes, mi Amorcito preciosa! 🌤️';
    timeClosing = 'Disfruta mucho tu tarde, pasa a mirar ropita linda y tómate una rica once por mí.';
  } else if (hour >= 20 || hour < 6) {
    dayGreeting = '¡Buenas noches, mi Amorcito hermoso! 🌙';
    timeClosing = 'Descansa rico tus piernecitas esta noche y sueña bonito conmigo.';
  }

  const activeDay =
    schedule.find((d) => (d.activities || []).some((a) => !a.done)) ||
    schedule[now.getDate() % Math.max(1, schedule.length)] ||
    schedule[0];

  const nextAct = activeDay?.activities?.find((a) => !a.done) || activeDay?.activities?.[0];

  const itineraryContext = activeDay
    ? `Hoy en tu Día ${activeDay.dayNumber} (${activeDay.city}): ${
        nextAct ? `"${nextAct.title}"${nextAct.time ? ` a las ${nextAct.time} hrs` : ''}` : activeDay.title
      }.`
    : 'Hoy es un día libre hermoso para disfrutar a tu ritmo.';

  const city = userLocation
    ? findNearestArgentineCity(userLocation.lat, userLocation.lng)
    : ARGENTINA_CITIES.find((c) => activeDay?.city?.toLowerCase().includes(c.name.toLowerCase())) ||
      ARGENTINA_CITIES[0];

  const weatherNote = `En ${city.name} hacen unos ${city.typicalNovTemp.min}°C a ${city.typicalNovTemp.max}°C (${city.defaultPacking.clothing[0]}).`;

  const dateStr = now.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate() + offsetIndex;
  const fashionTipOfTheDay =
    DAILY_FASHION_TIPS_POOL[Math.abs(daySeed) % DAILY_FASHION_TIPS_POOL.length];
  const argentinaTipOfTheDay =
    DAILY_ARGENTINA_FACTS_POOL[Math.abs(daySeed) % DAILY_ARGENTINA_FACTS_POOL.length];

  const custom = getCustomRodrigoLetter();
  if (custom && offsetIndex === 0) {
    return {
      dateKey: dateStr,
      dayGreeting,
      title: custom.title || 'Cartita Especial de Hoy de Rodrigo 💌',
      content:
        `${dayGreeting}\n\n${custom.content}\n\n` +
        `${fashionTipOfTheDay}\n\n` +
        `${argentinaTipOfTheDay}\n\n` +
        `📍 ${itineraryContext}\n🧥 ${weatherNote}\n\nCon todo mi amor hoy (${dateStr}),\nTu Rodrigo ❤️`,
      itineraryContext,
      weatherNote,
      fashionTipOfTheDay,
      argentinaTipOfTheDay,
      isCustomFromRodrigo: true,
    };
  }

  const chosen = DAILY_LETTER_POOL[Math.abs(daySeed) % DAILY_LETTER_POOL.length];

  const fullContent =
    `${dayGreeting}\n\n` +
    `${chosen.body}\n\n` +
    `${fashionTipOfTheDay}\n\n` +
    `${argentinaTipOfTheDay}\n\n` +
    `🗓️ **Tu panorama de hoy (${dateStr}):** ${itineraryContext}\n` +
    `🧥 **Qué abrigo ponerte hoy:** ${weatherNote}\n\n` +
    `${timeClosing}\n` +
    `Te ama hoy y siempre, tu Rodrigo ❤️`;

  return {
    dateKey: dateStr,
    dayGreeting,
    title: chosen.title,
    content: fullContent,
    itineraryContext,
    weatherNote,
    fashionTipOfTheDay,
    argentinaTipOfTheDay,
    isCustomFromRodrigo: false,
  };
}
