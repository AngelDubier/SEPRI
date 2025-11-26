// services/geminiService.ts (o el nombre que tenga este archivo)

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";

type ChatMessage = {
  role: string;
  text: string;
};

// En Vite, las variables públicas deben empezar por VITE_
// Usamos (import.meta as any) para que TypeScript no se queje en el build.
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
    // getGenerativeModel del SDK oficial
    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION,
    } as any); // cast para evitar error de tipos con systemInstruction

    // Convertimos el historial al formato del SDK
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
