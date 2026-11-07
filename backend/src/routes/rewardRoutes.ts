import { Router } from 'express';
import { RewardTier } from '../models/RewardTier';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const tiers = await RewardTier.find({ isActive: true }).sort({ pointsRequired: 1 }).lean();
    return res.json({ success: true, tiers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
