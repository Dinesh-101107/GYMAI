import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, ShieldCheck, Clock, Maximize2, Minimize2, QrCode } from 'lucide-react';
import api from '../../services/api.js';

export const FrontDeskQRCode: React.FC = () => {
  const [qrToken, setQrToken] = useState<string>('');
  const [gymName, setGymName] = useState<string>('GymMate AI Front Desk');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/attendance/gym-qr-token');
      setQrToken(res.data.token);
      setGymName(res.data.gymName);
      setSecondsRemaining(res.data.expiresInSeconds || 90);
    } catch (err: any) {
      setError('Unable to generate front-desk QR token. Tap retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      fetchToken();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, fetchToken]);

  const percentLeft = (secondsRemaining / 90) * 100;

  return (
    <div
      className={`flex flex-col items-center bg-gym-card border-2 border-gym-red/50 rounded-2xl p-6 shadow-plate text-center transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none justify-center bg-gym-darkest p-10' : 'w-full'
      }`}
    >
      {/* Header Banner */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-gym-border pb-3">
        <div className="flex items-center space-x-2 text-left">
          <div className="p-2 rounded-xl bg-red-950/60 border border-gym-red/40 text-gym-red">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-gym-red uppercase block">
              Staff Front-Desk QR Display
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {gymName}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen Kiosk' : 'Enter Fullscreen Kiosk'}
            className="p-2 rounded-lg bg-gym-plate text-gym-subtext hover:text-white border border-gym-border transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="text-xs text-gym-muted mb-4">
        Members point their smartphone camera at this screen to scan & check in.
      </p>

      {/* QR Code Container with High Contrast Plate Rim Frame */}
      <div className="relative p-5 bg-white rounded-2xl shadow-2xl flex items-center justify-center border-4 border-zinc-200">
        {loading && !qrToken ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center text-zinc-600">
            <RefreshCw className="w-8 h-8 animate-spin text-gym-red mb-2" />
            <span className="text-xs font-semibold">Generating Desk Key...</span>
          </div>
        ) : error ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center text-gym-red p-2 text-xs">
            <p className="mb-3">{error}</p>
            <button
              onClick={fetchToken}
              className="px-3 py-1.5 bg-gym-red text-white font-bold rounded shadow"
            >
              Retry
            </button>
          </div>
        ) : (
          <QRCodeSVG
            value={qrToken}
            size={isFullscreen ? 320 : 220}
            level="H"
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#0A0A0C"
          />
        )}
      </div>

      {/* Rotation Countdown Bar */}
      <div className="w-full max-w-xs mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-gym-subtext">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-gym-muted" />
            <span>Refreshes in</span>
          </span>
          <span className="font-mono font-bold text-white bg-gym-plate px-2 py-0.5 rounded border border-gym-border">
            {secondsRemaining}s
          </span>
        </div>

        <div className="w-full h-1.5 bg-gym-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsRemaining < 20 ? 'bg-gym-red' : 'bg-gym-green'
            }`}
            style={{ width: `${percentLeft}%` }}
          />
        </div>
      </div>

      {/* Manual refresh button */}
      <button
        onClick={fetchToken}
        className="mt-4 inline-flex items-center space-x-1.5 text-xs text-gym-muted hover:text-white transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Force Refresh Kiosk Token</span>
      </button>
    </div>
  );
};

export default FrontDeskQRCode;
