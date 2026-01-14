
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { ChatMessage } from "../types";

/**
 * Sends a message to the Gemini AI model and retrieves the response.
 * Uses process.env.API_KEY for authentication as required by the environment.
 */
export const sendMessageToGemini = async (
  history: ChatMessage[],
  _newMessage: string
): Promise<string> => {
  try {
    // Initialize GoogleGenAI with process.env.API_KEY as mandated.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Select the flash model for basic Q&A tasks to ensure low latency.
    const modelName = 'gemini-3-flash-preview';

    // Map conversation history to the format expected by the GenAI SDK.
    const contents = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Generate content using the specified model and system instruction.
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    // Extract the text output using the .text property of GenerateContentResponse.
    const text = response.text;

    return (
      text ||
      "Lo siento, no pude generar una respuesta en este momento."
    );
  } catch (error: any) {
    console.error("Error llamando a Gemini:", error);
    // Graceful error handling for connectivity or API issues.
    return "Hubo un error al conectar con el asistente. Por favor intenta más tarde.";
  }
};