import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Active Members
    const activeMembersCount = await prisma.member.count({
      where: { membershipStatus: 'active' },
    });

    // 2. Fees Due This Week (between now and 7 days)
    const feesDueThisWeekCount = await prisma.member.count({
      where: {
        feeDueDate: {
          gte: todayStart,
          lte: sevenDaysFromNow,
        },
      },
    });

    // 3. At-Risk Members (active members with drop_risk insight or overdue)
    const atRiskCount = await prisma.aIInsight.count({
      where: {
        type: 'drop_risk',
        createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      },
    });

    // 4. Reminders sent today
    const remindersSentTodayCount = await prisma.feeReminder.count({
      where: {
        sentAt: { gte: todayStart },
      },
    });

    // 5. Total check-ins today
    const checkInsTodayCount = await prisma.attendanceLog.count({
      where: {
        checkInTime: { gte: todayStart },
      },
    });

    res.json({
      activeMembers: activeMembersCount,
      feesDueThisWeek: feesDueThisWeekCount,
      atRiskMembers: atRiskCount,
      remindersSentToday: remindersSentTodayCount,
      checkInsToday: checkInsTodayCount,
    });
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
}

export async function getStaffList(req: Request, res: Response): Promise<void> {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve staff members.' });
  }
}

export async function createStaffMember(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, designation } = req.body;

    if (!email || !password || !name || !designation) {
      res.status(400).json({ error: 'email, password, name, and designation are required.' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'STAFF' as any,
        isEmailVerified: true,
        staff: {
          create: {
            name: name.trim(),
            designation: designation.trim(),
          },
        },
      },
      include: { staff: true },
    });

    res.status(201).json({
      message: 'Staff account created successfully.',
      staff: user.staff,
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff account.' });
  }
}

export async function getGymSettings(req: Request, res: Response): Promise<void> {
  try {
    let settings = await prisma.gymSettings.findFirst();

    if (!settings) {
      settings = await prisma.gymSettings.create({
        data: {
          id: 'default',
          gymName: 'GymMate AI — Iron & Plate Gym',
          reminderLeadTimeDays: 5,
          billingCycle: 'monthly',
          attendanceDropThreshold: 40,
          inactivityThresholdDays: 8,
          autoRemindersEnabled: true,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve gym settings.' });
  }
}

export async function updateGymSettings(req: Request, res: Response): Promise<void> {
  try {
    const {
      gymName,
      reminderLeadTimeDays,
      billingCycle,
      attendanceDropThreshold,
      inactivityThresholdDays,
      autoRemindersEnabled,
    } = req.body;

    const updated = await prisma.gymSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(gymName && { gymName }),
        ...(reminderLeadTimeDays !== undefined && { reminderLeadTimeDays: Number(reminderLeadTimeDays) }),
        ...(billingCycle && { billingCycle }),
        ...(attendanceDropThreshold !== undefined && { attendanceDropThreshold: Number(attendanceDropThreshold) }),
        ...(inactivityThresholdDays !== undefined && { inactivityThresholdDays: Number(inactivityThresholdDays) }),
        ...(autoRemindersEnabled !== undefined && { autoRemindersEnabled: Boolean(autoRemindersEnabled) }),
      },
      create: {
        id: 'default',
        gymName: gymName || 'GymMate AI — Iron & Plate Gym',
        reminderLeadTimeDays: Number(reminderLeadTimeDays || 5),
        billingCycle: billingCycle || 'monthly',
        attendanceDropThreshold: Number(attendanceDropThreshold || 40),
        inactivityThresholdDays: Number(inactivityThresholdDays || 8),
        autoRemindersEnabled: autoRemindersEnabled ?? true,
      },
    });

    res.json({ message: 'Settings updated successfully', settings: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
}
