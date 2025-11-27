import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface ImageComparatorProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ beforeSrc, afterSrc, beforeLabel, afterLabel }) => {
  const [percentage, setPercentage] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newPercentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
      setPercentage(newPercentage);
    }
  }, []);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = useCallback(() => setIsResizing(false), []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      handleMove(e.clientX);
    }
  }, [isResizing, handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isResizing) {
      handleMove(e.touches[0].clientX);
    }
  }, [isResizing, handleMove]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-xl cursor-col-resize select-none shadow-2xl group"
      onMouseDown={(e) => {
        setIsResizing(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsResizing(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Background Image (After / Compressed) */}
      <img 
        src={afterSrc} 
        alt="Compressed" 
        className="absolute top-0 left-0 w-full h-full object-contain bg-gray-100/50 dark:bg-gray-800/50" 
        draggable={false}
      />
      
      {/* Label for After */}
      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
        {afterLabel}
      </div>

      {/* Foreground Image (Before / Original) - Clipped */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        style={{ width: `${percentage}%` }}
      >
        <img 
          src={beforeSrc} 
          alt="Original" 
          className="absolute top-0 left-0 max-w-none h-full object-contain bg-gray-100/50 dark:bg-gray-800/50" 
          // Match parent width
          style={{ width: containerRef.current?.clientWidth || '100%' }}
          draggable={false}
        />
        {/* Label for Before */}
         <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-20">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-30"
        style={{ left: `${percentage}%` }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-primary">
          <ChevronsLeftRight size={16} />
        </div>
      </div>
    </div>
  );
};