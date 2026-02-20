import { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanning() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current || cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const decodeOnce = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const result = await reader.decodeOnceFromVideoElement(videoRef.current);
            if (result && !cancelled) {
              onDetected(result.getText());
            }
          } catch {
            // No barcode found in frame, retry
            if (!cancelled) {
              requestAnimationFrame(decodeOnce);
            }
          }
        };

        decodeOnce();
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Camera access denied');
        }
      }
    }

    startScanning();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="rpg-card p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-accent-gold font-bold">Scan Barcode</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">
            &times;
          </button>
        </div>
        {error ? (
          <div className="text-accent-red text-center py-8">
            <p>{error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-bg-hover rounded-lg text-text-primary">
              Close
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border-2 border-accent-gold/50 rounded-lg" />
            </div>
            <p className="text-text-muted text-sm text-center mt-2">
              Point camera at barcode
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
