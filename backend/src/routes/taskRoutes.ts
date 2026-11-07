import { Router } from 'express';
import { getAmbassadorTasks, getTaskDetail, submitTask } from '../controllers/taskController';
import { requireAuth, requireAmbassador } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(requireAuth, requireAmbassador);

router.get('/', getAmbassadorTasks);
router.get('/:taskId', getTaskDetail);
router.post('/:taskId/submit', upload.array('files', 5), submitTask);

export default router;
