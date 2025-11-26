// services/geminiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";

type ChatMessage = {
  role: string;
  text: string;
};

// En Vite, las env vars públicas deben empezar por VITE_
// Usamos un cast a any para que TypeScript no se queje de import.meta.env
const apiKey =
  (((import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined) ??
    "").trim();

if (!apiKey) {
  console.warn(
    "VITE_GEMINI_API_KEY no está configurada. El asistente de Gemini no podrá responder en producción."
  );
}

const MODEL_ID = "gemini-2.5-flash";

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  if (!apiKey || !genAI) {
    return "Lo siento, no se ha configurado la API Key de demostración. Por favor contacta al administrador del sistema.";
  }

  try {
    // Cast a any para evitar el error de tipo con systemInstruction
    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION,
    } as any);

    const chat = model.startChat({
      history: history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage(newMessage);
    const responseText = result.response.text();

    return (
      responseText ||
      "Lo siento, no pude generar una respuesta en este momento."
    );
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Hubo un error al conectar con el asistente. Por favor intenta más tarde.";
  }
};
