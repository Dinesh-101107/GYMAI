import React, { useState } from 'react';
import { Member } from '../../types/index.js';
import api from '../../services/api.js';
import { formatIndianPhone } from '../../utils/phone.js';
import { X, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';

interface ManualCheckInModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManualCheckInModal: React.FC<ManualCheckInModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !member) return null;

  const handleCheckIn = async () => {
    try {
      setSubmitting(true);
      setMessage(null);
      const res = await api.post('/attendance/check-in', {
        memberId: member.id,
        manual: true,
      });

      setMessage({ type: 'success', text: res.data.message || 'Check-in logged successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to check in member.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gym-card border-2 border-gym-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gym-muted hover:text-white hover:bg-gym-plate"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gym-red/10 border border-gym-red/20 text-gym-red flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Manual Front-Desk Check-In
            </h3>
            <p className="text-xs text-gym-muted">Verify member identity</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gym-plate/50 border border-gym-border/60 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gym-muted">Member:</span>
            <span className="font-bold text-white">{member.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gym-muted">Status:</span>
            <span className="font-mono text-xs uppercase font-bold text-gym-greenBright">
              {member.membershipStatus}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gym-muted">Mobile:</span>
            <span className="font-mono text-xs text-zinc-300">{formatIndianPhone(member.phone)}</span>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 mb-4 ${
              message.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                : 'bg-red-950/60 text-red-300 border border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-gym-subtext hover:text-white bg-gym-plate border border-gym-border"
          >
            CANCEL
          </button>
          <button
            onClick={handleCheckIn}
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-xs font-bold tracking-wider text-white bg-gym-red hover:bg-gym-redHover disabled:opacity-50 transition-colors shadow-glow-red"
          >
            {submitting ? 'CHECKING IN...' : 'CONFIRM CHECK-IN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualCheckInModal;
