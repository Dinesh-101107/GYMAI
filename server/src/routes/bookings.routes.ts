import { Router } from 'express';
import {
  getClassSlots,
  createClassSlot,
  bookSlot,
  cancelBooking,
} from '../controllers/bookingsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth);

router.get('/slots', getClassSlots);
router.post('/slots', requireRole('ADMIN', 'STAFF'), createClassSlot);
router.post('/book', bookSlot);
router.delete('/:id', cancelBooking);

export default router;
