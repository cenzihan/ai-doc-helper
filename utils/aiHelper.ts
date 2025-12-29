
import { GoogleGenAI } from "@google/genai";

export interface AIRequest {
  apiKey: string;
  model: string;
  baseUrl?: string; // If present, use OpenAI compatible fetch
  prompt: string;
  systemInstruction?: string;
  image?: string; // base64 string without data URI prefix (for Gemini) or full handling
  mimeType?: string; // e.g. 'image/png' or 'image/jpeg'
  jsonSchema?: any; // For Gemini schema or OpenAI json_object mode hint
}

/**
 * Unified function to call either Google Gemini SDK or OpenAI-compatible API (e.g. Alibaba DashScope)
 */
export async function generateContent(req: AIRequest): Promise<string> {
  const mimeType = req.mimeType || 'image/png';

  // ---------------------------------------------------------
  // 1. OpenAI Compatible Mode (For Alibaba Qwen, DeepSeek, etc.)
  // ---------------------------------------------------------
  if (req.baseUrl) {
    const messages: any[] = [];
    
    // System Prompt
    if (req.systemInstruction) {
      messages.push({ role: 'system', content: req.systemInstruction });
    }

    // User Content (Text + Image)
    const content: any[] = [{ type: 'text', text: req.prompt }];
    
    if (req.image) {
      // OpenAI/Compatible standard usually expects data URI for images
      content.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${req.image}` }
      });
    }
    
    messages.push({ role: 'user', content });

    const body: any = {
      model: req.model,
      messages: messages,
      stream: false 
    };

    // Handle JSON mode loosely for compatible APIs
    if (req.jsonSchema) {
       body.response_format = { type: "json_object" };
       // Append instruction to prompt to ensure JSON if not already there, as compatible APIs might not support strict schema
       const lastMsg = messages[messages.length - 1];
       if (typeof lastMsg.content === 'string') {
           lastMsg.content += "\n\nPlease respond in valid JSON format.";
       } else if (Array.isArray(lastMsg.content)) {
           lastMsg.content[0].text += "\n\nPlease respond in valid JSON format.";
       }
    }

    // Construct Endpoint
    // Remove trailing slash from base url
    const cleanBaseUrl = req.baseUrl.replace(/\/+$/, '');
    const endpoint = cleanBaseUrl.endsWith('/chat/completions') 
        ? cleanBaseUrl 
        : `${cleanBaseUrl}/chat/completions`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content;
        
        if (!result) throw new Error("No content in response");
        return result;
    } catch (e: any) {
        console.error("Compatible API Error:", e);
        throw new Error(`AI Request Failed: ${e.message}`);
    }
  } 
  
  // ---------------------------------------------------------
  // 2. Google Gemini Native SDK Mode
  // ---------------------------------------------------------
  const ai = new GoogleGenAI({ apiKey: req.apiKey });
  
  const parts: any[] = [];
  if (req.image) {
    parts.push({ inlineData: { mimeType: mimeType, data: req.image } });
  }
  parts.push({ text: req.prompt });

  const config: any = {};
  if (req.systemInstruction) {
    config.systemInstruction = req.systemInstruction;
  }
  if (req.jsonSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = req.jsonSchema;
  }

  const response = await ai.models.generateContent({
    model: req.model,
    contents: { parts },
    config
  });

  return response.text || "";
}
