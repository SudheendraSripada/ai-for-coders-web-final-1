import React from 'react';
import { Monitor, X } from 'lucide-react';

interface ScreenShareButtonProps {
  isSharing: boolean;
  onStartShare: () => void;
  onStopShare: () => void;
  disabled?: boolean;
}

export function ScreenShareButton({ isSharing, onStartShare, onStopShare, disabled }: ScreenShareButtonProps) {
  return (
    <button
      onClick={isSharing ? onStopShare : onStartShare}
      disabled={disabled}
      title={isSharing ? "Stop Sharing" : "Share Screen"}
      className={`p-2 rounded-md transition-colors ${
        isSharing 
          ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" 
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      } disabled:opacity-50`}
    >
      {isSharing ? <X className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
    </button>
  );
}
