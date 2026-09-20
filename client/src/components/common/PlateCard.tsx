import React from 'react';

interface PlateCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'red' | 'green' | 'gold' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

export const PlateCard: React.FC<PlateCardProps> = ({
  children,
  className = '',
  accent = 'none',
  onClick,
  hoverable = false,
}) => {
  let accentClass = '';
  if (accent === 'red') accentClass = 'plate-card-accent-red';
  if (accent === 'green') accentClass = 'plate-card-accent-green';
  if (accent === 'gold') accentClass = 'plate-card-accent-gold';

  const hoverClass = hoverable
    ? 'hover:border-gym-red/50 hover:shadow-plate-hover cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`plate-card p-5 ${accentClass} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default PlateCard;
