import React from 'react';
import { MembershipStatus } from '../../types/index.js';

interface ChalkBadgeProps {
  status?: MembershipStatus | string;
  daysUntilDue?: number;
  size?: 'sm' | 'md';
}

export const ChalkBadge: React.FC<ChalkBadgeProps> = ({ status = 'active', daysUntilDue, size = 'md' }) => {
  const normalized = status.toLowerCase();

  let tagClass = 'chalk-tag-active';
  let label = 'ACTIVE';

  if (normalized === 'expired') {
    tagClass = 'chalk-tag-expired';
    label = 'EXPIRED';
  } else if (normalized === 'frozen') {
    tagClass = 'chalk-tag-frozen';
    label = 'FROZEN';
  } else if (daysUntilDue !== undefined && daysUntilDue <= 3 && daysUntilDue >= 0) {
    tagClass = 'chalk-tag-frozen';
    label = `DUE IN ${daysUntilDue}D`;
  } else if (daysUntilDue !== undefined && daysUntilDue < 0) {
    tagClass = 'chalk-tag-expired';
    label = `OVERDUE (${Math.abs(daysUntilDue)}D)`;
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`chalk-tag ${tagClass} ${paddingClass} font-mono font-bold tracking-wider rounded border transition-all duration-150 shadow-sm`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};

export default ChalkBadge;
