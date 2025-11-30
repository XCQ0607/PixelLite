import React, { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, PenTool, Eraser, Square, Circle as CircleIcon, Type, Download, Undo, Redo } from 'lucide-react';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onSave: (newImage: string) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser' | 'rect' | 'circle'>('pen');
    const [color, setColor] = useState('#ff0000');
    const [lineWidth, setLineWidth] = useState(5);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                // Calculate aspect ratio to fit in window
                const maxWidth = window.innerWidth * 0.8;
                const maxHeight = window.innerHeight * 0.7;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    saveHistory();
                }
            };
        }
    }, [isOpen, imageSrc]);

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

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color; // Simple eraser (white)
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'pen' || tool === 'eraser') {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        // Shapes would require a temporary canvas or clearing/redrawing, keeping it simple for now
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveHistory();
        }
    };

    const handleSave = () => {
        if (canvasRef.current) {
            const newImage = canvasRef.current.toDataURL('image/png');
            onSave(newImage);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] max-w-[90vw] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Image Editor</h3>
                    <div className="flex gap-2">
                        <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"><Undo size={20} /></button>
                        <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"><Redo size={20} /></button>
                        <button onClick={onClose} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><X size={24} /></button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <div className="flex gap-2 border-r border-gray-300 dark:border-gray-600 pr-4">
                        <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><PenTool size={20} /></button>
                        <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><Eraser size={20} /></button>
                    </div>

                    <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-4">
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} className="w-24" />
                    </div>

                    <button onClick={handleSave} className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">
                        <Save size={18} /> Save Changes
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto bg-checkered p-4 flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="shadow-lg cursor-crosshair bg-transparent"
                    />
                </div>
            </div>
        </div>
    );
};
