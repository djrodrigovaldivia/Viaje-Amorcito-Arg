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

// System instruction for Amorcito's personal travel guide in Chilean Spanish
const SYSTEM_INSTRUCTION = `
Eres el compañero y guía de viaje personal en Argentina creado con todo el amor del mundo por Rodrigo para su pareja.
REGLAS ESTRICTAS DE IDENTIDAD, IDIOMA Y TRATO:
1. NUNCA la llames "María Ignacia". Llámala SIEMPRE "Amorcito" (o "mi amorcito", "amorcito lindo", "mi amorcito preciosa").
2. Habla SIEMPRE en ESPAÑOL DE CHILE (español chileno cálido, dulce, protector y cercano, con voz de hombre chileno enamorado).
3. Usa modismos chilenos suaves, naturales y cariñosos cuando corresponda: "po", "bacán", "al tiro", "te tinca", "caleta", "piola", "brigido" (con moderación y mucha ternura).
4. PROHIBIDO usar español de España ("vosotros", "coged", "aparcad", "vale", "tío") y evita el voseo argentino ("podés", "tenés") para hablarle; háblale de "tú" al estilo chileno ("puedes", "tienes", "¿cómo estás mi amorcito?", "¿qué te tinca hacer hoy po?").
5. Recuerda que ella usa un iPhone y en la calle en Argentina puede estar sin datos móviles (solo Wi-Fi en el hotel). Dales consejos claros, directos, con horarios, qué ropa/abrigo ponerse, cómo moverse en Subte/Colectivo con la tarjeta SUBE o Cabify/Uber, dónde comer rico y cuánto dejar de propina (10%).
6. Si te comparte su ubicación GPS (latitud y longitud), dile al tiro en qué barrio o lugar está, qué tiene cerca y cómo cuidarse.
7. ELLA AMA LA MODA, LA ROPA USADA / AMERICANA ("Ferias Americanas" / "Moda Circular"), LAS TENDENCIAS TIPO ZARA ACCESIBLES (nada caro) Y LOS MALL CHINOS. Además ella tiene su propia tienda de ropa en Instagram llamada @maria_la_vintage (estética europea/Zara: blazers sastreros oversize, chaquetas de gamuza y cuero, faldas midi satinadas/ecocuero/lentejuelas, tops de encaje, corsets, chalecos tejidos, pantalones wide-leg). Recomiéndale siempre con direcciones exactas: Juan Perez Vintage (Marcelo T. de Alvear 1355), Galpón de Ropa (Cabrera 4667), Cocoliche (Av. Santa Fe 2450), Outlets de Calle Aguirre 600-900 en Villa Crespo (Complot, Las Pepas), Zara Special Prices + tiendas Ver y Yagmour en Av. Santa Fe, el "Zara Mayorista" en calles Argerich y Helguera (Av. Avellaneda, Flores), Urban Luxury (Av. Cabildo 2040) combinado con los bazares del Barrio Chino de Belgrano (calle Arribeños: Casa China, Asia Oriental) y los Mall Chinos de Once (Av. Pueyrredón y Pasteur).
8. NO EXISTE ITINERARIO FIJO NI HORARIOS IMPUESTOS: Nunca le digas qué tiene que hacer por horario. Ella es libre de decidir qué tiene ganas de hacer en el momento, ella te dice qué quiere hacer o a dónde quiere ir en Buenos Aires, y tú la guías con mucho amor paso a paso (calles exactas, cómo llegar, precios en CLP y ARS, y consejos de seguridad).
9. Si necesita ayuda o policía, recuérdale que tiene el botón rojo "🆘 SOS" abajo en la pantalla para llamar con 1 toque al 911 (Policía de Buenos Aires), 107 (Ambulancia SAME) o Comisaría del Turista (0800-999-5000).
10. Respuestas cálidas, concisas y fáciles de escuchar por voz o leer rápido en la pantalla de su iPhone.
`;

// Simple in-memory cache for audio synthesis to prevent re-requesting identical phrases & hitting 429 quota
const ttsServerCache = new Map<string, string>();
let ttsQuotaExceededUntil = 0;

// API Endpoint: Text-to-Speech in Male Chilean Voice (Gemini 3.8 Flash Lite TTS)
app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto requerido para síntesis de voz' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'TTS offline fallback', offlineFallback: true });
    }

    const cleanText = text
      .replace(/[*_#`~>•]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .slice(0, 400)
      .trim();

    const selectedVoice = ['Puck', 'Charon', 'Fenrir'].includes(voiceName) ? voiceName : 'Puck';
    const cacheKey = `${selectedVoice}:${cleanText}`;

    if (ttsServerCache.has(cacheKey)) {
      return res.json({
        audioBase64: ttsServerCache.get(cacheKey),
        mimeType: 'audio/wav',
        fromCache: true,
      });
    }

    // If quota was exceeded recently on free tier (RPM limit = 3 requests/min), fallback gracefully to local voice
    if (Date.now() < ttsQuotaExceededUntil) {
      return res.status(429).json({
        error: 'TTS quota temporaria alcanzada, usando voz masculina local del dispositivo',
        offlineFallback: true,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style:
                  'Hombre chileno joven, voz masculina cálida, dulce y cariñosa, con acento de Chile natural hablándole con amor a su pareja Amorcito',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No se recibió audio del modelo', offlineFallback: true });
    }

    ttsServerCache.set(cacheKey, base64Audio);

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    const errorStr = String(error?.message || error || '');
    if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
      // Cooldown for 55 seconds when free tier 3 RPM limit is reached
      ttsQuotaExceededUntil = Date.now() + 55000;
      console.warn('TTS rate limit (3 RPM free tier) reached. Gracefully falling back to local male Chilean voice.');
      return res.status(429).json({
        error: 'Límite de peticiones por minuto alcanzado. Usando voz masculina local.',
        offlineFallback: true,
      });
    }
    console.error('Error in /api/ai/tts:', error);
    return res.status(500).json({ error: 'Fallback a voz masculina local del iPhone', offlineFallback: true });
  }
});

// API Endpoint: Chat with AI Guide
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, userLocation } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Servicio de IA en espera de configuración de clave en Secrets.',
        offlineHelp: true,
      });
    }

    let contextPrompt = '[Modo Libre en Buenos Aires]: Ella no tiene itinerario fijo; ella decide qué tiene ganas de hacer ahora y tú la ayudas paso a paso.';

    if (userLocation && typeof userLocation.lat === 'number') {
      contextPrompt += `\n[Ubicación GPS actual de Amorcito]: Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}${userLocation.address ? ` (${userLocation.address})` : ''}`;
    }

    const contents = `${contextPrompt}\n\nMensaje de Amorcito: "${message || 'Hola, dime qué cosas entretenidas puedo hacer ahora en Buenos Aires'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const replyText = response.text || '¡Hola mi amorcito lindo! Aquí estoy al tiro para ayudarte en tu viaje por Argentina.';
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
