
import { GoogleGenAI } from "@google/genai";
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { image, prompt, apiKey, model = 'gemini-2.5-flash-image', baseUrl } = req.body;

    // Use provided API key or fallback to environment variable
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        const options: any = { apiKey: key };
        if (baseUrl) {
            options.httpOptions = { baseUrl: baseUrl };
        }
        const ai = new GoogleGenAI(options);
        const cleanBase64 = image.split(',')[1] || image;

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
        let foundImage = null;
        let foundMimeType = null;
        let accumulatedText = "";

        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    foundImage = part.inlineData.data;
                    foundMimeType = part.inlineData.mimeType || 'image/png';
                }

                // Check for markdown image in text
                if (part.text) {
                    let text = part.text;
                    const match = text.match(/!\[.*?\]\(data:(.*?);base64,(.*?)\)/);
                    if (match) {
                        foundMimeType = match[1];
                        foundImage = match[2];
                        // Remove the image markdown from the text
                        text = text.replace(match[0], '').trim();
                    }
                    if (text) {
                        accumulatedText += text + "\n";
                    }
                }
            }
        }

        if (foundImage || accumulatedText) {
            return res.status(200).json({
                image: foundImage,
                mimeType: foundMimeType,
                text: accumulatedText.trim()
            });
        }

        // If neither image nor text found, return the full response for debugging
        return res.status(200).json({
            text: JSON.stringify(response, null, 2)
        });

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
