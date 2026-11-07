import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Allow authenticated ambassadors and admins to view live leaderboard
router.get('/', requireAuth, getLeaderboard);

export default router;
