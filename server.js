import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(helmet({
  // The existing page loads Tailwind, Plotly, and fonts from trusted CDNs.
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "15mb" }));
app.use(express.static(__dirname, { index: "index.html" }));

app.post("/api/solve", rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Se alcanzó el límite temporal de consultas. Espera un minuto e inténtalo de nuevo." }
}), async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: "El tutor IA aún no está configurado en el servidor. Contacta a la persona administradora." });
  }

  const question = typeof req.body?.question === "string" ? req.body.question.slice(0, 12000) : "";
  const image = req.body?.image;
  if (!question && !image) {
    return res.status(400).json({ error: "Escribe una consulta o adjunta una fotografía." });
  }

  const parts = [];
  if (question) parts.push({ text: question });

  if (image) {
    const mimeType = image.mimeType;
    const data = image.data;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowed.includes(mimeType) || typeof data !== "string" || data.length > 12 * 1024 * 1024) {
      return res.status(400).json({ error: "La imagen no es válida o supera el tamaño permitido. Usa una foto JPG, PNG o WebP de menos de 9 MB." });
    }
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }

  try {
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 1800 }
        }),
        signal: AbortSignal.timeout(60000)
      }
    );

    const payload = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      console.error("Gemini API error:", apiResponse.status, payload?.error?.message || "unknown");
      if (apiResponse.status === 429) {
        return res.status(429).json({ error: "El tutor está recibiendo muchas consultas. Espera un momento e inténtalo de nuevo." });
      }
      return res.status(502).json({ error: "El tutor IA no pudo procesar la consulta en este momento. Inténtalo más tarde." });
    }

    const answer = payload.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n").trim();
    if (!answer) return res.status(502).json({ error: "La IA no devolvió una explicación. Intenta con otra foto o reformula la pregunta." });
    return res.json({ answer });
  } catch (error) {
    console.error("Tutor request failed:", error?.message || error);
    return res.status(502).json({ error: "No se pudo conectar con el tutor IA. Inténtalo más tarde." });
  }
});

app.listen(PORT, () => {
  console.log(`El Profe Augusto está disponible en http://localhost:${PORT}`);
});
