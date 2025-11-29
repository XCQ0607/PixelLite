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
    // Only allow POST requests (or PUT for streaming if we wanted, but we keep POST for consistency)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let targetUrl: string;
        let method: string;
        let credentials: { username: string; password: string };
        let headers: Record<string, string> = {};
        let body: any;
        let depth: string | undefined;

        // Check if this is a binary upload (streaming)
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/octet-stream') || contentType.includes('application/zip')) {
            // Extract metadata from headers
            targetUrl = req.headers['x-webdav-target'] as string;
            method = req.headers['x-webdav-method'] as string;
            const credsHeader = req.headers['x-webdav-credentials'] as string;

            if (credsHeader) {
                try {
                    credentials = JSON.parse(Buffer.from(credsHeader, 'base64').toString());
                } catch (e) {
                    return res.status(400).json({ error: 'Invalid credentials header' });
                }
            } else {
                return res.status(400).json({ error: 'Missing credentials header' });
            }

            // Body is the request stream itself
            // Note: In Vercel Serverless, req is an IncomingMessage, which is a readable stream.
            // We can pass it directly to fetch body if supported, or read it.
            // Node-fetch supports stream as body.
            body = req;

            // We might need to set the content-type for the WebDAV request
            headers['Content-Type'] = contentType;
        } else {
            // Standard JSON request (existing logic)
            const jsonBody = req.body as ProxyRequestBody;
            targetUrl = jsonBody.targetUrl;
            method = jsonBody.method;
            credentials = jsonBody.credentials;
            headers = jsonBody.headers || {};
            body = jsonBody.body;
            depth = jsonBody.depth;
        }

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
        const requestHeaders: any = {
            'Authorization': authHeader,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
            body: body,
            // @ts-ignore - duplex is needed for streaming bodies in some fetch implementations (Node 18+)
            duplex: body && typeof body.pipe === 'function' ? 'half' : undefined
        });

        // Get response text/blob
        const responseContentType = webdavResponse.headers.get('content-type') || '';
        let responseData: any;

        if (responseContentType.includes('application/zip') || responseContentType.includes('application/octet-stream')) {
            // Binary data (for file downloads)
            const arrayBuffer = await webdavResponse.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            responseData = {
                type: 'binary',
                data: base64,
                contentType: responseContentType
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
            headers: Object.fromEntries(webdavResponse.headers.entries()),
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
