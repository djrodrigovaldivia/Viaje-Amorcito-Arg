export interface VintageFashionSpot {
  id: string;
  name: string;
  shortTitle: string;
  category: 'ropa_usada' | 'zara_tendencia' | 'feria_americana' | 'mall_chino' | 'moda_mayorista';
  categoryLabel: string;
  emoji: string;
  neighborhood: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: string;
  priceLevelArs: string;
  approxClpNote: string;
  styleVibe: string;
  highlights: string[];
  rodrigoFashionTip: string;
}

export const VINTAGE_AND_SHOPPING_SPOTS: VintageFashionSpot[] = [
  {
    id: 'juan-perez-vintage',
    name: 'Juan Perez Vintage (El Paraíso Estilo @maria_la_vintage)',
    shortTitle: 'Juan Perez Vintage',
    category: 'ropa_usada',
    categoryLabel: 'Ropa Usada, Blazers & Zara Vintage',
    emoji: '👗',
    neighborhood: 'Barrio Norte / Recoleta (CABA)',
    address: 'Marcelo T. de Alvear 1355 (entre Uruguay y Talcahuano)',
    coordinates: { lat: -34.5968, lng: -58.3862 },
    hours: 'Lunes a Sábado de 10:00 a 20:00 hrs',
    priceLevelArs: '$8.000 a $32.000 ARS',
    approxClpNote: 'Blazers, faldas y chaquetas desde ~$7.000 CLP',
    styleVibe: 'Blazers oversize, chaquetas de gamuza/cuero, faldas midi, Zara y tesoros vintage',
    highlights: [
      'La tienda de ropa usada seleccionada más grande y famosa de Buenos Aires',
      'Pisos enteros con blazers sastreros oversize, cuadros escoceses, gamuza y cuero real',
      'Percheros llenos de prendas Zara, Mango, Levi’s y marcas europeas a precio de feria',
      'Sector "Outlets y Discontinuos" en el fondo con precios ultra bajos',
    ],
    rodrigoFashionTip:
      'Mi amorcito lindo: este lugar tiene 100% la vibra de tu tienda @maria_la_vintage. Anda directo a los percheros de sastrería (blazers oversize y chaquetas de gamuza) y al sector de faldas midi y encaje; vas a pillar joyitas igualitas a las que te encantan por poquita plata 💕.',
  },
  {
    id: 'galpon-de-ropa-palermo',
    name: 'Galpón de Ropa — Palermo Soho (Zara & Tendencia Circular)',
    shortTitle: 'Galpón de Ropa',
    category: 'ropa_usada',
    categoryLabel: 'Ropa Usada de Marca & Estilo Zara',
    emoji: '🧥',
    neighborhood: 'Palermo Soho (CABA)',
    address: 'Cabrera 4667 / Loyola 851 (Palermo)',
    coordinates: { lat: -34.5889, lng: -58.4314 },
    hours: 'Todos los días de 11:00 a 20:00 hrs',
    priceLevelArs: '$7.000 a $26.000 ARS',
    approxClpNote: 'Prendas Zara / Complot / Rapsodia desde ~$6.000 CLP',
    styleVibe: 'Zara segunda mano, corsets, pantalones wide-leg, tejidos y tendencia',
    highlights: [
      'El lugar donde más llegan prendas usadas de Zara, H&M, Complot, Kosiuko y Rapsodia',
      'Ordenado por color y tipo de prenda: blazers, tops de encaje, faldas satinadas y denim',
      'Reponen percheros todos los días a las 11:00 AM con cientos de prendas baratas',
    ],
    rodrigoFashionTip:
      'Amorcito, acá las chicas de Palermo llevan a vender su ropa de Zara y marcas en tendencia casi nueva. Con el ojo seco que tienes tú con @maria_la_vintage, acá vas a encontrar outfits enteros sin gastar nada caro.',
  },
  {
    id: 'outlets-aguirre-villa-crespo',
    name: 'Outlets de Calle Aguirre & Gurruchaga (Tendencia a Mitad de Precio)',
    shortTitle: 'Outlets Calle Aguirre',
    category: 'zara_tendencia',
    categoryLabel: 'Outlets de Tendencia & Cuero Accesible',
    emoji: '✨',
    neighborhood: 'Villa Crespo / Palermo (CABA)',
    address: 'Calle Aguirre 600 al 900 y calle Gurruchaga (a pasos de Palermo Soho)',
    coordinates: { lat: -34.5938, lng: -58.4388 },
    hours: 'Todos los días de 10:00 a 20:00 hrs',
    priceLevelArs: '$9.000 a $30.000 ARS (40% a 60% OFF)',
    approxClpNote: 'Ropa nueva en tendencia desde ~$8.000 CLP',
    styleVibe: 'Estilo Zara / Europeo accesible: Complot Outlet, Las Pepas, Desiderata y Portsaid',
    highlights: [
      'Cuadras enteras de outlets oficiales de marcas de tendencia argentinas a precio bajo',
      'Complot Outlet y Ayres Outlet tienen tops de encaje, faldas metalizadas, bodys y wide-leg',
      'Las Pepas Outlet tiene las mejores chaquetas de cuero y gamuza con 50% de descuento',
    ],
    rodrigoFashionTip:
      'Mi amorcito: en vez de pagar caro en un mall, en calle Aguirre y Gurruchaga están los outlets con percheros de "Segunda Selección y Temporada" llenos de blazers, pantalones sastreros y tops onda Zara a mitad de precio ❤️.',
  },
  {
    id: 'ruta-zara-santa-fe',
    name: 'Ruta Zara, Ver & Tendencia Accesible (Av. Santa Fe & Alto Palermo)',
    shortTitle: 'Zara & Tendencia Santa Fe',
    category: 'zara_tendencia',
    categoryLabel: 'Zara + Marcas Tendencia No Caras',
    emoji: '🖤',
    neighborhood: 'Palermo / Barrio Norte (CABA)',
    address: 'Av. Santa Fe 3253 (Alto Palermo) y Av. Santa Fe 2000 al 3200',
    coordinates: { lat: -34.5881, lng: -58.4106 },
    hours: 'Todos los días de 10:00 a 21:00 hrs',
    priceLevelArs: '$10.000 a $35.000 ARS',
    approxClpNote: 'Blusas, sastrería y básicos desde ~$8.800 CLP',
    styleVibe: 'Zara, Ver, Yagmour, Complot e Isidora (tendencia europea a buen precio)',
    highlights: [
      'Zara de Alto Palermo con sección "Special Prices" (percheros rebajados todo el año)',
      'Por Av. Santa Fe están las tiendas "Ver" y "Yagmour": sastrería, chalecos tejidos y camisas estilo europeo súper baratas',
      'Tiendas Isidora y Todo Moda grandes llenas de lentes de sol retro, carteras baguette y cinturones con hebilla',
    ],
    rodrigoFashionTip:
      'Dato clave para mi amorcito: cuando entres a Zara busca los percheros que dicen "Special Prices", y al salir camina por Av. Santa Fe entrando a "Ver" y "Yagmour", que tienen puros pantalones sastreros, blazers y tejidos en tendencia nada de caros.',
  },
  {
    id: 'av-avellaneda-flores',
    name: 'Calle Argerich & Cuenca (El "Zara Mayorista" de Av. Avellaneda)',
    shortTitle: 'Moda Argerich & Avellaneda',
    category: 'moda_mayorista',
    categoryLabel: 'Tendencia Tipo Zara a Precio de Fábrica',
    emoji: '👠',
    neighborhood: 'Flores (CABA)',
    address: 'Calle Argerich, Helguera y Cuenca (cruzando Av. Avellaneda)',
    coordinates: { lat: -34.6275, lng: -58.4742 },
    hours: 'Lunes a Viernes 08:30 a 16:30 hrs, Sábados 08:30 a 14:00 hrs',
    priceLevelArs: '$4.500 a $16.000 ARS',
    approxClpNote: 'Blazers, corsets, faldas y jeans desde ~$4.000 CLP',
    styleVibe: 'Exactamente la estética Zara / Ganni / @maria_la_vintage recién salida de taller',
    highlights: [
      'En las calles Argerich y Helguera están los showrooms de moda joven que copian las últimas tendencias de Zara y Europa',
      'Corsets de encaje, pantalones wide-leg, faldas de ecocuero/satinadas, blazers oversize y tejidos por $5.000 a $15.000 ARS',
      'Ideal tanto para tu clóset personal como para mirar ideas y tesoros para @maria_la_vintage',
    ],
    rodrigoFashionTip:
      '¡Mi amorcito, este dato vale oro! No te quedes solo en Av. Avellaneda: dobla por calle Argerich y calle Helguera. Ahí están las tiendas con estética 100% Zara/Europea donde por 2 o 3 prendas te cobran precio mayorista en efectivo po 💕.',
  },
  {
    id: 'cocoliche-vintage',
    name: 'Cocoliche — Ropa con Otra Oportunidad (Estilo Editorial)',
    shortTitle: 'Cocoliche Ropa Usada',
    category: 'ropa_usada',
    categoryLabel: 'Ropa Usada & Americana Curada',
    emoji: '👚',
    neighborhood: 'Palermo / Recoleta (CABA)',
    address: 'Av. Santa Fe 2450 / Jerónimo Salguero 1851',
    coordinates: { lat: -34.5945, lng: -58.4018 },
    hours: 'Lunes a Sábado de 10:30 a 19:30 hrs',
    priceLevelArs: '$6.000 a $22.000 ARS',
    approxClpNote: 'Camisas, chalecos, faldas y chaquetas desde ~$5.200 CLP',
    styleVibe: 'Chalecos tejidos, camisas a cuadros, chaquetas de mezclilla, lentejuelas y botas',
    highlights: [
      'Ropa usada seleccionada con mucho estilo (camisas con cuello, tejidos, faldas midi)',
      'Precios súper accesibles y queda en la misma Av. Santa Fe',
      'Excelente para armar looks en capas (layering) como los de tus fotos',
    ],
    rodrigoFashionTip:
      'Mi amorcito, este local te queda de camino por Av. Santa Fe. Tienen esos chalecos sin mangas tejidos, camisas a cuadros y blazers vintage que tú sabes combinar como nadie ❤️.',
  },
  {
    id: 'feria-san-telmo-vintage',
    name: 'Galerías Vintage & Ferias Americanas del Mercado de San Telmo',
    shortTitle: 'Vintage San Telmo',
    category: 'feria_americana',
    categoryLabel: 'Feria Americana, Cuero & Joyitas Únicas',
    emoji: '👜',
    neighborhood: 'San Telmo (CABA)',
    address: 'Calle Defensa 800 al 1100 y Mercado de San Telmo (Defensa 963)',
    coordinates: { lat: -34.6212, lng: -58.3732 },
    hours: 'Martes a Domingo de 10:00 a 18:30 hrs (Domingo feria gigante)',
    priceLevelArs: '$5.000 a $28.000 ARS',
    approxClpNote: 'Cinturones de cuero, chaquetas y faldas desde ~$4.500 CLP',
    styleVibe: 'Camperas de cuero/gamuza años 80-90, cinturones con hebilla, encaje y satín',
    highlights: [
      'Adentro del Mercado de San Telmo hay locales ocultos de ropa americana y europea vintage',
      'Cinturones de cuero reales con hebillas grandes y carteras vintage baratas',
      'Blusas bordadas, chaquetas de gamuza color camel y tapados largos',
    ],
    rodrigoFashionTip:
      'Mi amorcito lindo: entra a los pasillos interiores del Mercado de San Telmo; ahí están las tiendas de ropa americana donde puedes encontrar chaquetas de gamuza, cinturones de cuero con hebilla y faldas únicas pagando en efectivo con descuento po.',
  },
  {
    id: 'urban-luxury-belgrano',
    name: 'Urban Luxury — Ropa Usada & Paseo a Barrio Chino',
    shortTitle: 'Urban Luxury Belgrano',
    category: 'ropa_usada',
    categoryLabel: 'Ropa Usada + Ruta Barrio Chino',
    emoji: '🧣',
    neighborhood: 'Belgrano (CABA)',
    address: 'Av. Cabildo 2040 (a 4 cuadras del Barrio Chino)',
    coordinates: { lat: -34.5621, lng: -58.4565 },
    hours: 'Lunes a Sábado de 10:00 a 20:00 hrs',
    priceLevelArs: '$6.500 a $24.000 ARS',
    approxClpNote: 'Desde ~$5.500 CLP por prenda',
    styleVibe: 'Sastrería usada, abrigos largos, jeans wide-leg y marcas en Av. Cabildo',
    highlights: [
      'Gran tienda de moda circular en Av. Cabildo rodeada de galerías de ropa económica',
      'A solo 4 cuadras del Barrio Chino para combinar ropa usada + mall chinos en un solo paseo',
      'Mucha rotación de blazers, trench coats y pantalones de vestir',
    ],
    rodrigoFashionTip:
      '¡El combo perfecto para ti, mi amorcito! Te bajas en el Subte D estación Juramento, recorres Urban Luxury y las galerías de Av. Cabildo, y bajas 4 cuadras directo al Barrio Chino 💕.',
  },
  {
    id: 'barrio-chino-bazar',
    name: 'Barrio Chino de Belgrano & Mall Chinos Gigantes',
    shortTitle: 'Barrio Chino & Bazares',
    category: 'mall_chino',
    categoryLabel: 'Mall Chinos, Accesorios & Belleza',
    emoji: '🏮',
    neighborhood: 'Belgrano (CABA)',
    address: 'Calle Arribeños 2100 al 2300 y Pasaje Echeverría',
    coordinates: { lat: -34.5579, lng: -58.4508 },
    hours: 'Todos los días de 10:00 a 20:30 hrs',
    priceLevelArs: '$1.500 a $14.000 ARS',
    approxClpNote: 'Cositas lindas desde ~$1.300 CLP',
    styleVibe: 'Bazares chinos de varios pisos, lentes de sol trendy, pinches, skincare y decoración',
    highlights: [
      'Supermercados y bazares chinos gigantes (Casa China, Asia Oriental, Tina & Co)',
      'Accesorios de moda, lentes rectangulares, medias de colores, carteras y maquillaje',
      'Snacks asiáticos, helados y Bubble Tea para descansar mientras vitrineas',
    ],
    rodrigoFashionTip:
      'Mi amorcito, sé cuánto disfrutas los mall chinos: entra a "Casa China" y "Asia Oriental" en calle Arribeños. Tienen pasillos enteros de cositas lindas, accesorios para tus looks y belleza a precios bajísimos.',
  },
  {
    id: 'bazares-chinos-once',
    name: 'Importadoras & Mall Chinos Mayoristas de Once (Accesorios & Lentes)',
    shortTitle: 'Mall Chinos de Once',
    category: 'mall_chino',
    categoryLabel: 'Mall Chinos Mayoristas & Lentes de Sol',
    emoji: '🕶️',
    neighborhood: 'Balvanera / Once (CABA)',
    address: 'Av. Pueyrredón y Sarmiento / Calle Pasteur y Castelli',
    coordinates: { lat: -34.6065, lng: -58.4048 },
    hours: 'Lunes a Viernes de 09:30 a 18:00 hrs, Sábado hasta las 14:00 hrs',
    priceLevelArs: '$1.000 a $9.000 ARS',
    approxClpNote: 'Lentes de sol, carteras y aros desde ~$900 CLP',
    styleVibe: 'Lentes de sol estilo europeo, carteras baguette, cinturones, pañuelos y gorros',
    highlights: [
      'Cuadras enteras de mall chinos e importadoras directas',
      'Los mismos lentes de sol, gorros peluditos (bucket hats), pañuelos y carteras de tendencia a precio de costo',
      'Ideal para llevar accesorios increíbles para tus fotos y para @maria_la_vintage',
    ],
    rodrigoFashionTip:
      'Amorcito, acá es donde compran todas las tiendas de accesorios: puedes pillar lentes de sol con toda la onda, carteras, cinturones y gorros por $2.000 o $3.000 pesos chilenos.',
  },
];
