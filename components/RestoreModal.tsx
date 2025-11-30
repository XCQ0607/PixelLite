
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, FileArchive, Download, Tag, Trash2, Archive, CheckSquare, Square } from 'lucide-react';
import { WebDAVConfig, ProcessedImage, AppSettings } from '../types';
import { listBackups, restoreBackup, deleteBackups, downloadBackupsAsZip } from '../services/webdavService';

interface RestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: WebDAVConfig;
    onRestore: (data: { images: ProcessedImage[], settings?: AppSettings }) => void;
    t: (key: string) => string; // translation function
}

export const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, onClose, config, onRestore, t }) => {
    const [backups, setBackups] = useState<{ name: string, lastModified: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && config.url) {
            loadBackups();
            setSelectedBackups(new Set());
        }
    }, [isOpen, config]);

    const loadBackups = async () => {
        console.log('[RestoreModal] Loading backups from:', config.url);
        setIsLoading(true);
        try {
            const list = await listBackups(config);
            console.log('[RestoreModal] Backups loaded:', list);
            setBackups(list);
        } catch (e) {
            console.error('[RestoreModal] Failed to load backups:', e);
            // Don't show alert, just log
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (filename: string) => {
        const confirmMsg = t('confirm_restore_backup').replace('{filename}', filename);
        if (!confirm(confirmMsg)) return;

        setIsRestoring(true);
        try {
            const result = await restoreBackup(config, filename);
            onRestore(result);
            const successMsg = t('restored_items_count').replace('{count}', result.images.length.toString());
            alert(successMsg);
            onClose();
        } catch (e: any) {
            console.error(e);
            alert(t('restore_backup_failed') + ': ' + e.message);
        } finally {
            setIsRestoring(false);
        }
    };

    const toggleSelection = (name: string) => {
        const newSet = new Set(selectedBackups);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setSelectedBackups(newSet);
    };

    const toggleAll = () => {
        if (selectedBackups.size === backups.length) {
            setSelectedBackups(new Set());
        } else {
            setSelectedBackups(new Set(backups.map(b => b.name)));
        }
    };

    const handleBatchDelete = async () => {
        const confirmMsg = t('confirm_batch_delete_backups').replace('{count}', selectedBackups.size.toString());
        if (!confirm(confirmMsg)) return;
        setIsProcessing(true);
        try {
            await deleteBackups(config, Array.from(selectedBackups));
            setSelectedBackups(new Set());
            await loadBackups();
        } catch (e: any) {
            alert(t('batch_delete_backups_failed') + ': ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchDownload = async () => {
        setIsProcessing(true);
        try {
            const zipBlob = await downloadBackupsAsZip(config, Array.from(selectedBackups));
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PixelLite_Batch_Backup_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(t('batch_download_backups_failed') + ': ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getTagFromName = (name: string) => {
        // Extract tag from filename: PixelLite_Backup_2024-11-30T12-34-56_tag.zip
        const parts = name.replace('.zip', '').split('_');
        return parts.length > 3 ? parts.slice(3).join('_') : '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Archive size={20} className="text-primary" /> {t('restore_modal_title')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadBackups}
                            disabled={isLoading}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                            title={t('refresh_list')}
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-3 border-b dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-card">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={toggleAll}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            {selectedBackups.size > 0 && selectedBackups.size === backups.length ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                            {t('select_all_backups')}
                        </button>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                            {t('backups_selected').replace('{count}', selectedBackups.size.toString())}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleBatchDownload}
                            disabled={selectedBackups.size === 0 || isProcessing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                            <span className="hidden sm:inline">Download {t('download_zip_btn')}</span>
                            <span className="sm:hidden">{t('download_zip_btn')}</span>
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            disabled={selectedBackups.size === 0 || isProcessing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            {t('batch_delete_btn')}
                        </button>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
                            <Loader2 className="animate-spin" size={32} />
                            <span>{t('fetching_backups')}</span>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            {t('no_backups_found')}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {backups.map((file) => {
                                const tag = getTagFromName(file.name);
                                const isSelected = selectedBackups.has(file.name);
                                return (
                                    <div
                                        key={file.name}
                                        className={`flex items-center justify-between p-3 border rounded-lg transition-all ${isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                                        onClick={() => toggleSelection(file.name)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                            <div onClick={(e) => { e.stopPropagation(); toggleSelection(file.name); }} className="cursor-pointer text-gray-400 hover:text-primary flex-shrink-0">
                                                {isSelected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
                                            </div>
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-blue-600 flex-shrink-0 hidden sm:block">
                                                <FileArchive size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1 mr-2">
                                                <p className="font-medium text-sm break-all" title={file.name}>
                                                    {file.name}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                                    <p className="text-xs text-gray-400 whitespace-nowrap">
                                                        {new Date(file.lastModified).toLocaleDateString()}
                                                    </p>
                                                    {tag && (
                                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded flex items-center gap-0.5 max-w-full truncate">
                                                            <Tag size={8} className="flex-shrink-0" /> {tag}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={isRestoring || isProcessing}
                                            onClick={(e) => { e.stopPropagation(); handleRestore(file.name); }}
                                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
                                            title={t('restore_backup_btn')}
                                        >
                                            {isRestoring ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                                            <span className="hidden sm:inline">{t('restore_backup_btn')}</span>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
