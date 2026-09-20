import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'gymmate_super_secret_access_jwt_key_2026_change_in_prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'gymmate_super_secret_refresh_jwt_key_2026_change_in_prod';

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        member: true,
        staff: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const tokens = generateTokens(user);

    const name = user.member?.name || user.staff?.name || user.email.split('@')[0];

    res.json({
      message: 'Login successful',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        memberId: user.member?.id,
        staffId: user.staff?.id,
        membershipStatus: user.member?.membershipStatus,
        designation: user.staff?.designation,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function registerMember(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, phone, feeAmount = 2000.0 } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'MEMBER' as any,
        isEmailVerified: true, // auto-verify for instant demo, token generated
        verificationToken,
        member: {
          create: {
            name: name.trim(),
            phone: phone ? phone.trim() : '',
            membershipStatus: 'active' as any,
            feeAmount: Number(feeAmount),
            feeDueDate: nextDueDate,
            lastPaymentDate: new Date(),
          },
        },
      },
      include: {
        member: true,
      },
    });

    // Send welcome email asynchronously
    sendEmail({
      to: user.email,
      subject: 'Welcome to GymMate AI!',
      html: `<h3>Welcome to the Iron Family, ${name}!</h3><p>Your GymMate AI account is active. Log in to view your rotating QR code and track your workouts.</p>`,
    }).catch(console.error);

    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'Registration successful. Welcome to GymMate AI!',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.member?.name,
        memberId: user.member?.id,
        membershipStatus: user.member?.membershipStatus,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required.' });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { member: true, staff: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    const tokens = generateTokens(user);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        member: true,
        staff: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      member: user.member,
      staff: user.staff,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always respond with success to avoid email enumeration
    if (!user) {
      res.json({ message: 'If an account exists with this email, a reset link has been dispatched.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'GymMate AI — Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    });

    res.json({ message: 'If an account exists with this email, a reset link has been dispatched.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
}
