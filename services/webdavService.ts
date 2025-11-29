
import JSZip from 'jszip';
import { ProcessedImage, WebDAVConfig, AIData, ProcessMode, AppSettings } from '../types';
import { blobToDataURL } from './imageService';

interface BackupMetadata {
    version: string;
    timestamp: number;
    tag: string;
    settings?: AppSettings; // Full settings backup
    items: {
        id: string;
        originalName: string;
        originalSize: number;
        compressedSize: number;
        compressionRatio: number;
        qualityUsed: number;
        timestamp: number;
        aiData?: AIData;
        mode?: ProcessMode;
        enhanceMethod?: any; // Keep generic for backup compat
        originalFileNameRef: string;
        compressedFileNameRef: string;
    }[];
}

interface ProxyResponse {
    ok: boolean;
    status: number;
    statusText: string;
    response: {
        type: 'text' | 'binary';
        data: string;
        contentType?: string;
    };
}

// Helper function to call the proxy
const callProxy = async (
    targetUrl: string,
    method: string,
    config: WebDAVConfig,
    options?: {
        headers?: Record<string, string>;
        body?: string;
        depth?: string;
    }
): Promise<ProxyResponse> => {
    const proxyUrl = '/api/webdav-proxy';

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            targetUrl,
            method,
            credentials: {
                username: config.username,
                password: config.password
            },
            headers: options?.headers,
            body: options?.body,
            depth: options?.depth
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.response && errorData.response.data) {
            console.error("WebDAV Error Details:", errorData.response.data);
            console.error("WebDAV Response Headers:", errorData.headers);
        }

        throw new Error(errorData.message || `Proxy request failed with status ${response.status}: ${errorData.statusText || ''}`);
    }

    return await response.json();
};

