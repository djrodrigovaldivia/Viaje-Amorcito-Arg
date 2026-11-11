export interface Landmark {
  id: string;
  name: string;
  shortTitle: string;
  province: string;
  region: 'caba' | 'cuyo' | 'noroeste' | 'litoral' | 'patagonia';
  regionName: string;
  category: 'natural' | 'arquitectura' | 'historico' | 'aventura';
  categoryLabel: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevation: number; // msnm
  camera: {
    heading: number;
    tilt: number;
    zoom: number;
    altitude: number; // For 3D camera
  };
  badge: string;
  unesco: boolean;
  yearBuiltOrFormed?: string;
  description: string;
  longHistory: string;
  highlights: string[];
  curiosities: string[];
  bestSeason: string;
  audioNarration: string;
  threeModelType: 'obelisk' | 'waterfall' | 'glacier' | 'mountain' | 'lighthouse' | 'canyon' | 'theater' | 'saltflat';
  imageUrl: string;
  trivia: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const REGIONS = [
  { id: 'all', name: 'Toda Argentina', icon: '🇦🇷' },
  { id: 'caba', name: 'Buenos Aires & CABA', icon: '🏛️' },
  { id: 'litoral', name: 'Litoral & Cataratas', icon: '🌊' },
  { id: 'noroeste', name: 'Noroeste Andino', icon: '🏜️' },
  { id: 'cuyo', name: 'Cuyo & Cordillera', icon: '🏔️' },
  { id: 'patagonia', name: 'Patagonia & Fin del Mundo', icon: '❄️' },
] as const;

export const CATEGORIES = [
  { id: 'all', name: 'Todas las categorías' },
  { id: 'natural', name: 'Maravillas Naturales' },
  { id: 'arquitectura', name: 'Arquitectura & Monumentos' },
  { id: 'historico', name: 'Sitios Históricos' },
  { id: 'aventura', name: 'Aventura & Altas Cumbres' },
] as const;

export const LANDMARKS: Landmark[] = [
  {
    id: 'obelisco',
    name: 'Obelisco de Buenos Aires',
    shortTitle: 'El Obelisco',
    province: 'Ciudad Autónoma de Buenos Aires',
    region: 'caba',
    regionName: 'Buenos Aires',
    category: 'arquitectura',
    categoryLabel: 'Monumento Histórico',
    coordinates: { lat: -34.603722, lng: -58.381592 },
    elevation: 25,
    camera: {
      heading: 45,
      tilt: 65,
      zoom: 18,
      altitude: 140,
    },
    badge: 'Ícono Porteño Nacional',
    unesco: false,
    yearBuiltOrFormed: '1936',
    description: 'El mayor emblema arquitectónico de la capital argentina, erigido en el cruce de las emblemáticas avenidas 9 de Julio y Corrientes para conmemorar los cuatrocientos años de la primera fundación de Buenos Aires.',
    longHistory: 'Diseñado por el célebre arquitecto Alberto Prebisch, una de las figuras clave del modernismo argentino, el Obelisco fue construido en un tiempo récord de solo 31 días por la empresa constructora alemana GEOPE. Tiene una altura total de 67,5 metros, una base cuadrada de 49 metros cuadrados y una única puerta de entrada en su cara oeste que da acceso a una escalera marinera de 206 escalones.',
    highlights: [
      'Altura total de 67,5 metros',
      'Ubicado en la Plaza de la República',
      'Cruce de Av. 9 de Julio y Av. Corrientes',
      'Punto de encuentro de celebraciones patrióticas y campeonatos mundiales'
    ],
    curiosities: [
      'En la cúspide cuenta con un pararrayos y 4 ventanas orientadas a los cuatro puntos cardinales.',
      'En 1939 el Concejo Deliberante aprobó su demolición por "razones estéticas y de seguridad", pero el intendente vetó la ordenanza.',
      'La bandera nacional se izó por primera vez en este exacto sitio el 23 de agosto de 1812, en la antigua iglesia de San Nicolás de Bari.'
    ],
    bestSeason: 'Todo el año (primavera y otoño ideales para caminar por la Av. Corrientes)',
    audioNarration: 'Bienvenidos al corazón de la República Argentina: el Obelisco de Buenos Aires. Con sus 67 metros y medio de altura, custodia el cruce de las avenidas Corrientes y 9 de Julio. Construido en apenas 31 días en 1936, ha sido testigo de los momentos más apasionantes de la historia nacional, desde gestas populares hasta el festejo de tres copas mundiales de fútbol.',
    threeModelType: 'obelisk',
    imageUrl: 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Cuántos días demoró la construcción completa del Obelisco de Buenos Aires en 1936?',
      options: ['31 días', '180 días', '1 año', '3 años'],
      correctIndex: 0,
      explanation: '¡Increíble pero real! Se levantó en tiempo récord de solo 31 días con 157 obreros para llegar a tiempo al cuarto centenario de la ciudad.'
    }
  },
  {
    id: 'iguazu',
    name: 'Cataratas del Iguazú & Garganta del Diablo',
    shortTitle: 'Cataratas del Iguazú',
    province: 'Misiones',
    region: 'litoral',
    regionName: 'Litoral',
    category: 'natural',
    categoryLabel: 'Maravilla del Mundo',
    coordinates: { lat: -25.69528, lng: -54.43667 },
    elevation: 195,
    camera: {
      heading: 190,
      tilt: 70,
      zoom: 17,
      altitude: 450,
    },
    badge: '7 Maravillas Naturales del Mundo',
    unesco: true,
    yearBuiltOrFormed: '200.000 años aprox.',
    description: 'Un sobrecogedor sistema de 275 saltos de agua en plena selva subtropical paranaense. Su salto principal, la Garganta del Diablo, descarga una colosal masa de agua con un rugido ensordecedor que crea un arco iris perpetuo.',
    longHistory: 'Declaradas Patrimonio de la Humanidad por la UNESCO en 1984 y consagradas como una de las Nuevas Siete Maravillas Naturales del Mundo en 2011. Las cataratas se precipitan a lo largo de un frente semicircular de 2,7 kilómetros sobre el río Iguazú, en la frontera entre la provincia de Misiones y el estado brasileño de Paraná. El Parque Nacional protege más de 67.000 hectáreas de selva con tucanes, jaguares y mariposas exóticas.',
    highlights: [
      '275 saltos individuales de agua',
      'Garganta del Diablo con más de 80 metros de caída libre',
      'Caudal medio de 1.750 metros cúbicos por segundo',
      'Biodiversidad única: yaguaretés, coatíes, tapires y más de 400 especies de aves'
    ],
    curiosities: [
      'La palabra "Iguazú" proviene del idioma guaraní: "Y" (agua) y "Guasú" (grande).',
      'Cuenta la leyenda guaraní que una serpiente gigante llamada Boi partió el cauce del río al enfurecerse, creando los saltos.',
      'Al ver las cataratas, la primera dama estadounidense Eleanor Roosevelt exclamó con asombro: "¡Pobre Niágara!".'
    ],
    bestSeason: 'Marzo a Mayo y Agosto a Octubre (clima templado y excelente caudal)',
    audioNarration: 'Nos encontramos frente a una de las obras cumbres de la naturaleza: las majestuosas Cataratas del Iguazú. Sus 275 cascadas se abren paso en la selva misionera arrojando millones de litros de agua por segundo. El vapor que se eleva desde la sobrecogedora Garganta del Diablo humedece el aire tropical mientras los vencejos de cascada se sumergen entre las cortinas de espuma.',
    threeModelType: 'waterfall',
    imageUrl: 'https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Qué significa el nombre "Iguazú" en la lengua originaria guaraní?',
      options: ['Agua grande', 'Río de la selva', 'Trueno de piedra', 'Tierra de arcoíris'],
      correctIndex: 0,
      explanation: 'Proviene de las voces guaraníes "Y" que significa agua y "Guasú" que significa grande.'
    }
  },
  {
    id: 'perito-moreno',
    name: 'Glaciar Perito Moreno',
    shortTitle: 'Glaciar Perito Moreno',
    province: 'Santa Cruz',
    region: 'patagonia',
    regionName: 'Patagonia Austral',
    category: 'natural',
    categoryLabel: 'Maravilla Glaciar',
    coordinates: { lat: -50.496111, lng: -73.137778 },
    elevation: 187,
    camera: {
      heading: 260,
      tilt: 68,
      zoom: 16,
      altitude: 600,
    },
    badge: 'Patrimonio de la Humanidad UNESCO',
    unesco: true,
    yearBuiltOrFormed: 'Era Cenozoica',
    description: 'Uno de los espectáculos glaciales más impactantes del planeta: una muralla de hielo vivo de 5 kilómetros de ancho y hasta 70 metros de altura que avanza sobre las aguas turquesas del Lago Argentino.',
    longHistory: 'Ubicado en el Parque Nacional Los Glaciares en Santa Cruz, el Perito Moreno es uno de los pocos glaciares del mundo en equilibrio dinámico que periódicamente avanza hasta tocar la península de Magallanes. Este fenómeno embalsa el brazo Rico del Lago Argentino creando un desnivel de agua que finalmente socava el hielo y desencadena la mítica y estruendosa "ruptura del glaciar".',
    highlights: [
      'Frente de 5 km de longitud y 70 metros de altura sobre el agua',
      'Profundidad total de hielo de hasta 170 metros',
      'Superficie de 250 kilómetros cuadrados (mayor que la ciudad de Buenos Aires)',
      'Fenómeno único de ruptura periódica con desprendimientos de bloques colosales'
    ],
    curiosities: [
      'A diferencia de la mayoría de los glaciares del mundo que retroceden por el calentamiento global, el Perito Moreno se encuentra en equilibrio.',
      'Lleva el nombre de Francisco Pascasio Moreno, insigne perito geógrafo y explorador que defendió los límites territoriales de Argentina.',
      'El hielo más profundo del glaciar tiene miles de años de compactación, lo que absorbe todas las ondas lumínicas salvo el azul zafiro.'
    ],
    bestSeason: 'Octubre a Abril (verano austral, con temperaturas templadas y rupturas diurnas)',
    audioNarration: 'Estás contemplando el coloso blanco de la Patagonia: el Glaciar Perito Moreno. Esta inmensa masa de hielo puro desciende desde el Campo de Hielo Patagónico Sur hasta las aguas del Lago Argentino. Cada crujido seco es el eco de toneladas de hielo milenario fracturándose bajo la presión, listo para regalarnos el sobrecogedor espectáculo de su desprendimiento.',
    threeModelType: 'glacier',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Por qué el hielo milenario del Glaciar Perito Moreno se ve de un color azul zafiro tan intenso?',
      options: [
        'Por la altísima compresión que expulsa burbujas de aire y absorbe el espectro rojo',
        'Por minerales de cobre disueltos en el agua cordillerana',
        'Por el reflejo del cielo patagónico en el agua',
        'Por un tipo especial de alga glacial'
      ],
      correctIndex: 0,
      explanation: 'La extrema compresión ejercida durante siglos elimina las burbujas de aire; la estructura densa absorbe las longitudes de onda rojas y refleja el azul puro.'
    }
  },
  {
    id: 'aconcagua',
    name: 'Cerro Aconcagua: Techo de América',
    shortTitle: 'Cerro Aconcagua',
    province: 'Mendoza',
    region: 'cuyo',
    regionName: 'Cuyo',
    category: 'aventura',
    categoryLabel: 'Cumbre Continental',
    coordinates: { lat: -32.653194, lng: -70.010833 },
    elevation: 6961,
    camera: {
      heading: 15,
      tilt: 72,
      zoom: 14,
      altitude: 7200,
    },
    badge: 'Pico más alto del hemisferio occidental',
    unesco: false,
    yearBuiltOrFormed: 'Orogenia Andina',
    description: 'El pico más elevado de los continentes americano y occidental, y el más alto del planeta fuera de la cordillera del Himalaya, erigiéndose con 6.961 metros sobre la majestuosa cordillera de los Andes.',
    longHistory: 'El Aconcagua integra el Parque Provincial Aconcagua en el noroeste mendocino. Su nombre deriva del quechua "Akankawa" o del aymara "Kon-Kawa" (Centinela de Piedra o Monte Nevado). Para la civilización Inca constituía un santuario de altura (Apu sagrado), donde se descubrió el "Niño del Aconcagua", una ofrenda ceremonial que data de más de 500 años conservada en el hielo.',
    highlights: [
      'Cumbre más alta de América a 6.961 metros sobre el nivel del mar',
      'Pared Sur de casi 3.000 metros de roca y hielo vertical',
      'Meca mundial del montañismo de altura y desafío de los "Siete Picos"',
      'Glaciares colgantes de Los Polacos y del Este'
    ],
    curiosities: [
      'El primer ascenso oficial registrado a su cumbre fue logrado en 1897 por el guía suizo Matthias Zurbriggen.',
      'Debido a su latitud y baja presión atmosférica, la sensación de altitud en su cumbre equivale a más de 7.500 metros en el Himalaya.',
      'En sus laderas a 5.300 msnm se halló un fardo funerario incaico intacto gracias a la congelación natural.'
    ],
    bestSeason: 'Diciembre a Febrero (temporada de expedición estival andina)',
    audioNarration: 'Nos elevamos hasta el techo de toda América: el titánico Cerro Aconcagua. Con sus 6.961 metros de roca, hielo y viento eterno, este vigía de los Andes desafía al cielo mendocino. Para los pueblos andinos fue una montaña sagrada donde los Apus custodiaban el equilibrio entre el cielo y la tierra fértil de los valles cuyanos.',
    threeModelType: 'mountain',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Cuál es la altitud exacta oficial del Cerro Aconcagua?',
      options: ['6.961 metros', '5.895 metros', '7.420 metros', '8.048 metros'],
      correctIndex: 0,
      explanation: 'El Instituto Geográfico Nacional de Argentina fijó su altura oficial en 6.960,8 metros (redondeado a 6.961 msnm).'
    }
  },
  {
    id: 'fitz-roy',
    name: 'Monte Fitz Roy (Chaltén)',
    shortTitle: 'Monte Fitz Roy',
    province: 'Santa Cruz',
    region: 'patagonia',
    regionName: 'Patagonia Austral',
    category: 'aventura',
    categoryLabel: 'Capital del Trekking',
    coordinates: { lat: -49.271111, lng: -73.043056 },
    elevation: 3405,
    camera: {
      heading: 290,
      tilt: 70,
      zoom: 15,
      altitude: 3600,
    },
    badge: 'Símbolo Heráldico de Santa Cruz',
    unesco: true,
    yearBuiltOrFormed: 'Plutón Ígneo Terciario',
    description: 'Una sobrecogedora aguja granítica de perfil inconfundible que se yergue desafiante entre el campo de hielo y los bosques patagónicos, conocida como la Capital Nacional del Trekking.',
    longHistory: 'Los pueblos originarios tehuelches o aónikenk llamaban a esta cumbre "Chaltén", vocablo que significa "montaña humeante", debido a que las nubes se condensan casi permanentemente en su cima simulando humo volcánico. El perito Francisco Moreno lo rebautizó en 1877 en homenaje al capitán del HMS Beagle, Robert FitzRoy, quien exploró el río Santa Cruz junto a Charles Darwin.',
    highlights: [
      'Paredes verticales de granito de más de 1.500 metros',
      'Cumbre a 3.405 metros con clima impredecible y vientos furiosos',
      'Laguna de los Tres a sus pies, con aguas de deshielo turquesa',
      'Icono global de la indumentaria outdoor y escalada alpina extrema'
    ],
    curiosities: [
      'Aunque es menos de la mitad de alto que el Everest, su escalada técnica es considerada por los alpinistas de élite como una de las más complejas del mundo.',
      'Su silueta forma el logotipo internacional de la reconocida marca de montaña Patagonia.',
      'En el pueblo de El Chaltén no se cobra entrada al parque y se puede acceder a pie directamente a los senderos.'
    ],
    bestSeason: 'Noviembre a Marzo (días largos con hasta 16 horas de luz solar)',
    audioNarration: 'Divisamos las agujas míticas del Monte Fitz Roy o Cerro Chaltén. La niebla que corona su cúspide granítica engañaba a los antiguos tehuelches, haciéndoles creer que se trataba de un volcán en erupción. Hoy es la meca donde convergen senderistas y escaladores de todos los continentes en busca de la aventura más pura del fin del mundo.',
    threeModelType: 'mountain',
    imageUrl: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Qué significa la palabra tehuelche "Chaltén" con la que nombraban al Fitz Roy?',
      options: ['Montaña humeante', 'Punta de flecha', 'Hogar del cóndor', 'Roca sagrada'],
      correctIndex: 0,
      explanation: 'Los tehuelches la llamaban Chaltén porque las nubes atrapadas en la cima semejaban el humo de un volcán.'
    }
  },
  {
    id: 'siete-colores',
    name: 'Cerro de los Siete Colores & Purmamarca',
    shortTitle: 'Cerro de los Siete Colores',
    province: 'Jujuy',
    region: 'noroeste',
    regionName: 'Noroeste (NOA)',
    category: 'natural',
    categoryLabel: 'Maravilla Geológica',
    coordinates: { lat: -23.748333, lng: -65.498889 },
    elevation: 2324,
    camera: {
      heading: 320,
      tilt: 65,
      zoom: 16,
      altitude: 2700,
    },
    badge: 'Patrimonio de la Humanidad UNESCO (Quebrada de Humahuaca)',
    unesco: true,
    yearBuiltOrFormed: '600 millones de años',
    description: 'Una prodigiosa paleta natural de estratos sedimentarios marinos y continentales que resumen 600 millones de años de historia geológica terrenal al pie del pueblo colonial de Purmamarca.',
    longHistory: 'Enmarcado en la Quebrada de Humahuaca, declarada Patrimonio Cultural y Natural de la Humanidad por la UNESCO en 2003, el cerro exhibe franjas de colores originadas por diferentes eras geológicas: lilas y verdes del Cámbrico marino, ocres y amarillos del Mesozoico lacustre, y tonos rojizos intensos del Terciario superior ricos en óxidos de hierro.',
    highlights: [
      'Gama cromática con verdes, morados, rosados, amarillos y ocres',
      'Paseo de Los Colorados de 3 kilómetros circundando el cerro',
      'Plaza de Purmamarca con centenario algarrobo histórico y feria de tapices andinos',
      'Herencia viva del Camino del Inca (Qhapaq Ñan)'
    ],
    curiosities: [
      'La leyenda popular relata que los niños del pueblo pintaron el cerro durante siete noches para que no luciera tan gris y deslucido.',
      'La mejor hora para apreciar la viveza de los colores es durante las dos primeras horas de la mañana, cuando la luz solar incide frontalmente.',
      'En el pueblo no hay semáforos ni edificios de más de una planta para preservar la arquitectura tradicional de adobe y techos de cardón.'
    ],
    bestSeason: 'Abril a Noviembre (cielos diáfanos y nula probabilidad de lluvias veraniegas)',
    audioNarration: 'Nos sumergimos en los matices mágicos del Cerro de los Siete Colores en Jujuy. Cada banda cromática representa una era geológica de nuestro planeta: fondos marinos antiquísimos, lagos desaparecidos y arenas teñidas de óxido que la tectónica andina empujó hacia arriba. A sus pies, Purmamarca conserva la serenidad de sus casas de adobe y telares tejidos con lana de llama.',
    threeModelType: 'canyon',
    imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Cuántos millones de años de historia geológica albergan las capas del Cerro de los Siete Colores?',
      options: ['Aproximadamente 600 millones', '5 millones', '50 millones', '2.000 millones'],
      correctIndex: 0,
      explanation: 'Las capas sedimentarias más antiguas datan del período Precámbrico tardío y Cámbrico temprano, hace unos 600 millones de años.'
    }
  },
  {
    id: 'salinas-grandes',
    name: 'Salinas Grandes de Jujuy y Salta',
    shortTitle: 'Salinas Grandes',
    province: 'Jujuy / Salta',
    region: 'noroeste',
    regionName: 'Noroeste (NOA)',
    category: 'natural',
    categoryLabel: 'Desierto Blanco',
    coordinates: { lat: -23.633333, lng: -65.916667 },
    elevation: 3450,
    camera: {
      heading: 0,
      tilt: 60,
      zoom: 14,
      altitude: 3900,
    },
    badge: 'Maravilla Natural de Argentina',
    unesco: false,
    yearBuiltOrFormed: '5 a 10 millones de años',
    description: 'Un inmenso mar de sal blanca de 212 kilómetros cuadrados encaramado a más de 3.400 metros sobre el nivel del mar en la Puna andina, cuyos piletones de extracción reflejan el azul profundo del cielo.',
    longHistory: 'Originadas a partir de la evaporación gradual de una vasta cuenca lacustre endorreica con abundante aporte volcánico hace millones de años. La costra de sal posee un espesor promedio de 30 centímetros a medio metro. Se accede desde Purmamarca a través de la sinuosa y espectacular Cuesta de Lipán por la Ruta Nacional 52.',
    highlights: [
      'Superficie de 212 km² de sal pura',
      'Altitud de 3.450 metros sobre el nivel del mar',
      'Piletones y "ojos de sal" de aguas cristalinas saturadas',
      'Efectos ópticos de perspectiva infinita y cielo espejado en temporada estival'
    ],
    curiosities: [
      'Es el cuarto salar más extenso de Sudamérica.',
      'Los trabajadores locales extraen bloques de sal y esculpen artesanías y pequeños refugios íntegramente con salmuera petrificada.',
      'En época de lluvia (enero-febrero), unos centímetros de agua sobre el suelo crean el efecto de un colosal espejo natural.'
    ],
    bestSeason: 'Mayo a Octubre para el blanco seco y brillante; Enero a Febrero para el efecto espejo',
    audioNarration: 'Estás pisando el blanco infinito de las Salinas Grandes, a 3.450 metros en el altiplano andino. El silencio aquí es total, interrumpido solo por la brisa de la puna. Los piletones turquesas donde se cristaliza la salmuera contrastan con el suelo hexagonal y los volcanes lejanos que recortan el horizonte.',
    threeModelType: 'saltflat',
    imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿A qué altitud aproximada sobre el nivel del mar se encuentran las Salinas Grandes?',
      options: ['3.450 msnm', '1.200 msnm', '4.800 msnm', '800 msnm'],
      correctIndex: 0,
      explanation: 'Están situadas en el corazón de la Puna argentina a 3.450 metros de altitud.'
    }
  },
  {
    id: 'faro-fin-del-mundo',
    name: 'Faro Les Éclaireurs & Canal Beagle',
    shortTitle: 'Faro del Fin del Mundo',
    province: 'Tierra del Fuego',
    region: 'patagonia',
    regionName: 'Patagonia Austral',
    category: 'historico',
    categoryLabel: 'Centinela Austral',
    coordinates: { lat: -54.871111, lng: -68.087778 },
    elevation: 22,
    camera: {
      heading: 120,
      tilt: 65,
      zoom: 16,
      altitude: 120,
    },
    badge: 'Ícono del Fin del Mundo',
    unesco: false,
    yearBuiltOrFormed: '1920',
    description: 'La emblemática torre roja y blanca erigida en un islote rocoso del Canal Beagle frente a la bahía de Ushuaia, centinela náutico que guía a los navegantes en las aguas más australes del planeta.',
    longHistory: 'Puesto en servicio el 23 de diciembre de 1920 por la Armada Argentina, el faro se ubica en los islotes Les Éclaireurs ("Los Iluminadores"), nombrados así por el capitán francés Louis-Ferdinand Martial en su expedición científica de 1882 a bordo de La Romanche. Tiene una torre de 11 metros de altura con una linterna automática alimentada por energía solar que destella luz blanca y roja cada 10 segundos.',
    highlights: [
      'Ubicación en el mítico Canal Beagle a 9 kilómetros de Ushuaia',
      'Pintado con franjas horizontales roja, blanca y roja',
      'Rodeado de colonias de cormoranes imperiales y lobos marinos de un pelo',
      'Vistas hacia la imponente Cordillera Darwin y los glaciares fueguinos'
    ],
    curiosities: [
      'Popularmente se lo confunde con el faro de la novela de Julio Verne "El faro del fin del mundo", que en realidad transcurre en el Faro San Juan de Salvamento de la Isla de los Estados.',
      'Es operado de forma remota y automatizada; no tiene farero residente en el islote.',
      'A escasa distancia yace sumergido el pecio del buque de pasajeros Monte Cervantes, que naufragó en 1930.'
    ],
    bestSeason: 'Noviembre a Marzo (temporada de navegación marítima y excursiones en catamarán)',
    audioNarration: 'Llegamos a la ciudad más austral del planeta: Ushuaia, frente al mítico Canal Beagle. Aquí se alza el Faro Les Éclaireurs, con sus franjas rojas y blancas recortadas contra las cumbres nevadas de la cordillera fueguina. Rodeado por colonias de lobos marinos y cormoranes, su luz guía desde hace más de un siglo a los barcos que se aventuran hacia la Antártida.',
    threeModelType: 'lighthouse',
    imageUrl: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿En qué año comenzó a emitir sus destellos de luz el Faro Les Éclaireurs en el Canal Beagle?',
      options: ['1920', '1850', '1955', '1982'],
      correctIndex: 0,
      explanation: 'Fue inaugurado y puesto en servicio el 23 de diciembre de 1920 por el buque ARA Vicente Fidel López.'
    }
  },
  {
    id: 'teatro-colon',
    name: 'Teatro Colón de Buenos Aires',
    shortTitle: 'Teatro Colón',
    province: 'Ciudad Autónoma de Buenos Aires',
    region: 'caba',
    regionName: 'Buenos Aires',
    category: 'arquitectura',
    categoryLabel: 'Joya Lírica Mundial',
    coordinates: { lat: -34.601111, lng: -58.383056 },
    elevation: 26,
    camera: {
      heading: 200,
      tilt: 65,
      zoom: 18,
      altitude: 180,
    },
    badge: 'Una de las 5 mejores salas de ópera del mundo',
    unesco: false,
    yearBuiltOrFormed: '1908',
    description: 'Reconocido unánimemente por directores de orquesta y cantantes líricos de todo el mundo como una de las cinco salas de conciertos con acústica más perfecta del planeta.',
    longHistory: 'Inaugurado el 25 de mayo de 1908 con la ópera Aïda de Giuseppe Verdi, su construcción llevó casi dos décadas y la participación de los arquitectos Francesco Tamburini, Vittorio Meano y Jules Dormal. Combina estilos del Renacimiento italiano, orden jónico y detalles monumentales franceses. Su cúpula fue pintada magistralmente por el artista argentino Raúl Soldi en 1966.',
    highlights: [
      'Sala principal en forma de herradura con capacidad para 2.487 espectadores',
      'Acústica inigualable por la curvatura y materiales nobles de su arquitectura',
      'Talleres propios subterráneos donde se elabora escenografía, vestuario y calzado',
      'Cúpula ilustrada por el maestro Raúl Soldi con figuras teatrales y musicales'
    ],
    curiosities: [
      'Luciano Pavarotti declaró que el Teatro Colón tiene un solo defecto: "su acústica es tan perfecta que si cometes una mínima equivocación, todos la notan".',
      'Bajo la platea existe una cámara de aire acústica de resonancia diseñada con maderas seleccionadas.',
      'En sus pasillos y palcos se grabaron películas legendarias y pasaron mitos como María Callas, Plácido Domingo e Igor Stravinsky.'
    ],
    bestSeason: 'Marzo a Diciembre (temporada de ópera, ballet y conciertos sinfónicos)',
    audioNarration: 'Entramos a la cumbre de la cultura lírica de América Latina: el Teatro Colón de Buenos Aires. Su majestuosa sala en herradura ostenta una acústica considerada casi milagrosa. Cada butaca de terciopelo rojo, cada moldura dorada y la conmovedora cúpula pintada por Raúl Soldi han albergado las voces más sublimes de la historia de la música universal.',
    threeModelType: 'theater',
    imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Con qué célebre ópera de Giuseppe Verdi se inauguró oficialmente el actual Teatro Colón en 1908?',
      options: ['Aïda', 'La Traviata', 'Rigoletto', 'Nabucco'],
      correctIndex: 0,
      explanation: 'El 25 de mayo de 1908 se inauguró el actual edificio con la puesta en escena de la ópera Aïda.'
    }
  },
  {
    id: 'la-boca-caminito',
    name: 'Caminito y Barrio de La Boca',
    shortTitle: 'Caminito & La Boca',
    province: 'Ciudad Autónoma de Buenos Aires',
    region: 'caba',
    regionName: 'Buenos Aires',
    category: 'historico',
    categoryLabel: 'Cuna del Tango',
    coordinates: { lat: -34.639444, lng: -58.362778 },
    elevation: 6,
    camera: {
      heading: 60,
      tilt: 65,
      zoom: 18,
      altitude: 120,
    },
    badge: 'Museo a Cielo Abierto',
    unesco: false,
    yearBuiltOrFormed: '1959 (museo peatonal)',
    description: 'El callejón museo a cielo abierto más colorido de Argentina, reflejo de la inmigración genovesa de fines del siglo XIX, con sus conventillos de chapa ondulada policromada y adoquines donde respira el tango.',
    longHistory: 'Debe su renacimiento cultural a la iniciativa del genial pintor boquense Benito Quinquela Martín, quien en la década de 1950 impulsó la recuperación del antiguo tendido ferroviario abandonado para convertirlo en un paseo de arte público. El nombre honra al famoso tango "Caminito" compuesto en 1926 por Juan de Dios Filiberto y Gabino Coria Peñaloza.',
    highlights: [
      'Conventillos multicolores pintados con sobrantes de pintura de barcos',
      'Artistas callejeros, parejas de tango bailando en vivo y fileteado porteño',
      'A metros del mítico estadio La Bombonera del Club Atlético Boca Juniors',
      'Paseo de la Ribera junto al Riachuelo y la vuelta de Rocha'
    ],
    curiosities: [
      'Los inmigrantes genoveses pintaban sus casas de chapa con las pinturas sobrantes que les regalaban los astilleros del puerto, de ahí que una misma casa tuviera varios colores.',
      'En 1882, un grupo de vecinos de La Boca declaró simbólicamente la "República Independiente de La Boca" e izó la bandera de Génova.',
      'El fileteado porteño, arte pictórico decorativo típico que nació en los carros lecheros de la zona, fue declarado Patrimonio Inmaterial de la Humanidad.'
    ],
    bestSeason: 'Todo el año (fines de semana al mediodía con sol)',
    audioNarration: 'Nos adentramos en los adoquines vivaces de Caminito, en el histórico barrio de La Boca. Cuna de conventillos donde inmigrantes italianos, criollos y españoles compartieron patios, guitarras y penas, alumbrando el compás del tango. Las fachadas multicolores ideadas por el pintor Benito Quinquela Martín siguen vibrando con música y fileteado.',
    threeModelType: 'obelisk',
    imageUrl: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Qué célebre pintor de La Boca impulsó la transformación de Caminito en un museo callejero?',
      options: ['Benito Quinquela Martín', 'Antonio Berni', 'Xul Solar', 'Raúl Soldi'],
      correctIndex: 0,
      explanation: 'Benito Quinquela Martín recuperó las vías abandonadas y propuso pintarlas con vivos colores para devolverle la alegría al barrio.'
    }
  },
  {
    id: 'bariloche-llao-llao',
    name: 'San Carlos de Bariloche & Hotel Llao Llao',
    shortTitle: 'Bariloche & Llao Llao',
    province: 'Río Negro',
    region: 'patagonia',
    regionName: 'Patagonia Norte',
    category: 'natural',
    categoryLabel: 'Lagos y Montañas',
    coordinates: { lat: -41.050556, lng: -71.530556 },
    elevation: 770,
    camera: {
      heading: 240,
      tilt: 65,
      zoom: 15,
      altitude: 1200,
    },
    badge: 'Capital Nacional del Chocolate y los Lagos',
    unesco: false,
    yearBuiltOrFormed: '1938',
    description: 'La postal paradisíaca de la Patagonia andina: lagos glaciares cristalinos como el Nahuel Huapi y el Moreno, bosques milenarios de coihues y arrayanes, y la arquitectura alpina del legendario Hotel Llao Llao.',
    longHistory: 'Diseñado por el arquitecto Alejandro Bustillo en estilo rústico canadiense con troncos de ciprés a la vista y tejuelas de alerce, el Llao Llao se alza sobre una colina entre dos lagos dentro del Parque Nacional Nahuel Huapi, el parque nacional más antiguo de Argentina creado gracias a la donación de tierras del perito Francisco Moreno en 1903.',
    highlights: [
      'Parque Nacional Nahuel Huapi con más de 710.000 hectáreas',
      'Puntos panorámicos legendarios: Cerro Campanario y Circuito Chico',
      'Gastronomía de excelencia: chocolates artesanales, trucha andina y cerveza artesanal',
      'Centro de esquí Cerro Catedral, el más grande de Sudamérica'
    ],
    curiosities: [
      'La vista desde el Cerro Campanario fue catalogada por National Geographic como una de las diez vistas panorámicas más bellas del mundo.',
      'El lago Nahuel Huapi tiene su propio mito folclórico: el "Nahuelito", una supuesta criatura lacustre prehistórica.',
      'En la Isla Victoria se encuentra el único bosque natural puro de arrayanes del planeta, árbol de corteza canela y fría.'
    ],
    bestSeason: 'Verano (Diciembre a Marzo) para lagos y playas; Invierno (Julio a Septiembre) para nieve y esquí',
    audioNarration: 'Bienvenidos a Bariloche, el paraíso lacustre de la Patagonia Norte. Flanqueado por las aguas azules del Lago Nahuel Huapi y los picos de la Cordillera de los Andes, el majestuoso Hotel Llao Llao corona una colina verde. El aroma a bosque húmedo de coihue y chocolate artesanal se entremezcla con el aire puro de la montaña.',
    threeModelType: 'mountain',
    imageUrl: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Quién donó las primeras tres leguas cuadradas de tierras en 1903 que dieron origen al primer Parque Nacional de Argentina?',
      options: ['Francisco Pascasio Moreno (Perito Moreno)', 'Julio Argentino Roca', 'Alejandro Bustillo', 'Charles Darwin'],
      correctIndex: 0,
      explanation: 'El Perito Francisco Moreno donó en 1903 las tierras que el Estado le había otorgado como recompensa por su labor pericial, creando el Parque Nacional Nahuel Huapi.'
    }
  },
  {
    id: 'valle-de-la-luna',
    name: 'Valle de la Luna (Parque Provincial Ischigualasto)',
    shortTitle: 'Valle de la Luna',
    province: 'San Juan',
    region: 'cuyo',
    regionName: 'Cuyo',
    category: 'historico',
    categoryLabel: 'Yacimiento Triásico',
    coordinates: { lat: -30.166667, lng: -67.833333 },
    elevation: 1300,
    camera: {
      heading: 10,
      tilt: 65,
      zoom: 14,
      altitude: 1800,
    },
    badge: 'Patrimonio de la Humanidad UNESCO',
    unesco: true,
    yearBuiltOrFormed: '230 millones de años (Período Triásico)',
    description: 'Un sobrecogedor paisaje lunar y desértico que constituye el yacimiento de fósiles del Período Triásico más completo del mundo, donde caminaron los ancestros directos de los primeros dinosaurios.',
    longHistory: 'Declarado Patrimonio de la Humanidad por la UNESCO junto con el vecino Parque Nacional Talampaya en el año 2000. Ischigualasto es el único lugar del globo terráqueo donde se encuentra expuesta en superficie y de manera continua y ordenada toda la secuencia sedimentaria del Triásico (hace entre 250 y 200 millones de años), permitiendo reconstruir la evolución de la vida continental previa a los gigantes jurásicos.',
    highlights: [
      'Formaciones escultóricas talladas por el viento: El Hongo, El Submarino, La Cancha de Bochas',
      'Cuna de los dinosaurios más primitivos conocidos, como el Eoraptor lunensis y Herrerasaurus',
      'Paisaje desértico que simula la superficie de la Luna con arcillas grises y cenizas volcánicas',
      'Paseos guiados nocturnos bajo la luz de la Luna llena'
    ],
    curiosities: [
      'El nombre Ischigualasto proviene de una lengua indígena extinta y suele traducirse como "sitio donde no se posa la luna" o "tierra de la muerte".',
      'En la "Cancha de Bochas" yacen esferas de piedra casi perfectas de origen sedimentario formadas por concentración mineral concéntrica.',
      'Aquí se encontró en 1991 el fósil de Eoraptor, con solo 1 metro de largo, uno de los dinosaurios carnívoros más arcaicos de la Tierra.'
    ],
    bestSeason: 'Abril a Noviembre (evita el calor extremo del verano cuyano)',
    audioNarration: 'Nos adentramos en el Valle de la Luna en San Juan, un viaje en el tiempo de 230 millones de años. En este suelo agreste esculpido por el viento y la lluvia nacieron los primeros dinosaurios del planeta. Estructuras caprichosas como El Hongo y La Cancha de Bochas nos recuerdan la fascinante e inabarcable historia geológica de nuestro mundo.',
    threeModelType: 'canyon',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    trivia: {
      question: '¿Por qué es científicamente célebre a nivel planetario el Parque Provincial Ischigualasto?',
      options: [
        'Por poseer la secuencia fósil continua más completa del Período Triásico',
        'Por albergar el meteorito más pesado del mundo',
        'Por ser el desierto más seco del hemisferio sur',
        'Por sus aguas termales curativas'
      ],
      correctIndex: 0,
      explanation: 'Es el único sitio del planeta donde se puede estudiar toda la evolución faunística del Triásico en una sola secuencia de estratos expuestos.'
    }
  }
];
