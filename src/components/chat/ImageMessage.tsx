import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ImageMessageProps {
  imageUrl: string;
}

export function ImageMessage({ imageUrl }: ImageMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="relative group max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <img 
          src={imageUrl} 
          alt="Captured screenshot" 
          className="w-full h-auto cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => setIsExpanded(true)}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-7xl w-full max-h-full flex flex-col">
            <div className="flex justify-end p-2">
                 <button 
                    className="text-white hover:text-gray-300"
                    onClick={() => setIsExpanded(false)}
                >
                    <X className="h-8 w-8" />
                </button>
            </div>
            <div className="flex-1 overflow-auto flex justify-center items-center">
                 <img 
                  src={imageUrl} 
                  alt="Captured screenshot full size" 
                  className="max-w-full max-h-[85vh] object-contain"
                />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