// Helper to get the base URL with PixelLite subdirectory
const getPixelLiteUrl = (baseUrl: string) => {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}/PixelLite/`;
};

// Helper to ensure the PixelLite directory exists
const ensureDirectoryExists = async (config: WebDAVConfig) => {
    const targetUrl = getPixelLiteUrl(config.url);

    try {
        // Check if exists
        const checkResult = await callProxy(targetUrl, 'PROPFIND', config, { depth: '0' });
        if (checkResult.ok || checkResult.status === 207) return true;
    } catch (e: any) {
        // If 404, it means folder doesn't exist, so we proceed to create it
        // We need to check if the error message or status indicates 404
        // Since we updated callProxy to throw with status, we can check the message or just proceed if it looks like a fetch error
        if (!e.message.includes('404')) {
            throw e; // Re-throw if it's not 404 (e.g. 401 Auth error)
        }
    }

    // If not, try to create it (MKCOL)
    const createResult = await callProxy(targetUrl, 'MKCOL', config);
    return createResult.ok || createResult.status === 201;
};

export const checkWebDAVConnection = async (config: WebDAVConfig): Promise<boolean> => {
    try {
        // Check root connection first
        const rootResult = await callProxy(config.url, 'PROPFIND', config, { depth: '0' });
        if (!rootResult.ok && rootResult.status !== 207) return false;

        // Try to ensure PixelLite folder exists/can be created
        return await ensureDirectoryExists(config);
    } catch (e) {
        console.error("WebDAV Connection Check Failed", e);
        return false;
    }
};

export const listBackups = async (config: WebDAVConfig): Promise<{ name: string, lastModified: string }[]> => {
    try {
        const targetUrl = getPixelLiteUrl(config.url);
        const result = await callProxy(targetUrl, 'PROPFIND', config, { depth: '1' });

        if (!result.ok && result.status !== 207) {
            throw new Error(`PROPFIND failed with status ${result.status}`);
        }

        const text = result.response.data;
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const responses = xml.querySelectorAll('response');

        const files: { name: string, lastModified: string }[] = [];

        responses.forEach(resp => {
            const href = resp.querySelector('href')?.textContent || '';
            const name = href.split('/').filter(Boolean).pop() || '';
            // Basic filter for our backup files
            if (name.startsWith('PixelLite_Backup_') && name.endsWith('.zip')) {
                const lastMod = resp.querySelector('getlastmodified')?.textContent || '';
                files.push({ name, lastModified: lastMod });
            }
        });

        return files.sort((a, b) => b.name.localeCompare(a.name));
    } catch (e: any) {
        // If folder doesn't exist (404), return empty list
        if (e.message.includes('404')) {
            return [];
        }
        console.error("List Backups Failed", e);
        throw e;
    }
};


export const generateBackupFilename = (tag: string): string => {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const cleanTag = tag.replace(/[^a-zA-Z0-9\-_]/g, '');
    return `PixelLite_Backup_${dateStr}_${cleanTag}.zip`;
};

export const generateBackupZip = async (
    history: ProcessedImage[],
    settings: AppSettings,
    tag: string
): Promise<Blob> => {
    const zip = new JSZip();
    const metadata: BackupMetadata = {
        version: "1.1",
        timestamp: Date.now(),
        tag: tag,
        settings: settings,
        items: []
    };

    const imagesFolder = zip.folder("images");

    for (const item of history) {
        const originalRef = `${item.id}_orig_${item.originalFile.name}`;
        const compressedRef = `${item.id}_comp_${item.originalFile.name}`;

        if (imagesFolder) {
            imagesFolder.file(originalRef, item.originalFile);
            imagesFolder.file(compressedRef, item.compressedBlob);
        }

        metadata.items.push({
            id: item.id,
            originalName: item.originalFile.name,
            originalSize: item.originalSize,
            compressedSize: item.compressedSize,
            compressionRatio: item.compressionRatio,
            qualityUsed: item.qualityUsed,
            timestamp: item.timestamp,
            aiData: item.aiData,
            mode: item.mode,
            enhanceMethod: item.enhanceMethod,
            originalFileNameRef: originalRef,
            compressedFileNameRef: compressedRef
        });
    }

    zip.file("metadata.json", JSON.stringify(metadata, null, 2));
    return await zip.generateAsync({ type: "blob" });
};

export const createBackup = async (
    config: WebDAVConfig,
    history: ProcessedImage[],
    settings: AppSettings,
    tag: string,
    onProgress?: (progress: number) => void
): Promise<void> => {
    // Ensure folder exists before upload
    await ensureDirectoryExists(config);

    const zipBlob = await generateBackupZip(history, settings, tag);
    const filename = generateBackupFilename(tag);

    // Upload to PixelLite subdirectory
    const targetUrl = getPixelLiteUrl(config.url) + filename;
    const proxyUrl = '/api/webdav-proxy';

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = (e.loaded / e.total) * 100;
                onProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                let errorMessage = `Upload failed with status ${xhr.status}`;
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) errorMessage = response.message || response.error;
                } catch (e) {
                    // Ignore JSON parse error
                }
                reject(new Error(errorMessage));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.open('POST', proxyUrl);

        // Set headers for streaming upload via proxy
        xhr.setRequestHeader('Content-Type', 'application/zip');
        xhr.setRequestHeader('X-WebDAV-Target', targetUrl);
        xhr.setRequestHeader('X-WebDAV-Method', 'PUT');
        xhr.setRequestHeader('X-WebDAV-Credentials', btoa(JSON.stringify({
            username: config.username,
            password: config.password
        })));

        // Send the blob directly
        xhr.send(zipBlob);
    });
};

export const parseBackupZip = async (blob: Blob): Promise<{ images: ProcessedImage[], settings?: AppSettings }> => {
    const zip = await JSZip.loadAsync(blob);

    const metadataFile = zip.file("metadata.json");
    if (!metadataFile) throw new Error("Invalid backup format: missing metadata.json");

    const metadataStr = await metadataFile.async("string");
    const metadata: BackupMetadata = JSON.parse(metadataStr);

    const restoredImages: ProcessedImage[] = [];

    for (const item of metadata.items) {
        const origFileInZip = zip.file(`images/${item.originalFileNameRef}`);
        const compFileInZip = zip.file(`images/${item.compressedFileNameRef}`);

        if (origFileInZip && compFileInZip) {
            const originalBlob = await origFileInZip.async("blob");
            const compressedBlob = await compFileInZip.async("blob");

            // Reconstruct File object
            const originalFile = new File([originalBlob], item.originalName, { type: originalBlob.type });
            const originalPreview = await blobToDataURL(originalBlob);
            const compressedPreview = await blobToDataURL(compressedBlob);

            restoredImages.push({
                id: item.id,
                originalFile,
                originalPreview,
                compressedBlob,
                compressedPreview,
                originalSize: item.originalSize,
                compressedSize: item.compressedSize,
                compressionRatio: item.compressionRatio,
                timestamp: item.timestamp,
                qualityUsed: item.qualityUsed,
                aiData: item.aiData,
                mode: item.mode || 'compress',
                enhanceMethod: item.enhanceMethod
            });
        }
    }

    return { images: restoredImages, settings: metadata.settings };
};

export const restoreBackup = async (
    config: WebDAVConfig,
    filename: string
): Promise<{ images: ProcessedImage[], settings?: AppSettings }> => {
    // Download from PixelLite subdirectory
    const targetUrl = getPixelLiteUrl(config.url) + filename;

    const result = await callProxy(targetUrl, 'GET', config);

    if (!result.ok) throw new Error("Download failed");

    // Decode base64 response to blob
    const binaryString = atob(result.response.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/zip' });

    return await parseBackupZip(blob);
};



export const deleteBackups = async (
    config: WebDAVConfig,
    filenames: string[]
): Promise<void> => {
    const targetBaseUrl = getPixelLiteUrl(config.url);

    // Process sequentially to avoid overwhelming the server/proxy
    for (const filename of filenames) {
        try {
            const targetUrl = targetBaseUrl + filename;
            await callProxy(targetUrl, 'DELETE', config);
        } catch (e) {
            console.error(`Failed to delete ${filename}`, e);
            // Continue deleting others even if one fails
        }
    }
};

export const downloadBackupsAsZip = async (
    config: WebDAVConfig,
    filenames: string[]
): Promise<Blob> => {
    const zip = new JSZip();
    const targetBaseUrl = getPixelLiteUrl(config.url);

    for (const filename of filenames) {
        try {
            const targetUrl = targetBaseUrl + filename;
            const result = await callProxy(targetUrl, 'GET', config);

            if (result.ok && result.response.data) {
                // Decode base64 response to blob
                const binaryString = atob(result.response.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                // Add to zip
                zip.file(filename, bytes);
            }
        } catch (e) {
            console.error(`Failed to download ${filename}`, e);
        }
    }

    return await zip.generateAsync({ type: "blob" });
};
