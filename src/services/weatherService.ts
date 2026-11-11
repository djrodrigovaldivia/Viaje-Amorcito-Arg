export interface WeatherData {
  cityName: string;
  region: string;
  temperature: number; // in °C
  apparentTemperature?: number;
  conditionText: string;
  weatherCode: number;
  icon: string; // emoji or icon key
  windSpeed: number; // km/h
  humidity?: number;
  minTemp?: number;
  maxTemp?: number;
  isDaytime: boolean;
  packingAdvice: {
    clothing: string[];
    accessories: string[];
    rodrigoTip: string;
  };
  isLive: boolean; // true if fetched from live API, false if offline estimate
  updatedAt: string;
}

export interface ArgentineCityCoordinate {
  name: string;
  province: string;
  lat: number;
  lng: number;
  typicalNovTemp: { min: number; max: number };
  climateType: 'subtropical' | 'templado' | 'patagonico_frio' | 'cordillera_arido' | 'extremo_sur';
  defaultPacking: {
    clothing: string[];
    accessories: string[];
    rodrigoTip: string;
  };
}

export const ARGENTINA_CITIES: ArgentineCityCoordinate[] = [
  {
    name: 'Buenos Aires',
    province: 'Ciudad Autónoma de Buenos Aires',
    lat: -34.6037,
    lng: -58.3816,
    typicalNovTemp: { min: 16, max: 26 },
    climateType: 'templado',
    defaultPacking: {
      clothing: ['Zapatillas muy cómodas para caminar cuadras enteras', 'Remeras de algodón livianas', 'Pantalón cómodo o vestido fresco', 'Campera liviana o cardigan para la noche y locales con aire'],
      accessories: ['Cargador portátil para el celu', 'Lentes de sol', 'Billetera o riñonera segura cruzada al pecho'],
      rodrigoTip: 'Amorcito, en Buenos Aires se camina muchísimo por la 9 de Julio, San Telmo y Palermo. Llevá calzado blando y no te olvides la tarjeta SUBE en la cartera.',
    },
  },
  {
    name: 'Puerto Iguazú',
    province: 'Misiones',
    lat: -25.5978,
    lng: -54.5786,
    typicalNovTemp: { min: 21, max: 32 },
    climateType: 'subtropical',
    defaultPacking: {
      clothing: ['Ropa súper liviana y de secado rápido (dri-fit)', 'Piloto impermeable o poncho para las pasarelas de Garganta del Diablo', 'Calzado deportivo con suela antideslizante que no te importe mojar'],
      accessories: ['Repelente de mosquitos (indispensable)', 'Funda impermeable para el celular', 'Protector solar FPS 50+', 'Gorra o sombrero'],
      rodrigoTip: '¡En las pasarelas te vas a empapar con la bruma de las cataratas mi vida! Cuidá tu celu con la bolsita impermeable y llevá una muda de ropa en la mochila.',
    },
  },
  {
    name: 'San Carlos de Bariloche',
    province: 'Río Negro',
    lat: -41.1335,
    lng: -71.3103,
    typicalNovTemp: { min: 6, max: 19 },
    climateType: 'patagonico_frio',
    defaultPacking: {
      clothing: ['Campera rompeviento o softshell abrigada', 'Buzo de polar o sweater térmico', 'Pantalón de trekking o jeans cómodos', 'Remera térmica debajo por si refresca'],
      accessories: ['Lentes de sol (el reflejo del lago y la montaña es fuerte)', 'Protector solar para la cara', 'Gorro liviano o buff para el cuello'],
      rodrigoTip: 'El viento del Lago Nahuel Huapi es fresco incluso en días soleados. Vestite en capas ("modo cebolla") para sacarte abrigo cuando entres a las chocolaterías.',
    },
  },
  {
    name: 'El Calafate',
    province: 'Santa Cruz',
    lat: -50.3382,
    lng: -72.2648,
    typicalNovTemp: { min: 4, max: 15 },
    climateType: 'patagonico_frio',
    defaultPacking: {
      clothing: ['Campera de pluma / abrigo grueso con capucha', 'Primera piel o camiseta térmica manga larga', 'Calzado de trekking con buen agarre para las pasarelas heladas', 'Guantes y cuello térmico'],
      accessories: ['Lentes con protección UV (el hielo del glaciar refleja mucho)', 'Protector labial manteca de cacao', 'Gorro de lana'],
      rodrigoTip: 'Frente al Perito Moreno el viento que baja del campo de hielo es helado mi amor. Abrigate muy bien las orejas y las manos para poder sacar fotos tranquila.',
    },
  },
  {
    name: 'Ushuaia',
    province: 'Tierra del Fuego',
    lat: -54.8019,
    lng: -68.303,
    typicalNovTemp: { min: 3, max: 12 },
    climateType: 'extremo_sur',
    defaultPacking: {
      clothing: ['Campera técnica impermeable y corta viento obligatoria', 'Pantalón abrigado térmico', 'Medias de lana o trekking', 'Bufanda abrigada, guantes y gorro polar'],
      accessories: ['Mochila impermeable', 'Lentes de sol para la navegación en el Canal Beagle', 'Protector labial'],
      rodrigoTip: '¡El fin del mundo es bellísimo pero súper fresco! Aunque veas sol, el viento del canal es frío. No te saques la campera en cubierta del catamarán.',
    },
  },
  {
    name: 'Mendoza',
    province: 'Mendoza',
    lat: -32.8895,
    lng: -68.8458,
    typicalNovTemp: { min: 14, max: 28 },
    climateType: 'cordillera_arido',
    defaultPacking: {
      clothing: ['Ropa casual elegante para bodegas', 'Remeras frescas de día', 'Campera o saquito liviano para la noche (baja la temperatura en la montaña)'],
      accessories: ['Lentes oscuros', 'Protector solar', 'Botellita de agua recargable (el aire es muy seco)'],
      rodrigoTip: 'El clima cuyano es soleado y seco. Tomá mucha agua entre degustaciones de vino y llevá abrigo para la noche cerca de la cordillera.',
    },
  },
  {
    name: 'Salta & Jujuy',
    province: 'Noroeste Argentino',
    lat: -24.7821,
    lng: -65.4232,
    typicalNovTemp: { min: 15, max: 29 },
    climateType: 'cordillera_arido',
    defaultPacking: {
      clothing: ['Ropa holgada de colores claros', 'Campera de abrigo liviana para las alturas de Purmamarca y Salinas', 'Zapatillas de trekking con agarre'],
      accessories: ['Sombrero de ala ancha', 'Lentes de sol UV400', 'Protector solar factor alto', 'Caramelos de coca o menta para la altura (apunamiento)'],
      rodrigoTip: 'En el norte hay mucha amplitud térmica: de día hace calorcito y de noche refresca un montón. Llevá abrigo a mano en el auto o bus.',
    },
  },
];

