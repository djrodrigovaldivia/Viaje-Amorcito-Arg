# Motor de Mapa Satelital 100% Libre y Gratuito para Argentina 3D

Reemplazo total del motor de mapas para eliminar para siempre los avisos de Google Maps, las marcas de agua de desarrollo y cualquier requerimiento de tarjeta de crédito o claves de pago. Se implementará una solución basada en **imágenes satelitales reales de alta resolución (Esri World Imagery / ArcGIS)** combinada con soporte offline y capas híbridas de OpenStreetMap.

---

## Decisiones del Usuario y Contexto Confirmado

> [!IMPORTANT]
> - **Estilo de mapa seleccionado:** Satélite real de alta resolución sin clave (imágenes satelitales nítidas del territorio argentino, glaciar, cataratas, montañas y ciudades).
> - **Acceso:** 100% libre y gratuito. Sin necesidad de registrar tarjetas de crédito, cuentas de Google Cloud, tokens ni claves de API en Vercel. Funciona inmediatamente al abrir la web.

- **Problema resuelto:** Desaparece el diálogo *"Esta página no puede cargar Google Maps correctamente"* y la marca de agua *"For development purposes only"*.
- **Beneficiaria:** María Ignacia tendrá un mapa fluido, hermoso y confiable tanto en Vercel como en modo offline en su celular mientras viaja por Argentina.

---

## 1. El Nuevo Motor de Mapas: Satélite de Alta Resolución Sin Clave

Utilizaremos **Leaflet** con la capa oficial y abierta de **Esri World Imagery** (el estándar de la industria para satélite gratuito sin cuotas restrictivas):

1. **Satélite Real de Alta Calidad (Esri World Imagery):**
   - Fotografía aérea y satelital nítida de todo el planeta, con extraordinario detalle en Argentina (CABA, Iguazú, Perito Moreno, Bariloche, Ushuaia, Mendoza, etc.).
   - Endpoint abierto: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`.
   - **Cero costo, cero configuración:** No requiere API key ni encabezados de autorización.
2. **Capa Híbrida / Nombres y Fronteras (Esri Boundaries & Places):**
   - Permite superponer los nombres de ciudades, rutas y provincias sobre el satélite.
3. **Capa Alternativa Modo Callejero / Nocturno (OpenStreetMap & CartoDB Dark Matter):**
   - Para cuando se desee explorar calles peatonales o ahorrar batería con un diseño oscuro elegante.

---

## 2. Experiencia de Usuario & Características Interactivas

El nuevo mapa mantendrá y mejorará todas las funciones interactivas que preparamos para María Ignacia:

- **12 Marcadores con el Sol de Mayo:**
  - Pins animados con burbujas de vidrio esmerilado (*glassmorphism*), elevación en metros sobre el nivel del mar y bandera argentina.
  - Al pulsar un marcador: la cámara vuela suavemente (*flyTo*) al monumento, se despliega una ficha emergente con foto y botón directo al Gemelo Digital 3D (Three.js).
- **Ruta Turística Aérea:**
  - Línea continua brillante (*cyan glow*) que conecta todas las paradas del tour por Argentina.
- **Ubicación GPS de María Ignacia (`📍 ¿Dónde estoy?`):**
  - Pin especial con corazón palpitante y su nombre en el mapa, calculando la distancia en kilómetros al atractivo más cercano.
- **Selector de Capas:**
  - Botón en pantalla para alternar entre **Satélite Real**, **Híbrido con Nombres** y **Relieve Topográfico**.
- **Controles de Zoom y Vista Panorámica:**
  - Botones táctiles diseñados para pantallas móviles para acercar, alejar y centrar todo el país con un solo toque.

---

## 3. Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────┐
│            Nuevo Motor de Mapas Satelital              │
│       (Leaflet + Esri World Imagery + CartoDB)         │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│  Satélite   │      │  Marcadores │      │  GPS María  │
│  HD Esri    │      │  12 Destinos│      │  Ignacia    │
│  (Sin Key)  │      │  Animados   │      │  (En vivo)  │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  Gemelos Digitales 3D     │
              │  Diario de Viaje (Fotos)  │
              │  Clima y Empaque          │
              │  Itinerario Guardado      │
              │  100% Funcional Offline   │
              └───────────────────────────┘
```

---

## 4. Plan de Implementación Técnica

1. **Instalación de Dependencias:**
   - Instalar `leaflet` y `@types/leaflet`.
2. **Nuevo Componente `FreeMapView.tsx` (Reemplazo de Google Maps):**
   - Inicializar el visor de mapa sobre Argentina con soporte táctil ágil y animaciones fluidas.
   - Cargar las teselas satelitales de Esri con caché del navegador.
   - Proyectar los 12 monumentos, polilínea de vuelo y marcador de María Ignacia con marcadores HTML personalizados sin dependencias externas.
3. **Actualización de `App.tsx`:**
   - Desconectar la dependencia de la API Key de Google Maps.
   - Montar el nuevo visor interactivo que funcionará de inmediato tanto en local como al desplegar en Vercel.
4. **Verificación:**
   - Compilación completa (`compile_applet`) y validación de tipos (`lint_applet`).
   - Prueba del mapa en navegador para garantizar fluidez y ausencia de errores.
