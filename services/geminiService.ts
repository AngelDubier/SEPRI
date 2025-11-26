import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize with a check. In a real app, this would be process.env.API_KEY
// We use a safe check for process to avoid ReferenceError in browser environments that don't polyfill it.
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';

const ai = new GoogleGenAI({ apiKey });

export const sendMessageToGemini = async (history: { role: string, text: string }[], newMessage: string): Promise<string> => {
  if (!apiKey) {
    return "Lo siento, no se ha configurado la API Key de demostración. Por favor contacta al administrador del sistema.";
  }

  try {
    const model = "gemini-2.5-flash";
    
    // Transform history to the format expected by the SDK
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const response = await chat.sendMessage({
      message: newMessage
    });

    return response.text || "Lo siento, no pude generar una respuesta en este momento.";

  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Hubo un error al conectar con el asistente. Por favor intenta más tarde.";
  }
};