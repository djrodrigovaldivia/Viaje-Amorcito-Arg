import { LANDMARKS, Landmark } from '../data/landmarks';
import { DaySchedule } from '../types/schedule';
import { ARGENTINA_CITIES, findNearestArgentineCity } from '../services/weatherService';

interface OfflineQueryContext {
  message: string;
  itinerary: DaySchedule[];
  userLocation: { lat: number; lng: number } | null;
}

// Haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Find nearest landmark to user coordinates
export function getNearestLandmark(
  userLat: number,
  userLng: number
): { landmark: Landmark; distanceKm: number } {
  let nearest = LANDMARKS[0];
  let minDistance = Infinity;

  for (const l of LANDMARKS) {
    const dist = getDistanceKm(userLat, userLng, l.coordinates.lat, l.coordinates.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = l;
    }
  }

  return { landmark: nearest, distanceKm: minDistance };
}

export function generateOfflineResponse({
  message,
  itinerary,
  userLocation,
}: OfflineQueryContext): string {
  const query = message.toLowerCase();

  // 0. Ropa Usada, Ropa Americana, Vintage (@maria_la_vintage), Tiendas tipo Zara Baratas & Mall Chinos
  if (
    query.includes('ropa usada') ||
    query.includes('ropa americana') ||
    query.includes('vintage') ||
    query.includes('feria americana') ||
    query.includes('ferias americanas') ||
    query.includes('zara') ||
    query.includes('sara') ||
    query.includes('outlet') ||
    query.includes('outlets') ||
    query.includes('chino') ||
    query.includes('chinos') ||
    query.includes('barrio chino') ||
    query.includes('comprar') ||
    query.includes('shopping') ||
    query.includes('tiendas') ||
    query.includes('moda') ||
    query.includes('juan perez') ||
    query.includes('galpon') ||
    query.includes('galpón') ||
    query.includes('avellaneda') ||
    query.includes('argerich') ||
    query.includes('aguirre') ||
    query.includes('blazer') ||
    query.includes('falda')
  ) {
    return (
      `👗 **¡Mi amorcito lindo! Te armé una ruta perfecta con la vibra de @maria_la_vintage, tiendas tipo Zara nada caras y Mall Chinos:**\n\n` +
      `1. **Juan Perez Vintage (Marcelo T. de Alvear 1355, Recoleta)**: El paraíso de ropa usada con blazers oversize, chaquetas de gamuza/cuero, faldas midi y prendas Zara desde $8.000 ARS (~$7.000 CLP).\n` +
      `2. **Galpón de Ropa (Cabrera 4667, Palermo Soho)**: Reponen todos los días a las 11:00 AM miles de prendas usadas de Zara, Mango, Complot y Rapsodia súper baratas.\n` +
      `3. **Outlets de Calle Aguirre 600-900 y Gurruchaga (Villa Crespo)**: Outlets de tendencia europea (*Complot, Las Pepas, Desiderata*) con 50% OFF en encaje, cuero y wide-leg.\n` +
      `4. **Ruta Zara "Special Prices" + Tiendas Ver & Yagmour (Av. Santa Fe 2000-3250)**: Tendencia igualita a Zara pero a precios súper accesibles + **Cocoliche Vintage (Av. Santa Fe 2450)**.\n` +
      `5. **Calles Argerich y Helguera en Av. Avellaneda (Flores)**: El *"Zara Mayorista"* donde fabrican blazers, corsets y faldas en tendencia entre $4.500 y $15.000 ARS (~$4.000 a $13.500 CLP) pagando en efectivo.\n` +
      `6. **Mall Chinos y Lentes/Accesorios**: Ve al **Barrio Chino de Belgrano** (Calle Arribeños: *Casa China* y *Asia Oriental*, a 4 cuadras de **Urban Luxury Ropa Usada** en Cabildo 2040) y a las importadoras chinas de **Once (Av. Pueyrredón y Pasteur)**.\n\n` +
      `👉 *Toca el botón **"👗 Ropa Usada & Zara"** arriba o en el mapa para volar directo a cada tienda po, mi amorcito.*`
    );
  }

  // 1. Weather, Climate, What to wear & What to pack (Offline Engine in Chilean Spanish)
  if (
    query.includes('clima') ||
    query.includes('tiempo') ||
    query.includes('temperatura') ||
    query.includes('frío') ||
    query.includes('frio') ||
    query.includes('calor') ||
    query.includes('ropa') ||
    query.includes('empacar') ||
    query.includes('llevar') ||
    query.includes('campera') ||
    query.includes('chaqueta') ||
    query.includes('abrigo') ||
    query.includes('lluvia') ||
    query.includes('paraguas') ||
    query.includes('viento') ||
    query.includes('pongo')
  ) {
    const foundCity = ARGENTINA_CITIES.find(
      (c) => query.includes(c.name.toLowerCase()) || c.province.toLowerCase().includes(query)
    );

    const targetCity =
      foundCity ||
      (userLocation
        ? findNearestArgentineCity(userLocation.lat, userLocation.lng)
        : ARGENTINA_CITIES[0]);

    return (
      `🌤️ **Mi amorcito lindo, te cuento al tiro cómo está el clima en ${targetCity.name}:**\n\n` +
      `• **Temperatura típica ahora:** entre ${targetCity.typicalNovTemp.min}°C y ${targetCity.typicalNovTemp.max}°C.\n` +
      `• **Ambiente:** ${targetCity.climateType.replace('_', ' ').toUpperCase()}.\n\n` +
      `🧥 **¿Qué te tinca ponerte hoy, amorcito?:**\n` +
      targetCity.defaultPacking.clothing.map((c) => `  • ${c}`).join('\n') +
      `\n\n` +
      `🎒 **No se te vaya a quedar en el hotel:**\n` +
      targetCity.defaultPacking.accessories.map((a) => `  • ${a}`).join('\n') +
      `\n\n` +
      `💕 *Encargo de Rodrigo para ti, mi amorcito:* ${targetCity.defaultPacking.rodrigoTip}\n\n` +
      `👉 *Si tocas el botón "Clima" arriba, vas a ver el pronóstico de todos tus días po.*`
    );
  }

  // 2. Travel Diary & Photos ("Diario de Viaje")
  if (
    query.includes('diario') ||
    query.includes('foto') ||
    query.includes('fotos') ||
    query.includes('recuerdo') ||
    query.includes('camara') ||
    query.includes('cámara') ||
    query.includes('guardar') ||
    query.includes('nota') ||
    query.includes('anecdota') ||
    query.includes('anécdota')
  ) {
    return (
      `📸 **Tu Diario de Viaje personal, mi amorcito 💕:**\n\n` +
      `Te dejé listo tu diario para que saques fotos bacanes con tu iPhone sin gastar ni un mega de internet:\n` +
      `1. Toca el botón **"Diario"** arriba o en tu Modo Esencial.\n` +
      `2. Puedes **sacar fotos al tiro con la cámara de tu iPhone** o subir de tu galería.\n` +
      `3. Escribe una notita corta de lo que sentiste y ponle un emoji bonito (😍, 🏔️, ☕).\n` +
      `4. Queda todo **100% guardado en la memoria de tu iPhone**, así cuando vuelvas a Chile vemos todas tus fotos juntos, mi amorcito lindo.`
    );
  }

  // 3. Location / "¿Dónde estoy?"
  if (
    query.includes('donde estoy') ||
    query.includes('dónde estoy') ||
    query.includes('mi ubicacion') ||
    query.includes('mi ubicación') ||
    query.includes('ubicacion') ||
    query.includes('ubicación') ||
    query.includes('cerca') ||
    query.includes('perdida')
  ) {
    if (userLocation) {
      const nearest = getNearestLandmark(userLocation.lat, userLocation.lng);
      const nearestCity = findNearestArgentineCity(userLocation.lat, userLocation.lng);
      return (
        `📍 **¡Aquí te tengo ubicada, mi amorcito lindo! 💕**:\n\n` +
        `Estás cerquita de **${nearestCity.name} (${nearestCity.province})** (Coordenadas: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}).\n` +
        `El lugar turístico más cercano es **${nearest.landmark.name}**, a unos **${nearest.distanceKm} km** de donde estás parada ahora.\n\n` +
        `🌤️ **Temperatura por ahí:** entre ${nearestCity.typicalNovTemp.min}°C y ${nearestCity.typicalNovTemp.max}°C.\n` +
        `💕 *Tip para ti, amorcito:* ${nearestCity.defaultPacking.rodrigoTip}\n\n` +
        `Quédate súper tranquila po, que el GPS de tu iPhone funciona aunque no tengas internet.`
      );
    } else {
      return (
        `📍 **Amorcito lindo, todavía no tengo tu punto GPS actual:**\n\n` +
        `Toca el botón rosado **"📍 ¿Dónde estoy? (GPS)"** aquí mismo para que tu iPhone me diga en 1 segundo dónde estás parada y te apague el GPS al tiro para cuidar tu batería.`
      );
    }
  }

  // 4. Schedule / Itinerario / Horarios de hoy
  if (
    query.includes('horario') ||
    query.includes('itinerario') ||
    query.includes('schedule') ||
    query.includes('hoy') ||
    query.includes('plan') ||
    query.includes('actividad') ||
    query.includes('agenda') ||
    query.includes('toca')
  ) {
    if (itinerary && itinerary.length > 0) {
      const totalActivities = itinerary.reduce(
        (acc, d) => acc + (d.activities ? d.activities.length : 0),
        0
      );
      const pendingActivities = itinerary.reduce(
        (acc, d) => acc + (d.activities ? d.activities.filter((a) => !a.done).length : 0),
        0
      );

      let text = `🗓️ **Mira mi amorcito, este es el resumen de tu itinerario:**\n\n`;
      text += `Tienes **${itinerary.length} días** armados con **${totalActivities} panoramas** (${pendingActivities} por hacer):\n\n`;

      itinerary.forEach((d) => {
        text += `🔹 **Día ${d.dayNumber}: ${d.title}** (${d.city})\n`;
        (d.activities || []).forEach((a) => {
          text += `   • ${a.time ? `[${a.time} hrs]` : '•'} ${a.title} ${a.done ? '✅' : '⏳'}\n`;
        });
        if (d.tipsForMaria) {
          text += `   💕 *${d.tipsForMaria}*\n`;
        }
        text += `\n`;
      });

      text += `👉 *Puedes ir marcando con un ticket ✅ lo que ya hiciste en el botón "Itinerario", mi amorcito.*`;
      return text;
    } else {
      return (
        `🗓️ **Amorcito, aún no tienes actividades anotadas en el itinerario.**\n\n` +
        `Toca el botón **"Itinerario"** para ver o editar tus días en Argentina po.`
      );
    }
  }

  // 5. Opening Hours of Iconic Places
  if (
    query.includes('abre') ||
    query.includes('cierra') ||
    query.includes('apertura') ||
    query.includes('atencion') ||
    query.includes('atención') ||
    query.includes('abierto') ||
    query.includes('hora')
  ) {
    return (
      `⏰ **Horarios de los lugares más bacanes para que te programes bien, mi amorcito:**\n\n` +
      `• **Teatro Colón (Buenos Aires)**: Visitas guiadas todos los días de 10:00 a 16:45 hrs.\n` +
      `• **Cataratas del Iguazú**: Abierto de 08:00 a 18:00 hrs (última entrada 16:30 hrs). El trencito a la Garganta del Diablo sale hasta las 16:00 hrs.\n` +
      `• **Glaciar Perito Moreno**: De 08:00 a 18:00 hrs en temporada primavera/verano.\n` +
      `• **Caminito y La Boca**: Es más lindo y seguro ir entre las 10:30 y las 18:00 hrs con luz de día, amorcito.\n` +
      `• **Parque Aconcagua (Mendoza)**: Abierto de 08:00 a 17:00 hrs.`
    );
  }

  // 6. Food & Recommendations
  if (
    query.includes('comer') ||
    query.includes('comida') ||
    query.includes('hambre') ||
    query.includes('empanada') ||
    query.includes('asado') ||
    query.includes('helado') ||
    query.includes('restaurant') ||
    query.includes('café') ||
    query.includes('cafe') ||
    query.includes('once') ||
    query.includes('merienda') ||
    query.includes('dulce de leche')
  ) {
    return (
      `🍴 **¡Qué rico mi amorcito! Mira estas recomendaciones para comer delicioso allá:**\n\n` +
      `1. **Helados Rapanui o Luccianos**: Tienes que probar los *Franui* (frambuesas bañadas en chocolate) y el helado de dulce de leche. ¡Te van a encantar caleta!\n` +
      `2. **Tomar once (allá le dicen "Merienda")**: Pide un cafecito con **medialunas de manteca calentitas** en el Café Tortoni o Las Violetas.\n` +
      `3. **Empanadas y Carne**: Prueba las empanadas salteñas cortadas a cuchillo y una provoleta a la parrilla.\n` +
      `4. **Propina**: Acuérdate que allá al igual que en Chile se deja el **10% de propina** en los restaurantes po, amorcito.`
    );
  }

  // 7. Practical tips: Transportation, SUBE, Money, Chilean vs Argentine words
  if (
    query.includes('sube') ||
    query.includes('transporte') ||
    query.includes('colectivo') ||
    query.includes('micro') ||
    query.includes('metro') ||
    query.includes('subte') ||
    query.includes('taxi') ||
    query.includes('uber') ||
    query.includes('plata') ||
    query.includes('dinero') ||
    query.includes('pesos') ||
    query.includes('cambio') ||
    query.includes('propina') ||
    query.includes('seguridad')
  ) {
    return (
      `💡 **Datos súper útiles para moverte tranquila, mi amorcito:**\n\n` +
      `• **Micro y Metro (allá se llaman Colectivo y Subte)**: Se pagan con la tarjeta **SUBE** (es como la Bip! de Santiago). En el Subte también puedes pagar directo acercando tu tarjeta del banco o Apple Pay del iPhone.\n` +
      `• **Uber y Cabify**: Funcionan súper bien y son muy seguros para que no andes tomando cualquier taxi en la calle.\n` +
      `• **Cambio de Pesos Chilenos a Argentinos**: En el **Menú Fácil -> Cambio $** te dejé una calculadora que funciona sin internet para que veas al tiro cuánto sale todo en pesos chilenos y el 10% de propina.\n` +
      `• **Cuidado en la calle**: Cuida tu iPhone cuando saques fotos en la vereda, mi amorcito lindo.`
    );
  }

  // 8. Love / Missing Rodrigo
  if (
    query.includes('rodrigo') ||
    query.includes('extraño') ||
    query.includes('extrano') ||
    query.includes('amo') ||
    query.includes('amor') ||
    query.includes('sola') ||
    query.includes('triste') ||
    query.includes('cartita')
  ) {
    return (
      `💌 **¡Ay mi amorcito lindo, Rodrigo te ama y te extraña caleta! ❤️**\n\n` +
      `Aunque estés al otro lado de la cordillera, Rodrigo hizo cada rincón de esta app pensando en cuidarte y acompañarte a cada paso.\n\n` +
      `👉 Toca el botón **"Cartitas 💌"** arriba para leer o escuchar con voz las cartas de amor que te dejó escritas para cuando lo extrañes, cuando estés tomando un cafecito o antes de dormir. ¡Te manda un abrazo gigante y miles de besos, mi amorcito!`
    );
  }

  // 9. Specific landmark search
  const matchedLandmark = LANDMARKS.find(
    (l) =>
      query.includes(l.shortTitle.toLowerCase()) ||
      query.includes(l.name.toLowerCase()) ||
      query.includes(l.province.toLowerCase())
  );

  if (matchedLandmark) {
    return (
      `🏛️ **Mira mi amorcito, te cuento sobre ${matchedLandmark.name}:**\n\n` +
      `• **Dónde queda:** ${matchedLandmark.province} (${matchedLandmark.regionName})\n` +
      `• **Altura:** ${matchedLandmark.elevation.toLocaleString()} msnm\n` +
      `• **Qué lo hace tan bacán:** ${matchedLandmark.badge}\n` +
      `• **Mejor época:** ${matchedLandmark.bestSeason}\n\n` +
      `📖 **Historia:** ${matchedLandmark.description}\n\n` +
      `✨ **Dato curioso para ti, amorcito:** ${matchedLandmark.curiosities[0]}`
    );
  }

  // Default warm Chilean male guide fallback calling her Amorcito
  return (
    `💕 **¡Hola mi amorcito lindo! 🇨🇱❤️🇦🇷**\n\n` +
    `Aquí estoy contigo en tu iPhone (funcionando en modo ahorro de batería y 100% sin internet si estás en la calle).\n\n` +
    `Háblame con el micrófono o pregúntame al tiro lo que te tinque:\n` +
    `• *"¿Qué clima hace y qué abrigo me pongo hoy?"*\n` +
    `• *"¿Dónde estoy parada ahora y qué hay cerca?"*\n` +
    `• *"¿Qué me toca hoy en mi itinerario?"*\n` +
    `• *"¿Dónde tomo once o como helado rico?"*\n` +
    `• *"¿Cómo funciona el Subte, la micro y el cambio de pesos?"*\n` +
    `• *"Extraño a Rodrigo"* 💌\n\n` +
    `¡Dime no más mi amorcito, te escucho con todo el amor del mundo!`
  );
}
