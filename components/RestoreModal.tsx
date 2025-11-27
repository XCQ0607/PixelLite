
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, FileArchive, Download, Tag } from 'lucide-react';
import { WebDAVConfig, ProcessedImage, AppSettings } from '../types';
import { listBackups, restoreBackup } from '../services/webdavService';

interface RestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: WebDAVConfig;
    onRestore: (data: { images: ProcessedImage[], settings?: AppSettings }) => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, onClose, config, onRestore }) => {
    const [backups, setBackups] = useState<{name: string, lastModified: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (isOpen && config.url) {
            loadBackups();
        }
    }, [isOpen, config]);

    const loadBackups = async () => {
        setIsLoading(true);
        try {
            const list = await listBackups(config);
            setBackups(list);
        } catch (e) {
            alert("Failed to load backups. Check config.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`Are you sure you want to restore ${filename}? It will merge with current history.`)) return;
        
        setIsRestoring(true);
        try {
            const result = await restoreBackup(config, filename);
            onRestore(result);
            alert(`Restored ${result.images.length} items successfully.`);
            onClose();
        } catch (e: any) {
            console.error(e);
            alert("Restore failed: " + e.message);
        } finally {
            setIsRestoring(false);
        }
    };

    const getTagFromName = (name: string) => {
        // Format: PixelLite_Backup_DATE_[TAG].zip
        const match = name.match(/\[(.*?)\]/);
        return match ? match[1] : '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold flex items-center gap-2">
                        <RefreshCw size={18}/> Restore Backup
                    </h3>
                    <button onClick={onClose}><X size={20}/></button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
                            <Loader2 className="animate-spin" size={32} />
                            <span>Fetching backups...</span>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            No backups found in remote directory.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {backups.map((file) => {
                                const tag = getTagFromName(file.name);
                                return (
                                <div key={file.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-blue-600">
                                            <FileArchive size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate text-sm" title={file.name}>{file.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-gray-400">{new Date(file.lastModified).toLocaleDateString()}</p>
                                                {tag && (
                                                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded flex items-center gap-0.5">
                                                        <Tag size={8}/> {tag}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        disabled={isRestoring}
                                        onClick={() => handleRestore(file.name)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-full"
                                        title="Restore this backup"
                                    >
                                        {isRestoring ? <Loader2 className="animate-spin" size={18}/> : <Download size={18} />}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
