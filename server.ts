import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google Gen AI with recommended free model gemini-3.8-flash
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for María Ignacia's personal Argentine guide
const SYSTEM_INSTRUCTION = `
Sos el Asistente Guía de Viaje Inteligente y Personal para María Ignacia, creado con mucho amor por su pareja Rodrigo para acompañarla en su aventura por la República Argentina.
Tu misión es ser su compañero de viaje ideal: cálido, protector, experto en turismo argentino y sumamente práctico.

Puntos clave sobre María Ignacia y su viaje:
- Ella está de viaje en Argentina y solo tiene conexión a internet mediante Wi-Fi (no tiene roaming/datos móviles en la calle).
- Puede consultarte sobre su schedule/itinerario, horarios de apertura y cierre de parques y monumentos, distancias, mejores horas de luz para fotos, dónde comer (empanadas, medialunas, helados artesanales, alfajores, asado), cómo trasladarse (tarjeta SUBE para colectivos y subte en CABA, taxis/remises confiables, vuelos) y precauciones útiles de viaje.
- Si ella te comparte su ubicación geográfica (latitud y longitud), indícale exactamente en qué ciudad/zona se encuentra, a qué monumentos cercanos está y qué puede hacer ahí mismo.
- Sé cariñoso, respetuoso y entusiasta. Recordale siempre que Rodrigo pensó esta aplicación para que ella disfrute al máximo cada instante de su estadía en Argentina sin estrés.
- Respuestas estructuradas con viñetas, horarios claros y consejos concisos para que pueda leerlos fácilmente en su teléfono móvil.
`;

// API Endpoint: Chat with AI Guide
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, itinerary, userLocation, chatHistory } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Servicio de IA en espera de configuración de clave en Secrets.',
        offlineHelp: true,
      });
    }

    // Compose rich contextual prompt
    let contextPrompt = '';
    if (itinerary && Array.isArray(itinerary) && itinerary.length > 0) {
      contextPrompt += `\n[Itinerario actual de María Ignacia]:\n` +
        itinerary.map((day: { dayNumber: number; title: string; activities: { time: string; text: string; done?: boolean }[] }) => {
          const actList = (day.activities || []).map(a => `  - ${a.time || 'Horario flexible'}: ${a.text} ${a.done ? '(Completado)' : ''}`).join('\n');
          return `Día ${day.dayNumber}: ${day.title}\n${actList}`;
        }).join('\n\n');
    }

    if (userLocation && typeof userLocation.lat === 'number') {
      contextPrompt += `\n\n[Ubicación GPS actual de María Ignacia]: Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}${userLocation.address ? ` (${userLocation.address})` : ''}`;
    }

    const contents = `${contextPrompt}\n\nPregunta de María Ignacia: "${message || 'Hola, ¿qué me recomiendas para mi itinerario?'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const replyText = response.text || '¡Hola María Ignacia! Estoy aquí para ayudarte con tu recorrido por Argentina.';
    return res.json({ reply: replyText });
  } catch (error: unknown) {
    console.error('Error calling Gemini API:', error);
    const errMsg = error instanceof Error ? error.message : 'Error al procesar la respuesta de la IA';
    return res.status(500).json({
      error: errMsg,
      offlineFallback: true,
    });
  }
});

// API Endpoint: Optimize / Plan Schedule with AI
app.post('/api/ai/plan-schedule', async (req, res) => {
  try {
    const { totalDays, interests, regions } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const prompt = `Crea un itinerario sugerido perfecto y equilibrado para María Ignacia de ${totalDays || 5} días en Argentina.
Intereses: ${interests || 'Paisajes naturales, gastronomía, fotos y caminatas tranquilas'}.
Regiones preferidas: ${regions || 'Buenos Aires y Patagonia o Iguazú'}.
Proporciona cada día con título, 3 actividades con horario estimado y un consejo especial para ella.
Responde en formato JSON estrictamente válido con la siguiente estructura:
{
  "title": "Itinerario para María Ignacia",
  "summary": "Breve resumen",
  "days": [
    {
      "dayNumber": 1,
      "title": "Llegada y paseo porteño",
      "activities": [
        { "time": "10:00", "text": "Caminar por Plaza de Mayo y Casa Rosada" },
        { "time": "14:00", "text": "Almuerzo y café en San Telmo" },
        { "time": "17:00", "text": "Atardecer junto al Obelisco" }
      ],
      "tip": "Tip de ahorro o mejor hora para fotos"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    return res.json(JSON.parse(raw));
  } catch (error: unknown) {
    console.error('Error generating plan:', error);
    return res.status(500).json({ error: 'Error al generar itinerario con IA' });
  }
});

// Vite middleware in dev or static server in prod
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
