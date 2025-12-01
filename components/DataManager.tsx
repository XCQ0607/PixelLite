import React, { useState } from 'react';
import { ArrowLeft, Trash2, Download, CheckSquare, Square, AlertTriangle, Archive, FileImage, Loader2, Wand2, Minimize2, ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react';
import { ProcessedImage } from '../types';
import { formatBytes, generateZip } from '../services/imageService';
import { AIResultCard } from './AIResultCard';

interface DataManagerProps {
  history: ProcessedImage[];
  onBack: () => void;
  onDelete: (ids: string[]) => void;
  onAnalyze: (id: string) => void;
  t: (key: string) => string;
  analyzingIds: Set<string>;
}

export const DataManager: React.FC<DataManagerProps> = ({ history, onBack, onDelete, onAnalyze, t, analyzingIds }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeOriginals, setIncludeOriginals] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(h => h.id)));
    }
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;

    const selectedImages = history.filter(h => selectedIds.has(h.id));
    try {
      const zipBlob = await generateZip(selectedImages, includeOriginals);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `pixel-lite-export-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
    } catch (error) {
      console.error("Export failed", error);
      alert(t('export_failed'));
    }
  };

  const getFormatName = (mimeType: string, fallback?: string) => {
    if (mimeType === 'image/jpeg') return 'JPEG';
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/webp') return 'WEBP';
    if (fallback) return fallback.toUpperCase();
    return 'IMG';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark animate-fade-in flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('data_manager')}</h1>
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-mono">
              {history.length} items
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">

        {/* Warning Banner */}
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">{t('privacy_warning_title')}</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {t('privacy_warning_desc')}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              {selectedIds.size === history.length && history.length > 0 ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
              {t('select_all')}
            </button>
            <span className="text-sm text-gray-400">{t('selected_items').replace('{count}', selectedIds.size.toString())}</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 mr-4">
              <input
                type="checkbox"
                id="incOrig"
                checked={includeOriginals}
                onChange={e => setIncludeOriginals(e.target.checked)}
                className="rounded text-primary focus:ring-primary dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="incOrig" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                {t('include_original')}
              </label>
            </div>

            <button
              onClick={handleExport}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Archive size={16} /> {t('export_zip')}
            </button>

            <button
              onClick={() => selectedIds.size > 0 && setShowDeleteConfirm(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800"
            >
              <Trash2 size={16} /> {t('delete')}
            </button>
          </div>
        </div>

        {/* List View */}
        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileImage size={64} className="mx-auto mb-4 opacity-20" />
            <p>{t('no_history')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((item) => {
              const isAnalyzing = analyzingIds.has(item.id);
              const isEnhance = item.mode === 'enhance';
              const diff = item.compressedSize - item.originalSize;
              const absDiff = Math.abs(diff);
              const percentageStr = ((absDiff / item.originalSize) * 100).toFixed(1).replace(/\.0$/, '');

              const inputFormat = getFormatName(item.originalFile.type);
              const outputFormat = getFormatName(item.compressedBlob.type, item.outputFormat);

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-card p-4 rounded-xl border transition-all ${selectedIds.has(item.id) ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {/* Checkbox */}
                    <div className="pt-1 md:pt-0" onClick={() => toggleSelect(item.id)}>
                      {selectedIds.has(item.id) ? <CheckSquare size={20} className="text-primary cursor-pointer" /> : <Square size={20} className="text-gray-400 cursor-pointer" />}
                    </div>

                    {/* Preview & Info */}
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                        <img src={item.compressedPreview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2" title={item.originalFile.name}>
                          <span className="truncate">{item.originalFile.name}</span>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${isEnhance ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                            {isEnhance ? <Wand2 size={10} /> : <Minimize2 size={10} />}
                            {isEnhance ? 'ENHANCE' : 'COMPRESS'}
                          </span>
                        </h4>

                        {/* Format Info */}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <span>{inputFormat}</span>
                          <ArrowRight size={10} className="text-gray-400" />
                          <span className={isEnhance ? 'text-blue-500' : 'text-emerald-500'}>{outputFormat}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{formatBytes(item.originalSize)}</span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${isEnhance ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>{formatBytes(item.compressedSize)}</span>

                          {isEnhance ? (
                            diff > 0 ? (
                              <span className="text-red-500 font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> +{percentageStr}%</span>
                            ) : diff < 0 ? (
                              <span className="text-purple-500 font-bold flex items-center gap-0.5"><ArrowDownRight size={10} /> -{percentageStr}%</span>
                            ) : (
                              <span className="text-gray-400 font-bold flex items-center gap-0.5"><Minus size={10} /> 0%</span>
                            )
                          ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5"><ArrowDownRight size={10} /> -{percentageStr}%</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* AI Info & Actions */}
                    <div className="w-full md:w-1/3">
                      {item.aiData ? (
                        <AIResultCard data={item.aiData} t={t} className="text-xs" />
                      ) : (
                        <button
                          onClick={() => onAnalyze(item.id)}
                          disabled={isAnalyzing}
                          className="w-full h-full min-h-[60px] flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-500 hover:text-primary hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                          {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <FileImage size={14} />}
                          {isAnalyzing ? t('analyzing') : t('generate_ai')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('confirm_delete_title')}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('confirm_delete_desc').replace('{count}', selectedIds.size.toString())}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  onDelete(Array.from(selectedIds));
                  setSelectedIds(new Set());
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};