// Helper to calculate distance between coordinates (Haversine formula in km)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return R * c;
}

// Find nearest Argentine city
export function findNearestArgentineCity(lat: number, lng: number): ArgentineCityCoordinate {
  let closest = ARGENTINA_CITIES[0];
  let minDistance = calculateDistanceKm(lat, lng, closest.lat, closest.lng);

  for (let i = 1; i < ARGENTINA_CITIES.length; i++) {
    const dist = calculateDistanceKm(lat, lng, ARGENTINA_CITIES[i].lat, ARGENTINA_CITIES[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = ARGENTINA_CITIES[i];
    }
  }

  return closest;
}

// Map WMO Weather Code to Spanish description and emoji
export function interpretWmoCode(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Cielo despejado', icon: '☀️' };
  if (code === 1) return { text: 'Mayormente soleado', icon: '🌤️' };
  if (code === 2) return { text: 'Parcialmente nublado', icon: '⛅' };
  if (code === 3) return { text: 'Nublado', icon: '☁️' };
  if (code === 45 || code === 48) return { text: 'Neblina / Bruma', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { text: 'Llovizna suave', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { text: 'Lluvia', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { text: 'Nieve', icon: '❄️' };
  if (code >= 80 && code <= 82) return { text: 'Chubascos de lluvia', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { text: 'Tormenta eléctrica', icon: '⛈️' };
  return { text: 'Tiempo agradable', icon: '🌤️' };
}

/**
 * Fetch real live weather from Open-Meteo free API (no API key required, reliable for all coordinates).
 * Falls back gracefully to the offline climatology engine if offline or fetch fails.
 */
export async function getCityWeather(cityNameOrLocation: string, customLat?: number, customLng?: number): Promise<WeatherData> {
  // Check if we have coordinates
  let lat = customLat;
  let lng = customLng;
  let targetCity = ARGENTINA_CITIES.find(
    (c) =>
      c.name.toLowerCase().includes(cityNameOrLocation.toLowerCase()) ||
      cityNameOrLocation.toLowerCase().includes(c.name.toLowerCase())
  );

  if (!lat || !lng) {
    if (targetCity) {
      lat = targetCity.lat;
      lng = targetCity.lng;
    } else {
      // Default to Buenos Aires
      targetCity = ARGENTINA_CITIES[0];
      lat = targetCity.lat;
      lng = targetCity.lng;
    }
  } else if (!targetCity) {
    targetCity = findNearestArgentineCity(lat, lng);
  }

  const cacheKey = `maria_weather_cache_${targetCity.name}_${lat.toFixed(2)}_${lng.toFixed(2)}`;

  // Try fetching live weather
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FArgentina%2FBuenos_Aires`;
    
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      const daily = data.daily;

      const weatherInfo = interpretWmoCode(current.weather_code);
      const isCold = current.temperature_2m < 12;
      const isWarm = current.temperature_2m >= 25;
      const hasRain = current.precipitation > 0 || current.weather_code >= 51;

      // Dynamic packing advice adjustment based on real live conditions
      const clothing = [...targetCity.defaultPacking.clothing];
      const accessories = [...targetCity.defaultPacking.accessories];

      if (hasRain && !accessories.some((a) => a.includes('paraguas') || a.includes('impermeable'))) {
        accessories.unshift('☔ Paraguas plegable o campera impermeable (hay probabilidad de lluvia hoy)');
      }
      if (isCold && !clothing.some((c) => c.includes('térmic'))) {
        clothing.unshift('🧥 Llevar abrigo extra: la sensación térmica está fresca');
      }
      if (isWarm && !clothing.some((c) => c.includes('fresca'))) {
        clothing.unshift('👕 Ropa ligera de algodón o lino');
      }

      const weatherResult: WeatherData = {
        cityName: targetCity.name,
        region: targetCity.province,
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        conditionText: weatherInfo.text,
        weatherCode: current.weather_code,
        icon: weatherInfo.icon,
        windSpeed: Math.round(current.wind_speed_10m),
        humidity: current.relative_humidity_2m,
        minTemp: daily?.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : undefined,
        maxTemp: daily?.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : undefined,
        isDaytime: current.is_day === 1,
        packingAdvice: {
          clothing,
          accessories,
          rodrigoTip: targetCity.defaultPacking.rodrigoTip,
        },
        isLive: true,
        updatedAt: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      };

      // Save to localStorage cache for offline usage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(weatherResult));
      } catch (_) {}

      return weatherResult;
    }
  } catch (err) {
    console.log('Live weather fetch unavailable, falling back to cache or climatology:', err);
  }

  // Check cached version first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as WeatherData;
      parsed.isLive = false;
      return parsed;
    }
  } catch (_) {}

  // Offline fallback from climatological database
  const typical = targetCity.typicalNovTemp;
  const avgTemp = Math.round((typical.min + typical.max) / 2);

  return {
    cityName: targetCity.name,
    region: targetCity.province,
    temperature: avgTemp,
    apparentTemperature: avgTemp - 1,
    conditionText: avgTemp > 24 ? 'Cálido y soleado' : avgTemp < 10 ? 'Fresco con brisa patagónica' : 'Templado de primavera',
    weatherCode: avgTemp > 20 ? 0 : 2,
    icon: avgTemp > 24 ? '☀️' : avgTemp < 10 ? '❄️' : '⛅',
    windSpeed: avgTemp < 10 ? 28 : 14,
    humidity: targetCity.climateType === 'subtropical' ? 80 : 45,
    minTemp: typical.min,
    maxTemp: typical.max,
    isDaytime: true,
    packingAdvice: targetCity.defaultPacking,
    isLive: false,
    updatedAt: 'Estimado offline',
  };
}
