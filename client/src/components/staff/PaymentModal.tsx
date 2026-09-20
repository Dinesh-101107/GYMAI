import React, { useState } from 'react';
import { Member } from '../../types/index.js';
import api from '../../services/api.js';
import { X, IndianRupee, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !member) return null;

  const totalAmount = (member.feeAmount * months).toFixed(2);

  const handlePayment = async () => {
    try {
      setSubmitting(true);
      setMessage(null);
      const res = await api.post(`/members/${member.id}/payment`, { months });

      // Trigger celebratory confetti for renewing member!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E63946', '#2E8B57', '#F4A261'],
      });

      setMessage({ type: 'success', text: res.data.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to record payment.',
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
          <div className="w-10 h-10 rounded-xl bg-gym-green/20 border border-gym-green/40 text-gym-greenBright flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Record Membership Fee Payment
            </h3>
            <p className="text-xs text-gym-muted">Updates due date and unlocks active status</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gym-plate/50 border border-gym-border/60 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gym-muted">Member:</span>
            <span className="font-bold text-white">{member.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gym-muted">Current Due:</span>
            <span className="font-mono text-xs text-zinc-300">
              {new Date(member.feeDueDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gym-muted">Monthly Rate:</span>
            <span className="font-mono text-xs text-gym-greenBright font-bold">
              ₹{member.feeAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Duration selection */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-2">
            Renewal Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  months === m
                    ? 'bg-gym-red text-white border-gym-red shadow-sm'
                    : 'bg-gym-plate text-gym-subtext border-gym-border hover:text-white'
                }`}
              >
                {m} {m === 1 ? 'Month' : 'Months'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-gym-darkest border border-gym-border/80 mb-5">
          <span className="text-xs font-bold text-gym-muted uppercase">Total Paid:</span>
          <span className="font-display text-2xl text-gym-greenBright tracking-wider">
            ₹{Number(totalAmount).toLocaleString('en-IN')}
          </span>
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
            onClick={handlePayment}
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-xs font-bold tracking-wider text-white bg-gym-green hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-glow-green"
          >
            {submitting ? 'PROCESSING...' : 'RECORD PAYMENT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
