import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, ShieldCheck, Clock } from 'lucide-react';
import api from '../../services/api.js';

interface RotatingQRCodeProps {
  memberId: string;
}

export const RotatingQRCode: React.FC<RotatingQRCodeProps> = ({ memberId }) => {
  const [qrToken, setQrToken] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/attendance/qr-token');
      setQrToken(res.data.token);
      setSecondsRemaining(res.data.expiresInSeconds || 60);
    } catch (err: any) {
      setError('Unable to generate secure QR token. Tap retry.');
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

  const percentLeft = (secondsRemaining / 60) * 100;

  return (
    <div className="flex flex-col items-center bg-gym-card border-2 border-gym-border rounded-2xl p-6 shadow-plate text-center max-w-sm mx-auto">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-gym-muted uppercase tracking-widest mb-3">
        <ShieldCheck className="w-4 h-4 text-gym-greenBright" />
        <span>Rotating Dynamic Check-In Key</span>
      </div>

      {/* QR Code Container with High Contrast Chalk/Plate Frame */}
      <div className="relative p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-zinc-300">
        {loading && !qrToken ? (
          <div className="w-52 h-52 flex flex-col items-center justify-center text-zinc-600">
            <RefreshCw className="w-8 h-8 animate-spin text-gym-red mb-2" />
            <span className="text-xs font-semibold">Generating Key...</span>
          </div>
        ) : error ? (
          <div className="w-52 h-52 flex flex-col items-center justify-center text-gym-red p-2 text-xs">
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
            size={208}
            level="H"
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#111114"
          />
        )}
      </div>

      {/* Expiry countdown and rotation bar */}
      <div className="w-full mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-gym-subtext">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-gym-muted" />
            <span>Regenerating in</span>
          </span>
          <span className="font-mono font-bold text-white bg-gym-plate px-2 py-0.5 rounded">
            {secondsRemaining}s
          </span>
        </div>

        {/* Dynamic progress bar */}
        <div className="w-full h-1.5 bg-gym-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsRemaining < 15 ? 'bg-gym-red' : 'bg-gym-green'
            }`}
            style={{ width: `${percentLeft}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-gym-muted mt-4">
        Hold this code against the front desk scanner to check in automatically. Codes refresh every 60s to prevent screenshot reuse.
      </p>

      {/* Manual refresh button */}
      <button
        onClick={fetchToken}
        className="mt-3 inline-flex items-center space-x-1 text-xs text-gym-muted hover:text-white transition-colors"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        <span>Force Refresh Token</span>
      </button>
    </div>
  );
};

export default RotatingQRCode;
