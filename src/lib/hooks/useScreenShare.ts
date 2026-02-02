import { useState, useRef, useCallback, useEffect } from 'react';

export function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsSharing(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const startScreenShare = useCallback(async () => {
    setError(null);
    try {
      // @ts-expect-error - cursor property is not standard in MediaTrackConstraints but supported by some browsers
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: false
      });
      
      setStream(mediaStream);
      setIsSharing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Handle user stopping via browser UI
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (err) {
      console.error("Error sharing screen:", err);
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
              setError("Permission denied. Please allow screen sharing to proceed.");
          } else {
              setError(err.message);
          }
      } else {
          setError("Failed to share screen.");
      }
      setIsSharing(false);
    }
  }, [stopScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);

  return {
    stream,
    isSharing,
    error,
    startScreenShare,
    stopScreenShare,
    videoRef
  };
}
