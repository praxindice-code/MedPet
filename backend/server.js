import express from "express";
import cors from "cors";

import { intakeFlow } from "./services/intakeFlow.js";
import { calculateTriage } from "./services/riskEngine.js";

const app = express();

app.use(cors());
app.use(express.json());

console.log("🩺 MedPet Chat Triage Running");

let sessions = {};

app.post("/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      step: 0,
      answers: {}
    };
  }

  const session = sessions[sessionId];

  if (session.step > 0) {
    const prevKey = intakeFlow[session.step - 1].key;
    session.answers[prevKey] = message;
  }

  // Phase 1 & 2: intake flow
  if (session.step < intakeFlow.length) {
    const nextQuestion = intakeFlow[session.step].question;
    session.step++;
    return res.json({ reply: nextQuestion, done: false });
  }

  // Phase 3: triage score + Ollama summary
  const triageInput = {
    ...session.answers,
    severity: parseFloat(session.answers.severity) || 0,
    age: parseInt(session.answers.age, 10) || 0
  };
  const result = calculateTriage(triageInput);
  const answers = session.answers;
  delete sessions[sessionId];

  const prompt = `You are MedPet, a clinical triage assistant. A patient just completed a symptom intake form.

Patient answers:
${Object.entries(answers).map(([k, v]) => `  ${k}: ${v}`).join("\n")}

Triage result:
  Risk level: ${result.level}
  Score: ${result.score}
  Reasons: ${result.reasons?.join(", ") || "none"}

Write a concise clinical summary (3-5 sentences) that:
1. Briefly restates the key symptoms
2. Explains the risk level and what it means for the patient
3. Gives a clear recommended next step (e.g. go to ER, schedule urgent appointment, monitor at home)

Be direct and plain-language — this is shown to the patient, not the clinician.`;

  try {
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: prompt,
        stream: false
      })
    });

    const ollamaData = await ollamaResponse.json();
    const summary = ollamaData.response;

    return res.json({
      reply: summary,
      done: true,
      data: result
    });

  } catch (err) {
    console.error("Ollama error:", err);
    return res.json({
      reply: `Based on your symptoms, your risk level is: ${result.level}`,
      done: true,
      data: result
    });
  }
});

app.get("/", (req, res) => {
  res.send("MedPet Chat API is live 🩺");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});