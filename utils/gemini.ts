import { GoogleGenAI } from "@google/genai";
import { getRuntimeApiKey } from "./runtimeConfig";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: getRuntimeApiKey() });
};
