import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an intelligent assistant embedded within a WeChat clone application. 
Your name is "WeChat AI". 
Keep your responses concise, friendly, and helpful, similar to how a friend would text on a messaging app. 
Use emojis occasionally. 
If asked about the app, explain that this is a React-based clone for demonstration purposes.`;

export const sendMessageToGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing");
      return "I'm currently offline (API Key missing). Please check your configuration.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // We use the 'gemini-2.5-flash' model for fast, chat-like responses
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history,
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: newMessage
    });

    return result.text || "Sorry, I didn't catch that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Network error. Please check your connection or API Key.";
  }
};