import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

interface ProxyRequestBody {
    targetUrl: string;
    method: string;
    credentials: {
        username: string;
        password: string;
    };
    headers?: Record<string, string>;
    body?: string;
    depth?: string;
}

export const config = {
    api: {
        bodyParser: false, // Disable body parsing to handle streams
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if this is a streaming request (metadata in headers)
        const targetUrlHeader = req.headers['x-webdav-target-url'];

        if (targetUrlHeader) {
            // --- STREAMING MODE (For Uploads) ---
            const targetUrl = Array.isArray(targetUrlHeader) ? targetUrlHeader[0] : targetUrlHeader;
            const method = (req.headers['x-webdav-method'] as string) || 'PUT';
            const authHeader = req.headers['authorization']; // Forward the auth header directly

            if (!targetUrl) {
                return res.status(400).json({ error: 'Missing Target URL' });
            }

            const requestHeaders: any = {
                'User-Agent': 'PixelLite-Proxy/1.0',
            };

            if (authHeader) {
                requestHeaders['Authorization'] = authHeader;
            }

            // Forward other relevant headers if needed, e.g., Content-Type
            if (req.headers['content-type']) {
                requestHeaders['Content-Type'] = req.headers['content-type'];
            }

            // Pipe the request body directly to the WebDAV server
            const webdavResponse = await fetch(targetUrl, {
                method: method,
                headers: requestHeaders,
                body: req, // Pipe the incoming stream
            });

            if (!webdavResponse.ok) {
                const errorText = await webdavResponse.text();
                return res.status(webdavResponse.status).json({
                    error: 'WebDAV Error',
                    details: errorText,
                    status: webdavResponse.status
                });
            }

            return res.status(200).json({ success: true });

        } else {
            // --- JSON MODE (Legacy/Metadata) ---
            // Since bodyParser is false, we need to parse the JSON body manually
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const bodyStr = Buffer.concat(buffers).toString();

            let bodyJson;
            try {
                bodyJson = JSON.parse(bodyStr);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON body' });
            }

            const { targetUrl, method, credentials, headers = {}, body, depth } = bodyJson;

            if (!targetUrl || !method || !credentials) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const authHeader = 'Basic ' + Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

            const requestHeaders: any = {
                'Authorization': authHeader,
                'User-Agent': 'PixelLite-Proxy/1.0',
                ...headers
            };

            if (depth) {
                requestHeaders['Depth'] = depth;
            }

            // Handle binary data in body (if present and not streaming)
            let requestBody = undefined;
            if (body) {
                if (typeof body === 'string' && body.startsWith('base64:')) {
                    requestBody = Buffer.from(body.replace('base64:', ''), 'base64');
                } else {
                    requestBody = body;
                }
            }

            const webdavResponse = await fetch(targetUrl, {
                method: method,
                headers: requestHeaders,
                body: requestBody,
            });

            const contentType = webdavResponse.headers.get('content-type') || '';

            // Handle binary response (e.g. ZIP download)
            if (contentType.includes('application/zip') || contentType.includes('application/octet-stream')) {
                const arrayBuffer = await webdavResponse.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                return res.status(webdavResponse.status).json({
                    ok: webdavResponse.ok,
                    status: webdavResponse.status,
                    type: 'binary',
                    data: base64,
                    contentType
                });
            }

            const text = await webdavResponse.text();

            return res.status(webdavResponse.status).json({
                ok: webdavResponse.ok,
                status: webdavResponse.status,
                statusText: webdavResponse.statusText,
                text: text,
                headers: Object.fromEntries(webdavResponse.headers.entries())
            });
        }

    } catch (error: any) {
        console.error('WebDAV Proxy Error:', error);
        return res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
}
