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

// QR Code ONLY generated for STAFF to display at front desk
router.get('/gym-qr-token', requireRole('STAFF'), getGymQRToken);

// SCANNING option for MEMBERS to check in
router.post('/member-scan', requireRole('MEMBER'), memberScanCheckIn);

// Staff desk manual check-in fallback
router.post('/check-in', requireRole('STAFF'), manualCheckIn);

// Live feeds & stats
router.get('/recent', requireRole('STAFF'), getRecentCheckIns);
router.get('/member/:id', getMemberAttendanceStats);

export default router;
