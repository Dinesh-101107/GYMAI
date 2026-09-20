import { AttendanceLogRecord } from './aiInsightEngine.js';

export interface ReminderCandidate {
  memberId: string;
  name: string;
  email?: string;
  phone?: string;
  reason: 'fee_due_soon' | 'fee_overdue' | 'inactivity_gap';
  details: {
    daysLeft?: number;
    daysOverdue?: number;
    feeAmount?: number;
    daysSinceLastVisit?: number;
    averageGapDays?: number;
    suggestedTime?: string;
  };
  message: string;
}

export interface ReminderContext {
  daysLeft?: number;
  daysOverdue?: number;
  feeAmount?: number;
  daysSinceLastVisit?: number;
  averageGapDays?: number;
  preferredTime?: string;
}

/**
 * Generates warm, encouraging, non-guilt-tripping reminder copy.
 * Structured cleanly to easily plug into LLM completion in the future.
 */
export function generateReminderCopy(
  member: { name: string; feeAmount?: number },
  context: ReminderContext,
  reason: 'fee_due_soon' | 'fee_overdue' | 'inactivity_gap'
): string {
  const firstName = member.name.split(' ')[0] || 'Friend';
  const amountStr = member.feeAmount ? `₹${member.feeAmount.toLocaleString('en-IN')}` : 'your membership fee';

  switch (reason) {
    case 'fee_due_soon':
      if (context.daysLeft === 0) {
        return `Hey ${firstName}! Quick heads-up: your GymMate membership renews today (${amountStr}). Tap your member portal anytime to keep your access seamless! 💪`;
      }
      return `Hey ${firstName}! Just a friendly reminder that your GymMate membership renews in ${context.daysLeft} days (${amountStr}). Let's keep those gains going strong! 🏋️`;

    case 'fee_overdue':
      return `Hi ${firstName}, hope you're having an awesome week. Your GymMate membership renewal (${amountStr}) is ${context.daysOverdue} days past due. Whenever you're ready, you can settle it easily in your member portal or at the front desk.`;

    case 'inactivity_gap':
      const timeNote = context.preferredTime ? ` Your favorite ${context.preferredTime} window is open.` : '';
      return `Hey ${firstName}! We miss seeing you around the gym floor! We know life gets busy.${timeNote} Whenever you're ready for your next session, the barbells and coaching team are here for you! 🌟`;

    default:
      return `Hi ${firstName}, a quick friendly update from your GymMate team!`;
  }
}

/**
 * Computes average gap (in days) between consecutive visits.
 */
export function calculateAverageGap(logs: AttendanceLogRecord[]): number {
  if (!logs || logs.length < 2) return 3; // Default 3 days assumption

  const sortedTimes = logs
    .map(l => new Date(l.checkInTime).getTime())
    .sort((a, b) => a - b);

  let totalGaps = 0;
  let gapCount = 0;
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i < sortedTimes.length; i++) {
    const diffDays = (sortedTimes[i] - sortedTimes[i - 1]) / dayMs;
    if (diffDays > 0.3) { // filter multi check-ins on same day
      totalGaps += diffDays;
      gapCount++;
    }
  }

  return gapCount > 0 ? Number((totalGaps / gapCount).toFixed(1)) : 3;
}

/**
 * Evaluates whether a member warrants a reminder based on fee due dates or attendance gaps.
 */
export function evaluateMemberForReminder(
  member: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    feeAmount: number;
    feeDueDate: Date | string;
    membershipStatus: string;
  },
  logs: AttendanceLogRecord[],
  leadTimeDays: number = 5,
  referenceDate: Date = new Date()
): ReminderCandidate | null {
  const nowMs = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const dueDateMs = new Date(member.feeDueDate).getTime();
  const diffDays = Math.round((dueDateMs - nowMs) / dayMs);

  // 1. Check Overdue
  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    const context: ReminderContext = { daysOverdue, feeAmount: member.feeAmount };
    return {
      memberId: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      reason: 'fee_overdue',
      details: context,
      message: generateReminderCopy(member, context, 'fee_overdue'),
    };
  }

  // 2. Check Due within leadTimeDays
  if (diffDays <= leadTimeDays) {
    const context: ReminderContext = { daysLeft: diffDays, feeAmount: member.feeAmount };
    return {
      memberId: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      reason: 'fee_due_soon',
      details: context,
      message: generateReminderCopy(member, context, 'fee_due_soon'),
    };
  }

  // 3. Check Inactivity Gap (if active)
  if (member.membershipStatus === 'active' && logs && logs.length > 0) {
    const sortedTimes = logs
      .map(l => new Date(l.checkInTime).getTime())
      .sort((a, b) => b - a); // newest first

    const latestVisitMs = sortedTimes[0];
    const daysSinceLastVisit = Number(((nowMs - latestVisitMs) / dayMs).toFixed(1));
    const averageGapDays = calculateAverageGap(logs);

    // If member has been gone for more than 2x their average gap (and at least 7 days)
    if (daysSinceLastVisit >= Math.max(7, averageGapDays * 2)) {
      const context: ReminderContext = {
        daysSinceLastVisit,
        averageGapDays,
      };
      return {
        memberId: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        reason: 'inactivity_gap',
        details: context,
        message: generateReminderCopy(member, context, 'inactivity_gap'),
      };
    }
  }

  return null;
}
