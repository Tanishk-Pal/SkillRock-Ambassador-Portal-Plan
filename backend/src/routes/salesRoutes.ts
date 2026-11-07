import { Router } from 'express';
import { validateSRID, recordSaleWebhook } from '../controllers/salesController';

const router = Router();

// Public / Checkout integration routes
router.get('/validate-srid/:srid', validateSRID);
router.post('/record-sale', recordSaleWebhook);

export default router;
