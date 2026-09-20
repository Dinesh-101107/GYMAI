import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api.js';
import { Camera, QrCode, CheckCircle2, AlertCircle, ScanLine, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MemberScannerProps {
  onCheckInSuccess?: () => void;
}

export const MemberScanner: React.FC<MemberScannerProps> = ({ onCheckInSuccess }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setStatusMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusMessage({
          type: 'error',
          text: 'Camera access is not supported in this browser. Please enter or paste the desk code below.',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable', err);
      setStatusMessage({
        type: 'error',
        text: 'Camera permission denied or camera unavailable. You can enter or paste the front-desk code below.',
      });
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleScanSubmit = async (tokenToSubmit: string) => {
    if (!tokenToSubmit.trim()) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const res = await api.post('/attendance/member-scan', {
        gymToken: tokenToSubmit.trim(),
      });

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E63946', '#2E8B57', '#F4A261'],
      });

      setStatusMessage({
        type: 'success',
        text: res.data.message || 'Check-in confirmed! Welcome to the gym.',
      });

      setManualCode('');
      stopCamera();

      if (onCheckInSuccess) {
        onCheckInSuccess();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Invalid or expired gym QR code.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gym-card border-2 border-gym-border rounded-2xl p-6 shadow-plate text-center max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between border-b border-gym-border pb-3">
        <div className="flex items-center space-x-2 text-left">
          <div className="p-2 rounded-xl bg-gym-red/10 border border-gym-red/20 text-gym-red">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Gym QR Scanner
            </h3>
            <p className="text-xs text-gym-muted">
              Scan front-desk code to log your workout
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gym-plate text-gym-greenBright border border-gym-border">
          MEMBER PASS
        </span>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 text-left ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
              : 'bg-red-950/80 text-red-300 border border-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Camera Viewfinder Container */}
      {cameraActive ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-gym-red bg-black shadow-2xl">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-64 object-cover"
          />

          {/* Viewfinder Target Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-dashed border-gym-red rounded-xl animate-pulse" />
          </div>

          <button
            onClick={stopCamera}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="py-8 px-4 bg-gym-plate/30 rounded-2xl border border-dashed border-gym-border space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gym-plate border border-gym-border flex items-center justify-center mx-auto text-gym-red shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Point Camera at Front Desk</h4>
            <p className="text-xs text-gym-muted max-w-xs mx-auto">
              Tap below to activate your smartphone camera and scan the QR code displayed by gym staff.
            </p>
          </div>

          <button
            onClick={startCamera}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
          >
            <Camera className="w-4 h-4" />
            <span>ACTIVATE CAMERA SCANNER</span>
          </button>
        </div>
      )}

      {/* Manual / Paste Desk Code Fallback */}
      <div className="pt-2 border-t border-gym-border/60 text-left space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gym-muted">
          Or Enter / Paste Desk QR Code
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste code from staff screen..."
            className="flex-grow px-3 py-2 bg-gym-darkest border border-gym-border rounded-xl text-xs font-mono text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
          />
          <button
            onClick={() => handleScanSubmit(manualCode)}
            disabled={submitting || !manualCode.trim()}
            className="px-4 py-2 rounded-xl bg-gym-green hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold tracking-wider transition-colors whitespace-nowrap shadow-glow-green"
          >
            {submitting ? 'CHECKING...' : 'CHECK IN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberScanner;
