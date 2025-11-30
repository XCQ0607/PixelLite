export interface AIData {
  description: string;
  tags: string[];
}

export type ProcessMode = 'compress' | 'enhance';
export type EnhanceMethod = 'algorithm' | 'ai';

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalPreview: string; // Data URL
  compressedBlob: Blob; // Also serves as "processed blob" for enhancement
  compressedPreview: string; // Data URL
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timestamp: number;
  qualityUsed: number; // Represents 'quality' for compression or 'intensity' for enhancement
  mode: ProcessMode;
  enhanceMethod?: EnhanceMethod; // Track if AI or Algorithm was used
  aiData?: AIData;
  aiModelUsed?: string; // Track which AI model was used for generation
  aiGeneratedText?: string; // Text returned from AI generation
  outputFormat?: 'original' | 'webp' | 'png' | 'jpeg'; // Track actual output format
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
}

export type Language = 'zh' | 'en';

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

export interface AppSettings {
  customApiKey: string;
  customBaseUrl: string;
  defaultQuality: number;
  smartCompression: boolean;
  compressionMode: 'canvas' | 'algorithm'; // 压缩引擎: Canvas (WebP only) 或 Algorithm (Advanced)
  outputFormat: 'original' | 'webp' | 'png' | 'jpeg'; // 默认输出格式
  defaultProcessMode: ProcessMode;
  enhanceMethod: EnhanceMethod;
  analysisModel: string; // Custom model for analysis
  aiModel: string; // Custom model name for generation
  aiPrompt: string;
  language: Language;
  webdav: WebDAVConfig;
}
