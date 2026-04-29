import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraFacing = 'environment' | 'user';

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isReady: boolean;
  isStarting: boolean;
  error: string | null;
  facing: CameraFacing;
  hasFlashSupport: boolean;
  flashOn: boolean;
  start: () => Promise<void>;
  stop: () => void;
  toggleFacing: () => Promise<void>;
  toggleFlash: () => Promise<void>;
  capture: () => Promise<{ blob: Blob; dataUrl: string } | null>;
}

/**
 * Real-camera hook backed by getUserMedia + canvas snapshot.
 * Captures a high-quality JPEG frame from the active stream and returns
 * both a Blob (for upload) and a data URL (for preview / base64 to MedGemma).
 *
 * Why: scanner page previously rendered a fake viewfinder. This wires
 * real device hardware into the existing UI shell.
 */
export const useCamera = (): UseCameraResult => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraFacing>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);

  const stop = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
    setFlashOn(false);
  }, []);

   const startWithFacing = useCallback(async (mode: CameraFacing) => {
     setIsStarting(true);
     setError(null);
     try {
       if (!navigator.mediaDevices?.getUserMedia) {
         throw new Error('Camera API not available on this device.');
       }
       const next = await navigator.mediaDevices.getUserMedia({
         video: {
           facingMode: mode,
           width: { ideal: 1920 },
           height: { ideal: 1080 },
         },
         audio: false,
       });
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return next;
      });
      if (videoRef.current) {
        videoRef.current.srcObject = next;
        await videoRef.current.play().catch(() => undefined);
      }
      const track = next.getVideoTracks()[0];
      const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setHasFlashSupport(Boolean(caps.torch));
      setIsReady(true);
    } catch (err) {
      const name = (err as DOMException)?.name;
      const message =
        name === 'NotAllowedError' ? 'Camera permission was denied. Please enable camera access in your browser settings.'
        : name === 'NotFoundError' ? 'No camera found on this device.'
        : name === 'NotReadableError' ? 'Camera is in use by another application.'
        : (err as Error)?.message || 'Could not start the camera.';
      setError(message);
      setIsReady(false);
    } finally {
      setIsStarting(false);
    }
  }, []);

  const start = useCallback(() => startWithFacing(facing), [startWithFacing, facing]);

  const toggleFacing = useCallback(async () => {
    const next: CameraFacing = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    await startWithFacing(next);
  }, [facing, startWithFacing]);

  const toggleFlash = useCallback(async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      const want = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: want } as MediaTrackConstraintSet & { torch: boolean }] });
      setFlashOn(want);
    } catch {
      // device declined; leave flash state untouched
    }
  }, [stream, flashOn]);

  const capture = useCallback(async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    const video = videoRef.current;
    if (!video || !isReady) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    const MAX_DIM = 800;
    let scale = 1;
    if (w > MAX_DIM || h > MAX_DIM) {
      scale = MAX_DIM / Math.max(w, h);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7));
    if (!blob) return null;
    return { blob, dataUrl };
  }, [isReady]);

   useEffect(() => {
     return () => {
       stop();
      };
    }, [stop]);

  return {
    videoRef,
    stream,
    isReady,
    isStarting,
    error,
    facing,
    hasFlashSupport,
    flashOn,
    start,
    stop,
    toggleFacing,
    toggleFlash,
    capture,
  };
};
