import { GoogleGenAI } from "@google/genai";

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { image, apiKey, model = 'gemini-2.5-flash', baseUrl } = req.body;

    // Logic:
    // 1. If user provides apiKey: Use user's apiKey. Use user's baseUrl if provided, otherwise default (undefined). Ignore env vars.
    // 2. If user provides NO apiKey: Use env GEMINI_API_KEY and env GEMINI_BASE_URL.

    let key: string | undefined;
    let apiBaseUrl: string | undefined;

    if (apiKey) {
        key = apiKey;
        apiBaseUrl = baseUrl; // Use provided baseUrl or undefined (default)
    } else {
        key = process.env.GEMINI_API_KEY;
        apiBaseUrl = process.env.GEMINI_BASE_URL;
    }

    if (!key) {
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        const options: any = { apiKey: key };
        if (apiBaseUrl) {
            options.httpOptions = { baseUrl: apiBaseUrl };
        }
        const ai = new GoogleGenAI(options);

        // Remove data:image/xxx;base64, prefix if present
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
        if (!text) {
            return res.status(500).json({ error: 'No response from AI' });
        }

        try {
            const data = JSON.parse(text);
            return res.status(200).json({
                description: data.description || "无法生成描述",
                tags: Array.isArray(data.tags) ? data.tags : []
            });
        } catch (e) {
            return res.status(200).json({
                description: text.substring(0, 100),
                tags: []
            });
        }

    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
