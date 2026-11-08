import { Router } from 'express';
import { validateSRID, recordSaleWebhook, triggerSalesSync } from '../controllers/salesController';

const router = Router();

// Public / Checkout integration routes
router.get('/validate-srid/:srid', validateSRID);
router.post('/record-sale', recordSaleWebhook);
router.post('/sync', triggerSalesSync);

export default router;
