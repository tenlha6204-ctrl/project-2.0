import { GoogleGenAI, Type } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface UserHabits {
  studyHabits: string;
  fitnessRoutine: string;
  sleepSchedule: string;
  goals: string;
  stressLevel: number; // 1-10
}

export interface SimulationResult {
  sixMonths: {
    description: string;
    metrics: {
      health: number;
      career: number;
      happiness: number;
    };
  };
  fiveYears: {
    description: string;
    metrics: {
      health: number;
      career: number;
      happiness: number;
    };
  };
  habitAnalysis: string[];
  warnings: string[];
  futureSelfAdvice: string;
}

export async function simulateFuture(habits: UserHabits): Promise<SimulationResult> {
  const ai = getGenAI();
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

  return JSON.parse(response.text || "{}") as SimulationResult;
}

export async function chatWithFutureSelf(history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string, simulation: SimulationResult) {
  const ai = getGenAI();
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
  return response.text;
}
