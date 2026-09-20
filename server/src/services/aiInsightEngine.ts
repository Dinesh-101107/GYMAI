export interface AttendanceLogRecord {
  id?: string;
  checkInTime: Date | string;
  checkOutTime?: Date | string | null;
  date?: Date | string;
}

export interface MemberRecord {
  id: string;
  name: string;
  membershipStatus: string;
  feeDueDate?: Date | string;
}

export interface PatternChangeResult {
  hasDrop: boolean;
  dropPercentage: number;
  baselineWeeklyAverage: number;
  recentWeeklyAverage: number;
  isSignificant: boolean;
}

export interface SuggestedTimingResult {
  preferredDays: string[];
  preferredTimeSlot: string;
  confidence: number;
  totalAnalyzed: number;
}

export interface AIInsightOutput {
  type: 'drop_risk' | 'optimal_time' | 'high_consistency' | 'new_member';
  observation: string;
  suggestedAction: string;
  timing: string;
  confidence: number;
}

/**
 * Compares trailing 2-week attendance frequency against preceding 8-week baseline.
 * Flags if attendance drops by more than 40%.
 */
export function detectPatternChange(
  logs: AttendanceLogRecord[],
  referenceDate: Date = new Date()
): PatternChangeResult {
  if (!logs || logs.length === 0) {
    return {
      hasDrop: false,
      dropPercentage: 0,
      baselineWeeklyAverage: 0,
      recentWeeklyAverage: 0,
      isSignificant: false,
    };
  }

  const nowMs = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const twoWeeksMs = 14 * dayMs;
  const tenWeeksMs = 70 * dayMs;

  let recentCount = 0;
  let baselineCount = 0;

  for (const log of logs) {
    const logTime = new Date(log.checkInTime).getTime();
    const ageMs = nowMs - logTime;

    if (ageMs < 0) continue; // Future logs ignored

    if (ageMs <= twoWeeksMs) {
      recentCount++;
    } else if (ageMs <= tenWeeksMs) {
      baselineCount++;
    }
  }

  // Trailing 2 weeks is 2 weeks duration
  const recentWeeklyAverage = Number((recentCount / 2).toFixed(1));
  // Preceding baseline is 8 weeks (weeks 3 through 10)
  const baselineWeeklyAverage = Number((baselineCount / 8).toFixed(1));

  // If baseline had fewer than 1 visit per 2 weeks (0.5/wk), drop is not statistically significant
  if (baselineWeeklyAverage < 0.8) {
    return {
      hasDrop: false,
      dropPercentage: 0,
      baselineWeeklyAverage,
      recentWeeklyAverage,
      isSignificant: false,
    };
  }

  if (recentWeeklyAverage >= baselineWeeklyAverage) {
    return {
      hasDrop: false,
      dropPercentage: 0,
      baselineWeeklyAverage,
      recentWeeklyAverage,
      isSignificant: true,
    };
  }

  const rawDrop = ((baselineWeeklyAverage - recentWeeklyAverage) / baselineWeeklyAverage) * 100;
  const dropPercentage = Math.round(Math.max(0, Math.min(100, rawDrop)));
  const hasDrop = dropPercentage >= 40;

  return {
    hasDrop,
    dropPercentage,
    baselineWeeklyAverage,
    recentWeeklyAverage,
    isSignificant: true,
  };
}

/**
 * Infers the usual day-of-week and time slot from check-in history using statistical mode.
 */
export function suggestTiming(logs: AttendanceLogRecord[]): SuggestedTimingResult {
  if (!logs || logs.length === 0) {
    return {
      preferredDays: ['Flexible'],
      preferredTimeSlot: 'Open Hours',
      confidence: 0,
      totalAnalyzed: 0,
    };
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const hourCounts: Record<number, number> = {};

  for (const log of logs) {
    const date = new Date(log.checkInTime);
    const day = date.getDay();
    const hour = date.getHours();

    dayCounts[day] = (dayCounts[day] || 0) + 1;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  // Find top days that exceed 18% of total visits
  const total = logs.length;
  const sortedDays = Object.entries(dayCounts)
    .map(([day, count]) => ({ day: Number(day), count }))
    .sort((a, b) => b.count - a.count);

  const topDays = sortedDays
    .filter(d => d.count > 0 && d.count / total >= 0.18)
    .slice(0, 3)
    .map(d => dayNames[d.day]);

  const preferredDays = topDays.length > 0 ? topDays : [dayNames[sortedDays[0].day]];

  // Find modal hour
  const sortedHours = Object.entries(hourCounts)
    .map(([h, c]) => ({ hour: Number(h), count: c }))
    .sort((a, b) => b.count - a.count);

  let preferredTimeSlot = 'Evening (18:00 - 19:30)';
  let maxHour = sortedHours.length > 0 ? sortedHours[0].hour : 18;

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${period}`;
  };

  preferredTimeSlot = `${formatHour(maxHour)} – ${formatHour((maxHour + 1) % 24)}`;

  // Confidence calculation based on consistency and sample size
  const modalHourRatio = sortedHours.length > 0 ? sortedHours[0].count / total : 0;
  const sampleConfidence = Math.min(1, total / 15);
  const confidence = Number((Math.min(0.98, modalHourRatio * 0.5 + sampleConfidence * 0.5)).toFixed(2));

  return {
    preferredDays,
    preferredTimeSlot,
    confidence,
    totalAnalyzed: total,
  };
}

/**
 * Builds structured, testable, human-friendly insight from member and log history.
 */
export function buildInsight(
  member: MemberRecord,
  logs: AttendanceLogRecord[],
  referenceDate: Date = new Date()
): AIInsightOutput {
  const pattern = detectPatternChange(logs, referenceDate);
  const timing = suggestTiming(logs);
  const timingSummary = `${timing.preferredDays.join(' & ')} around ${timing.preferredTimeSlot}`;

  if (logs.length < 3) {
    return {
      type: 'new_member',
      observation: `${member.name} joined recently with ${logs.length} logged workout sessions so far.`,
      suggestedAction: 'Offer an introductory equipment walk-through and coach check-in to build early consistency.',
      timing: 'Flexible morning or evening',
      confidence: 0.75,
    };
  }

  if (pattern.hasDrop) {
    return {
      type: 'drop_risk',
      observation: `Attendance dropped by ${pattern.dropPercentage}% over the last 2 weeks (from ${pattern.baselineWeeklyAverage} visits/wk down to ${pattern.recentWeeklyAverage} visits/wk).`,
      suggestedAction: `Send a low-pressure motivational check-in suggesting their preferred workout window (${timingSummary}).`,
      timing: timingSummary,
      confidence: Number((0.75 + (pattern.dropPercentage / 200)).toFixed(2)),
    };
  }

  if (pattern.recentWeeklyAverage >= 3.5) {
    return {
      type: 'high_consistency',
      observation: `Exceptional consistency: ${pattern.recentWeeklyAverage} visits per week over the last 14 days!`,
      suggestedAction: 'Congratulate them on maintaining high momentum or invite them to advanced barbell / HIIT challenges.',
      timing: timingSummary,
      confidence: 0.95,
    };
  }

  return {
    type: 'optimal_time',
    observation: `High adherence observed on ${timing.preferredDays.join(', ')} sessions. Usual arrival: ${timing.preferredTimeSlot}.`,
    suggestedAction: `Ensure class capacity or rack reservation for their peak workout windows.`,
    timing: timingSummary,
    confidence: timing.confidence,
  };
}
