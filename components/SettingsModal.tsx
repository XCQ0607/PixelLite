import React, { useState, useEffect } from 'react';
import { X, Save, Wand2, Globe, Cloud, UploadCloud, DownloadCloud, Loader2, Layers, Link, Zap, Cpu, Sparkles, MessageSquare, Microscope, Tag, Download, Upload } from 'lucide-react';
import { AppSettings, ProcessedImage } from '../types';
import { checkWebDAVConnection, createBackup, generateBackupZip, generateBackupFilename, parseBackupZip } from '../services/webdavService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
    t: (key: string) => string;
    onRestoreClick: () => void;
    historyForBackup: any[];
    onLocalRestore?: (data: { images: ProcessedImage[], settings?: AppSettings }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, settings, onSave, t, onRestoreClick, historyForBackup, onLocalRestore
}) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'modes' | 'webdav'>('general');
    const [isChecking, setIsChecking] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'failed'>('none');
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [backupTag, setBackupTag] = useState('PixelLite');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    useEffect(() => {
        setLocalSettings(settings);
        // Initialize defaults if missing
        setLocalSettings(s => ({
            ...s,
            webdav: s.webdav || { url: '', username: '', password: '' },
            customBaseUrl: s.customBaseUrl || '',
            compressionMode: s.compressionMode || 'balanced',
            defaultProcessMode: s.defaultProcessMode || 'compress',
            enhanceMethod: s.enhanceMethod || 'algorithm',
            aiModel: s.aiModel || 'gemini-2.5-flash-image',
            analysisModel: s.analysisModel || 'gemini-2.5-flash',
            aiPrompt: s.aiPrompt || 'Enhance clarity, sharpen details, maintain realistic colors. High resolution.'
        }));
    }, [settings, isOpen]);

    const handleWebDAVCheck = async () => {
        setIsChecking(true);
        setConnectionStatus('none');
        if (!localSettings.webdav?.url) {
            setIsChecking(false);
            return;
        }
        const ok = await checkWebDAVConnection(localSettings.webdav);
        setConnectionStatus(ok ? 'success' : 'failed');
        if (!ok) showToast(t('connection_failed'), 'error');
        else showToast(t('connection_success'), 'success');
        setIsChecking(false);
    };

    const handleBackup = async () => {
        if (!localSettings.webdav?.url) {
            showToast(t('webdav_missing_url'), 'error');
            return;
        }
        if (!backupTag.trim()) {
            showToast("Please enter a backup tag", 'error');
            return;
        }

        setIsBackingUp(true);
        setUploadProgress(0);
        try {
            await createBackup(
                localSettings.webdav,
                historyForBackup,
                localSettings,
                backupTag,
                (progress) => setUploadProgress(progress)
            );
            showToast(t('backup_success'), 'success');
        } catch (e: any) {
            console.error(e);
            showToast("Backup Error: " + e.message, 'error');
        } finally {
            setIsBackingUp(false);
            setUploadProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-xl z-[110] flex items-center gap-2 text-sm font-medium animate-fade-in ${toast.type === 'success' ? 'bg-green-500 text-white' :
                    toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                    {toast.type === 'success' ? <Sparkles size={16} /> : <Zap size={16} />}
                    {toast.message}
                </div>
            )}

            <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {t('settings_title')}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'general' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        {t('settings_tab_general')}
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'modes' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab('modes')}
                    >
                        {t('settings_tab_modes')}
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'webdav' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab('webdav')}
                    >
                        {t('settings_tab_webdav')}
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                    {activeTab === 'general' && (
                        <>
                            {/* Language */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Globe size={16} /> {t('language_label')}
                                </label>
                                <select
                                    value={localSettings.language}
                                    onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value as 'zh' | 'en' })}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="zh">中文 (Chinese)</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('api_key_label')}
                                </label>
                                <input
                                    type="password"
                                    value={localSettings.customApiKey}
                                    onChange={(e) => setLocalSettings({ ...localSettings, customApiKey: e.target.value })}
                                    placeholder={t('api_key_placeholder')}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('api_key_desc')}
                                </p>
                            </div>

                            {/* Base URL */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Link size={16} /> {t('api_base_url')}
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.customBaseUrl}
                                    onChange={(e) => setLocalSettings({ ...localSettings, customBaseUrl: e.target.value })}
                                    placeholder="https://generativelanguage.googleapis.com"
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* Analysis Model */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Microscope size={16} /> Analysis Model
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.analysisModel}
                                    onChange={(e) => setLocalSettings({ ...localSettings, analysisModel: e.target.value })}
                                    placeholder="gemini-2.5-flash"
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'modes' && (
                        <div className="space-y-8">
                            {/* Default Mode */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Zap size={16} /> {t('default_process_mode')}
                                </label>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setLocalSettings({ ...localSettings, defaultProcessMode: 'compress' })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${localSettings.defaultProcessMode === 'compress'
                                            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        <Layers size={14} /> {t('mode_compress')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLocalSettings({ ...localSettings, defaultProcessMode: 'enhance' })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${localSettings.defaultProcessMode === 'enhance'
                                            ? 'bg-white dark:bg-gray-600 text-blue-500 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        <Wand2 size={14} /> {t('mode_enhance')}
                                    </button>
                                </div>
                            </div>

                            {/* Compression Settings */}
                            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Layers size={16} /> {t('mode_compress')} {t('settings')}
                                </h4>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {t('mode_label')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setLocalSettings({ ...localSettings, compressionMode: 'balanced' })}
                                            className={`p-2 rounded-lg border text-sm transition-all text-left ${localSettings.compressionMode === 'balanced'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-white dark:bg-dark border-gray-200 dark:border-gray-700'}`}
                                        >
                                            <div className="font-bold text-xs">{t('mode_balanced_title')}</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLocalSettings({ ...localSettings, compressionMode: 'strict' })}
                                            className={`p-2 rounded-lg border text-sm transition-all text-left ${localSettings.compressionMode === 'strict'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-white dark:bg-dark border-gray-200 dark:border-gray-700'}`}
                                        >
                                            <div className="font-bold text-xs">{t('mode_strict_title')}</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('smart_compression')}</span>
                                    <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setLocalSettings({ ...localSettings, smartCompression: false })}
                                            className={`px-3 py-1 text-xs font-medium rounded transition-all ${!localSettings.smartCompression
                                                ? 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            关闭
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLocalSettings({ ...localSettings, smartCompression: true })}
                                            className={`px-3 py-1 text-xs font-medium rounded transition-all ${localSettings.smartCompression
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            开启
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Enhancement Settings */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-4">
                                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Wand2 size={16} /> {t('mode_enhance')} {t('settings')}
                                </h4>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('enhance_method')}</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="enhanceMethod"
                                                checked={localSettings.enhanceMethod === 'algorithm'}
                                                onChange={() => setLocalSettings({ ...localSettings, enhanceMethod: 'algorithm' })}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm flex items-center gap-1"><Cpu size={14} /> {t('method_algorithm')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="enhanceMethod"
                                                checked={localSettings.enhanceMethod === 'ai'}
                                                onChange={() => setLocalSettings({ ...localSettings, enhanceMethod: 'ai' })}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm flex items-center gap-1"><Sparkles size={14} /> {t('method_ai')}</span>
                                        </label>
                                    </div>
                                </div>

                                {localSettings.enhanceMethod === 'ai' && (
                                    <div className="space-y-3 animate-fade-in pl-1">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">{t('ai_model_name')}</label>
                                            <input
                                                className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-dark"
                                                value={localSettings.aiModel}
                                                onChange={(e) => setLocalSettings({ ...localSettings, aiModel: e.target.value })}
                                                placeholder="e.g. gemini-2.5-flash-image"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                                <MessageSquare size={12} /> {t('default_ai_prompt')}
                                            </label>
                                            <textarea
                                                className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-dark h-20 resize-none"
                                                value={localSettings.aiPrompt}
                                                onChange={(e) => setLocalSettings({ ...localSettings, aiPrompt: e.target.value })}
                                                placeholder="Enter system prompt for image enhancement..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'webdav' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                <Cloud size={14} />
                                {t('webdav_help')}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('webdav_server_url')}</label>
                                <input
                                    className="w-full p-2 rounded border dark:bg-dark dark:border-gray-600"
                                    placeholder="https://dav.example.com/backup/"
                                    value={localSettings.webdav?.url || ''}
                                    onChange={e => setLocalSettings({ ...localSettings, webdav: { ...(localSettings.webdav || { username: '', password: '' }), url: e.target.value } })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('webdav_username')}</label>
                                    <input
                                        className="w-full p-2 rounded border dark:bg-dark dark:border-gray-600"
                                        value={localSettings.webdav?.username || ''}
                                        onChange={e => setLocalSettings({ ...localSettings, webdav: { ...(localSettings.webdav || { url: '', password: '' }), username: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('webdav_password')}</label>
                                    <input
                                        type="password"
                                        className="w-full p-2 rounded border dark:bg-dark dark:border-gray-600"
                                        value={localSettings.webdav?.password || ''}
                                        onChange={e => setLocalSettings({ ...localSettings, webdav: { ...(localSettings.webdav || { url: '', username: '' }), password: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 items-center pt-2">
                                <button
                                    onClick={handleWebDAVCheck}
                                    disabled={isChecking}
                                    className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded flex items-center gap-2"
                                >
                                    {isChecking && <Loader2 size={12} className="animate-spin" />} {t('test_connection')}
                                </button>
                                {connectionStatus === 'success' && <span className="text-xs text-green-500 font-bold">{t('connection_success')}</span>}
                                {connectionStatus === 'failed' && <span className="text-xs text-red-500 font-bold">{t('connection_failed')}</span>}
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4 mt-4 space-y-4">
                                {/* Backup Tag Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Tag size={14} /> Backup Tag / Name
                                    </label>
                                    <input
                                        className="w-full p-2 rounded border dark:bg-dark dark:border-gray-600"
                                        placeholder="e.g. PixelLite_V1"
                                        value={backupTag}
                                        onChange={e => setBackupTag(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleBackup}
                                        disabled={isBackingUp || !localSettings.webdav?.url}
                                        className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                        title={!localSettings.webdav?.url ? "Configure WebDAV first" : ""}
                                    >
                                        {isBackingUp ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                                        {t('backup_btn')}
                                    </button>
                                    <button
                                        onClick={() => { onClose(); onRestoreClick(); }}
                                        disabled={!localSettings.webdav?.url}
                                        className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                                        title={!localSettings.webdav?.url ? "Configure WebDAV first" : ""}
                                    >
                                        <DownloadCloud size={18} />
                                        Manage / Restore
                                    </button>
                                </div>

                                {/* Upload Progress Bar */}
                                {isBackingUp && uploadProgress > 0 && (
                                    <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">Uploading to WebDAV...</span>
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR LOCAL</span>
                                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const zipBlob = await generateBackupZip(historyForBackup, localSettings, backupTag || 'LocalBackup');
                                                const filename = generateBackupFilename(backupTag || 'LocalBackup');
                                                const url = URL.createObjectURL(zipBlob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = filename;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                                showToast("Backup downloaded successfully", 'success');
                                            } catch (e: any) {
                                                showToast("Local backup failed: " + e.message, 'error');
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                                    >
                                        <Download size={18} />
                                        Save to Disk
                                    </button>
                                    <button
                                        onClick={() => document.getElementById('local-restore-input')?.click()}
                                        className="flex items-center justify-center gap-2 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                                    >
                                        <Upload size={18} />
                                        Load from Disk
                                    </button>
                                    <input
                                        type="file"
                                        id="local-restore-input"
                                        className="hidden"
                                        accept=".zip"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (!confirm(`Restore from ${file.name}? Current history will be merged.`)) return;

                                            try {
                                                const result = await parseBackupZip(file);
                                                if (onLocalRestore) {
                                                    onLocalRestore(result);
                                                    showToast(`Restored ${result.images.length} items successfully`, 'success');
                                                    onClose();
                                                } else {
                                                    showToast("Restore handler not connected", 'error');
                                                }
                                            } catch (err: any) {
                                                showToast("Invalid backup file: " + err.message, 'error');
                                            }
                                            e.target.value = ''; // Reset
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                    <button
                        onClick={() => {
                            onSave(localSettings);
                            onClose();
                        }}
                        className="px-4 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary/30"
                    >
                        <Save size={18} /> {t('save_settings')}
                    </button>
                </div>
            </div>
        </div >
    );
};
