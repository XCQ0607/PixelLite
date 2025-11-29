
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Sliders, Download, Image as ImageIcon, Sparkles, Zap, ArrowRight, Loader2, Save, CheckCircle, Key, RefreshCw, Settings as SettingsIcon, Database, Wand2, Layers, Minimize2, Cpu, Play } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { ImageComparator } from './components/ImageComparator';
import { HistoryList } from './components/HistoryList';
import { SettingsModal } from './components/SettingsModal';
import { DataManager } from './components/DataManager';
import { AIResultCard } from './components/AIResultCard';
import { RestoreModal } from './components/RestoreModal';
import { compressImage, applyImageEnhancement, formatBytes, blobToDataURL, getCompressedFileName } from './services/imageService';
import { analyzeImage, generateEnhancedImage } from './services/geminiService';
import { ProcessedImage, AppSettings, ProcessMode } from './types';
import { StorageService } from './services/storageService';

// Translation Dictionary
const translations = {
    zh: {
        title: 'PixelLite Pro',
        hero_title_prefix: '智能',
        slogans: ['图片压缩', '画质增强', '无损优化'],
        hero_desc: '一站式图片处理工坊。压缩体积，增强画质，智能分析。数据本地处理，安全无忧。',
        upload_area: '点击上传，拖拽，或 Ctrl+V 粘贴图片',
        formats: '支持 PNG, JPG, JPEG, WebP',
        image_info: '图片信息',
        original_size: '原始大小',
        compressed_size: '处理后',
        savings: '变化',
        compression_strength: '压缩强度',
        enhance_strength: '清晰度增强',
        slider_tip: '调整滑块以平衡效果',
        processing: '正在处理...',
        save_history: '确认并保存',
        saved_history: '已保存',
        change_image: '换一张',
        download_only: '仅下载',
        ai_analysis_title: 'AI 智能分析与建议',
        ai_analysis_placeholder: '使用 Gemini 模型分析图片内容，获取优化建议。',
        start_analysis: '开始分析',
        analyzing: '分析中...',
        history_title: '历史记录',
        settings_title: '设置',
        language_label: '语言 / Language',
        api_key_label: 'Gemini API Key',
        api_key_placeholder: '输入您的 API Key',
        api_key_placeholder_env: '使用内置默认 Key',
        api_key_desc: '留空则尝试使用系统环境变量中的 Key (如果存在)。',
        smart_compression: '智能压缩',
        smart_compression_desc: '根据图片大小自动推荐最佳压缩率',
        default_quality: '默认强度',
        save_settings: '保存设置',
        data_manager: '数据管理',
        privacy_warning_title: '隐私与数据安全提醒',
        privacy_warning_desc: '所有转换记录和图片仅保存在您的浏览器缓存(内存)中。刷新页面或关闭标签页后，所有数据将永久丢失。请及时导出重要文件。',
        select_all: '全选',
        selected_items: '已选 {count} 项',
        include_original: '包含原图',
        export_zip: '导出 ZIP',
        delete: '删除',
        confirm_delete_title: '确认删除?',
        confirm_delete_desc: '您即将删除 {count} 个项目。此操作无法撤销。',
        cancel: '取消',
        confirm: '确认删除',
        no_history: '暂无历史记录',
        generate_ai: 'AI 分析',
        original_label: '原图',
        compressed_label: '处理后',
        custom_key_active: 'Custom Key Active',
        close_menu: '关闭菜单',
        export_failed: '导出失败，请重试',
        tags_label: '标签',
        drag_compare: '拖动中间滑块对比效果',
        compressing: '处理中...',
        webdav_missing_url: '请先配置 WebDAV URL',

        // Settings specific
        settings_tab_general: '通用设置',
        settings_tab_modes: '处理模式',
        settings_tab_webdav: 'WebDAV 备份',
        settings: '设置',
        mode_label: '压缩算法模式',
        mode_balanced_title: '模式 1: 均衡 (Balanced)',
        mode_balanced_desc: '使用标准算法，优先保持画质与原始格式。',
        mode_strict_title: '模式 2: 现代算法 (WebP)',
        mode_strict_desc: '使用 WebP 高效编码，保持分辨率的同时大幅减小体积。',
        api_base_url: 'API Base URL',
        api_base_url_desc: '可选：覆盖默认 Google API 地址 (如使用反向代理)。',
        webdav_help: '支持 WebDAV 协议的网盘 (如坚果云, Nextcloud, Alist)',
        webdav_server_url: '服务器地址 (Server URL)',
        webdav_username: '用户名 (Username)',
        webdav_password: '密码 (Password)',
        test_connection: '测试连接',
        connection_success: '连接成功！',
        connection_failed: '连接失败',
        backup_btn: '备份',
        restore_btn: '恢复',
        backup_success: '备份成功！',
        restore_success: '恢复成功！',
        enhance_mode: '清晰增强',
        enhance_mode_title: '画质增强设置',
        enhance_mode_desc: '通过图像卷积算法增强边缘清晰度和对比度。',
        default_process_mode: '默认处理模式',
        mode_compress: '压缩模式',
        mode_enhance: '增强模式',
        switch_to_compress: '切换到压缩模式',
        switch_to_enhance: '切换到增强模式',
        enhance_method: '增强方式',
        method_algorithm: '传统算法 (本地快)',
        method_ai: 'AI 生成 (云端慢)',
        ai_model_name: 'AI 模型名称',
        default_ai_prompt: '默认提示词模板',

        // AI Enhance
        ai_enhance_prompt_label: 'AI 增强提示词',
        btn_generate: '开始生成',
        generating: '生成中...',
        ai_enhance_placeholder: '等待生成...'
    },
    en: {
        title: 'PixelLite Pro',
        hero_title_prefix: 'Smart ',
        slogans: ['Compression', 'Enhancement', 'Optimization'],
        hero_desc: 'All-in-one image studio. Reduce size, enhance clarity, and analyze with AI. Secure local processing.',
        upload_area: 'Click to upload, Drag & Drop, or Ctrl+V',
        formats: 'Supports PNG, JPG, JPEG, WebP',
        image_info: 'Image Info',
        original_size: 'Original Size',
        compressed_size: 'Processed',
        savings: 'Change',
        compression_strength: 'Compression',
        enhance_strength: 'Sharpening',
        slider_tip: 'Adjust slider to balance effect',
        processing: 'Processing...',
        save_history: 'Confirm & Save',
        saved_history: 'Saved',
        change_image: 'Change Image',
        download_only: 'Download Only',
        ai_analysis_title: 'AI Analysis & Advice',
        ai_analysis_placeholder: 'Use Gemini model to analyze content and get optimization advice.',
        start_analysis: 'Analyze',
        analyzing: 'Analyzing...',
        history_title: 'History',
        settings_title: 'Settings',
        language_label: 'Language',
        api_key_label: 'Gemini API Key',
        api_key_placeholder: 'Enter your API Key',
        api_key_placeholder_env: 'Using built-in default Key',
        api_key_desc: 'Leave empty to use system environment variable Key (if exists).',
        smart_compression: 'Smart Compression',
        smart_compression_desc: 'Auto-recommend best compression rate based on file size',
        default_quality: 'Default Strength',
        save_settings: 'Save Settings',
        data_manager: 'Data Manager',
        privacy_warning_title: 'Privacy & Data Safety',
        privacy_warning_desc: 'All records and images are stored in browser memory only. Data will be lost upon refresh or closing tab. Please export important files.',
        select_all: 'Select All',
        selected_items: 'Selected {count}',
        include_original: 'Include Originals',
        export_zip: 'Export ZIP',
        delete: 'Delete',
        confirm_delete_title: 'Confirm Delete?',
        confirm_delete_desc: 'You are about to delete {count} items. This cannot be undone.',
        cancel: 'Cancel',
        confirm: 'Confirm',
        no_history: 'No history records',
        generate_ai: 'AI Analyze',
        original_label: 'Original',
        compressed_label: 'Processed',
        custom_key_active: 'Custom Key Active',
        close_menu: 'Close Menu',
        export_failed: 'Export failed, please try again',
        tags_label: 'Tags',
        drag_compare: 'Drag slider to compare',
        compressing: 'Working...',
        webdav_missing_url: 'Please configure WebDAV URL first',

        // Settings specific
        settings_tab_general: 'General',
        settings_tab_modes: 'Modes',
        settings_tab_webdav: 'WebDAV Backup',
        settings: 'Settings',
        mode_label: 'Compression Mode',
        mode_balanced_title: 'Mode 1: Balanced',
        mode_balanced_desc: 'Standard algorithm, prioritizes quality and original format.',
        mode_strict_title: 'Mode 2: Modern (WebP)',
        mode_strict_desc: 'Uses WebP efficient encoding. Keeps resolution but reduces size significantly.',
        api_base_url: 'API Base URL',
        api_base_url_desc: 'Optional: Override default Google API endpoint (e.g. for proxies).',
        webdav_help: 'Supports WebDAV compatible services (Nextcloud, etc.)',
        webdav_server_url: 'Server URL',
        webdav_username: 'Username',
        webdav_password: 'Password',
        test_connection: 'Test Connection',
        connection_success: 'Connected!',
        connection_failed: 'Connection Failed',
        backup_btn: 'Backup',
        restore_btn: 'Restore',
        backup_success: 'Backup Successful!',
        restore_success: 'Restore Successful!',
        enhance_mode: 'Enhancement',
        enhance_mode_title: 'Enhancement Settings',
        enhance_mode_desc: 'Uses image convolution algorithms to improve edge clarity and contrast.',
        default_process_mode: 'Default Mode',
        mode_compress: 'Compression',
        mode_enhance: 'Enhancement',
        switch_to_compress: 'Switch to Compress',
        switch_to_enhance: 'Switch to Enhance',
        enhance_method: 'Enhance Method',
        method_algorithm: 'Algorithm (Fast, Local)',
        method_ai: 'AI Generation (Slow, Cloud)',
        ai_model_name: 'AI Model Name',
        default_ai_prompt: 'Default Prompt Template',

        // AI Enhance
        ai_enhance_prompt_label: 'AI Enhance Prompt',
        btn_generate: 'Generate',
        generating: 'Generating...',
        ai_enhance_placeholder: 'Waiting for generation...'
    }
};

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

