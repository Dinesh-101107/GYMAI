import { describe, it, expect } from 'vitest';
import {
  detectPatternChange,
  suggestTiming,
  buildInsight,
  AttendanceLogRecord,
} from '../src/services/aiInsightEngine.js';

describe('AI Insight Engine — Pure Functions', () => {
  const referenceDate = new Date('2026-09-20T12:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;

  it('should detect significant attendance drop (> 40%) in trailing 2 weeks', () => {
    // Generate 8-week baseline with 4 visits per week (days 15 to 70)
    // and trailing 2 weeks with only 1 visit total
    const logs: AttendanceLogRecord[] = [];

    // Baseline: 4 visits per week for 8 weeks (32 visits)
    for (let day = 15; day <= 65; day += 1.75) {
      logs.push({
        checkInTime: new Date(referenceDate.getTime() - day * dayMs),
      });
    }

    // Trailing 2 weeks: only 1 visit
    logs.push({
      checkInTime: new Date(referenceDate.getTime() - 4 * dayMs),
    });

    const result = detectPatternChange(logs, referenceDate);

    expect(result.hasDrop).toBe(true);
    expect(result.dropPercentage).toBeGreaterThanOrEqual(40);
    expect(result.isSignificant).toBe(true);
  });

  it('should not flag drop when member maintains high consistency', () => {
    const logs: AttendanceLogRecord[] = [];

    // Consistent 4 visits a week throughout the full 10 weeks
    for (let day = 1; day <= 65; day += 1.75) {
      logs.push({
        checkInTime: new Date(referenceDate.getTime() - day * dayMs),
      });
    }

    const result = detectPatternChange(logs, referenceDate);
    expect(result.hasDrop).toBe(false);
    expect(result.dropPercentage).toBe(0);
  });

  it('should infer modal workout timing accurately', () => {
    const logs: AttendanceLogRecord[] = [];

    // Simulate member who attends Tuesdays at 18:30
    // 2026-09-15 is Tuesday
    for (let i = 0; i < 20; i++) {
      const d = new Date(2026, 8, 15, 18, 30, 0); // Month 8 is September
      d.setDate(d.getDate() - i * 7);
      logs.push({ checkInTime: d });
    }

    const timing = suggestTiming(logs);
    expect(timing.preferredDays).toContain('Tuesday');
    expect(timing.preferredTimeSlot).toContain('6:00 PM');
    expect(timing.confidence).toBeGreaterThan(0.7);
  });

  it('should build structured insight for at-risk drop member', () => {
    const logs: AttendanceLogRecord[] = [];
    // 8-week baseline
    for (let day = 15; day <= 65; day += 2) {
      logs.push({ checkInTime: new Date(referenceDate.getTime() - day * dayMs) });
    }
    // Only 1 visit recently
    logs.push({ checkInTime: new Date(referenceDate.getTime() - 3 * dayMs) });

    const insight = buildInsight(
      {
        id: 'member-123',
        name: 'Jordan Reed',
        membershipStatus: 'active',
      },
      logs,
      referenceDate
    );

    expect(insight.type).toBe('drop_risk');
    expect(insight.observation).toContain('Attendance dropped');
    expect(insight.suggestedAction).toContain('motivational');
    expect(insight.confidence).toBeGreaterThan(0.7);
  });
});
