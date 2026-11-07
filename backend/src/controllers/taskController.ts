import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { TaskSubmission } from '../models/TaskSubmission';

export const getAmbassadorTasks = async (req: Request, res: Response) => {
  try {
    const ambassadorId = req.user!.id;
    const tasks = await Task.find({ status: 'active' }).sort({ taskNumber: 1 }).lean();

    // Fetch latest submissions by this ambassador for each task
    const submissions = await TaskSubmission.find({ ambassadorId }).sort({ createdAt: -1 }).lean();

    const submissionMap: Record<string, any> = {};
    for (const sub of submissions) {
      const taskIdStr = sub.taskId.toString();
      if (!submissionMap[taskIdStr]) {
        submissionMap[taskIdStr] = sub; // latest submission
      }
    }

    const tasksWithStatus = tasks.map((task) => {
      const sub = submissionMap[task._id.toString()];
      let userStatus = 'Not Started';
      if (sub) {
        if (sub.status === 'approved') userStatus = 'Approved';
        else if (sub.status === 'rejected') userStatus = 'Rejected';
        else if (sub.status === 'under_review') userStatus = 'Under Review';
        else userStatus = 'Submitted';
      }

      return {
        ...task,
        userStatus,
        submission: sub || null,
      };
    });

    return res.json({
      success: true,
      tasks: tasksWithStatus,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTaskDetail = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const ambassadorId = req.user!.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const submissions = await TaskSubmission.find({ taskId, ambassadorId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      task,
      latestSubmission: submissions[0] || null,
      submissionHistory: submissions,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const ambassadorId = req.user!.id;
    const srid = req.user!.srid;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Check if task is past deadline
    if (new Date() > new Date(task.deadline)) {
      return res.status(400).json({ success: false, message: 'Deadline for this task has passed.' });
    }

    // Check previous submissions
    const existingApproved = await TaskSubmission.findOne({
      taskId,
      ambassadorId,
      status: 'approved',
    });
    if (existingApproved) {
      return res.status(400).json({ success: false, message: 'This task has already been approved and points awarded.' });
    }

    // Extract text responses, links, videoUrl
    const { textResponse, videoUrl } = req.body;
    let links: string[] = [];
    if (req.body.links) {
      links = Array.isArray(req.body.links) ? req.body.links : [req.body.links];
    }

    // Extract uploaded files
    const filePaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        filePaths.push(`/uploads/${file.filename}`);
      }
    }

    const previousSubmissionsCount = await TaskSubmission.countDocuments({ taskId, ambassadorId });

    const newSubmission = await TaskSubmission.create({
      taskId,
      ambassadorId,
      srid: srid || 'SR0000',
      submissionData: {
        textResponse: textResponse || '',
        links,
        filePaths,
        videoUrl: videoUrl || '',
      },
      status: 'submitted',
      submittedAt: new Date(),
      resubmissionCount: previousSubmissionsCount,
    });

    return res.status(201).json({
      success: true,
      message: 'Task submitted successfully for Admin review.',
      submission: newSubmission,
    });
  } catch (error: any) {
    console.error('Task submission error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
