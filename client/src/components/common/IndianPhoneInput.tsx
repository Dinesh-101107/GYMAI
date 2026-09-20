import React from 'react';

interface IndianPhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Clean Indian Mobile Number input component with +91 prefix and 10-digit auto-formatting.
 * Produces clean E.164 formatted string (+91 98765 43210).
 */
export const IndianPhoneInput: React.FC<IndianPhoneInputProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  placeholder = '98765 43210',
}) => {
  // Extract 10 digits from incoming value (stripping +91 or non-digits)
  const extractDigits = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.startsWith('91') && clean.length > 10) {
      clean = clean.slice(2);
    }
    return clean.slice(0, 10);
  };

  const digits = extractDigits(value);

  // Format as XXXXX XXXXX for display
  const formatDisplay = (d: string) => {
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)} ${d.slice(5)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    const formattedE164 = raw ? `+91 ${formatDisplay(raw)}` : '';
    onChange(formattedE164);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Locked +91 India Prefix */}
      <div className="absolute left-3 flex items-center space-x-1.5 pointer-events-none text-xs font-bold text-gym-subtext select-none border-r border-gym-border/80 pr-2.5">
        <span className="text-base leading-none">🇮🇳</span>
        <span className="font-mono text-white">+91</span>
      </div>

      <input
        type="tel"
        inputMode="numeric"
        required={required}
        disabled={disabled}
        value={formatDisplay(digits)}
        onChange={handleInputChange}
        placeholder={placeholder}
        pattern="[6-9][0-9]{4}\s?[0-9]{5}"
        title="Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
        className="w-full pl-24 pr-4 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm font-mono text-white placeholder-gym-muted focus:outline-none focus:border-gym-red disabled:opacity-50"
      />
    </div>
  );
};

export default IndianPhoneInput;
