import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

export async function getMembers(req: Request, res: Response): Promise<void> {
  try {
    const { search, status, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const where: any = {};

    if (status && status !== 'all') {
      where.membershipStatus = status as any;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        user: { select: { email: true, role: true, createdAt: true } },
        attendanceLogs: {
          take: 1,
          orderBy: { checkInTime: 'desc' },
          select: { checkInTime: true },
        },
        aiInsights: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { [sortBy as string]: sortOrder === 'desc' ? 'desc' : 'asc' },
    });

    // Compute helpful status tags for staff table
    const formatted = members.map((m) => {
      const now = new Date();
      const dueDate = new Date(m.feeDueDate);
      const daysUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.user.email,
        phone: m.phone,
        membershipStatus: m.membershipStatus,
        feeAmount: m.feeAmount,
        feeDueDate: m.feeDueDate,
        lastPaymentDate: m.lastPaymentDate,
        joinDate: m.joinDate,
        lastCheckIn: m.attendanceLogs[0]?.checkInTime || null,
        daysUntilDue,
        latestInsight: m.aiInsights[0] || null,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to retrieve members.' });
  }
}

export async function getMemberById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Permissions: staff can view anyone; members can only view their own record
    if (req.user?.role === 'MEMBER' && req.user.memberId !== id) {
      res.status(403).json({ error: 'Access denied to this member profile.' });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, createdAt: true } },
        attendanceLogs: {
          orderBy: { checkInTime: 'desc' },
          take: 100,
        },
        feeReminders: {
          orderBy: { sentAt: 'desc' },
          take: 20,
        },
        aiInsights: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        bookings: {
          include: { slot: true },
          orderBy: { bookedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    res.json(member);
  } catch (error) {
    console.error('Error fetching member details:', error);
    res.status(500).json({ error: 'Failed to retrieve member details.' });
  }
}

export async function createMember(req: Request, res: Response): Promise<void> {
  try {
    const { email, name, phone, feeAmount = 2000, membershipStatus = 'active', password } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: 'Email and name are required.' });
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
    const passwordHash = await bcrypt.hash(password || 'MemberPass123!', salt);

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'MEMBER' as any,
        isEmailVerified: true,
        member: {
          create: {
            name: name.trim(),
            phone: phone ? phone.trim() : '',
            feeAmount: Number(feeAmount),
            membershipStatus: membershipStatus as any,
            feeDueDate: nextDueDate,
            lastPaymentDate: new Date(),
          },
        },
      },
      include: { member: true },
    });

    res.status(201).json({
      message: 'Member created successfully.',
      member: user.member,
      tempPassword: password || 'MemberPass123!',
    });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member.' });
  }
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, phone, membershipStatus, feeAmount, feeDueDate } = req.body;

    // Staff or owner member
    if (req.user?.role === 'MEMBER' && req.user.memberId !== id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const data: any = {};
    if (name) data.name = name;
    if (phone) data.phone = phone;

    // Only staff or admin can adjust membership status or fee fields
    if (req.user?.role === 'STAFF' || req.user?.role === 'ADMIN') {
      if (membershipStatus) data.membershipStatus = membershipStatus;
      if (feeAmount !== undefined) data.feeAmount = Number(feeAmount);
      if (feeDueDate) data.feeDueDate = new Date(feeDueDate);
    }

    const updated = await prisma.member.update({
      where: { id },
      data,
    });

    res.json({ message: 'Member updated successfully', member: updated });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member.' });
  }
}

export async function logPayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { months = 1 } = req.body;

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Extend due date
    const currentDue = new Date(member.feeDueDate);
    const baseDate = currentDue > new Date() ? currentDue : new Date();
    baseDate.setDate(baseDate.getDate() + 30 * Number(months));

    const updated = await prisma.member.update({
      where: { id },
      data: {
        membershipStatus: 'active' as any,
        lastPaymentDate: new Date(),
        feeDueDate: baseDate,
      },
    });

    res.json({
      message: `Payment logged successfully. Membership extended until ${baseDate.toLocaleDateString()}.`,
      member: updated,
    });
  } catch (error) {
    console.error('Error logging payment:', error);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
}
