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

  // 1. Weather, Climate, What to wear & What to pack (Offline Engine)
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
    query.includes('abrigo') ||
    query.includes('lluvia') ||
    query.includes('paraguas') ||
    query.includes('viento')
  ) {
    // Check if a specific city was named
    const foundCity = ARGENTINA_CITIES.find(
      (c) => query.includes(c.name.toLowerCase()) || c.province.toLowerCase().includes(query)
    );

    const targetCity = foundCity || (userLocation ? findNearestArgentineCity(userLocation.lat, userLocation.lng) : ARGENTINA_CITIES[0]);

    return `🌤️ **Clima y Recomendación de Ropa para ${targetCity.name} (Modo Offline):**\n\n` +
      `• **Temperatura típica de temporada:** entre ${targetCity.typicalNovTemp.min}°C y ${targetCity.typicalNovTemp.max}°C.\n` +
      `• **Tipo de clima:** ${targetCity.climateType.replace('_', ' ').toUpperCase()}.\n\n` +
      `👗 **¿Qué ropa conviene vestir?:**\n` +
      targetCity.defaultPacking.clothing.map((c) => `  • ${c}`).join('\n') + `\n\n` +
      `🎒 **En tu cartera o mochila:**\n` +
      targetCity.defaultPacking.accessories.map((a) => `  • ${a}`).join('\n') + `\n\n` +
      `💡 *Consejo de Rodrigo para vos:* ${targetCity.defaultPacking.rodrigoTip}\n\n` +
      `👉 *También podés abrir el botón "Clima" en la barra superior para ver el pronóstico de todos los días de tu itinerario.*`;
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
    return `📖 **Tu Diario de Viaje Personal, María Ignacia 💕:**\n\n` +
      `Agregamos una sección especial para que guardes tus recuerdos sin gastar internet:\n` +
      `1. Tocá el botón **"Diario de Viaje"** (o el icono de librito/cámara en la barra superior).\n` +
      `2. Podés **tomar fotos directas con la cámara de tu celular** o elegir de tu galería.\n` +
      `3. Escribí una breve nota o anécdota y elegí tu emoción con emojis (😍, 🏔️, ☕, etc.).\n` +
      `4. Las fotos se vinculan automáticamente al día de tu itinerario y quedan **100% guardadas en tu teléfono**, para que las puedas ver offline en cualquier momento.\n\n` +
      `¡Así cuando vuelvas pueden revivir cada día juntos con Rodrigo!`;
  }

  // 3. Location / "¿Dónde estoy?"
  if (
    query.includes('donde estoy') ||
    query.includes('dónde estoy') ||
    query.includes('mi ubicacion') ||
    query.includes('mi ubicación') ||
    query.includes('ubicacion') ||
    query.includes('ubicación') ||
    query.includes('cerca')
  ) {
    if (userLocation) {
      const nearest = getNearestLandmark(userLocation.lat, userLocation.lng);
      const nearestCity = findNearestArgentineCity(userLocation.lat, userLocation.lng);
      return `📍 **Tu ubicación actual, María Ignacia 💕**:\n\n` +
        `Estás en las coordenadas geográficas (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}), cerca de **${nearestCity.name} (${nearestCity.province})**.\n` +
        `El atractivo turístico más cercano es **${nearest.landmark.name}**, a aproximadamente **${nearest.distanceKm} km** de distancia.\n\n` +
        `🌤️ **Clima estimado donde estás:** ${nearestCity.typicalNovTemp.min}°C a ${nearestCity.typicalNovTemp.max}°C.\n` +
        `💡 *Consejo de Rodrigo:* ${nearestCity.defaultPacking.rodrigoTip}\n\n` +
        `Podés pulsar el botón de tu ubicación en el mapa 3D para centrar la cámara con tu marcador con corazón.`;
    } else {
      return `📍 **Ubicación no detectada aún, María Ignacia:**\n\n` +
        `Para decirte exactamente dónde estás, el clima de tu lugar y qué atractivos tenés cerca, pulsa el botón **"📍 Mi Ubicación actual"** en el mapa o en este panel para activar el GPS de tu celular. ¡Funciona incluso sin datos móviles!`;
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
    query.includes('agenda')
  ) {
    if (itinerary && itinerary.length > 0) {
      const totalActivities = itinerary.reduce((acc, d) => acc + (d.activities ? d.activities.length : 0), 0);
      const pendingActivities = itinerary.reduce(
        (acc, d) => acc + (d.activities ? d.activities.filter((a) => !a.done).length : 0),
        0
      );

      let text = `🗓️ **Resumen de tu Itinerario por Argentina, María Ignacia:**\n\n`;
      text += `Tenés **${itinerary.length} días planificados** con un total de **${totalActivities} actividades** (${pendingActivities} pendientes):\n\n`;

      itinerary.forEach((d) => {
        text += `🔹 **Día ${d.dayNumber}: ${d.title}** (${d.city})\n`;
        (d.activities || []).forEach((a) => {
          text += `   • ${a.time ? `[${a.time} hs]` : '•'} ${a.title} ${a.done ? '✅' : '⏳'}\n`;
        });
        if (d.tipsForMaria) {
          text += `   💡 *${d.tipsForMaria}*\n`;
        }
        text += `\n`;
      });

      text += `👉 *Podés marcar actividades como completadas o agregar nuevos días en la pestaña "Mi Itinerario".*`;
      return text;
    } else {
      return `🗓️ **Aún no cargaste actividades en tu itinerario, María Ignacia.**\n\n` +
        `Abrí el botón **"Mi Itinerario"** para agregar tus días o cargar la plantilla sugerida con paseos por Buenos Aires, Iguazú, Mendoza y Bariloche que te preparó Rodrigo.`;
    }
  }

  // 5. Opening Hours of Iconic Places
  if (
    query.includes('abre') ||
    query.includes('cierra') ||
    query.includes('apertura') ||
    query.includes('atencion') ||
    query.includes('atención') ||
    query.includes('abierto')
  ) {
    return `⏰ **Horarios Oficiales de los Principales Monumentos de Argentina:**\n\n` +
      `• **Teatro Colón (CABA)**: Visitas guiadas todos los días de 10:00 a 16:45 hs. Se recomienda reservar turno con anticipación.\n` +
      `• **Parque Nacional Iguazú (Cataratas)**: Abierto de 08:00 a 18:00 hs (último ingreso a las 16:30 hs). El tren a Garganta del Diablo funciona hasta las 16:00 hs.\n` +
      `• **Glaciar Perito Moreno (Los Glaciares)**: Verano (septiembre a abril): 08:00 a 18:00 hs. Invierno: 09:00 a 16:00 hs.\n` +
      `• **Caminito y La Boca**: Paseo peatonal abierto todo el día. Mayor concurrencia y artistas de 10:30 a 18:30 hs.\n` +
      `• **Parque Provincial Ischigualasto**: Abierto de 08:00 a 17:00 hs con salidas guiadas en caravana vehicular cada hora.\n` +
      `• **Parque Provincial Aconcagua**: Ingreso al circuito Laguna de Horcones de 08:00 a 17:00 hs.\n\n` +
      `💡 *Consejo:* Para parques nacionales, comprá las entradas oficiales online en la web de Parques Nacionales para evitar filas en boleterías.`;
  }

  // 6. Food & Recommendations (Empanadas, Asado, Helados, Alfajores)
  if (
    query.includes('comer') ||
    query.includes('comida') ||
    query.includes('empanada') ||
    query.includes('asado') ||
    query.includes('helado') ||
    query.includes('restaurant') ||
    query.includes('café') ||
    query.includes('cafe') ||
    query.includes('dulce de leche')
  ) {
    return `🍴 **Recomendaciones Gastronómicas Imperdibles para vos, María Ignacia:**\n\n` +
      `1. **Helados Artesanales**: En Argentina el helado es de otro nivel. No dejes de probar **Rapanui** (pedí los *Frambui* bañados en chocolate y helado de dulce de leche con nuez) o **Luccianos** y **Cadore**.\n` +
      `2. **Empanadas**: Si estás en el norte o CABA, probá las empanadas cortadas a cuchillo (salteñas o tucumanas con limón).\n` +
      `3. **Cafeterías Notables**: En Buenos Aires, visitá el Café Tortoni o Las Violetas para un café con medialunas de manteca calientes.\n` +
      `4. **Parrilla Argentina**: Ojo de bife, bife de chorizo y provoleta crocante a la parrilla.\n` +
      `5. **Alfajores**: En Bariloche probá Mamuschka o Rapanui; en Buenos Aires los Havanna o Guaymallén para el clásico popular.`;
  }

  // 7. Practical tips: Transportation, SUBE, Money, Safety
  if (
    query.includes('sube') ||
    query.includes('transporte') ||
    query.includes('colectivo') ||
    query.includes('subte') ||
    query.includes('taxi') ||
    query.includes('plata') ||
    query.includes('dinero') ||
    query.includes('cambio') ||
    query.includes('tarjeta') ||
    query.includes('seguridad')
  ) {
    return `💡 **Tips Prácticos de Viaje en Argentina:**\n\n` +
      `• **Moverse en Buenos Aires**: Necesitás una tarjeta **SUBE** para colectivos y subte (metro). La podés comprar en estaciones de subte o kioscos con cartel de SUBE.\n` +
      `• **Taxis y Apps**: Uber y Cabify funcionan muy bien en CABA, Mendoza y Bariloche. En la calle, siempre preferí radio-taxis con cartel luminoso en el techo.\n` +
      `• **Dinero y Pagos**: En casi todos los comercios aceptan tarjetas de crédito y débito internacionales (visa/mastercard contactless). Llevá algo de pesos en efectivo para propinas (10% sugerido en gastronomía) y ferias artesanales.\n` +
      `• **Enchufes**: En Argentina se usan tomas tipo I (tres patas chatas en ángulo) y tipo C (dos patas redondas) a 220V.\n` +
      `• **Seguridad**: En zonas muy concurridas cuidá tu celular y cartera, tal como en cualquier gran ciudad turística del mundo.`;
  }

  // 8. Specific landmark search
  const matchedLandmark = LANDMARKS.find(
    (l) =>
      query.includes(l.shortTitle.toLowerCase()) ||
      query.includes(l.name.toLowerCase()) ||
      query.includes(l.province.toLowerCase())
  );

  if (matchedLandmark) {
    return `🏛️ **Información sobre ${matchedLandmark.name}:**\n\n` +
      `• **Ubicación:** ${matchedLandmark.province} (${matchedLandmark.regionName})\n` +
      `• **Altitud:** ${matchedLandmark.elevation.toLocaleString()} msnm\n` +
      `• **Distinción:** ${matchedLandmark.badge}\n` +
      `• **Mejor época:** ${matchedLandmark.bestSeason}\n\n` +
      `📖 **Descripción:** ${matchedLandmark.description}\n\n` +
      `✨ **Curiosidad:** ${matchedLandmark.curiosities[0]}\n\n` +
      `💡 *Consejo:* Podés seleccionarlo en el mapa para activar la cámara 3D o ver su modelo interactivo en el botón "Gemelo 3D".`;
  }

  // Default warm and helpful fallback
  return `🇦🇷 **¡Hola María Ignacia! 💕 (Modo Inteligente Offline)**\n\n` +
    `Estoy funcionando directamente en tu dispositivo sin necesidad de conexión a internet o datos móviles.\n\n` +
    `Podés preguntarme sobre:\n` +
    `• *"¿Qué clima hace y qué ropa me pongo hoy?"* (o en Bariloche, Iguazú, Ushuaia, etc.)\n` +
    `• *"¿Dónde estoy y qué tengo cerca?"* (usa el GPS de tu celular)\n` +
    `• *"¿Cómo guardo fotos en mi Diario de Viaje?"*\n` +
    `• *"¿Cuál es mi itinerario de hoy?"* o *"Mis horarios"*\n` +
    `• *"¿A qué hora abren las Cataratas del Iguazú / Teatro Colón?"*\n` +
    `• *"¿Dónde comer los mejores helados o empanadas?"*\n` +
    `• *"Tips de transporte, tarjeta SUBE y dinero"*\n\n` +
    `¡Rodrigo preparó todo esto para que viajes tranquila y sin preocupaciones! ¿Qué necesitás saber?`;
}
