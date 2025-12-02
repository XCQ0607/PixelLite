
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Sliders, Download, Image as ImageIcon, Sparkles, Zap, ArrowRight, Loader2, Save, CheckCircle, Key, RefreshCw, Settings as SettingsIcon, Database, Wand2, Layers, Minimize2, Cpu, Play, PenTool } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { ImageComparator } from './components/ImageComparator';
import { HistoryList } from './components/HistoryList';
import { SettingsModal } from './components/SettingsModal';
import { DataManager } from './components/DataManager';
import { AIResultCard } from './components/AIResultCard';
import { RestoreModal } from './components/RestoreModal';
import { compressImage, applyImageEnhancement, formatBytes, blobToDataURL, getCompressedFileName, convertBlobFormat } from './services/imageService';
import { analyzeImage, generateEnhancedImage } from './services/geminiService';
import { ProcessedImage, AppSettings, ProcessMode } from './types';
import { StorageService } from './services/storageService';
import { ImageEditorModal } from './components/ImageEditorModal';
import { translations, TranslationKeys } from './translations';
import { useDynamicTitle } from './hooks/useDynamicTitle';
import { InteractiveOverlay } from './components/InteractiveOverlay';
import { CustomContextMenu } from './components/CustomContextMenu';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ConfirmDialog } from './components/ConfirmDialog';




// Typewriter Component
const Typewriter = ({ texts, speed = 100, pause = 2000 }: { texts: string[], speed?: number, pause?: number }) => {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (reverse) {
                if (subIndex === 0) {
                    setReverse(false);
                    setIndex((prev) => (prev + 1) % texts.length);
                } else {
                    setSubIndex((prev) => prev - 1);
                }
                return;
            }

            if (subIndex === texts[index].length) {
                setBlink(true);
                setTimeout(() => setReverse(true), pause);
                return;
            }

            setSubIndex((prev) => prev + 1);
            setBlink(false);
        }, reverse ? 75 : speed);

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, texts, speed, pause]);

    return (
        <span>
            {texts[index].substring(0, subIndex)}
            <span className={`inline-block w-1 h-[1em] ml-1 bg-primary align-middle ${blink ? 'opacity-100' : 'opacity-0'} transition-opacity`}></span>
        </span>
    );
};

const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let index = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, index + 1));
            index++;
            if (index >= text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <div className="whitespace-pre-wrap break-words">{displayedText}</div>;
};


