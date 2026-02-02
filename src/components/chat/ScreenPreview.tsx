import React, { RefObject } from 'react';

interface ScreenPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isSharing: boolean;
}

export function ScreenPreview({ videoRef, isSharing }: ScreenPreviewProps) {
  if (!isSharing) return null;

  return (
    <div className="h-full w-full bg-black flex items-center justify-center overflow-hidden relative">
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
        Live Screen Preview
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
