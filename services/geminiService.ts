import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { ChatMessage } from "../types";

/**
 * Sends a message to the Gemini AI model and retrieves the response.
 * This function follows the @google/genai coding guidelines.
 */
export const sendMessageToGemini = async (
  history: ChatMessage[],
  _newMessage: string,
  _providedApiKey?: string
): Promise<string> => {
  try {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    // Use this process.env.API_KEY string directly when initializing the @google/genai client instance.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using 'gemini-3-flash-preview' for general chat and basic text tasks.
    const modelName = 'gemini-3-flash-preview';

    // Map the local ChatMessage array to the SDK's Content[] structure.
    const contents = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Calling generateContent with the model name, contents, and system instructions in config.
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    // The GenerateContentResponse has a .text property (not a method) which returns the extracted string output.
    const text = response.text;

    return (
      text ||
      "Lo siento, no pude generar una respuesta en este momento."
    );
  } catch (error: any) {
    console.error("Error llamando a Gemini:", error);
    // Standard error message without exposing technical details of the API configuration.
    return "Hubo un error al conectar con el asistente. Por favor intenta más tarde.";
  }
};
