import crypto from 'crypto';

const QR_SECRET = process.env.QR_SIGNING_SECRET || 'gymmate_qr_default_secret_key_2026';
const TOKEN_TTL_SECONDS = 90; // Rotating every 90 seconds for front desk

export interface GymQRTokenPayload {
  facilityId: string;
  timestamp: number;
  expiresAt: number;
  nonce: string;
}

/**
 * Generates a signed, time-bounded QR check-in token for the Gym front desk / kiosk.
 * Members scan this token using their camera to log attendance.
 */
export function generateGymCheckInToken(facilityId = 'gymmate_main_hq'): {
  token: string;
  expiresAt: number;
  expiresInSeconds: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + TOKEN_TTL_SECONDS;
  const nonce = crypto.randomBytes(4).toString('hex');

  const payloadString = `GYM:${facilityId}:${now}:${expiresAt}:${nonce}`;
  const hmac = crypto.createHmac('sha256', QR_SECRET).update(payloadString).digest('hex');

  const fullToken = Buffer.from(`${payloadString}:${hmac}`).toString('base64url');

  return {
    token: fullToken,
    expiresAt,
    expiresInSeconds: TOKEN_TTL_SECONDS,
  };
}

/**
 * Verifies the gym's front-desk QR token scanned by a member.
 */
export function verifyGymCheckInToken(token: string): { valid: boolean; facilityId?: string; error?: string } {
  try {
    const decoded = Buffer.from(token.trim(), 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 6 || parts[0] !== 'GYM') {
      return { valid: false, error: 'Invalid QR code. Please scan the official GymMate front-desk display.' };
    }

    const [, facilityId, timestampStr, expiresAtStr, nonce, receivedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Math.floor(Date.now() / 1000);

    // Clock skew grace period of 20 seconds
    if (now > expiresAt + 20) {
      return { valid: false, error: 'The front-desk QR code has refreshed. Please scan again.' };
    }

    const payloadString = `GYM:${facilityId}:${timestampStr}:${expiresAtStr}:${nonce}`;
    const expectedHmac = crypto.createHmac('sha256', QR_SECRET).update(payloadString).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac))) {
      return { valid: true, facilityId };
    } else {
      return { valid: false, error: 'Invalid or forged QR signature.' };
    }
  } catch (err: any) {
    return { valid: false, error: 'Failed to decode gym QR code.' };
  }
}
