import { Router } from 'express';
import {
  getCandidates,
  sendReminder,
  sendBulkReminders,
  getReminderLogs,
  getMemberReminders,
} from '../controllers/remindersController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth);

router.get('/candidates', requireRole('ADMIN', 'STAFF'), getCandidates);
router.post('/send', requireRole('ADMIN', 'STAFF'), sendReminder);
router.post('/bulk-send', requireRole('ADMIN', 'STAFF'), sendBulkReminders);
router.get('/logs', requireRole('ADMIN', 'STAFF'), getReminderLogs);
router.get('/my-reminders', requireRole('MEMBER'), getMemberReminders);

export default router;
