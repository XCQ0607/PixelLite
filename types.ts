
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
  aiModelUsed?: string; // New: Track which AI model was used for generation
  aiGeneratedText?: string; // New: Text returned from AI generation
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
  compressionMode: 'balanced' | 'strict';
  defaultProcessMode: ProcessMode;
  enhanceMethod: EnhanceMethod;
  analysisModel: string; // New: custom model for analysis
  aiModel: string; // New: custom model name for generation
  aiPrompt: string;
  language: Language;
  webdav: WebDAVConfig;
}
