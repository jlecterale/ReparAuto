'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, ArrowCounterClockwise, Warning } from '@phosphor-icons/react';
import Button from './Button';

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
  facingMode?: 'user' | 'environment';
  label?: string;
  /** Replaces the default "Alinhar no centro" guide (e.g. the 360 angle frame). */
  overlay?: React.ReactNode;
  /** Center-crop the captured photo to this aspect ratio (width / height). */
  cropAspect?: number;
  /** Keep the camera open after onCapture (multi-shot flows like guided 360). */
  keepOpenAfterCapture?: boolean;
}

export default function CameraCapture({
  onCapture,
  onClose,
  facingMode = 'environment',
  label,
  overlay,
  cropAspect,
  keepOpenAfterCapture = false,
}: Props) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async (mode: 'user' | 'environment') => {
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    
    try {
      setPermissionState('prompt');
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(newStream);
      setPermissionState('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('[Camera] Error getting media stream:', err);
      setPermissionState('denied');
    }
  };

  useEffect(() => {
    startCamera(currentFacingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentFacingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center-crop the source frame to cropAspect (when set) so the saved
        // photo matches the on-screen guide frame.
        let sx = 0;
        let sy = 0;
        let sw = video.videoWidth;
        let sh = video.videoHeight;
        if (cropAspect && sw > 0 && sh > 0) {
          if (sw / sh > cropAspect) {
            sw = Math.round(sh * cropAspect);
            sx = Math.round((video.videoWidth - sw) / 2);
          } else {
            sh = Math.round(sw / cropAspect);
            sy = Math.round((video.videoHeight - sh) / 2);
          }
        }
        canvas.width = sw;
        canvas.height = sh;

        // If front camera is active, flip horizontally to match preview mirror effect
        if (currentFacingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        // Reset scale/translate just in case
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedDataUrl(dataUrl);
      }
    }
  };

  const handleUsePhoto = () => {
    if (capturedDataUrl) {
      // Convert dataUrl to File object
      fetch(capturedDataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          if (keepOpenAfterCapture) setCapturedDataUrl(null);
        });
    }
  };

  const toggleCamera = () => {
    setCurrentFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col items-center justify-center p-4">
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full flex flex-col h-[85vh] max-h-[600px] border border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
          <span className="text-sm font-extrabold text-white">{label || 'Captura de Câmara'}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {permissionState === 'prompt' && (
            <div className="text-center p-6 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-sm font-semibold">A iniciar câmara...</p>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="text-center p-6 max-w-xs text-slate-400">
              <Warning size={40} className="text-amber-500 mx-auto mb-3" />
              <h4 className="font-extrabold text-white text-base mb-1">Acesso à Câmara Negado</h4>
              <p className="text-xs text-slate-400 mb-4">
                Por favor, ative as permissões de câmara nas definições do seu navegador para continuar.
              </p>
              <Button tipo="primario" tamanho="sm" onClick={() => startCamera(currentFacingMode)}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* With cropAspect the preview box keeps that exact aspect so the
              guide overlay outlines precisely what gets saved. */}
          {permissionState === 'granted' && !capturedDataUrl && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={cropAspect ? { aspectRatio: cropAspect } : undefined}
              className={`w-full object-cover ${cropAspect ? 'max-h-full' : 'h-full'} ${currentFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {capturedDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedDataUrl}
              alt="Captura"
              style={cropAspect ? { aspectRatio: cropAspect } : undefined}
              className={`w-full object-cover ${cropAspect ? 'max-h-full' : 'h-full'}`}
            />
          )}

          {/* Guide Overlay */}
          {permissionState === 'granted' && !capturedDataUrl && (
            overlay ?? (
              <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none m-8 rounded-xl flex items-center justify-center">
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2.5 py-1 rounded">
                  Alinhar no centro
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3 shrink-0">
          <canvas ref={canvasRef} className="hidden" />

          {permissionState === 'granted' && !capturedDataUrl && (
            <>
              <button
                onClick={toggleCamera}
                className="w-10 h-10 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition flex items-center justify-center border border-slate-700"
                title="Inverter Câmara"
              >
                <ArrowCounterClockwise size={18} />
              </button>
              <button
                onClick={handleCapture}
                className="w-14 h-14 rounded-full bg-white hover:scale-105 transition flex items-center justify-center shadow-lg border-4 border-slate-700 text-slate-950"
                title="Tirar Foto"
              >
                <Camera size={26} weight="fill" />
              </button>
              <div className="w-10" /> {/* Spacer to center the capture button */}
            </>
          )}

          {capturedDataUrl && (
            <>
              <Button
                tipo="secundario"
                icone={<ArrowCounterClockwise />}
                onClick={() => setCapturedDataUrl(null)}
                className="flex-1 !bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700"
              >
                Tirar Outra
              </Button>
              <Button
                tipo="primario"
                icone={<Check />}
                onClick={handleUsePhoto}
                className="flex-1"
              >
                Usar Foto
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
