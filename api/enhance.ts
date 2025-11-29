import { GoogleGenAI } from "@google/genai";

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { image, prompt, apiKey, model, baseUrl } = req.body;

    // Use provided API key or fallback to environment variable
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        const options: any = { apiKey: key };
        if (baseUrl) {
            options.baseUrl = baseUrl;
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
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    // Return the base64 image directly
                    return res.status(200).json({
                        image: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'image/png'
                    });
                }
            }
        }

        return res.status(500).json({ error: "AI did not return an image part." });

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
