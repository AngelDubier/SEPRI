
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { ChatMessage } from "../types";

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string,
  providedApiKey?: string
): Promise<string> => {
  try {
    // Usar la clave proporcionada o caer en la de entorno como respaldo
    const apiKey = providedApiKey || process.env.API_KEY;

    if (!apiKey) {
      return "Error: API Key de Gemini no configurada en el sistema.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-pro-preview';

    const contents = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text;

    return (
      text ||
      "Lo siento, no pude generar una respuesta en este momento."
    );
  } catch (error: any) {
    console.error("Error llamando a Gemini:", error);
    if (error?.message?.includes('API_KEY_INVALID')) {
      return "La API Key configurada no es válida. Por favor revise la configuración administrativa.";
    }
    return "Hubo un error al conectar con el asistente. Por favor intenta más tarde.";
  }
};
