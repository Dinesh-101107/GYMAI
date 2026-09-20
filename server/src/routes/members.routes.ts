import { Router } from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  logPayment,
} from '../controllers/membersController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole('STAFF'), getMembers);
router.post('/', requireRole('STAFF'), createMember);
router.get('/:id', getMemberById); // Permission check in controller
router.put('/:id', updateMember);
router.post('/:id/payment', logPayment);

export default router;
