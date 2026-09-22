import 'dotenv/config';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
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

    if (!user.passwordHash) {
      res.status(401).json({ error: 'This account was registered using Google. Please sign in with Google.' });
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

export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: 'Google credential token is required.' });
      return;
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!googleClientId) {
      console.error('Google OAuth error: GOOGLE_CLIENT_ID is not configured in process.env');
      res.status(500).json({ error: 'Google OAuth is not configured on the server (GOOGLE_CLIENT_ID missing).' });
      return;
    }

    // Cryptographically verify Google ID Token with Google public keys
    const client = new OAuth2Client(googleClientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
    } catch (verifyError: any) {
      const msg = verifyError?.message || 'Invalid or expired Google authentication token';
      console.error('Google token verification failed:', msg);
      res.status(401).json({ error: `Google verification failed: ${msg}` });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Google profile incomplete: verified email is required.' });
      return;
    }

    // Validate token audience against configured Google Client ID
    if (payload.aud !== googleClientId) {
      console.error(`Google token audience mismatch: expected ${googleClientId}, received ${payload.aud}`);
      res.status(401).json({ error: 'Google token audience mismatch.' });
      return;
    }

    // Validate token issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      console.error(`Invalid Google token issuer: ${payload.iss}`);
      res.status(401).json({ error: 'Invalid Google token issuer.' });
      return;
    }

    // Validate verified email
    const isEmailVerified = payload.email_verified === true || String(payload.email_verified) === 'true';
    if (!isEmailVerified) {
      res.status(401).json({ error: 'Google account email is not verified.' });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture || null;

    // Search for existing user strictly by verified googleId or verified email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
      include: {
        member: true,
        staff: true,
      },
    });

    if (user) {
      // Existing user: PRESERVE existing database role (ADMIN, STAFF, MEMBER)!
      // Link googleId if missing and mark email verified
      const updates: any = {};
      if (!user.googleId) {
        updates.googleId = googleId;
      }
      if (!user.isEmailVerified) {
        updates.isEmailVerified = true;
      }

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
          include: {
            member: true,
            staff: true,
          },
        });
      }

      // If user has a member profile and no avatar yet, save the Google photo
      if (user.member && picture && !user.member.avatarUrl) {
        await prisma.member.update({
          where: { id: user.member.id },
          data: { avatarUrl: picture },
        });
      }
    } else {
      // New user registration via Google:
      // STRICT REQUIREMENT: Role MUST strictly be 'MEMBER'.
      // Never allow Google registration to choose or create ADMIN or STAFF roles.
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 30);

      user = await prisma.user.create({
        data: {
          email,
          googleId,
          role: 'MEMBER' as any,
          isEmailVerified: true,
          member: {
            create: {
              name: name.trim(),
              phone: '',
              membershipStatus: 'active' as any,
              feeAmount: 2000.0,
              feeDueDate: nextDueDate,
              lastPaymentDate: new Date(),
              avatarUrl: picture,
            },
          },
        },
        include: {
          member: true,
          staff: true,
        },
      });

      // Send welcome email asynchronously
      sendEmail({
        to: user.email,
        subject: 'Welcome to GymMate AI!',
        html: `<h3>Welcome to the Iron Family, ${name}!</h3><p>Your GymMate AI account has been activated via Google. Log in anytime to access your dashboard and dynamic QR check-in.</p>`,
      }).catch(console.error);
    }

    const tokens = generateTokens(user);
    const resolvedName = user.member?.name || user.staff?.name || user.email.split('@')[0];

    res.json({
      message: 'Login successful',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: resolvedName,
        memberId: user.member?.id,
        staffId: user.staff?.id,
        membershipStatus: user.member?.membershipStatus,
        designation: user.staff?.designation,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error during Google authentication.' });
  }
}

