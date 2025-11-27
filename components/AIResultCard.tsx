import React from 'react';
import { Sparkles, Tag } from 'lucide-react';
import { AIData } from '../types';

interface AIResultCardProps {
  data: AIData;
  className?: string;
  t?: (key: string) => string;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({ data, className = '', t }) => {
  const tagColors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  ];

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm ${className}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-inner text-white flex-shrink-0">
          <Sparkles size={16} />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
          {data.description}
        </p>
      </div>
      
      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center text-xs text-gray-400 mr-1">
            <Tag size={12} className="mr-1" /> {t ? t('tags_label') : 'Tags'}:
          </div>
          {data.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tagColors[idx % tagColors.length]}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};