import React, { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, PenTool, Eraser, RotateCw, Type, Download, Undo, Redo, RefreshCw, FlipHorizontal, FlipVertical, Crop, Sliders, Palette, Check, Ban } from 'lucide-react';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onSave: (newImage: string) => void;
    t: (key: string) => string;
}

type EditorTab = 'draw' | 'crop' | 'adjust';

interface CropState {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FilterState {
    brightness: number;
    contrast: number;
    saturation: number;
    grayscale: number;
    sepia: number;
    invert: number;
    blur: number;
}

const DEFAULT_FILTERS: FilterState = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    blur: 0
};

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageSrc, onSave, t }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // Drawing layer
    const imageRef = useRef<HTMLImageElement>(null); // Base image

    const [activeTab, setActiveTab] = useState<EditorTab>('draw');

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#ff0000');
    const [lineWidth, setLineWidth] = useState(5);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Transform State
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

    // Crop State
    const [crop, setCrop] = useState<CropState | null>(null);
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cropStart, setCropStart] = useState<CropState | null>(null);

    // Initialize
    useEffect(() => {
        if (isOpen && imageRef.current && canvasRef.current) {
            const img = imageRef.current;
            const canvas = canvasRef.current;

            // Reset all state
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setHistory([]);
            setHistoryStep(-1);
            setFilters(DEFAULT_FILTERS);
            setCrop(null);
            setActiveTab('draw');

            const initCanvas = () => {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    saveHistory();
                }
            };

            if (img.complete) {
                initCanvas();
            } else {
                img.onload = initCanvas;
            }
        }
    }, [isOpen, imageSrc]);

    // --- Drawing Logic ---
    const saveHistory = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const newHistory = history.slice(0, historyStep + 1);
            newHistory.push(imageData);
            setHistory(newHistory);
            setHistoryStep(newHistory.length - 1);
        }
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            setHistoryStep(newStep);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.putImageData(history[newStep], 0, 0);
            }
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            setHistoryStep(newStep);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.putImageData(history[newStep], 0, 0);
            }
        }
    };

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (activeTab !== 'draw') return;
        const point = getCanvasPoint(e);
        if (!point) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = lineWidth * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || activeTab !== 'draw') return;
        const point = getCanvasPoint(e);
        if (!point) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveHistory();
        }
    };

    // --- Crop Logic ---
    const initCrop = () => {
        if (!imageRef.current) return;
        const img = imageRef.current;
        // Default crop: 80% center
        const w = img.naturalWidth * 0.8;
        const h = img.naturalHeight * 0.8;
        const x = (img.naturalWidth - w) / 2;
        const y = (img.naturalHeight - h) / 2;
        setCrop({ x, y, width: w, height: h });
    };

    const applyCrop = () => {
        // Crop is applied during save. Here we just switch back to draw or adjust?
        // Actually, let's just keep the crop rect visible until save or cancel.
        // But for UX, maybe "Apply" just means "I'm done adjusting the crop rect".
        // Since we don't destructively crop until save, we can just leave it.
        // Or we can update the VIEW to show only the cropped area?
        // For simplicity, we'll just keep the rect.
        setActiveTab('draw');
    };

    const cancelCrop = () => {
        setCrop(null);
        setActiveTab('draw');
    };

    // --- Filter Logic ---
    const applyFilterPreset = (preset: Partial<FilterState>) => {
        setFilters({ ...DEFAULT_FILTERS, ...preset });
    };

    const getFilterString = () => {
        return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) invert(${filters.invert}%) blur(${filters.blur}px)`;
    };

    // --- Save Logic ---
    const handleSave = () => {
        if (!imageRef.current || !canvasRef.current) return;

        const img = imageRef.current;
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        // 1. Determine dimensions (Crop or Full)
        let sourceX = 0, sourceY = 0, sourceW = img.naturalWidth, sourceH = img.naturalHeight;
        if (crop) {
            sourceX = crop.x;
            sourceY = crop.y;
            sourceW = crop.width;
            sourceH = crop.height;
        }

        // 2. Handle Rotation for Output Canvas Size
        const isRotated90 = rotation % 180 !== 0;
        tempCanvas.width = isRotated90 ? sourceH : sourceW;
        tempCanvas.height = isRotated90 ? sourceW : sourceH;

        if (ctx) {
            // 3. Apply Filters
            ctx.filter = getFilterString();

            // 4. Apply Transforms
            ctx.save();
            ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

            // 5. Draw Image (Cropped)
            // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            // We need to draw the cropped area centered in the transformed context
            // The context is centered at (0,0) relative to the output canvas
            // So we draw from -width/2 to width/2

            const drawW = isRotated90 ? sourceH : sourceW; // Effective width in local space
            const drawH = isRotated90 ? sourceW : sourceH; // Effective height in local space
            // Wait, if we rotate 90deg, the "width" of the image in local space is still sourceW.
            // But we are drawing into a canvas that is swapped.

            // Let's simplify:
            // We draw the image centered at 0,0.
            // The image source rect is (sourceX, sourceY, sourceW, sourceH).
            // We draw it to (-sourceW/2, -sourceH/2, sourceW, sourceH).

            ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, -sourceW / 2, -sourceH / 2, sourceW, sourceH);

            // 6. Draw Annotations (Cropped)
            // The annotation canvas matches the full natural size.
            // So we also crop it using the same source rect.
            ctx.filter = 'none'; // Don't filter annotations
            ctx.drawImage(canvasRef.current, sourceX, sourceY, sourceW, sourceH, -sourceW / 2, -sourceH / 2, sourceW, sourceH);

            ctx.restore();

            // 7. Export
            const newImage = tempCanvas.toDataURL('image/png');
            onSave(newImage);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-gray-900 rounded-2xl shadow-2xl flex flex-col w-full max-w-6xl h-[90vh] overflow-hidden border border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <PenTool size={20} className="text-primary" /> {t('editor_title')}
                        </h3>
                        {/* Tabs */}
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button onClick={() => setActiveTab('draw')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === 'draw' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>{t('editor_draw')}</button>
                            <button onClick={() => { setActiveTab('crop'); if (!crop) initCrop(); }} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === 'crop' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>{t('editor_crop')}</button>
                            <button onClick={() => setActiveTab('adjust')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === 'adjust' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>{t('editor_adjust')}</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 hover:bg-gray-800 text-gray-300 rounded disabled:opacity-30 transition-colors" title="Undo"><Undo size={20} /></button>
                        <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 hover:bg-gray-800 text-gray-300 rounded disabled:opacity-30 transition-colors" title="Redo"><Redo size={20} /></button>
                        <div className="w-px h-6 bg-gray-700 mx-2"></div>
                        <button onClick={onClose} className="p-2 hover:bg-red-900/50 text-red-400 rounded transition-colors"><X size={24} /></button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Toolbar (Left) - Dynamic based on Tab */}
                    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4 gap-6 overflow-y-auto">

                        {activeTab === 'draw' && (
                            <>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('editor_draw')}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setTool('pen')} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${tool === 'pen' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'}`}>
                                            <PenTool size={20} />
                                            <span className="text-xs">{t('editor_pen')}</span>
                                        </button>
                                        <button onClick={() => setTool('eraser')} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${tool === 'eraser' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'}`}>
                                            <Eraser size={20} />
                                            <span className="text-xs">{t('editor_eraser')}</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('editor_color')}</h4>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
                                        className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-600 p-0 overflow-hidden"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('editor_size')} ({lineWidth}px)</h4>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={lineWidth}
                                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'crop' && (
                            <>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('editor_crop')}</h4>
                                    <p className="text-xs text-gray-400 mb-4">Drag the overlay to crop.</p>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={applyCrop} className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center gap-2">
                                            <Check size={16} /> {t('editor_apply')}
                                        </button>
                                        <button onClick={cancelCrop} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2">
                                            <Ban size={16} /> {t('editor_cancel')}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'adjust' && (
                            <>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('editor_adjust')}</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{t('editor_brightness')}</span>
                                                <span>{filters.brightness}%</span>
                                            </div>
                                            <input type="range" min="0" max="200" value={filters.brightness} onChange={(e) => setFilters(f => ({ ...f, brightness: parseInt(e.target.value) }))} className="w-full" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{t('editor_contrast')}</span>
                                                <span>{filters.contrast}%</span>
                                            </div>
                                            <input type="range" min="0" max="200" value={filters.contrast} onChange={(e) => setFilters(f => ({ ...f, contrast: parseInt(e.target.value) }))} className="w-full" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{t('editor_saturation')}</span>
                                                <span>{filters.saturation}%</span>
                                            </div>
                                            <input type="range" min="0" max="200" value={filters.saturation} onChange={(e) => setFilters(f => ({ ...f, saturation: parseInt(e.target.value) }))} className="w-full" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Filters</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => applyFilterPreset({})} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">{t('editor_filter_none')}</button>
                                        <button onClick={() => applyFilterPreset({ grayscale: 100 })} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">{t('editor_filter_grayscale')}</button>
                                        <button onClick={() => applyFilterPreset({ sepia: 100 })} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">{t('editor_filter_sepia')}</button>
                                        <button onClick={() => applyFilterPreset({ invert: 100 })} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">{t('editor_filter_invert')}</button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mt-auto pt-4 border-t border-gray-700">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('editor_rotate_left')} / {t('editor_rotate_right')}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setRotation(r => r - 90)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex justify-center"><RotateCcw size={16} /></button>
                                    <button onClick={() => setRotation(r => r + 90)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex justify-center"><RotateCw size={16} /></button>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setFlipH(f => !f)} className={`p-2 rounded-lg flex justify-center ${flipH ? 'bg-primary text-white' : 'bg-gray-700 text-white'}`}><FlipHorizontal size={16} /></button>
                                    <button onClick={() => setFlipV(f => !f)} className={`p-2 rounded-lg flex justify-center ${flipV ? 'bg-primary text-white' : 'bg-gray-700 text-white'}`}><FlipVertical size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')] bg-repeat flex items-center justify-center overflow-hidden relative p-8">
                        <div
                            className="relative shadow-2xl transition-transform duration-300 ease-out"
                            style={{
                                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                maxWidth: '100%',
                                maxHeight: '100%',
                                filter: getFilterString()
                            }}
                        >
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Editing"
                                className="max-w-full max-h-[80vh] object-contain block select-none pointer-events-none"
                                draggable={false}
                            />
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className={`absolute inset-0 w-full h-full touch-none ${activeTab === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                            />

                            {/* Crop Overlay */}
                            {activeTab === 'crop' && crop && (
                                <div className="absolute inset-0 pointer-events-auto">
                                    <div className="absolute inset-0 bg-black/50"></div>
                                    {/* Crop Rect */}
                                    <div
                                        className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                                        style={{
                                            left: (crop.x / (imageRef.current?.naturalWidth || 1)) * 100 + '%',
                                            top: (crop.y / (imageRef.current?.naturalHeight || 1)) * 100 + '%',
                                            width: (crop.width / (imageRef.current?.naturalWidth || 1)) * 100 + '%',
                                            height: (crop.height / (imageRef.current?.naturalHeight || 1)) * 100 + '%'
                                        }}
                                    // Simple drag implementation for demo purposes
                                    // In a real app, use a library like react-easy-crop or implement full drag/resize logic
                                    >
                                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400"></div>
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400"></div>
                                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400"></div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel (Actions) */}
                    <div className="w-20 bg-gray-800 border-l border-gray-700 flex flex-col items-center py-4 gap-4">
                        <button onClick={() => {
                            setRotation(0);
                            setFlipH(false);
                            setFlipV(false);
                            setHistory([]);
                            setHistoryStep(-1);
                            setFilters(DEFAULT_FILTERS);
                            setCrop(null);
                            const ctx = canvasRef.current?.getContext('2d');
                            if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        }} className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors" title={t('editor_reset')}>
                            <RefreshCw size={24} />
                        </button>
                        <div className="mt-auto">
                            <button onClick={handleSave} className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg shadow-green-900/20 transition-all hover:scale-105 active:scale-95" title={t('editor_save')}>
                                <Save size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
