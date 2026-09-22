import { Router } from 'express';
import {
  getGymQRToken,
  memberScanCheckIn,
  manualCheckIn,
  getRecentCheckIns,
  getMemberAttendanceStats,
} from '../controllers/attendanceController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth);

// QR Code generated for STAFF & ADMIN to display at front desk
router.get('/gym-qr-token', requireRole('ADMIN', 'STAFF'), getGymQRToken);

// SCANNING option for MEMBERS to check in
router.post('/member-scan', requireRole('MEMBER'), memberScanCheckIn);

// Staff/Admin desk manual check-in fallback
router.post('/check-in', requireRole('ADMIN', 'STAFF'), manualCheckIn);

// Live feeds & stats
router.get('/recent', requireRole('ADMIN', 'STAFF'), getRecentCheckIns);
router.get('/member/:id', getMemberAttendanceStats);

export default router;
