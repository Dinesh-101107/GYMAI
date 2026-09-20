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
router.use(requireRole('STAFF'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/list', getStaffList);
router.post('/create', createStaffMember);
router.get('/settings', getGymSettings);
router.put('/settings', updateGymSettings);

export default router;
