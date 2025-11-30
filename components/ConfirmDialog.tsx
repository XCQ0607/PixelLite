import React from 'react';
import { X, AlertTriangle, HelpCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    customActions?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    }[];
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    customActions
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'confirm':
                return <HelpCircle className="text-blue-500" size={32} />;
            case 'alert':
                return <AlertTriangle className="text-amber-500" size={32} />;
            case 'info':
            default:
                return <Info className="text-blue-500" size={32} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-scale-in">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full">
                            {getIcon()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3 justify-center">
                    {customActions ? (
                        <div className="flex flex-col w-full gap-2">
                            {customActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={`w-full px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95 ${action.variant === 'secondary'
                                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                            : action.variant === 'danger'
                                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
                                                : action.variant === 'outline'
                                                    ? 'border-2 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                                                    : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30'
                                        }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="w-full px-4 py-2.5 rounded-xl font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-1"
                                >
                                    {cancelText}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {(type === 'confirm' || onCancel) && (
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {cancelText}
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all active:scale-95"
                            >
                                {confirmText}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
