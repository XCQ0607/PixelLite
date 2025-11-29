import React, { useState, useEffect } from 'react';
import { X, Settings, Download, Upload, Trash2, Check, AlertCircle, Loader2, Tag, CheckSquare, Square } from 'lucide-react';
import { AppSettings, WebDAVConfig, ProcessedImage } from '../types';
import { checkWebDAVConnection, listBackups, createBackup, restoreBackup, deleteBackups, downloadBackups } from '../services/webdavService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (newSettings: AppSettings) => void;
    history: ProcessedImage[];
    onRestoreHistory: (history: ProcessedImage[], settings?: AppSettings) => void;
}

interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    history,
    onRestoreHistory
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'webdav'>('general');
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig>(settings.webdav || {
        url: '',
        username: '',
        password: ''
    });
    const [isChecking, setIsChecking] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
    const [backups, setBackups] = useState<{ name: string, lastModified: string }[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupTag, setBackupTag] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);

    // New State for Advanced Features
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set());
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
        if (settings.webdav) {
            setWebdavConfig(settings.webdav);
        }
    }, [settings]);

    useEffect(() => {
        if (isOpen && activeTab === 'webdav' && webdavConfig.url) {
            loadBackups();
        }
    }, [isOpen, activeTab]);

    const addToast = (type: 'success' | 'error' | 'info', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const handleSave = () => {
        onUpdateSettings({
            ...localSettings,
            webdav: webdavConfig
        });
        onClose();
    };

    const handleWebDAVCheck = async () => {
        setIsChecking(true);
        setConnectionStatus('none');
        try {
            const success = await checkWebDAVConnection(webdavConfig);
            setConnectionStatus(success ? 'success' : 'error');
            if (success) {
                addToast('success', 'Connection successful');
                loadBackups();
            } else {
                addToast('error', 'Connection failed');
            }
        } catch (error) {
            setConnectionStatus('error');
            addToast('error', 'Connection error');
        } finally {
            setIsChecking(false);
        }
    };

    const loadBackups = async (force = false) => {
        setIsLoadingBackups(true);
        try {
            const list = await listBackups(webdavConfig, force);
            setBackups(list);
            setSelectedBackups(new Set()); // Clear selection on reload
        } catch (error) {
            console.error("Failed to load backups", error);
        } finally {
            setIsLoadingBackups(false);
        }
    };

    const handleBackup = async () => {
        if (!backupTag.trim()) {
            addToast('error', 'Please enter a backup tag');
            return;
        }

        setIsBackingUp(true);
        setUploadProgress(0);
        try {
            await createBackup(webdavConfig, history, localSettings, backupTag, (progress) => {
                setUploadProgress(progress);
            });
            addToast('success', 'Backup created successfully');
            setBackupTag('');
            setUploadProgress(0);
            loadBackups(true); // Force refresh list
        } catch (error: any) {
            addToast('error', `Backup failed: ${error.message}`);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`Restore backup "${filename}"? Current history will be replaced.`)) return;

        setIsRestoring(true);
        try {
            const { images, settings: restoredSettings } = await restoreBackup(webdavConfig, filename);
            onRestoreHistory(images, restoredSettings);
            addToast('success', 'Backup restored successfully');
            onClose();
        } catch (error: any) {
            addToast('error', `Restore failed: ${error.message}`);
        } finally {
            setIsRestoring(false);
        }
    };

    // Batch Operations
    const toggleBackupSelection = (filename: string) => {
        const newSelection = new Set(selectedBackups);
        if (newSelection.has(filename)) {
            newSelection.delete(filename);
        } else {
            newSelection.add(filename);
        }
        setSelectedBackups(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedBackups.size === backups.length) {
            setSelectedBackups(new Set());
        } else {
            setSelectedBackups(new Set(backups.map(b => b.name)));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedBackups.size === 0) return;
        if (!confirm(`Delete ${selectedBackups.size} backups? This cannot be undone.`)) return;

        setIsBatchProcessing(true);
        try {
            await deleteBackups(webdavConfig, Array.from(selectedBackups));
            addToast('success', 'Backups deleted');
            loadBackups(true);
        } catch (error: any) {
            addToast('error', `Delete failed: ${error.message}`);
        } finally {
            setIsBatchProcessing(false);
        }
    };

    const handleBatchDownload = async () => {
        if (selectedBackups.size === 0) return;

        setIsBatchProcessing(true);
        try {
            await downloadBackups(webdavConfig, Array.from(selectedBackups));
            addToast('success', 'Download started');
        } catch (error: any) {
            addToast('error', `Download failed: ${error.message}`);
        } finally {
            setIsBatchProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            {/* Toast Container */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className={`
                        px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right fade-in duration-300
                        ${toast.type === 'success' ? 'bg-green-500 text-white' :
                            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}
                    `}>
                        {toast.message}
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors
                            ${activeTab === 'general'
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('webdav')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors
                            ${activeTab === 'webdav'
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        WebDAV Backup
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Theme
                                </label>
                                <select
                                    value={localSettings.theme}
                                    onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                            {/* Add more general settings here */}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WebDAV URL</label>
                                    <input
                                        type="text"
                                        value={webdavConfig.url}
                                        onChange={(e) => setWebdavConfig({ ...webdavConfig, url: e.target.value })}
                                        placeholder="https://dav.example.com/"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={webdavConfig.username}
                                            onChange={(e) => setWebdavConfig({ ...webdavConfig, username: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={webdavConfig.password}
                                            onChange={(e) => setWebdavConfig({ ...webdavConfig, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleWebDAVCheck}
                                        disabled={isChecking}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                        Test Connection
                                    </button>
                                    {connectionStatus === 'success' && <span className="text-green-500 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Connected</span>}
                                    {connectionStatus === 'error' && <span className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" /> Failed</span>}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Backup & Restore</h3>

                                <div className="flex gap-2 mb-6">
                                    <div className="flex-1 relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Backup Tag (e.g. 'Before Update')"
                                            value={backupTag}
                                            onChange={(e) => setBackupTag(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleBackup}
                                        disabled={isBackingUp || !webdavConfig.url}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Create Backup
                                    </button>
                                </div>

                                {isBackingUp && uploadProgress > 0 && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            <span>Uploading...</span>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Backups</h4>
                                        <div className="flex gap-2">
                                            {selectedBackups.size > 0 && (
                                                <>
                                                    <button
                                                        onClick={handleBatchDownload}
                                                        disabled={isBatchProcessing}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        title="Download Selected"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleBatchDelete}
                                                        disabled={isBatchProcessing}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Delete Selected"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => loadBackups(true)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>

                                    {isLoadingBackups ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading backups...
                                        </div>
                                    ) : backups.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                            No backups found
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
                                            {/* Header Row for Select All */}
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-3">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    {selectedBackups.size === backups.length && backups.length > 0 ? (
                                                        <CheckSquare className="w-4 h-4" />
                                                    ) : (
                                                        <Square className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    {selectedBackups.size} selected
                                                </span>
                                            </div>

                                            {backups.map((backup) => (
                                                <div key={backup.name} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <button
                                                            onClick={() => toggleBackupSelection(backup.name)}
                                                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0"
                                                        >
                                                            {selectedBackups.has(backup.name) ? (
                                                                <CheckSquare className="w-4 h-4 text-blue-500" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate" title={backup.name}>
                                                                {backup.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {backup.lastModified}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => handleRestore(backup.name)}
                                                            disabled={isRestoring || isBatchProcessing}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                            title="Restore"
                                                        >
                                                            <Upload className="w-4 h-4 rotate-180" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
