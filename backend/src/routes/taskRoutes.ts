import { Router, Request, Response, NextFunction } from 'express';
import { getAmbassadorTasks, getTaskDetail, submitTask } from '../controllers/taskController';
import { requireAuth, requireAmbassador } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { TaskSubmission } from '../models/TaskSubmission';

const router = Router();

// In-flight mutex set to prevent concurrent multi-click submissions
const inFlightSubmissions = new Set<string>();

export const preventDuplicateSubmission = async (req: Request, res: Response, next: NextFunction) => {
  const taskId = req.params.taskId;
  const ambassadorId = req.user?.id;

  if (!taskId || !ambassadorId) {
    return next();
  }

  const lockKey = `${ambassadorId}:${taskId}`;

  // Atomic check 1: In-flight submission lock (blocks concurrent rapid requests)
  if (inFlightSubmissions.has(lockKey)) {
    return res.status(409).json({
      success: false,
      message: 'A submission for this task is already in progress. Please wait.',
    });
  }

  // Acquire lock IMMEDIATELY and synchronously before any async I/O
  inFlightSubmissions.add(lockKey);

  let released = false;
  const releaseLock = () => {
    if (!released) {
      released = true;
      inFlightSubmissions.delete(lockKey);
      res.removeListener('finish', releaseLock);
      res.removeListener('close', releaseLock);
      clearTimeout(safetyTimer);
    }
  };

  const safetyTimer = setTimeout(releaseLock, 60000);
  res.on('finish', releaseLock);
  res.on('close', releaseLock);

  // Atomic check 2: Pre-upload database check to prevent duplicate records
  try {
    const existingSubmission = await TaskSubmission.findOne({
      taskId,
      ambassadorId,
    });

    if (existingSubmission) {
      if (existingSubmission.status === 'approved') {
        releaseLock();
        return res.status(400).json({
          success: false,
          message: 'This task has already been approved and points awarded.',
        });
      }
      if (existingSubmission.status === 'submitted' || existingSubmission.status === 'under_review') {
        releaseLock();
        return res.status(400).json({
          success: false,
          message: 'A submission for this task has already been submitted and is pending review.',
        });
      }
      // If rejected, ambassador is permitted to resubmit
    }
  } catch (err: any) {
    releaseLock();
    return res.status(500).json({ success: false, message: err.message });
  }

  next();
};

router.use(requireAuth, requireAmbassador);

router.get('/', getAmbassadorTasks);
router.get('/:taskId', getTaskDetail);
router.post('/:taskId/submit', preventDuplicateSubmission, upload.array('files', 5), submitTask);

export default router;
