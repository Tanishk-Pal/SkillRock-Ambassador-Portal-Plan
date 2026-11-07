import { Router } from 'express';
import {
  getAmbassadorDashboard,
  getMyPointsLedger,
  getMySales,
  updateAmbassadorProfile,
} from '../controllers/ambassadorController';
import { requireAuth, requireAmbassador } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireAmbassador);

router.get('/dashboard', getAmbassadorDashboard);
router.get('/points', getMyPointsLedger);
router.get('/sales', getMySales);
router.put('/profile', updateAmbassadorProfile);

export default router;