function App() {
    const [isDark, setIsDark] = useState(true);
    const [currentImage, setCurrentImage] = useState<ProcessedImage | null>(null);
    const [history, setHistory] = useState<ProcessedImage[]>([]);

    // Dynamic Title Hook
    useDynamicTitle();

    // UI States
    const [isProcessing, setIsProcessing] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
    const [hasSaved, setHasSaved] = useState(false);
    const [sliderValue, setSliderValue] = useState(0.8);
    const [showSettings, setShowSettings] = useState(false);
    const [showDataManager, setShowDataManager] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    // New States
    const [processMode, setProcessMode] = useState<ProcessMode>('compress');
    const [currentAiPrompt, setCurrentAiPrompt] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // App Settings
    const [settings, setSettings] = useState<AppSettings>({
        customApiKey: process.env.CUSTOM_API_KEY || '',
        customBaseUrl: process.env.CUSTOM_BASE_URL || '',
        defaultQuality: parseFloat(process.env.DEFAULT_QUALITY || '0.8'),
        smartCompression: process.env.SMART_COMPRESSION === 'false' ? false : true,
        compressionMode: (process.env.COMPRESSION_MODE as any) || 'algorithm', // 默认使用专业模式
        outputFormat: (process.env.OUTPUT_FORMAT as any) || 'original', // 默认保持原格式
        defaultProcessMode: (process.env.DEFAULT_PROCESS_MODE as any) || 'compress',
        enhanceMethod: (process.env.ENHANCE_METHOD as any) || 'algorithm',
        aiModel: process.env.AI_MODEL || 'gemini-2.5-flash-image',
        analysisModel: process.env.ANALYSIS_MODEL || 'gemini-2.5-flash',
        aiPrompt: process.env.AI_PROMPT || 'Enhance the clarity and details of this image, maintain realistic colors.',
        language: (process.env.LANGUAGE as any) || 'zh',
        webdav: {
            url: process.env.WEBDAV_URL || '',
            username: process.env.WEBDAV_USERNAME || '',
            password: process.env.WEBDAV_PASSWORD || ''
        }
    });

    // Load Settings & History on Mount
    useEffect(() => {
        const savedSettings = StorageService.loadSettings();
        if (savedSettings) {
            setSettings(prev => ({ ...prev, ...savedSettings }));
        }

        StorageService.loadAllImages().then(savedHistory => {
            if (savedHistory.length > 0) {
                setHistory(savedHistory);
            }
        }).catch(console.error);
    }, []);

    // Save Settings on Change
    useEffect(() => {
        StorageService.saveSettings(settings);
    }, [settings]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper for Translation
    const t = useCallback((key: string): any => {
        return translations[settings.language][key as keyof TranslationKeys] || key;
    }, [settings.language]);

    // Theme Handling
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const getSmartQuality = (size: number): number => {
        const MB = 1024 * 1024;
        if (size > 5 * MB) return 0.6;
        if (size > 2 * MB) return 0.7;
        if (size > 1 * MB) return 0.75;
        return 0.85;
    };

    const executeProcessing = async (file: File, val: number, mode: ProcessMode) => {
        if (mode === 'compress') {
            return await compressImage(file, val, settings.compressionMode, settings.outputFormat);
        } else {
            // Algorithm Enhance
            return await applyImageEnhancement(file, val, settings.outputFormat);
        }
    };

    const processFile = useCallback(async (file: File, overrideMode?: ProcessMode) => {
        setIsProcessing(true);
        setHasSaved(false);

        // Determine mode and initial value
        const mode = overrideMode || settings.defaultProcessMode;
        setProcessMode(mode);
        setCurrentAiPrompt(settings.aiPrompt); // Reset prompt

        // Initial Processing
        // If Enhance + AI mode, we don't process immediately, we just load original
        const isAiEnhance = mode === 'enhance' && settings.enhanceMethod === 'ai';

        try {
            const originalPreview = await blobToDataURL(file);
            let processedBlob: Blob;
            let initialVal = 0.5;

            if (isAiEnhance) {
                // Placeholder blob (just a copy) until AI runs
                processedBlob = file.slice(0, file.size, file.type);
                initialVal = 0; // Not used
            } else {
                if (mode === 'compress') {
                    initialVal = settings.smartCompression ? getSmartQuality(file.size) : settings.defaultQuality;
                }
                processedBlob = await executeProcessing(file, initialVal, mode);
            }

            setSliderValue(initialVal);

            const compressedPreview = await blobToDataURL(processedBlob);
            const originalSize = file.size;
            const compressedSize = processedBlob.size;
            const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);

            const newItem: ProcessedImage = {
                id: Date.now().toString(),
                originalFile: file,
                originalPreview,
                compressedBlob: processedBlob,
                compressedPreview,
                originalSize,
                compressedSize,
                compressionRatio,
                timestamp: Date.now(),
                qualityUsed: initialVal,
                mode: mode,
                enhanceMethod: mode === 'enhance' ? settings.enhanceMethod : undefined
            };

            setCurrentImage(newItem);
        } catch (error) {
            console.error("Processing failed:", error);
            alert("Processing failed, please try again");
        } finally {
            setIsProcessing(false);
        }
    }, [settings]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
            e.target.value = '';
        }
    };

    // Debounced Slider Change (For Algo Mode)
    const debounceRef = useRef<any>(undefined);
    const handleSliderChange = (newVal: number) => {
        setSliderValue(newVal);
        if (!currentImage || (currentImage.mode === 'enhance' && settings.enhanceMethod === 'ai')) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsProcessing(true);
            if (hasSaved) setHasSaved(false);

            try {
                const processedBlob = await executeProcessing(currentImage.originalFile, newVal, processMode);
                const compressedPreview = await blobToDataURL(processedBlob);
                const compressedSize = processedBlob.size;
                const compressionRatio = Math.round(((currentImage.originalSize - compressedSize) / currentImage.originalSize) * 100);

                setCurrentImage(prev => prev ? ({
                    ...prev,
                    compressedBlob: processedBlob,
                    compressedPreview,
                    compressedSize,
                    compressionRatio,
                    qualityUsed: newVal,
                    mode: processMode
                }) : null);
            } catch (e) {
                console.error(e);
            } finally {
                setIsProcessing(false);
            }
        }, 300);
    };

    // Re-process when output format changes (for supported modes)
    useEffect(() => {
        if (!currentImage) return;

        const isAlgorithmMode = processMode === 'compress' && settings.compressionMode === 'algorithm';
        const isEnhanceMode = processMode === 'enhance' && settings.enhanceMethod === 'algorithm';

        if (isAlgorithmMode || isEnhanceMode) {
            handleSliderChange(sliderValue);
        } else if (processMode === 'enhance' && settings.enhanceMethod === 'ai' && currentImage?.aiOriginalBlob) {
            // Handle AI Format Conversion
            (async () => {
                setIsProcessing(true);
                try {
                    const newBlob = await convertBlobFormat(currentImage.aiOriginalBlob!, settings.outputFormat);
                    const compressedPreview = await blobToDataURL(newBlob);

                    setCurrentImage(prev => prev ? ({
                        ...prev,
                        compressedBlob: newBlob,
                        compressedPreview,
                        compressedSize: newBlob.size,
                        outputFormat: settings.outputFormat
                    }) : null);
                } catch (e) {
                    console.error("Format conversion failed", e);
                } finally {
                    setIsProcessing(false);
                }
            })();
        }
    }, [settings.outputFormat]);

    // AI Generation Handler
    const handleAIEnhance = async () => {
        if (!currentImage) return;
        const key = settings.customApiKey || '';
        // Strict check removed

        setIsAiGenerating(true);
        try {
            const result = await generateEnhancedImage(
                currentImage.originalPreview,
                currentAiPrompt,
                settings.aiModel,
                key,
                settings.customBaseUrl
            );

            if (result) {
                const { blob, text } = result;

                setCurrentImage(prev => {
                    if (!prev) return null;

                    const updates: Partial<ProcessedImage> = {
                        aiGeneratedText: text // Save generated text
                    };

                    if (blob) {
                        updates.qualityUsed = 1; // Flag as generated
                        updates.aiModelUsed = settings.aiModel; // Save model used
                        updates.compressedBlob = blob;
                        updates.aiOriginalBlob = blob; // Save original for re-formatting
                        updates.compressedSize = blob.size;
                        updates.compressionRatio = 0;
                        updates.outputFormat = 'original'; // Default to original
                    }

                    return {
                        ...prev,
                        ...updates,
                    } as ProcessedImage;
                });

                // We need to handle the async preview update if blob exists
                if (blob) {
                    const compressedPreview = await blobToDataURL(blob);
                    setCurrentImage(prev => prev ? ({ ...prev, compressedPreview }) : null);
                    setHasSaved(false); // Only mark as unsaved (allow saving to history) if we got a new image
                }
            }
        } catch (e: any) {
            alert("AI Generation Failed: " + e.message);
        } finally {
            setIsAiGenerating(false);
        }
    };

    const toggleMode = async () => {
        if (!currentImage || hasSaved) return; // Prevent switch if saved
        const newMode = processMode === 'compress' ? 'enhance' : 'compress';
        setProcessMode(newMode);

        // Update method in current image for tracking UI
        const newMethod = newMode === 'enhance' ? settings.enhanceMethod : undefined;

        // Reset values
        const defaultVal = newMode === 'compress' ? 0.8 : 0.5;
        setSliderValue(defaultVal);

        // If switching to AI enhance, don't auto-process algo
        if (newMode === 'enhance' && settings.enhanceMethod === 'ai') {
            setCurrentImage(prev => prev ? ({
                ...prev,
                mode: newMode,
                enhanceMethod: 'ai',
                // Reset to "pending" state
                qualityUsed: 0,
                compressedPreview: prev.originalPreview, // Show original until generated
                compressedSize: prev.originalSize, // Reset size
                compressedBlob: prev.originalFile.slice(0, prev.originalFile.size, prev.originalFile.type), // Reset blob
                compressionRatio: 0,
                aiGeneratedText: undefined, // Clear previous text
                aiOriginalBlob: undefined, // Clear previous AI blob
                outputFormat: 'original'
            }) : null);
            setHasSaved(false);
            return;
        }

        setIsProcessing(true);
        setHasSaved(false);
        try {
            const processedBlob = await executeProcessing(currentImage.originalFile, defaultVal, newMode);
            const compressedPreview = await blobToDataURL(processedBlob);
            const compressedSize = processedBlob.size;
            const compressionRatio = Math.round(((currentImage.originalSize - compressedSize) / currentImage.originalSize) * 100);

            setCurrentImage(prev => prev ? ({
                ...prev,
                compressedBlob: processedBlob,
                compressedPreview,
                compressedSize,
                compressionRatio,
                qualityUsed: defaultVal,
                mode: newMode,
                enhanceMethod: newMethod
            }) : null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveToHistory = () => {
        if (currentImage && !hasSaved) {
            setHistory(prev => [currentImage, ...prev]);
            setHasSaved(true);
            StorageService.saveImage(currentImage).catch(console.error);
        }
    };

    const handleGeminiAnalysis = async (targetImage?: ProcessedImage) => {
        const imgToAnalyze = targetImage || currentImage;
        if (!imgToAnalyze) return;
        const key = settings.customApiKey || '';
        // if (!key) { alert("API Key Required"); setShowSettings(true); return; } // Removed strict check
        setAnalyzingIds(prev => new Set(prev).add(imgToAnalyze.id));
        try {
            const aiData = await analyzeImage(
                imgToAnalyze.compressedPreview,
                key,
                settings.customBaseUrl,
                settings.analysisModel // Use Custom Model
            );
            if (aiData) {
                if (currentImage && currentImage.id === imgToAnalyze.id) setCurrentImage(prev => prev ? ({ ...prev, aiData }) : null);
                setHistory(prev => prev.map(item => item.id === imgToAnalyze.id ? { ...item, aiData } : item));
            } else { alert("Analysis Failed"); }
        } finally {
            setAnalyzingIds(prev => { const next = new Set(prev); next.delete(imgToAnalyze.id); return next; });
        }
    };

    const triggerDownload = () => {
        if (currentImage) {
            const link = document.createElement('a');
            link.href = currentImage.compressedPreview;

            // Determine format from blob type
            let format = 'original';
            if (currentImage.compressedBlob.type === 'image/webp') format = 'webp';
            else if (currentImage.compressedBlob.type === 'image/png') format = 'png';
            else if (currentImage.compressedBlob.type === 'image/jpeg') format = 'jpeg';

            const fileName = getCompressedFileName(
                currentImage.originalFile.name,
                currentImage.qualityUsed,
                currentImage.mode,
                currentImage.aiModelUsed,
                format
            );
            link.download = fileName;
            link.click();
        }
    };

    // Paste/Drag hooks
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (showDataManager || showSettings) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) processFile(blob);
                    break;
                }
            }
        };
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            if (showDataManager || showSettings) return;
            if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) processFile(file);
            }
        };
        const handleDragOver = (e: DragEvent) => e.preventDefault();
        window.addEventListener('paste', handlePaste);
        window.addEventListener('drop', handleDrop);
        window.addEventListener('dragover', handleDragOver);
        return () => {
            window.removeEventListener('paste', handlePaste);
            window.removeEventListener('drop', handleDrop);
            window.removeEventListener('dragover', handleDragOver);
        };
    }, [processFile, showDataManager, showSettings]);

    if (showDataManager) {
        return (
            <DataManager
                history={history}
                onBack={() => setShowDataManager(false)}
                onDelete={(ids) => {
                    setHistory(prev => prev.filter(p => !ids.includes(p.id)));
                    StorageService.deleteAllImages(ids).catch(console.error);
                    if (currentImage && ids.includes(currentImage.id)) {
                        setCurrentImage(null);
                        setHasSaved(false);
                    }
                }}
                onAnalyze={(id) => {
                    const item = history.find(h => h.id === id);
                    if (item) handleGeminiAnalysis(item);
                }}
                t={t}
                analyzingIds={analyzingIds}
            />
        );
    }

    // Helper to check if AI Enhancement is active and not generated yet
    const isPendingAiEnhance = !!currentImage && currentImage.mode === 'enhance' && settings.enhanceMethod === 'ai' && currentImage.qualityUsed === 0;

    return (
        <div
            ref={containerRef}
            className="min-h-screen relative overflow-hidden font-sans flex flex-col transition-colors duration-300"
            style={{
                '--mouse-x': `${mousePos.x}px`,
                '--mouse-y': `${mousePos.y}px`,
            } as React.CSSProperties}
        >
            <InteractiveOverlay />
            <CustomContextMenu isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gray-50 dark:bg-dark">
                {/* Mouse Follower Blob */}
                <div
                    className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-[100px] pointer-events-none transition-transform duration-75 ease-out translate-x-[-50%] translate-y-[-50%]"
                    style={{ left: 'var(--mouse-x)', top: 'var(--mouse-y)' }}
                ></div>

                {/* Ambient Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>

                {/* Grid Pattern with Spotlight Reveal */}
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
                    style={{
                        maskImage: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), black, transparent 400px)',
                        WebkitMaskImage: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), black, transparent 400px)'
                    }}
                ></div>
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onSave={(newSettings) => {
                    setSettings(newSettings);
                    // If method changed, trigger re-process if image exists
                    if (currentImage && currentImage.mode === 'enhance' && newSettings.enhanceMethod !== settings.enhanceMethod) {
                        // Logic to handle switch if needed, currently simplified
                    }
                }}
                t={t}
                onRestoreClick={() => setShowRestoreModal(true)}
                historyForBackup={history}
                onLocalRestore={(res) => {
                    // Same logic as RestoreModal
                    const newImages = res.images;
                    const newSettings = res.settings;

                    setHistory(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const itemsToAdd = newImages.filter(i => !existingIds.has(i.id));
                        return [...itemsToAdd, ...prev];
                    });

                    if (newSettings && confirm("Found settings in backup. Restore them?")) {
                        setSettings(newSettings);
                    }
                }}
            />

            {currentImage && (
                <ImageEditorModal
                    isOpen={showImageEditor}
                    onClose={() => setShowImageEditor(false)}
                    imageSrc={currentImage.originalPreview}
                    t={t}
                    onSave={async (newImage) => {
                        if (!currentImage) return;
                        // Update current image with edited version
                        // Note: This replaces the "original" in the context of the app
                        const res = await fetch(newImage);
                        const blob = await res.blob();
                        const type = currentImage.originalFile.type;
                        const file = new File([blob], currentImage.originalFile.name, { type });

                        // Trigger re-processing with new file
                        processFile(file, currentImage.mode);
                    }}
                />
            )}

            <RestoreModal
                isOpen={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                config={settings.webdav}
                t={t}
                onRestore={(res) => {
                    // Restore Settings if present
                    // The service now returns { images, settings }
                    const restoredData = res as unknown as { images: ProcessedImage[], settings?: AppSettings };

                    // Handle legacy return type (array) vs new type
                    const newImages = Array.isArray(restoredData) ? restoredData : restoredData.images;
                    const newSettings = !Array.isArray(restoredData) ? restoredData.settings : undefined;

                    setHistory(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const itemsToAdd = newImages.filter(i => !existingIds.has(i.id));
                        return [...itemsToAdd, ...prev];
                    });

                    if (newSettings) {
                        setSettings(newSettings);
                    }
                }}
            />

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                title={t('confirm_delete_title')}
                message={t('confirm_delete_desc').replace('{count}', '1')}
                type="confirm"
                confirmText={t('delete')}
                cancelText={t('cancel')}
                onConfirm={() => {
                    if (deleteTargetId) {
                        setHistory(prev => prev.filter(p => p.id !== deleteTargetId));
                        StorageService.deleteImage(deleteTargetId).catch(console.error);
                        if (currentImage && currentImage.id === deleteTargetId) {
                            setCurrentImage(null);
                            setHasSaved(false);
                        }
                    }
                    setDeleteConfirmOpen(false);
                    setDeleteTargetId(null);
                }}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setDeleteTargetId(null);
                }}
            />

            {/* Header */}
            <header className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentImage(null)}>
                        <div className="bg-gradient-to-br from-primary via-purple-500 to-secondary p-2.5 rounded-xl shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform duration-200">
                            <Zap size={26} strokeWidth={2.5} fill="white" className="text-white" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-secondary">
                            {t('title')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <PWAInstallButton />
                        <button onClick={() => setShowDataManager(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                            <Database size={20} />
                        </button>
                        <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                            <SettingsIcon size={20} />
                        </button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                        <ThemeToggle isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
                    </div>
                </div>
            </header>

            <main className="flex-grow pt-28 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col items-center">
                {!currentImage && (
                    <div className="text-center w-full max-w-3xl mt-16 animate-fade-in">
                        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-800 dark:text-white mb-6 leading-tight min-h-[160px] md:min-h-[auto]">
                            {t('hero_title_prefix')}
                            <span className="text-primary block md:inline mt-2 md:mt-0">
                                <Typewriter texts={t('slogans') as unknown as string[]} />
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
                            {t('hero_desc')}
                        </p>

                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative glass-panel rounded-2xl p-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors">
                                <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                                    <Upload size={40} />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    {t('upload_area')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('formats')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {currentImage && (
                    <div className="w-full flex flex-col lg:flex-row gap-8 animate-fade-in">
                        {/* Left Controls */}
                        <div className="lg:w-1/3 space-y-6 order-2 lg:order-1">

                            {/* Stats */}
                            {/* Image Preview & Editor Trigger */}
                            <div
                                className="glass-panel rounded-2xl p-2 shadow-xl cursor-pointer group relative overflow-hidden mb-6"
                                onClick={() => setShowImageEditor(true)}
                            >
                                <img
                                    src={currentImage.originalPreview}
                                    alt="Original Preview"
                                    className="w-full h-48 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                    <span className="text-white font-bold flex items-center gap-2">
                                        <PenTool size={20} /> {t('edit_view')}
                                    </span>
                                </div>
                            </div>



                            {/* Stats */}
                            <div className="glass-panel rounded-2xl p-6 shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <ImageIcon size={20} className="text-primary" /> {t('image_info')}
                                    </h3>
                                    <button
                                        onClick={toggleMode}
                                        disabled={hasSaved} // Disabled when saved
                                        className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-colors ${processMode === 'enhance'
                                            ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                                            : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                            } ${hasSaved ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {processMode === 'compress' ? <Wand2 size={12} /> : <Minimize2 size={12} />}
                                        {processMode === 'compress' ? t('switch_to_enhance') : t('switch_to_compress')}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('original_size')}</span>
                                        <span className="font-mono font-medium">{formatBytes(currentImage.originalSize)}</span>
                                    </div>
                                    {/* Hide compressed size stats if pending AI generate */}
                                    {!isPendingAiEnhance && (
                                        <div className={`flex justify-between items-center p-3 rounded-lg border ${processMode === 'enhance' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-primary/10 border-primary/20'}`}>
                                            <span className={`text-sm ${processMode === 'enhance' ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>{t('compressed_size')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold">{formatBytes(currentImage.compressedSize)}</span>
                                                {/* Enhance Mode Specific Stats */}
                                                {processMode === 'enhance' && (() => {
                                                    const diff = currentImage.compressedSize - currentImage.originalSize;
                                                    const pct = Math.round((diff / currentImage.originalSize) * 100);
                                                    return diff > 0
                                                        ? <span className="text-red-500 text-xs font-bold">+{pct}%</span>
                                                        : <span className="text-purple-500 text-xs font-bold">{pct}%</span>
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            {processMode === 'compress' ? <Sliders size={20} className="text-green-500" /> : <Wand2 size={20} className="text-blue-500" />}
                                            {processMode === 'compress' ? t('compression_strength') : t('enhance_strength')}
                                        </h3>
                                    </div>

                                    {/* Render Logic: If AI Enhance, show prompt input, else slider */}
                                    {(processMode === 'enhance' && settings.enhanceMethod === 'ai') ? (
                                        <div className="space-y-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">{t('ai_enhance_prompt_label')}</label>
                                            <textarea
                                                className="w-full p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark resize-none h-24 focus:ring-2 focus:ring-primary outline-none"
                                                value={currentAiPrompt}
                                                onChange={(e) => setCurrentAiPrompt(e.target.value)}
                                                placeholder="Describe how to enhance the image..."
                                            />
                                            <button
                                                onClick={handleAIEnhance}
                                                disabled={isAiGenerating}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                                            >
                                                {isAiGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                                {isAiGenerating ? t('generating') : t('btn_generate')}
                                            </button>

                                            {currentImage?.aiModelUsed && (
                                                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 max-h-60 overflow-y-auto shadow-inner">
                                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                                                        <Sparkles size={12} /> AI Response
                                                    </div>
                                                    <TypewriterText text={currentImage.aiGeneratedText || t('responding')} />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                                    {Math.round(sliderValue * 100)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.0"
                                                max="1.0"
                                                step="0.05"
                                                value={sliderValue}
                                                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 ${processMode === 'enhance' ? 'bg-blue-200 accent-blue-600' : 'bg-green-200 accent-green-600'}`}
                                            />
                                            <p className="text-xs text-gray-500 mt-2 text-center">
                                                {isProcessing ? t('processing') : t('slider_tip')}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Output Format Selection Card */}
                                {(() => {
                                    const isCanvasMode = processMode === 'compress' && settings.compressionMode === 'canvas';
                                    const isAlgorithmMode = processMode === 'compress' && settings.compressionMode === 'algorithm';
                                    const isAIEnhance = processMode === 'enhance' && settings.enhanceMethod === 'ai';
                                    const shouldShowFormatCard = isAlgorithmMode || (processMode === 'enhance');

                                    if (!shouldShowFormatCard) return null;

                                    return (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    <ImageIcon size={16} className="text-primary" />
                                                    {t('output_format_card_title')}
                                                </h4>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    {isCanvasMode ? 'WebP' : settings.outputFormat.toUpperCase()}
                                                </span>
                                            </div>
                                            <select
                                                value={settings.outputFormat}
                                                onChange={(e) => setSettings(prev => ({ ...prev, outputFormat: e.target.value as any }))}
                                                disabled={isCanvasMode}
                                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-gray-100 text-sm font-medium focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <option value="original">{t('format_original')}</option>
                                                <option value="webp">{t('format_webp')}</option>
                                                <option value="png">{t('format_png')}</option>
                                                <option value="jpeg">{t('format_jpeg')}</option>
                                            </select>
                                            {isCanvasMode && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                                                    <span className="font-bold">⚠️</span> {t('format_note_canvas')}
                                                </p>
                                            )}
                                            {isAIEnhance && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                                    <span className="font-bold">ℹ️</span> {t('format_note_ai')}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {!isPendingAiEnhance && (
                                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={handleSaveToHistory}
                                            disabled={hasSaved || isProcessing || isAiGenerating}
                                            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all transform font-bold ${hasSaved
                                                ? 'bg-green-500 hover:bg-green-600 text-white cursor-default'
                                                : 'bg-gradient-to-r from-primary to-secondary hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] text-white'
                                                }`}
                                        >
                                            {hasSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                                            {hasSaved ? t('saved_history') : t('save_history')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                                >
                                    <RefreshCw size={16} /> {t('change_image')}
                                </button>
                                <button
                                    onClick={triggerDownload}
                                    disabled={isPendingAiEnhance}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 text-sm font-medium disabled:opacity-50"
                                >
                                    <Download size={16} /> {t('download_only')}
                                </button>
                            </div>

                            <div className="glass-panel rounded-2xl p-6 shadow-xl border-t-4 border-indigo-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Sparkles size={100} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                    <Sparkles size={20} className="text-indigo-500" /> {t('ai_analysis_title')}
                                </h3>
                                {!currentImage.aiData ? (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 mb-4">
                                            {t('ai_analysis_placeholder')}
                                        </p>
                                        <button
                                            onClick={() => handleGeminiAnalysis()}
                                            disabled={analyzingIds.has(currentImage.id)}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            {analyzingIds.has(currentImage.id) ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                            {analyzingIds.has(currentImage.id) ? t('analyzing') : t('start_analysis')}
                                        </button>
                                    </div>
                                ) : (
                                    <AIResultCard data={currentImage.aiData} t={t} />
                                )}
                            </div>
                        </div>

                        <div className="lg:w-2/3 flex flex-col order-1 lg:order-2">
                            <div className="glass-panel rounded-2xl p-1 md:p-4 shadow-2xl flex-1 flex flex-col min-h-[500px]">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <ArrowRight size={16} /> {t('drag_compare')}
                                    </div>
                                    {(isProcessing || isAiGenerating) && (
                                        <div className="flex items-center gap-2 text-primary text-sm font-bold animate-pulse">
                                            <Loader2 size={16} className="animate-spin" /> {isAiGenerating ? t('generating') : t('compressing')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative bg-gray-500/5 rounded-xl overflow-hidden flex flex-col justify-center">
                                    {isPendingAiEnhance ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                                            <Sparkles size={48} className="text-indigo-400 mb-4 animate-pulse" />
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('ai_enhance_placeholder')}</p>
                                            <p className="text-xs text-gray-400 mt-2">Click "Generate" on the left</p>
                                        </div>
                                    ) : (
                                        <ImageComparator
                                            beforeSrc={currentImage.originalPreview}
                                            afterSrc={currentImage.compressedPreview}
                                            beforeLabel={t('original_label')}
                                            afterLabel={t('compressed_label')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <HistoryList
                    history={history}
                    onSelect={(item) => {
                        setCurrentImage(item);
                        setHasSaved(true);
                        setSliderValue(item.qualityUsed);
                        setProcessMode(item.mode);
                        setCurrentAiPrompt(settings.aiPrompt);
                    }}
                    onAnalyze={(id) => {
                        const item = history.find(h => h.id === id);
                        if (item) handleGeminiAnalysis(item);
                    }}
                    onDelete={(id) => {
                        setDeleteTargetId(id);
                        setDeleteConfirmOpen(true);
                    }}
                    t={t}
                    analyzingIds={analyzingIds}
                />
            </main>

            <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm w-full">
                <div className="flex flex-col items-center gap-2">
                    <p>© 2025 PixelLite Pro. Author: XCQ</p>
                    {settings.customApiKey && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full text-xs font-mono">
                            <Key size={12} />
                            <span>{t('custom_key_active')}</span>
                        </div>
                    )}
                </div>
            </footer>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}

export default App;
