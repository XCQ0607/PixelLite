import JSZip from 'jszip';
import UPNG from 'upng-js';
import { ProcessedImage, ProcessMode } from '../types';

/**
 * Compresses an image file using dual engines: Canvas (WebP only) or Algorithm (Advanced).
 */
export const compressImage = async (
    file: File,
    targetQuality: number,
    mode: 'canvas' | 'algorithm' = 'canvas',
    outputFormat: 'original' | 'webp' | 'png' | 'jpeg' = 'original'
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                let width = img.width;
                let height = img.height;

                const MAX_DIMENSION = 4096;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height = (height / width) * MAX_DIMENSION;
                        width = MAX_DIMENSION;
                    } else {
                        width = (width / height) * MAX_DIMENSION;
                        height = MAX_DIMENSION;
                    }
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error("Canvas context unavailable")); return; }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    // CANVAS MODE: Always WebP
                    if (mode === 'canvas') {
                        const blob = await canvasToWebP(canvas, targetQuality);
                        resolve(blob);
                        return;
                    }

                    // ALGORITHM MODE: Advanced compression
                    const isPNG = file.type === 'image/png';
                    const desiredFormat = outputFormat === 'original'
                        ? (isPNG ? 'png' : file.type === 'image/jpeg' ? 'jpeg' : 'webp')
                        : outputFormat;

                    // Use UPNG.js for PNG output (lossy compression)
                    if (desiredFormat === 'png') {
                        const blob = await compressPNGWithUPNG(canvas, targetQuality);
                        resolve(blob);
                    } else {
                        // Use Canvas API for JPEG/WebP output
                        const mimeType = desiredFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
                        const blob = await canvasToBlob(canvas, mimeType, targetQuality);
                        resolve(blob);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Convert canvas to WebP using Canvas API
 */
const canvasToWebP = async (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
    const targetQuality = quality >= 1.0 ? 0.92 : quality;
    const getBlob = (q: number): Promise<Blob | null> => {
        return new Promise(r => canvas.toBlob(r, 'image/webp', q));
    };

    let blob = await getBlob(targetQuality);
    if (!blob) throw new Error("WebP compression failed");
    return blob;
};

/**
 * Convert canvas to specified format using Canvas API
 */
const canvasToBlob = async (canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> => {
    const targetQuality = quality >= 1.0 ? 0.92 : quality;
    const getBlob = (q: number): Promise<Blob | null> => {
        return new Promise(r => canvas.toBlob(r, mimeType, q));
    };

    let blob = await getBlob(targetQuality);
    if (!blob) throw new Error(`${mimeType} compression failed`);
    return blob;
};

/**
 * Compress PNG using UPNG.js (lossy compression)
 */
const compressPNGWithUPNG = async (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context unavailable");

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const rgba = imageData.data.buffer;

    // Convert quality (0-1) to UPNG cnum (color palette size)
    // Higher quality = more colors = larger file
    const cnum = Math.max(2, Math.min(256, Math.round(quality * 256)));

    try {
        const compressed = UPNG.encode([rgba], canvas.width, canvas.height, cnum);
        return new Blob([compressed], { type: 'image/png' });
    } catch (error) {
        // Fallback to lossless if lossy fails
        const compressed = UPNG.encode([rgba], canvas.width, canvas.height, 0);
        return new Blob([compressed], { type: 'image/png' });
    }
};

/**
 * Applies visual enhancements (Sharpening) to an image.
 * Uses a convolution filter.
 */
export const applyImageEnhancement = async (
    file: File,
    intensity: number // 0.0 to 1.0 (Strength of sharpening)
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error("Canvas context unavailable")); return; }

                canvas.width = img.width;
                canvas.height = img.height;

                // 1. Draw original
                ctx.drawImage(img, 0, 0);

                if (intensity > 0) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const w = canvas.width;
                    const h = canvas.height;

                    const buff = new Uint8ClampedArray(data);
                    const mix = intensity;

                    for (let y = 1; y < h - 1; y++) {
                        for (let x = 1; x < w - 1; x++) {
                            const idx = (y * w + x) * 4;
                            for (let c = 0; c < 3; c++) {
                                const val =
                                    buff[idx + c] * 5 +
                                    buff[((y - 1) * w + x) * 4 + c] * -1 +
                                    buff[((y + 1) * w + x) * 4 + c] * -1 +
                                    buff[(y * w + (x - 1)) * 4 + c] * -1 +
                                    buff[(y * w + (x + 1)) * 4 + c] * -1;
                                data[idx + c] = Math.min(255, Math.max(0, (val * mix) + (buff[idx + c] * (1 - mix))));
                            }
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                }

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Enhancement failed"));
                }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 1.0);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const getCompressedFileName = (
    originalName: string,
    ratioOrIntensity: number,
    mode: ProcessMode = 'compress',
    aiModelName?: string,
    actualFormat?: string // 'webp', 'png', 'jpeg'
): string => {
    const lastDotIndex = originalName.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const originalExt = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';

    // Determine extension based on actualFormat
    let ext = originalExt;
    if (actualFormat === 'webp') ext = '.webp';
    else if (actualFormat === 'png') ext = '.png';
    else if (actualFormat === 'jpeg' || actualFormat === 'jpg') ext = '.jpg';

    if (mode === 'enhance') {
        if (aiModelName) {
            return `${name}_${aiModelName}${ext}`;
        }
        return `${name}_enhanced_${Math.round(ratioOrIntensity * 100)}%${ext}`;
    }
    return `${name}_compressed_${ratioOrIntensity}%${ext}`;
};

export const generateZip = async (
    images: ProcessedImage[],
    includeOriginals: boolean
): Promise<Blob> => {
    const zip = new JSZip();
    const usedNames = new Set<string>();

    const getUniqueName = (filename: string) => {
        let name = filename;
        let counter = 1;
        const extIndex = name.lastIndexOf('.');
        const base = extIndex !== -1 ? name.substring(0, extIndex) : name;
        const ext = extIndex !== -1 ? name.substring(extIndex) : '';

        while (usedNames.has(name)) {
            name = `${base}(${counter})${ext}`;
            counter++;
        }
        usedNames.add(name);
        return name;
    };

    for (const img of images) {
        // Determine format from blob type or outputFormat
        let format = 'webp'; // default
        if (img.compressedBlob.type === 'image/png') format = 'png';
        else if (img.compressedBlob.type === 'image/jpeg') format = 'jpeg';
        else if (img.outputFormat) format = img.outputFormat;

        const suffixValue = img.mode === 'enhance' ? img.qualityUsed : img.compressionRatio;
        const processedName = getUniqueName(
            getCompressedFileName(img.originalFile.name, suffixValue, img.mode, img.aiModelUsed, format)
        );
        zip.file(processedName, img.compressedBlob);

        if (includeOriginals) {
            const originalName = getUniqueName(img.originalFile.name);
            zip.file(originalName, img.originalFile);
        }
    }

    return zip.generateAsync({ type: "blob" });
};