function App() {
    const [isDark, setIsDark] = useState(true);
    const [currentImage, setCurrentImage] = useState<ProcessedImage | null>(null);
    const [history, setHistory] = useState<ProcessedImage[]>([]);

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

    // App Settings
    const [settings, setSettings] = useState<AppSettings>({
        customApiKey: '',
        customBaseUrl: '',
        defaultQuality: 0.8,
        smartCompression: true,
        compressionMode: 'balanced',
        defaultProcessMode: 'compress',
        enhanceMethod: 'algorithm',
        aiModel: 'gemini-2.5-flash-image',
        analysisModel: 'gemini-2.5-flash',
        aiPrompt: 'Enhance the clarity and details of this image, maintain realistic colors.',
        language: 'zh',
        webdav: { url: '', username: '', password: '' }
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
        return translations[settings.language][key as keyof typeof translations['zh']] || key;
    }, [settings.language]);

    // Theme Handling
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Mouse Move Effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const getSmartQuality = (size: number): number => {
        const MB = 1024 * 1024;
        if (size > 5 * MB) return 0.6;
        if (size > 2 * MB) return 0.7;
        if (size > 1 * MB) return 0.75;
        return 0.85;
    };

    const executeProcessing = async (file: File, val: number, mode: ProcessMode) => {
        if (mode === 'compress') {
            return await compressImage(file, val, settings.compressionMode);
        } else {
            // Algorithm Enhance
            return await applyImageEnhancement(file, val);
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

    // AI Generation Handler
    const handleAIEnhance = async () => {
        if (!currentImage) return;
        const key = settings.customApiKey || '';
        // Strict check removed

        setIsAiGenerating(true);
        try {
            const blob = await generateEnhancedImage(
                currentImage.originalPreview,
                currentAiPrompt,
                settings.aiModel,
                key,
                settings.customBaseUrl
            );

            if (blob) {
                const compressedPreview = await blobToDataURL(blob);
                setCurrentImage(prev => prev ? ({
                    ...prev,
                    compressedBlob: blob,
                    compressedPreview,
                    compressedSize: blob.size,
                    compressionRatio: 0, // Not applicable
                    qualityUsed: 1, // Flag as generated
                    aiModelUsed: settings.aiModel // Save model used
                }) : null);
                setHasSaved(false);
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
            setCurrentImage(prev => prev ? ({ ...prev, mode: newMode, enhanceMethod: 'ai' }) : null);
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
            let originalName = currentImage.originalFile.name;
            if (currentImage.compressedBlob.type === 'image/webp') {
                const nameParts = originalName.split('.');
                if (nameParts.length > 1) nameParts.pop();
                originalName = nameParts.join('.') + '.webp';
            }
            const fileName = getCompressedFileName(originalName, currentImage.qualityUsed, currentImage.mode, currentImage.aiModelUsed);
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
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gray-50 dark:bg-dark">
                <div
                    className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 blur-[100px] pointer-events-none transition-transform duration-75 ease-out translate-x-[-50%] translate-y-[-50%]"
                    style={{ left: 'var(--mouse-x)', top: 'var(--mouse-y)' }}
                ></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
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
            />

            <RestoreModal
                isOpen={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                config={settings.webdav}
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

                    if (newSettings && confirm("Found settings in backup. Restore them?")) {
                        setSettings(newSettings);
                    }
                }}
            />

            {/* Header */}
            <header className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentImage(null)}>
                        <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg text-white">
                            <Zap size={24} />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {t('title')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
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
