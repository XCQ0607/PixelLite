import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, Moon, Sun, Info, X } from 'lucide-react';

interface CustomContextMenuProps {
    isDark: boolean;
    onToggleTheme: () => void;
}

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({ isDark, onToggleTheme }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();

            // Adjust position to keep menu within viewport
            let x = e.clientX;
            let y = e.clientY;

            const menuWidth = 200;
            const menuHeight = 160;

            if (x + menuWidth > window.innerWidth) x -= menuWidth;
            if (y + menuHeight > window.innerHeight) y -= menuHeight;

            setPosition({ x, y });
            setVisible(true);
        };

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };

        const handleScroll = () => {
            if (visible) setVisible(false);
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-[10000] min-w-[180px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-scale-in origin-top-left"
            style={{ top: position.y, left: position.x }}
        >
            <div className="p-1.5 space-y-1">
                <button
                    onClick={() => {
                        window.location.reload();
                        setVisible(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                    <span>Reload App</span>
                </button>

                <button
                    onClick={() => {
                        onToggleTheme();
                        setVisible(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-medium text-gray-500 dark:text-gray-400">
                        <Info size={14} />
                        <span>PixelLite Pro</span>
                    </div>
                    <span className="pl-6">v1.0.0 • by XCQ</span>
                </div>
            </div>
        </div>
    );
};
