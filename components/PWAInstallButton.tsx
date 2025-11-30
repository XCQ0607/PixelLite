import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    // if (!isVisible) return null; // Always show for debugging/layout verification

    return (
        <button
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className={`p-2 rounded-full transition-colors mr-1 ${deferredPrompt
                    ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
            title={deferredPrompt ? "Install App" : "App already installed or not available"}
        >
            <Download size={20} />
        </button>
    );
};
