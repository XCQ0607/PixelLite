
import React, { useState } from 'react';
import { ProcessedImage } from '../types';
import { formatBytes, getCompressedFileName } from '../services/imageService';
import { Download, MoreHorizontal, Loader2, Sparkles, Minimize2, Wand2, ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react';
import { AIResultCard } from './AIResultCard';

interface HistoryListProps {
  history: ProcessedImage[];
  onSelect: (item: ProcessedImage) => void;
  onAnalyze: (id: string) => void;
  t: (key: string) => string;
  analyzingIds: Set<string>;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onAnalyze, t, analyzingIds }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const getFormatName = (mimeType: string, fallback?: string) => {
    if (mimeType === 'image/jpeg') return 'JPEG';
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/webp') return 'WEBP';
    if (fallback) return fallback.toUpperCase();
    return 'IMG';
  };

  return (
    <div className="mt-12 w-full max-w-5xl animate-fade-in pb-20">
      <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
        {t('history_title')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => {
          const isAnalyzing = analyzingIds.has(item.id);
          const isEnhance = item.mode === 'enhance';

          const diff = item.compressedSize - item.originalSize;
          // Use absolute value for display, keep 1 decimal place if needed, remove .0
          const absDiff = Math.abs(diff);
          const percentageStr = ((absDiff / item.originalSize) * 100).toFixed(1).replace(/\.0$/, '');
          const isZeroChange = diff === 0;

          const inputFormat = getFormatName(item.originalFile.type);
          const outputFormat = getFormatName(item.compressedBlob.type, item.outputFormat);

          return (
            <div
              key={item.id}
              className={`glass-panel rounded-xl p-4 transition-transform hover:scale-[1.02] cursor-pointer group relative border-2 ${isEnhance ? 'border-blue-100 dark:border-blue-900/30' : 'border-transparent'}`}
              onClick={() => onSelect(item)}
            >
              {/* Mode Badge - Explicit Text */}
              <div className="absolute top-3 left-3 z-20">
                <div className={`px-2 py-1 rounded-md shadow-sm text-xs font-bold flex items-center gap-1.5 ${isEnhance
                  ? 'bg-blue-500 text-white'
                  : 'bg-emerald-500 text-white'
                  }`}>
                  {isEnhance ? <Wand2 size={12} /> : <Minimize2 size={12} />}
                  {isEnhance ? 'ENHANCE' : 'COMPRESS'}
                </div>
              </div>

              {/* Context Menu Button */}
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === item.id ? null : item.id);
                  }}
                  className="p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 transition-colors backdrop-blur-sm"
                >
                  <MoreHorizontal size={16} />
                </button>
                {openMenuId === item.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg w-32 py-1 z-30 flex flex-col">
                    {!item.aiData && (
                      <button
                        disabled={isAnalyzing}
                        className="text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 w-full flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnalyze(item.id);
                          setOpenMenuId(null);
                        }}
                      >
                        {isAnalyzing && <Loader2 size={12} className="animate-spin" />}
                        {t('generate_ai')}
                      </button>
                    )}
                    <button
                      className="text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                    >
                      {t('close_menu')}
                    </button>
                  </div>
                )}
              </div>

              {/* Click overlay to close menu */}
              {openMenuId === item.id && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                ></div>
              )}

              <div className="flex gap-4 items-center mb-3 pt-8">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 relative border border-gray-100 dark:border-gray-600">
                  <img src={item.compressedPreview} alt="thumb" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm" title={item.originalFile.name}>
                    {item.originalFile.name}
                  </p>

                  {/* Format Info */}
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span>{inputFormat}</span>
                    <ArrowRight size={10} className="text-gray-400" />
                    <span className={isEnhance ? 'text-blue-500' : 'text-emerald-500'}>{outputFormat}</span>
                  </div>

                  {/* Size Stats */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 font-mono line-through">{formatBytes(item.originalSize)}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-sm font-bold font-mono text-gray-700 dark:text-gray-100">{formatBytes(item.compressedSize)}</span>
                  </div>

                  {/* Percentage Indicator */}
                  <div className="mt-1">
                    {isEnhance ? (
                      diff > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                          <ArrowUpRight size={10} /> +{percentageStr}%
                        </span>
                      ) : diff < 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                          <ArrowDownRight size={10} /> -{percentageStr}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          <Minus size={10} /> 0%
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                        <ArrowDownRight size={10} /> {formatBytes(item.originalSize - item.compressedSize)}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {item.aiData && (
                <div className="mb-3">
                  <AIResultCard data={item.aiData} t={t} className="text-xs py-2 px-3" />
                </div>
              )}

              <div className="flex justify-between items-center mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-primary transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = item.compressedPreview;
                    const suffix = isEnhance ? item.qualityUsed : item.compressionRatio;
                    const fileName = getCompressedFileName(item.originalFile.name, suffix, item.mode, item.aiModelUsed);
                    link.download = fileName;
                    link.click();
                  }}
                  title="Download Result"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
