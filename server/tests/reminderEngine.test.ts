import { describe, it, expect } from 'vitest';
import {
  evaluateMemberForReminder,
  generateReminderCopy,
  calculateAverageGap,
} from '../src/services/reminderEngine.js';

describe('Smart Reminder Engine', () => {
  const referenceDate = new Date('2026-09-20T12:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;

  it('should flag member when fee is due within lead time', () => {
    // Fee due in 3 days (lead time is 5 days)
    const dueDate = new Date(referenceDate.getTime() + 3 * dayMs);

    const result = evaluateMemberForReminder(
      {
        id: 'member-1',
        name: 'Elena Rostova',
        feeAmount: 65,
        feeDueDate: dueDate,
        membershipStatus: 'active',
      },
      [],
      5,
      referenceDate
    );

    expect(result).not.toBeNull();
    expect(result?.reason).toBe('fee_due_soon');
    expect(result?.details.daysLeft).toBe(3);
    expect(result?.message).toContain('renews in 3 days');
  });

  it('should flag overdue member with positive non-guilt copy', () => {
    // Fee overdue by 4 days
    const dueDate = new Date(referenceDate.getTime() - 4 * dayMs);

    const result = evaluateMemberForReminder(
      {
        id: 'member-2',
        name: 'Samira Khan',
        feeAmount: 50,
        feeDueDate: dueDate,
        membershipStatus: 'expired',
      },
      [],
      5,
      referenceDate
    );

    expect(result).not.toBeNull();
    expect(result?.reason).toBe('fee_overdue');
    expect(result?.details.daysOverdue).toBe(4);
    expect(result?.message).toContain('past due');
  });

  it('should flag member when inactivity exceeds 2x historical average gap', () => {
    // Member historical logs with ~2-day gap, but last visit was 12 days ago
    const logs = [
      { checkInTime: new Date(referenceDate.getTime() - 12 * dayMs) },
      { checkInTime: new Date(referenceDate.getTime() - 14 * dayMs) },
      { checkInTime: new Date(referenceDate.getTime() - 16 * dayMs) },
      { checkInTime: new Date(referenceDate.getTime() - 18 * dayMs) },
    ];

    const dueDateFar = new Date(referenceDate.getTime() + 25 * dayMs);

    const result = evaluateMemberForReminder(
      {
        id: 'member-3',
        name: 'Jordan Reed',
        feeAmount: 55,
        feeDueDate: dueDateFar,
        membershipStatus: 'active',
      },
      logs,
      5,
      referenceDate
    );

    expect(result).not.toBeNull();
    expect(result?.reason).toBe('inactivity_gap');
    expect(result?.message).toContain('miss seeing you');
  });

  it('should calculate inter-visit gap accurately', () => {
    const logs = [
      { checkInTime: new Date(referenceDate.getTime() - 2 * dayMs) },
      { checkInTime: new Date(referenceDate.getTime() - 5 * dayMs) },
      { checkInTime: new Date(referenceDate.getTime() - 8 * dayMs) },
    ];

    const gap = calculateAverageGap(logs);
    expect(gap).toBe(3);
  });
});
