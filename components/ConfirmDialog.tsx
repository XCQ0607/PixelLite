import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    type = 'confirm',
    confirmText = '确定',
    cancelText = '取消',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'alert':
                return <AlertTriangle size={48} className="text-amber-500" />;
            case 'info':
                return <Info size={48} className="text-blue-500" />;
            default:
                return <CheckCircle size={48} className="text-green-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in">
                <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {getIcon()}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                        </div>
                        {type === 'alert' && (
                            <button
                                onClick={onCancel}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed pl-16">
                        {message}
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
                    {type === 'confirm' && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${type === 'alert'
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : type === 'info'
                                    ? 'bg-blue-500 hover:bg-blue-600'
                                    : 'bg-primary hover:bg-primary/90'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
