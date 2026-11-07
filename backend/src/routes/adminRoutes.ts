import { Router } from 'express';
import {
  getAdminDashboardStats,
  getAllAmbassadors,
  createAmbassador,
  updateAmbassador,
  deleteAmbassador,
  adjustPoints,
  getApplicantsList,
  convertApplicantToAmbassador,
  getAllTasksAdmin,
  createTaskAdmin,
  updateTaskAdmin,
  deleteTaskAdmin,
  getAllSubmissionsAdmin,
  reviewSubmissionAdmin,
  getAllSalesAdmin,
  updateSaleCommissionStatus,
  getRewardTiersAdmin,
  updateRewardTierAdmin,
  getCommissionSettingsAdmin,
  updateCommissionSettingsAdmin,
} from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Guard all admin routes with auth and admin role
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/dashboard', getAdminDashboardStats);

// Ambassadors
router.get('/ambassadors', getAllAmbassadors);
router.post('/ambassadors', createAmbassador);
router.put('/ambassadors/:id', updateAmbassador);
router.delete('/ambassadors/:id', deleteAmbassador);
router.post('/points/adjust', adjustPoints);

// 1-Click Applicant Conversion
router.get('/applicants', getApplicantsList);
router.post('/applicants/:applicantId/convert', convertApplicantToAmbassador);

// Task Management
router.get('/tasks', getAllTasksAdmin);
router.post('/tasks', createTaskAdmin);
router.put('/tasks/:id', updateTaskAdmin);
router.delete('/tasks/:id', deleteTaskAdmin);

// Submission Reviews
router.get('/submissions', getAllSubmissionsAdmin);
router.post('/submissions/:submissionId/review', reviewSubmissionAdmin);

// Sales & Commission
router.get('/sales', getAllSalesAdmin);
router.put('/sales/:saleId/commission', updateSaleCommissionStatus);
router.get('/settings/commission', getCommissionSettingsAdmin);
router.put('/settings/commission', updateCommissionSettingsAdmin);

// Reward Tiers
router.get('/rewards', getRewardTiersAdmin);
router.put('/rewards/:id', updateRewardTierAdmin);

export default router;
