import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { generateGymCheckInToken, verifyGymCheckInToken } from '../services/qrService.js';
import { broadcastCheckIn } from '../socket/index.js';

/**
 * Staff-only endpoint: Generates the active Gym Check-In QR token
 * displayed at the front-desk/turnstile for members to scan.
 */
export async function getGymQRToken(req: Request, res: Response): Promise<void> {
  try {
    const gymSettings = await prisma.gymSettings.findFirst();
    const facilityId = gymSettings?.id || 'gymmate_main_hq';
    const qrData = generateGymCheckInToken(facilityId);

    res.json({
      ...qrData,
      gymName: gymSettings?.gymName || 'GymMate AI',
    });
  } catch (error) {
    console.error('Error generating gym QR token:', error);
    res.status(500).json({ error: 'Failed to generate front-desk QR token.' });
  }
}

/**
 * Member-only endpoint: Member scans the Staff/Gym QR code on their device.
 */
export async function memberScanCheckIn(req: Request, res: Response): Promise<void> {
  try {
    const memberId = req.user?.memberId;
    if (!memberId) {
      res.status(403).json({ error: 'Only registered members can perform mobile QR check-ins.' });
      return;
    }

    const { gymToken } = req.body;
    if (!gymToken) {
      res.status(400).json({ error: 'Gym QR token payload is required.' });
      return;
    }

    // Verify gym QR code
    const verification = verifyGymCheckInToken(gymToken);
    if (!verification.valid) {
      res.status(400).json({
        error: verification.error || 'Invalid or expired gym QR code.',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      res.status(404).json({ error: 'Member record not found.' });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Prevent duplicate check-in within last 10 minutes
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentDuplicate = await prisma.attendanceLog.findFirst({
      where: {
        memberId: member.id,
        checkInTime: { gte: tenMinutesAgo },
      },
    });

    if (recentDuplicate) {
      res.status(409).json({
        error: `You already checked in at ${recentDuplicate.checkInTime.toLocaleTimeString()}. Enjoy your workout!`,
        log: recentDuplicate,
      });
      return;
    }

    const log = await prisma.attendanceLog.create({
      data: {
        memberId: member.id,
        checkInTime: now,
        date: todayStart,
      },
    });

    // Broadcast live check-in event to staff console via WebSocket
    broadcastCheckIn({
      id: log.id,
      memberId: member.id,
      memberName: member.name,
      checkInTime: log.checkInTime,
      membershipStatus: member.membershipStatus,
      phone: member.phone || undefined,
      method: 'QR_SCAN',
    });

    res.status(201).json({
      message: `Check-in confirmed! Welcome, ${member.name}. Have a killer workout! 💪`,
      log,
      member: {
        id: member.id,
        name: member.name,
        membershipStatus: member.membershipStatus,
      },
    });
  } catch (error) {
    console.error('Member QR scan check-in error:', error);
    res.status(500).json({ error: 'Internal server error during mobile scan check-in.' });
  }
}

/**
 * Staff manual check-in fallback
 */
export async function manualCheckIn(req: Request, res: Response): Promise<void> {
  try {
    const { memberId } = req.body;

    if (!memberId) {
      res.status(400).json({ error: 'Member ID is required.' });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentDuplicate = await prisma.attendanceLog.findFirst({
      where: {
        memberId: member.id,
        checkInTime: { gte: tenMinutesAgo },
      },
    });

    if (recentDuplicate) {
      res.status(409).json({
        error: `${member.name} already checked in at ${recentDuplicate.checkInTime.toLocaleTimeString()}.`,
        log: recentDuplicate,
      });
      return;
    }

    const log = await prisma.attendanceLog.create({
      data: {
        memberId: member.id,
        checkInTime: now,
        date: todayStart,
      },
    });

    broadcastCheckIn({
      id: log.id,
      memberId: member.id,
      memberName: member.name,
      checkInTime: log.checkInTime,
      membershipStatus: member.membershipStatus,
      phone: member.phone || undefined,
      method: 'MANUAL',
    });

    res.status(201).json({
      message: `Manual check-in logged for ${member.name}.`,
      log,
      member: {
        id: member.id,
        name: member.name,
        membershipStatus: member.membershipStatus,
      },
    });
  } catch (error) {
    console.error('Manual check-in error:', error);
    res.status(500).json({ error: 'Internal server error during manual check-in.' });
  }
}

export async function getRecentCheckIns(req: Request, res: Response): Promise<void> {
  try {
    const logs = await prisma.attendanceLog.findMany({
      take: 25,
      orderBy: { checkInTime: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            membershipStatus: true,
            phone: true,
          },
        },
      },
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance feed.' });
  }
}

export async function getMemberAttendanceStats(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const targetMemberId = req.user?.role === 'STAFF' ? id : req.user?.memberId;

    if (!targetMemberId) {
      res.status(400).json({ error: 'Member ID required' });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await prisma.attendanceLog.findMany({
      where: { memberId: targetMemberId },
      orderBy: { checkInTime: 'desc' },
    });

    const monthLogs = logs.filter((l) => new Date(l.checkInTime) >= startOfMonth);
    const lastVisit = logs[0]?.checkInTime || null;

    const monthlyTrend: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      monthlyTrend[monthLabel] = 0;
    }

    logs.forEach((log) => {
      const d = new Date(log.checkInTime);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      if (monthlyTrend[monthLabel] !== undefined) {
        monthlyTrend[monthLabel]++;
      }
    });

    const trendData = Object.entries(monthlyTrend).map(([month, visits]) => ({
      month,
      visits,
    }));

    res.json({
      totalVisitsThisMonth: monthLogs.length,
      allTimeVisits: logs.length,
      lastVisit,
      monthlyTrend: trendData,
      logs: logs.slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to calculate attendance statistics.' });
  }
}
