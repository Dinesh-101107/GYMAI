export type Role = 'STAFF' | 'MEMBER';
export type MembershipStatus = 'active' | 'expired' | 'frozen';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  memberId?: string;
  staffId?: string;
  membershipStatus?: MembershipStatus;
  designation?: string;
}

export interface Member {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone: string;
  membershipStatus: MembershipStatus;
  feeAmount: number;
  feeDueDate: string;
  lastPaymentDate: string | null;
  joinDate: string;
  lastCheckIn?: string | null;
  daysUntilDue?: number;
  attendanceLogs?: AttendanceLog[];
  feeReminders?: FeeReminder[];
  aiInsights?: AIInsight[];
  bookings?: Booking[];
  latestInsight?: AIInsight | null;
}

export interface Staff {
  id: string;
  userId: string;
  name: string;
  designation: string;
  createdAt: string;
  user: {
    email: string;
  };
}

export interface AttendanceLog {
  id: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string | null;
  date: string;
  member?: {
    id: string;
    name: string;
    membershipStatus: MembershipStatus;
    phone: string;
  };
}

export interface FeeReminder {
  id: string;
  memberId: string;
  sentAt: string;
  channel: 'email' | 'sms' | 'in_app';
  message: string;
  status: 'pending' | 'sent' | 'failed';
  member?: {
    id: string;
    name: string;
    phone: string;
    membershipStatus: MembershipStatus;
  };
}

export interface AIInsight {
  id?: string;
  dbId?: string;
  memberId: string;
  memberName?: string;
  type: 'drop_risk' | 'optimal_time' | 'high_consistency' | 'new_member';
  observation: string;
  suggestedAction: string;
  timing?: string;
  confidence: number;
  createdAt?: string;
}

export interface ClassSlot {
  id: string;
  name: string;
  capacity: number;
  bookedCount: number;
  spotsRemaining: number;
  isFull: boolean;
  startTime: string;
  endTime: string;
  category: string;
  instructor: string;
  version: number;
  isBookedByMe?: boolean;
}

export interface Booking {
  id: string;
  memberId: string;
  slotId: string;
  status: 'confirmed' | 'cancelled';
  version: number;
  bookedAt: string;
  slot?: ClassSlot;
}

export interface DashboardStats {
  activeMembers: number;
  feesDueThisWeek: number;
  atRiskMembers: number;
  remindersSentToday: number;
  checkInsToday: number;
}

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

export interface GymSettings {
  id: string;
  gymName: string;
  reminderLeadTimeDays: number;
  billingCycle: string;
  attendanceDropThreshold: number;
  inactivityThresholdDays: number;
  autoRemindersEnabled: boolean;
}
