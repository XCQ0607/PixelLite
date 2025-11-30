import { useEffect, useRef } from 'react';

export const useDynamicTitle = (
    defaultTitle: string = 'PixelLite Pro - 智能图片处理',
    hiddenTitle: string = '别走，好图还没修完呢！😭'
) => {
    const originalTitle = useRef(document.title);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                document.title = hiddenTitle;
            } else {
                document.title = defaultTitle;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.title = defaultTitle; // Restore on unmount
        };
    }, [defaultTitle, hiddenTitle]);
};
