import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";

type ChatMessage = {
  role: string;
  text: string;
};

// En Vite las env vars públicas deben empezar por VITE_
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!apiKey) {
  console.warn(
    "VITE_GEMINI_API_KEY no está configurada. El asistente de Gemini no podrá responder en producción."
  );
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ID del modelo que quieres usar
const MODEL_ID = "gemini-2.5-flash";

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  if (!apiKey || !genAI) {
    return "Lo siento, no se ha configurado la API Key de demostración. Por favor contacta al administrador del sistema.";
  }

  try {
    // Creamos el modelo con la system instruction
    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Iniciamos el chat con el historial previo
    const chat = model.startChat({
      history: history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    // Enviamos el nuevo mensaje
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
