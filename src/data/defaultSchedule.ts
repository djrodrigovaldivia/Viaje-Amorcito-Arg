import { DaySchedule } from '../types/schedule';

export const DEFAULT_MARIA_SCHEDULE: DaySchedule[] = [
  {
    id: 'ba-dia-1',
    dayNumber: 1,
    title: 'Día 1: Obelisco, Recoleta & Juan Perez Vintage',
    city: 'Buenos Aires (Centro, Recoleta & Av. Santa Fe)',
    tipsForMaria:
      'Tip de Rodrigo para tu Día 1, mi Amorcito: Hoy todo queda cerquita caminando o en Subte Línea D. En Juan Perez Vintage (Marcelo T. de Alvear 1355) vas a alucinar con los blazers sastreros y carteras de cuero real para inspirar a @maria_la_vintage.',
    activities: [
      {
        id: 'ba-1-1',
        time: '10:00',
        title: 'Fotos en el Obelisco & Desayuno con Medialunas',
        landmarkId: 'obelisco',
        notes:
          'Av. 9 de Julio y Av. Corrientes. Sacate fotos en las letras blancas de BA y probá un café con medialunas de manteca calentitas.',
        done: false,
      },
      {
        id: 'ba-1-2',
        time: '11:30',
        title: 'Visita por fuera y hall del Teatro Colón',
        landmarkId: 'teatro-colon',
        notes:
          'Cerrito 628 (a 2 cuadras del Obelisco). Uno de los teatros de ópera más lindos del mundo.',
        done: false,
      },
      {
        id: 'ba-1-3',
        time: '13:30',
        title: '👗 Joya Vintage #1: Juan Perez Vintage (Recoleta)',
        vintageSpotId: 'juan-perez-vintage',
        notes:
          'Marcelo T. de Alvear 1355. La tienda de ropa usada y vintage más famosa de Buenos Aires: blazers, gabardinas, cuero y denim con precios súper accesibles.',
        done: false,
      },
      {
        id: 'ba-1-4',
        time: '16:00',
        title: '🖤 Ruta Tipo Zara & Tendencia en Av. Santa Fe / Alto Palermo',
        vintageSpotId: 'ruta-zara-santa-fe',
        notes:
          'Av. Santa Fe 3253. Mirar tendencias de temporada en Zara, Ver y Complot (sastrería, faldas midi y básicos lindos sin gastar de más).',
        done: false,
      },
      {
        id: 'ba-1-5',
        time: '19:00',
        title: 'Paseo por Recoleta & Chocolates Rapanui (Franuí)',
        notes:
          'Caminar por Plaza Francia y probar los famosos Franuí (frambuesas bañadas en chocolate blanco y negro) en Rapanui.',
        done: false,
      },
    ],
  },
  {
    id: 'ba-dia-2',
    dayNumber: 2,
    title: 'Día 2: Palermo Soho, Outlets Aguirre & Barrio Chino',
    city: 'Buenos Aires (Palermo, Villa Crespo & Belgrano)',
    tipsForMaria:
      'Tip de Rodrigo para tu Día 2, mi Amorcito: Empezá en Galpón de Ropa (Palermo Soho) y después bajá caminando 10 minutos hasta los Outlets de Calle Aguirre. ¡Vas a encontrar prendas increíbles a mitad de precio!',
    activities: [
      {
        id: 'ba-2-1',
        time: '10:30',
        title: '♻️ Galpón de Ropa (Palermo Soho) + Cafecito aesthetic',
        vintageSpotId: 'galpon-de-ropa-palermo',
        notes:
          'Cabrera 4667, Palermo Soho. Ropa usada seleccionada por color y talle: Zara, Mango, Levi’s y marcas argentinas impecables.',
        done: false,
      },
      {
        id: 'ba-2-2',
        time: '13:00',
        title: '🛍️ Outlets de Calle Aguirre (Tendencia a -50%)',
        vintageSpotId: 'outlets-aguirre-villa-crespo',
        notes:
          'Aguirre 600 al 900 (Villa Crespo, pegado a Palermo). 6 cuadras llenas de outlets oficiales de marcas de moda argentina a precio rebajado.',
        done: false,
      },
      {
        id: 'ba-2-3',
        time: '15:30',
        title: '✨ Urban Luxury (Av. Cabildo) rumbo a Belgrano',
        vintageSpotId: 'urban-luxury-belgrano',
        notes:
          'Av. Cabildo 2040. Mega tienda de ropa usada seleccionada donde entran más de 500 prendas nuevas por día.',
        done: false,
      },
      {
        id: 'ba-2-4',
        time: '17:30',
        title: '🏮 Paseo y Compras en el Barrio Chino de Belgrano',
        vintageSpotId: 'barrio-chino-bazar',
        notes:
          'Arribeños 2100 y Pasaje Echeverría. Entrá por el arco gigante a los bazares chinos de 2 pisos (maquillaje, carteras, accesorios kawaii y snacks asiáticos).',
        done: false,
      },
    ],
  },
  {
    id: 'ba-dia-3',
    dayNumber: 3,
    title: 'Día 3: Feria San Telmo, Caminito, Mayoristas & Puerto Madero',
    city: 'Buenos Aires (San Telmo, La Boca & Puerto Madero)',
    tipsForMaria:
      'Tip de Rodrigo para tu último día, mi Amorcito: Si querés comprar lotes nuevos en tendencia para vender en @maria_la_vintage, pasá temprano por Calle Argerich (Avellaneda) o los Mall Chinos de Once con efectivo. Y en la tarde disfrutá San Telmo y Puerto Madero.',
    activities: [
      {
        id: 'ba-3-1',
        time: '09:30',
        title: '👠 Opcional Mayorista: Calle Argerich (Avellaneda) o Mall Chinos Once',
        vintageSpotId: 'av-avellaneda-flores',
        notes:
          'Av. Avellaneda y Argerich (Flores) para comprar ropa de tendencia por mayor a $4.000-$10.000 CLP, o Bazares Chinos de Sarmiento y Pueyrredón (Once).',
        done: false,
      },
      {
        id: 'ba-3-2',
        time: '12:30',
        title: '👜 Mercado de San Telmo & Galerías Vintage (Calle Defensa)',
        vintageSpotId: 'feria-san-telmo-vintage',
        notes:
          'Defensa 963. Recorré el mercado histórico con techo de hierro, las tiendas de ropa americana, cuero argentino y antigüedades.',
        done: false,
      },
      {
        id: 'ba-3-3',
        time: '15:30',
        title: '🎨 Paseo y Fotos en Caminito (La Boca)',
        landmarkId: 'la-boca-caminito',
        notes:
          'Conventillos de todos los colores, tango en vivo y feria de artistas plásticos al aire libre (ir siempre por la zona turística principal).',
        done: false,
      },
      {
        id: 'ba-3-4',
        time: '19:30',
        title: '🌉 Atardecer y Cena de Despedida en Puente de la Mujer (Puerto Madero)',
        notes:
          'Caminar por los diques iluminados de Puerto Madero y brindar por estos 3 días hermosos en Buenos Aires.',
        done: false,
      },
    ],
  },
];
