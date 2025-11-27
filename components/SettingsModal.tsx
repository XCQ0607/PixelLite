
import React, { useState } from 'react';
import { X, Save, Wand2, Globe, Cloud, UploadCloud, DownloadCloud, Loader2, Layers, Link, Zap, Cpu, Sparkles, MessageSquare, Microscope } from 'lucide-react';
import { AppSettings } from '../types';
import { checkWebDAVConnection, createBackup } from '../services/webdavService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  t: (key: string) => string;
  onRestoreClick: () => void;
  historyForBackup: any[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, settings, onSave, t, onRestoreClick, historyForBackup 
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = React.useState<'general' | 'modes' | 'webdav'>('general');
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'failed'>('none');
  const [isBackingUp, setIsBackingUp] = useState(false);

  React.useEffect(() => {
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
      setIsChecking(false);
  };

  const handleBackup = async () => {
      if (!localSettings.webdav?.url) {
          alert(t('webdav_missing_url'));
          return;
      }
      const tag = prompt("Backup Tag:", "PixelLite");
      if (!tag) return;

      setIsBackingUp(true);
      try {
          await createBackup(localSettings.webdav, historyForBackup, localSettings, tag);
          alert(t('backup_success'));
      } catch (e: any) {
          console.error(e);
          alert("Backup Error: " + e.message);
      } finally {
          setIsBackingUp(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
                    onChange={(e) => setLocalSettings({...localSettings, language: e.target.value as 'zh' | 'en'})}
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
                    onChange={(e) => setLocalSettings({...localSettings, customApiKey: e.target.value})}
                    placeholder={process.env.API_KEY ? t('api_key_placeholder_env') : t('api_key_placeholder')}
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
                    onChange={(e) => setLocalSettings({...localSettings, customBaseUrl: e.target.value})}
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
                    onChange={(e) => setLocalSettings({...localSettings, analysisModel: e.target.value})}
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
                            onClick={() => setLocalSettings({...localSettings, defaultProcessMode: 'compress'})}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                                localSettings.defaultProcessMode === 'compress' 
                                ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <Layers size={14} /> {t('mode_compress')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocalSettings({...localSettings, defaultProcessMode: 'enhance'})}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                                localSettings.defaultProcessMode === 'enhance' 
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
                                onClick={() => setLocalSettings({...localSettings, compressionMode: 'balanced'})}
                                className={`p-2 rounded-lg border text-sm transition-all text-left ${localSettings.compressionMode === 'balanced' 
                                    ? 'bg-primary/10 border-primary text-primary' 
                                    : 'bg-white dark:bg-dark border-gray-200 dark:border-gray-700'}`}
                            >
                                <div className="font-bold text-xs">{t('mode_balanced_title')}</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocalSettings({...localSettings, compressionMode: 'strict'})}
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
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={localSettings.smartCompression} 
                                onChange={(e) => setLocalSettings({...localSettings, smartCompression: e.target.checked})}
                                className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                         </label>
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
                                    onChange={() => setLocalSettings({...localSettings, enhanceMethod: 'algorithm'})}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                 />
                                 <span className="text-sm flex items-center gap-1"><Cpu size={14}/> {t('method_algorithm')}</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input 
                                    type="radio" 
                                    name="enhanceMethod"
                                    checked={localSettings.enhanceMethod === 'ai'}
                                    onChange={() => setLocalSettings({...localSettings, enhanceMethod: 'ai'})}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                 />
                                 <span className="text-sm flex items-center gap-1"><Sparkles size={14}/> {t('method_ai')}</span>
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
                                    onChange={(e) => setLocalSettings({...localSettings, aiModel: e.target.value})}
                                    placeholder="e.g. gemini-2.5-flash-image"
                                 />
                             </div>
                             <div className="space-y-1">
                                 <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                     <MessageSquare size={12}/> {t('default_ai_prompt')}
                                 </label>
                                 <textarea 
                                    className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-dark h-20 resize-none"
                                    value={localSettings.aiPrompt}
                                    onChange={(e) => setLocalSettings({...localSettings, aiPrompt: e.target.value})}
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
                        onChange={e => setLocalSettings({...localSettings, webdav: {...(localSettings.webdav || {username:'',password:''}), url: e.target.value}})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">{t('webdav_username')}</label>
                        <input 
                            className="w-full p-2 rounded border dark:bg-dark dark:border-gray-600"
                            value={localSettings.webdav?.username || ''}
                            onChange={e => setLocalSettings({...localSettings, webdav: {...(localSettings.webdav || {url:'',password:''}), username: e.target.value}})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">{t('webdav_password')}</label>
                        <input 
                            type="password"
                            className="w-full p-2 rounded border dark:bg-dark dark:border-gray-600"
                            value={localSettings.webdav?.password || ''}
                            onChange={e => setLocalSettings({...localSettings, webdav: {...(localSettings.webdav || {url:'',username:''}), password: e.target.value}})}
                        />
                     </div>
                  </div>

                  <div className="flex gap-3 items-center pt-2">
                      <button 
                        onClick={handleWebDAVCheck}
                        disabled={isChecking}
                        className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded flex items-center gap-2"
                      >
                         {isChecking && <Loader2 size={12} className="animate-spin"/>} {t('test_connection')}
                      </button>
                      {connectionStatus === 'success' && <span className="text-xs text-green-500 font-bold">{t('connection_success')}</span>}
                      {connectionStatus === 'failed' && <span className="text-xs text-red-500 font-bold">{t('connection_failed')}</span>}
                  </div>

                  <div className="border-t dark:border-gray-700 pt-4 mt-4 grid grid-cols-2 gap-4">
                      <button 
                         onClick={handleBackup}
                         disabled={isBackingUp || !localSettings.webdav?.url}
                         className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      >
                          {isBackingUp ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18} />}
                          {t('backup_btn')}
                      </button>
                      <button 
                         onClick={() => { onClose(); onRestoreClick(); }}
                         disabled={!localSettings.webdav?.url}
                         className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      >
                          <DownloadCloud size={18} />
                          {t('restore_btn')}
                      </button>
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
    </div>
  );
};
