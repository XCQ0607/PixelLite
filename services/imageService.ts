
import JSZip from 'jszip';
import { ProcessedImage, ProcessMode } from '../types';

/**
 * Compresses an image file using the Canvas API.
 */
export const compressImage = async (
    file: File, 
    targetQuality: number,
    mode: 'balanced' | 'strict' = 'balanced'
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
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
          
          let mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          if (mode === 'strict') mimeType = 'image/webp';
          
          let currentQuality = targetQuality >= 1.0 ? 0.92 : targetQuality;
          
          const getBlob = (q: number): Promise<Blob | null> => {
              return new Promise(r => canvas.toBlob(r, mimeType, q));
          };

          let blob = await getBlob(currentQuality);
          let attempts = 0;

          while (blob && blob.size >= file.size && attempts < 6) {
              currentQuality -= 0.1;
              if (currentQuality < 0.1) break;
              blob = await getBlob(currentQuality);
              attempts++;
          }

          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
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
                                    buff[((y-1)*w + x)*4 + c] * -1 +
                                    buff[((y+1)*w + x)*4 + c] * -1 +
                                    buff[(y*w + (x-1))*4 + c] * -1 +
                                    buff[(y*w + (x+1))*4 + c] * -1;
                                data[idx + c] = Math.min(255, Math.max(0, (val * mix) + (buff[idx+c] * (1-mix))));
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

export const getCompressedFileName = (originalName: string, ratioOrIntensity: number, mode: ProcessMode = 'compress', aiModelName?: string): string => {
    const lastDotIndex = originalName.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
    
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
        let fileName = img.originalFile.name;
        if (img.compressedBlob.type === 'image/webp') {
            const parts = fileName.split('.');
            if (parts.length > 1) parts.pop();
            fileName = parts.join('.') + '.webp';
        }

        const suffixValue = img.mode === 'enhance' ? img.qualityUsed : img.compressionRatio;
        const processedName = getUniqueName(getCompressedFileName(fileName, suffixValue, img.mode, img.aiModelUsed));
        zip.file(processedName, img.compressedBlob);

        if (includeOriginals) {
            const originalName = getUniqueName(img.originalFile.name);
            zip.file(originalName, img.originalFile);
        }
    }

    return zip.generateAsync({ type: "blob" });
};
