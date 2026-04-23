import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI lazily
  let aiClient: any = null;
  const getAI = () => {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  };

  // --- API Routes ---

  app.post("/api/simulate", async (req, res) => {
    try {
      const { habits } = req.body;
      const ai = getAI();
      const prompt = `
        Simulate a future life based on these current habits:
        Study/Work: ${habits.studyHabits}
        Fitness: ${habits.fitnessRoutine}
        Sleep: ${habits.sleepSchedule}
        Goals: ${habits.goals}
        Current Stress Level: ${habits.stressLevel}/10

        Provide a realistic, data-driven simulation of where this person will be in 6 months and 5 years.
        Be encouraging but honest. If habits leading to burnout, mention it.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sixMonths: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  metrics: {
                    type: Type.OBJECT,
                    properties: {
                      health: { type: Type.NUMBER },
                      career: { type: Type.NUMBER },
                      happiness: { type: Type.NUMBER },
                    },
                  },
                },
                required: ["description", "metrics"],
              },
              fiveYears: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  metrics: {
                    type: Type.OBJECT,
                    properties: {
                      health: { type: Type.NUMBER },
                      career: { type: Type.NUMBER },
                      happiness: { type: Type.NUMBER },
                    },
                  },
                },
                required: ["description", "metrics"],
              },
              habitAnalysis: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              futureSelfAdvice: { type: Type.STRING },
            },
            required: ["sixMonths", "fiveYears", "habitAnalysis", "warnings", "futureSelfAdvice"],
          },
        },
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message, simulation } = req.body;
      const ai = getAI();
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `
            You are the user's future self from the 5-year simulation provided.
            Your current life state: ${simulation.fiveYears.description}
            You have achieved: ${simulation.fiveYears.metrics.career}/10 career, ${simulation.fiveYears.metrics.health}/10 health, ${simulation.fiveYears.metrics.happiness}/10 happiness.
            Talk to your younger self with wisdom, empathy, and occasional "back in my day" or "I remember when we used to..." vibes.
            Encourage them based on their goals but warn them about the pitfalls you've experienced in this simulation.
          `,
        },
        history: history,
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // --- Vite & Static Asset Handling ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched at http://localhost:${PORT}`);
  });
}

startServer();
