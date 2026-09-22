import { Router } from 'express';
import { getMemberInsight, recomputeAllInsights } from '../controllers/insightsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth);

router.get('/member/:id', getMemberInsight);
router.post('/recompute', requireRole('ADMIN', 'STAFF'), recomputeAllInsights);

export default router;
