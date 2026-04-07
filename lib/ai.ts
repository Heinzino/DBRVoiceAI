import OpenAI from "openai";

let client: OpenAI | null = null;

export function openrouter(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return client;
}

// Fast, cheap, great at structured JSON and natural conversation
export const MODEL = "google/gemini-2.5-flash";
