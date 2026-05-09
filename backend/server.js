import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Config (from .env or defaults)
const MODEL = process.env.OLLAMA_MODEL || "llama3";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Emergency detection
const emergencyKeywords = [
  "chest pain",
  "can't breathe",
  "difficulty breathing",
  "severe bleeding",
  "unconscious",
  "stroke",
  "heart attack"
];

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // 🔴 Safety layer FIRST
  if (emergencyKeywords.some(k => message.toLowerCase().includes(k))) {
    return res.json({
      reply: "⚠️ This may be an emergency. Please call 911 or go to the nearest ER immediately."
    });
  }

  try {
    const prompt = `
You are MedPet, a cautious medical assistant designed to help people without insurance.

Rules:
- Never diagnose conditions
- Never prescribe medication
- Provide general guidance only
- Always include uncertainty
- Recommend professional care when needed
- Be clear, calm, and supportive

User: ${message}
Assistant:
`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false
      })
    });

    const data = await response.json();

    res.json({
      reply: data.response
    });

  } catch (error) {
    console.error("Ollama error:", error);
    res.status(500).json({
      reply: "⚠️ Error communicating with the AI. Make sure Ollama is running."
    });
  }
});

app.listen(3000, () => {
  console.log(`✅ Server running at http://localhost:3000`);
});