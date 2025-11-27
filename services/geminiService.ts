
import { GoogleGenAI } from "@google/genai";
import { AIData } from "../types";

const getAIClient = (apiKey: string, baseUrl?: string) => {
    const options: any = { apiKey };
    if (baseUrl) {
        options.baseUrl = baseUrl;
    }
    return new GoogleGenAI(options);
};

export const analyzeImage = async (
    base64Image: string, 
    apiKey: string, 
    baseUrl?: string,
    model: string = 'gemini-2.5-flash'
): Promise<AIData | null> => {
  if (!apiKey) return null;

  try {
    const ai = getAIClient(apiKey, baseUrl);
    
    // Remove data:image/xxx;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "分析这张图片。请以 JSON 格式返回结果，包含两个字段：'description' (一段50字以内的中文描述) 和 'tags' (3-5个适合SEO的中文标签数组)。"
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      const data = JSON.parse(text);
      return {
        description: data.description || "无法生成描述",
        tags: Array.isArray(data.tags) ? data.tags : []
      };
    } catch (e) {
      console.error("JSON Parse Error", e);
      return {
          description: text.substring(0, 100),
          tags: []
      }
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

/**
 * Generates an enhanced/processed version of the image using AI.
 * Note: This relies on the model returning an image part.
 */
export const generateEnhancedImage = async (
    base64Image: string,
    prompt: string,
    model: string,
    apiKey: string,
    baseUrl?: string
): Promise<Blob | null> => {
    if (!apiKey) throw new Error("API Key is required");

    try {
        const ai = getAIClient(apiKey, baseUrl);
        const cleanBase64 = base64Image.split(',')[1] || base64Image;

        const response = await ai.models.generateContent({
            model: model, 
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: cleanBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        // Check for image in response
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    const byteCharacters = atob(part.inlineData.data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    // Default to png if unknown
                    return new Blob([byteArray], { type: part.inlineData.mimeType || 'image/png' });
                }
            }
        }
        
        console.warn("AI did not return an image part. Response text:", response.text);
        throw new Error("模型未返回图片数据，请检查模型是否支持该功能或 Prompt 是否正确。");

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};
