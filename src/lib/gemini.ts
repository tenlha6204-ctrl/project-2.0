import { GoogleGenAI, Type } from "@google/genai";

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
  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habits }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to simulate future");
  }
  
  return response.json();
}

export async function chatWithFutureSelf(history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string, simulation: SimulationResult) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, message, simulation }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to chat with future self");
  }

  const data = await response.json();
  return data.text;
}
