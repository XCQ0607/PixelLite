import { AIData } from "../types";

export const analyzeImage = async (
  base64Image: string,
  apiKey: string,
  baseUrl?: string,
  model: string = 'gemini-2.5-flash'
): Promise<AIData | null> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        apiKey,
        baseUrl,
        model
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

/**
 * Generates an enhanced/processed version of the image using AI.
 */
export const generateEnhancedImage = async (
  base64Image: string,
  prompt: string,
  model: string,
  apiKey: string,
  baseUrl?: string
): Promise<Blob | null> => {
  try {
    const response = await fetch('/api/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt,
        model,
        apiKey,
        baseUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.image) {
      const byteCharacters = atob(data.image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: data.mimeType || 'image/png' });
    }

    throw new Error("No image returned from API");

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
