import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { targetUrl, method, credentials, headers = {}, body, depth } = req.body as ProxyRequestBody;

        // Validate request
        if (!targetUrl || !method || !credentials?.username || !credentials?.password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate URL format
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            return res.status(400).json({ error: 'Invalid target URL' });
        }

        // Build authorization header
        const authHeader = 'Basic ' + Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

        // Prepare headers
        const requestHeaders: HeadersInit = {
            'Authorization': authHeader,
            'User-Agent': 'PixelLite-Pro/1.0 (Vercel Serverless)',
            ...headers
        };

        // Add Depth header for PROPFIND if provided
        if (depth !== undefined) {
            requestHeaders['Depth'] = depth;
        }

        // Make the request to WebDAV server
        const webdavResponse = await fetch(targetUrl, {
            method: method,
            headers: requestHeaders,
            body: body ? body : undefined,
        });

        // Get response text/blob
        const contentType = webdavResponse.headers.get('content-type') || '';
        let responseData: any;

        if (contentType.includes('application/zip') || contentType.includes('application/octet-stream')) {
            // Binary data (for file downloads)
            const arrayBuffer = await webdavResponse.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            responseData = {
                type: 'binary',
                data: base64,
                contentType: contentType
            };
        } else {
            // Text data (XML, JSON, etc.)
            responseData = {
                type: 'text',
                data: await webdavResponse.text()
            };
        }

        // Return response
        return res.status(webdavResponse.status).json({
            ok: webdavResponse.ok,
            status: webdavResponse.status,
            statusText: webdavResponse.statusText,
            response: responseData
        });

    } catch (error: any) {
        console.error('WebDAV Proxy Error:', error);
        return res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
}
