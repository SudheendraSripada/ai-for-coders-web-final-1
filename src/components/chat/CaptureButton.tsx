import React, { useState } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface CaptureButtonProps {
  onCapture: (imageData: string) => void;
  disabled?: boolean;
}

export function CaptureButton({ onCapture, disabled }: CaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleCapture = async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      // Wait a bit for the video to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop sharing immediately after capture
      stream.getTracks().forEach(track => track.stop());
      
      setPreviewUrl(dataUrl);
      setIsOpen(true);
      setLoading(false);
      
    } catch (err) {
      console.error("Capture failed", err);
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
        onCapture(previewUrl);
        setIsOpen(false);
        setPreviewUrl(null);
    }
  };

  return (
    <>
      <button
        onClick={handleCapture}
        disabled={disabled || loading}
        title="Capture Screenshot"
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
      >
        <Camera className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-lg dark:text-white">Screenshot Preview</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    <X className="h-5 w-5" />
                </button>
            </div>
            
            <div className="p-4 overflow-auto flex-1 bg-gray-100 dark:bg-gray-900 flex justify-center">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Screenshot preview" 
                  className="max-w-full h-auto object-contain rounded border dark:border-gray-700"
                />
              )}
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
               <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
               >
                Cancel
               </button>
               <button 
                onClick={handleConfirm}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
               >
                <Check className="h-4 w-4" /> Send for Analysis
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
