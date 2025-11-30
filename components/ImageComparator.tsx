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
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
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

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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
      <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-md z-20 font-medium tracking-wide shadow-lg border border-white/10 pointer-events-none select-none">
        {afterLabel}
      </div>

      {/* Label for Before - Moved OUTSIDE the clipped div to prevent clipping */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-md z-20 font-medium tracking-wide shadow-lg border border-white/10 pointer-events-none select-none">
        {beforeLabel}
      </div>

      {/* Foreground Image (Before / Original) - Clipped */}
      <div
        className="absolute top-0 left-0 h-full overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10"
        style={{ width: `${percentage}%` }}
      >
        <img
          src={beforeSrc}
          alt="Original"
          className={`absolute top-0 left-0 max-w-none h-full object-contain bg-gray-100/50 dark:bg-gray-800/50 transition-opacity duration-200 ${containerWidth ? 'opacity-100' : 'opacity-0'}`}
          // Match parent width using state
          style={{ width: containerWidth ? `${containerWidth}px` : '100%' }}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-col-resize z-30 shadow-[0_0_10px_rgba(0,0,0,0.3)] -translate-x-1/2 flex flex-col justify-center items-center"
        style={{ left: `${percentage}%` }}
      >
        <div className="w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center text-primary hover:scale-110 transition-transform duration-200">
          <ChevronsLeftRight size={16} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};