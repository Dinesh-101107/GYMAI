import { Router } from 'express';
import {
  getDashboardStats,
  getStaffList,
  createStaffMember,
  getGymSettings,
  updateGymSettings,
} from '../controllers/staffController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth);

// Accessible by both Staff and Admin
router.get('/dashboard-stats', requireRole('ADMIN', 'STAFF'), getDashboardStats);

// Admin-only endpoints
router.get('/list', requireRole('ADMIN'), getStaffList);
router.post('/create', requireRole('ADMIN'), createStaffMember);
router.get('/settings', requireRole('ADMIN'), getGymSettings);
router.put('/settings', requireRole('ADMIN'), updateGymSettings);

export default router;
