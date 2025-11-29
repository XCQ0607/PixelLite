import { AppSettings, ProcessedImage, WebDAVConfig, AIData, ProcessMode } from '../types';
import JSZip from 'jszip';
import { blobToDataURL } from './imageService';

interface BackupMetadata {
    version: string;
    timestamp: number;
    tag: string;
    settings?: AppSettings;
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
        enhanceMethod?: any;
        originalFileNameRef: string;
        compressedFileNameRef: string;
    }[];
}

interface ProxyResponse {
    ok: boolean;
    status: number;
    statusText?: string;
    text?: string;
    type?: 'text' | 'binary';
    data?: string;
    contentType?: string;
    headers?: Record<string, string>;
}

// Cache for listBackups
let backupListCache: { timestamp: number, data: { name: string, lastModified: string }[] } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute

const getPixelLiteUrl = (baseUrl: string) => {
    return baseUrl.endsWith('/') ? `${baseUrl}PixelLite/` : `${baseUrl}/PixelLite/`;
};

const callProxy = async (targetUrl: string, method: string, config: WebDAVConfig, options: { headers?: any, body?: any, depth?: string } = {}): Promise<ProxyResponse> => {
    try {
        const response = await fetch('/api/webdav-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targetUrl,
                method,
                credentials: {
                    username: config.username,
                    password: config.password
                },
                headers: options.headers,
                body: options.body,
                depth: options.depth
            })
        });

        if (!response.ok) {
            throw new Error(`Proxy error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Proxy Call Failed", error);
        throw error;
    }
};

const ensureDirectoryExists = async (config: WebDAVConfig) => {
    const pixelLiteUrl = getPixelLiteUrl(config.url);
    const checkResult = await callProxy(pixelLiteUrl, 'PROPFIND', config, { depth: '0' });

    if (!checkResult.ok && checkResult.status === 404) {
        console.log("Creating PixelLite directory...");
        const createResult = await callProxy(pixelLiteUrl, 'MKCOL', config);
        if (!createResult.ok && createResult.status !== 201 && createResult.status !== 405) {
            throw new Error(`Failed to create directory: ${createResult.status}`);
        }
    }
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

export const listBackups = async (config: WebDAVConfig, forceRefresh = false): Promise<{ name: string, lastModified: string }[]> => {
    if (!forceRefresh && backupListCache && (Date.now() - backupListCache.timestamp < CACHE_DURATION)) {
        console.log("Returning cached backup list");
        return backupListCache.data;
    }

    await ensureDirectoryExists(config);
    const pixelLiteUrl = getPixelLiteUrl(config.url);

    const result = await callProxy(pixelLiteUrl, 'PROPFIND', config, { depth: '1' });

    if (!result.ok && result.status !== 207) {
        if (result.status === 404) return [];
        throw new Error(`Failed to list backups: ${result.status}`);
    }

    const xmlText = result.text || (result as any).response?.data || '';
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const responses = xmlDoc.querySelectorAll("response");

    const backups: { name: string, lastModified: string }[] = [];

    responses.forEach(response => {
        const href = response.querySelector("href")?.textContent || "";
        const name = href.split('/').filter(Boolean).pop() || '';

        if (name.startsWith('PixelLite_Backup_') && name.endsWith('.zip')) {
            const lastMod = response.querySelector("getlastmodified")?.textContent || "";
            backups.push({ name, lastModified: lastMod });
        }
    });

    backups.sort((a, b) => b.name.localeCompare(a.name));

    backupListCache = { timestamp: Date.now(), data: backups };

    return backups;
};

export const createBackup = async (
    config: WebDAVConfig,
    history: ProcessedImage[],
    settings: AppSettings,
    tag: string,
    onProgress?: (progress: number) => void
): Promise<void> => {
    await ensureDirectoryExists(config);
    const pixelLiteUrl = getPixelLiteUrl(config.url);

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

    const zipBlob = await zip.generateAsync({ type: "blob" });

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const cleanTag = tag.replace(/[^a-zA-Z0-9\-_]/g, '');
    const filename = `PixelLite_Backup_${dateStr}_[${cleanTag}].zip`;
    const targetUrl = pixelLiteUrl + filename;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/webdav-proxy');

        xhr.setRequestHeader('x-webdav-target-url', targetUrl);
        xhr.setRequestHeader('x-webdav-method', 'PUT');
        xhr.setRequestHeader('Content-Type', 'application/zip');

        const authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
        xhr.setRequestHeader('Authorization', authHeader);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status === 200) {
                backupListCache = null;
                resolve();
            } else {
                try {
                    const errorResp = JSON.parse(xhr.responseText);
                    reject(new Error(errorResp.details || errorResp.error || 'Upload failed'));
                } catch (e) {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        };

        xhr.onerror = () => {
            reject(new Error('Network error during upload'));
        };

        xhr.send(zipBlob);
    });
};

export const restoreBackup = async (
    config: WebDAVConfig,
    filename: string
): Promise<{ images: ProcessedImage[], settings?: AppSettings }> => {
    const targetUrl = getPixelLiteUrl(config.url) + filename;

    const result = await callProxy(targetUrl, 'GET', config);

    if (!result.ok) throw new Error("Download failed");

    const base64Data = result.data || (result as any).response?.data;
    if (!base64Data) throw new Error("No data received");

    const binaryString = atob(base64Data);
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

export const deleteBackups = async (config: WebDAVConfig, filenames: string[]): Promise<void> => {
    const pixelLiteUrl = getPixelLiteUrl(config.url);

    const deletePromises = filenames.map(filename => {
        const targetUrl = pixelLiteUrl + filename;
        return callProxy(targetUrl, 'DELETE', config);
    });

    const results = await Promise.all(deletePromises);

    const failed = results.filter(r => !r.ok && r.status !== 404);

    if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} backups`);
    }

    backupListCache = null;
};

export const downloadBackups = async (config: WebDAVConfig, filenames: string[]): Promise<void> => {
    for (const filename of filenames) {
        const pixelLiteUrl = getPixelLiteUrl(config.url);
        const targetUrl = pixelLiteUrl + filename;

        const result = await callProxy(targetUrl, 'GET', config);

        const base64Data = result.data || (result as any).response?.data;

        if (result.ok && base64Data) {
            const link = document.createElement('a');
            link.href = `data:application/zip;base64,${base64Data}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
