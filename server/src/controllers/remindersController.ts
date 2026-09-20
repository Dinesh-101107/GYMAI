import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { evaluateMemberForReminder } from '../services/reminderEngine.js';
import { sendEmail } from '../services/emailService.js';

export async function getCandidates(req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.gymSettings.findFirst() || {
      reminderLeadTimeDays: 5,
    };

    const members = await prisma.member.findMany({
      include: {
        user: { select: { email: true } },
        attendanceLogs: {
          orderBy: { checkInTime: 'desc' },
          take: 60,
        },
      },
    });

    const candidates = [];

    for (const m of members) {
      const candidate = evaluateMemberForReminder(
        {
          id: m.id,
          name: m.name,
          email: m.user.email,
          phone: m.phone,
          feeAmount: m.feeAmount,
          feeDueDate: m.feeDueDate,
          membershipStatus: m.membershipStatus,
        },
        m.attendanceLogs,
        settings.reminderLeadTimeDays
      );

      if (candidate) {
        candidates.push(candidate);
      }
    }

    res.json(candidates);
  } catch (error) {
    console.error('Error fetching reminder candidates:', error);
    res.status(500).json({ error: 'Failed to evaluate reminder candidates.' });
  }
}

export async function sendReminder(req: Request, res: Response): Promise<void> {
  try {
    const { memberId, message, channel = 'email' } = req.body;

    if (!memberId || !message) {
      res.status(400).json({ error: 'memberId and message are required.' });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: { select: { email: true } } },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    // Dispatch email if channel is email
    if (channel === 'email' && member.user.email) {
      await sendEmail({
        to: member.user.email,
        subject: 'GymMate AI — Workout & Membership Update',
        text: message,
      });
    }

    const reminder = await prisma.feeReminder.create({
      data: {
        memberId: member.id,
        channel: channel as any,
        message,
        status: 'sent' as any,
      },
    });

    res.status(201).json({
      message: `Reminder successfully sent to ${member.name}.`,
      reminder,
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder.' });
  }
}

export async function sendBulkReminders(req: Request, res: Response): Promise<void> {
  try {
    const { candidates } = req.body; // Array of { memberId, message, channel }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      res.status(400).json({ error: 'Array of reminder candidates is required.' });
      return;
    }

    let sentCount = 0;

    for (const c of candidates) {
      const member = await prisma.member.findUnique({
        where: { id: c.memberId },
        include: { user: { select: { email: true } } },
      });

      if (member) {
        if (member.user.email) {
          await sendEmail({
            to: member.user.email,
            subject: 'GymMate AI — Membership Update',
            text: c.message,
          });
        }

        await prisma.feeReminder.create({
          data: {
            memberId: member.id,
            channel: 'email' as any,
            message: c.message,
            status: 'sent' as any,
          },
        });

        sentCount++;
      }
    }

    res.json({
      message: `Successfully dispatched ${sentCount} reminders.`,
      sentCount,
    });
  } catch (error) {
    console.error('Error bulk sending reminders:', error);
    res.status(500).json({ error: 'Failed to dispatch bulk reminders.' });
  }
}

export async function getReminderLogs(req: Request, res: Response): Promise<void> {
  try {
    const reminders = await prisma.feeReminder.findMany({
      take: 50,
      orderBy: { sentAt: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            membershipStatus: true,
          },
        },
      },
    });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve reminder logs.' });
  }
}

export async function getMemberReminders(req: Request, res: Response): Promise<void> {
  try {
    const memberId = req.user?.memberId;
    if (!memberId) {
      res.status(403).json({ error: 'Member profile required' });
      return;
    }

    const reminders = await prisma.feeReminder.findMany({
      where: { memberId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch member reminders.' });
  }
}
