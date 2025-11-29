
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
        throw new Error(errorData.message || `Proxy request failed with status ${response.status}`);
    }

    return await response.json();
};

export const checkWebDAVConnection = async (config: WebDAVConfig): Promise<boolean> => {
    try {
        const result = await callProxy(config.url, 'PROPFIND', config, { depth: '0' });
        return result.ok || result.status === 207;
    } catch (e) {
        console.error("WebDAV Connection Check Failed", e);
        return false;
    }
};

export const listBackups = async (config: WebDAVConfig): Promise<{ name: string, lastModified: string }[]> => {
    try {
        const result = await callProxy(config.url, 'PROPFIND', config, { depth: '1' });

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
    } catch (e) {
        console.error("List Backups Failed", e);
        throw e;
    }
};

export const createBackup = async (
    config: WebDAVConfig,
    history: ProcessedImage[],
    settings: AppSettings,
    tag: string
): Promise<void> => {
    const zip = new JSZip();
    const metadata: BackupMetadata = {
        version: "1.1",
        timestamp: Date.now(),
        tag: tag,
        settings: settings, // Include full settings
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

    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Generate Filename
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const cleanTag = tag.replace(/[^a-zA-Z0-9\-_]/g, '');
    const filename = `PixelLite_Backup_${dateStr}_[${cleanTag}].zip`;

    // Upload via proxy
    const uploadUrl = config.url.endsWith('/') ? config.url + filename : config.url + '/' + filename;

    // Convert blob to base64 for transfer through proxy
    const arrayBuffer = await zipBlob.arrayBuffer();
    const base64Body = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const result = await callProxy(uploadUrl, 'PUT', config, {
        headers: {
            'Content-Type': 'application/zip'
        },
        body: base64Body
    });

    if (!result.ok && result.status !== 201 && result.status !== 204) {
        throw new Error(`Upload failed with status ${result.status}`);
    }
};

export const restoreBackup = async (
    config: WebDAVConfig,
    filename: string
): Promise<{ images: ProcessedImage[], settings?: AppSettings }> => {
    const fileUrl = config.url.endsWith('/') ? config.url + filename : config.url + '/' + filename;

    const result = await callProxy(fileUrl, 'GET', config);

    if (!result.ok) throw new Error("Download failed");

    // Decode base64 response to blob
    const binaryString = atob(result.response.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/zip' });

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
