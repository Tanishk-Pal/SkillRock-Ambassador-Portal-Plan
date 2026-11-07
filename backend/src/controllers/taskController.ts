import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { TaskSubmission } from '../models/TaskSubmission';

export const getTaskSubmissionType = (task: {
  title?: string;
  category?: string;
  submissionType?: string;
  taskNumber?: number;
}): 'reel_challenge' | 'monthly_highlight' | 'campus_growth' | 'affiliate_sales' | 'custom' => {
  if (task.submissionType && task.submissionType !== 'custom') {
    return task.submissionType as any;
  }
  const title = (task.title || '').toLowerCase();
  const cat = (task.category || '').toLowerCase();

  if (title.includes('reel') || cat === 'content creation') {
    return 'reel_challenge';
  }
  if (title.includes('highlight') || cat === 'monthly highlights') {
    return 'monthly_highlight';
  }
  if (title.includes('growth') || title.includes('fest') || title.includes('trial') || title.includes('campus growth')) {
    if (title.includes('affiliate') || title.includes('sales') || title.includes('earn')) {
      return 'affiliate_sales';
    }
    return 'campus_growth';
  }
  if (title.includes('affiliate') || title.includes('sales') || title.includes('earn') || title.includes('course')) {
    return 'affiliate_sales';
  }
  return 'custom';
};

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

      const submissionType = getTaskSubmissionType(task);

      return {
        ...task,
        submissionType,
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

    const submissionType = getTaskSubmissionType(task);

    return res.json({
      success: true,
      task: {
        ...task.toObject(),
        submissionType,
      },
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

    const taskType = getTaskSubmissionType(task);
    const body = req.body;

    // Helper for URL validation
    const isValidUrl = (val: string) => {
      if (!val || typeof val !== 'string') return false;
      try {
        const u = new URL(val.trim());
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    };

    const submissionData: any = {
      submissionType: taskType,
      additionalComments: body.additionalComments || body.textResponse || '',
      submittedAt: new Date(),
    };

    // Extract uploaded files
    const filePaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        filePaths.push(`/uploads/${file.filename}`);
      }
    }
    submissionData.filePaths = filePaths;

    // Task-Specific Backend Validations
    if (taskType === 'reel_challenge') {
      const { instagramReelUrl, linkedinPostUrl, driveVideoUrl } = body;

      if (!instagramReelUrl || !isValidUrl(instagramReelUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Instagram Reel URL is required and must be a valid URL (e.g. https://www.instagram.com/reel/...).',
        });
      }

      if (!linkedinPostUrl || !isValidUrl(linkedinPostUrl)) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn Post URL is required and must be a valid URL (e.g. https://www.linkedin.com/posts/...).',
        });
      }

      if (driveVideoUrl && !isValidUrl(driveVideoUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Google Drive Video URL must be a valid URL if provided.',
        });
      }

      submissionData.instagramReelUrl = instagramReelUrl.trim();
      submissionData.linkedinPostUrl = linkedinPostUrl.trim();
      if (driveVideoUrl) submissionData.driveVideoUrl = driveVideoUrl.trim();
      submissionData.links = [
        instagramReelUrl.trim(),
        linkedinPostUrl.trim(),
        ...(driveVideoUrl ? [driveVideoUrl.trim()] : []),
      ];
    } else if (taskType === 'monthly_highlight') {
      const { linkedinPostUrl, driveCarouselUrl } = body;

      if (!linkedinPostUrl || !isValidUrl(linkedinPostUrl)) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn Post URL is required and must be a valid URL (e.g. https://www.linkedin.com/posts/...).',
        });
      }

      if (driveCarouselUrl && !isValidUrl(driveCarouselUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Google Drive Carousel URL must be a valid URL if provided.',
        });
      }

      submissionData.linkedinPostUrl = linkedinPostUrl.trim();
      if (driveCarouselUrl) submissionData.driveCarouselUrl = driveCarouselUrl.trim();
      submissionData.links = [
        linkedinPostUrl.trim(),
        ...(driveCarouselUrl ? [driveCarouselUrl.trim()] : []),
      ];
    } else if (taskType === 'campus_growth') {
      const { studentsReached, registrationsGenerated, studentsLearningStarted } = body;

      if (studentsReached === undefined || isNaN(Number(studentsReached)) || Number(studentsReached) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of Students Reached is required and must be a valid number.',
        });
      }

      if (registrationsGenerated === undefined || isNaN(Number(registrationsGenerated)) || Number(registrationsGenerated) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of Registrations Generated is required and must be a valid number.',
        });
      }

      if (studentsLearningStarted === undefined || isNaN(Number(studentsLearningStarted)) || Number(studentsLearningStarted) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of Students Who Started Learning is required and must be a valid number.',
        });
      }

      // Drive video links
      let rawDriveLinks: string[] = [];
      if (Array.isArray(body.driveVideoLinks)) {
        rawDriveLinks = body.driveVideoLinks;
      } else if (typeof body.driveVideoLinks === 'string') {
        try {
          rawDriveLinks = JSON.parse(body.driveVideoLinks);
        } catch {
          rawDriveLinks = [body.driveVideoLinks];
        }
      } else if (body.driveVideoLink1) {
        rawDriveLinks = [body.driveVideoLink1, body.driveVideoLink2, body.driveVideoLink3].filter(Boolean);
      }

      const cleanDriveLinks = rawDriveLinks.map((l) => (typeof l === 'string' ? l.trim() : '')).filter(Boolean);

      if (cleanDriveLinks.length === 0 || !isValidUrl(cleanDriveLinks[0])) {
        return res.status(400).json({
          success: false,
          message: 'Google Drive Video Link 1 is required and must be a valid URL.',
        });
      }

      for (let i = 0; i < cleanDriveLinks.length; i++) {
        if (!isValidUrl(cleanDriveLinks[i])) {
          return res.status(400).json({
            success: false,
            message: `Google Drive Video Link #${i + 1} is not a valid URL.`,
          });
        }
      }

      submissionData.studentsReached = Number(studentsReached);
      submissionData.registrationsGenerated = Number(registrationsGenerated);
      submissionData.studentsLearningStarted = Number(studentsLearningStarted);
      submissionData.driveVideoLinks = cleanDriveLinks;
      submissionData.links = cleanDriveLinks;
    } else if (taskType === 'affiliate_sales') {
      const { coursesPromotedCount, salesGeneratedCount, courseNames } = body;

      if (coursesPromotedCount === undefined || isNaN(Number(coursesPromotedCount)) || Number(coursesPromotedCount) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of Courses Promoted is required and must be a valid number.',
        });
      }

      if (salesGeneratedCount === undefined || isNaN(Number(salesGeneratedCount)) || Number(salesGeneratedCount) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of Course Sales Generated is required and must be a valid number.',
        });
      }

      if (!courseNames || typeof courseNames !== 'string' || !courseNames.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Course Names are required (e.g. "Full Stack Web Development, Python Mastery").',
        });
      }

      let promoLinks: string[] = [];
      if (body.promotionalUrls) {
        if (Array.isArray(body.promotionalUrls)) {
          promoLinks = body.promotionalUrls;
        } else if (typeof body.promotionalUrls === 'string') {
          promoLinks = body.promotionalUrls.split('\n').map((l: string) => l.trim()).filter(Boolean);
        }
      }

      submissionData.coursesPromotedCount = Number(coursesPromotedCount);
      submissionData.salesGeneratedCount = Number(salesGeneratedCount);
      submissionData.courseNames = courseNames.trim();
      submissionData.promotionalUrls = promoLinks;
      submissionData.links = promoLinks;
    } else {
      // Custom / Fallback task
      let links: string[] = [];
      if (body.links) {
        links = Array.isArray(body.links) ? body.links : [body.links];
      }
      submissionData.textResponse = body.textResponse || body.additionalComments || '';
      submissionData.links = links;
      submissionData.videoUrl = body.videoUrl || '';
    }

    const previousSubmissionsCount = await TaskSubmission.countDocuments({ taskId, ambassadorId });

    // Check if there was a rejected submission to update, or create new
    const existingRejected = await TaskSubmission.findOne({
      taskId,
      ambassadorId,
      status: 'rejected',
    }).sort({ createdAt: -1 });

    let finalSubmission;
    if (existingRejected) {
      existingRejected.submissionData = submissionData;
      existingRejected.status = 'submitted';
      existingRejected.submittedAt = new Date();
      existingRejected.resubmissionCount += 1;
      await existingRejected.save();
      finalSubmission = existingRejected;
    } else {
      finalSubmission = await TaskSubmission.create({
        taskId,
        ambassadorId,
        srid: srid || 'SR0000',
        submissionData,
        status: 'submitted',
        submittedAt: new Date(),
        resubmissionCount: previousSubmissionsCount,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Task submitted successfully for Admin review.',
      submission: finalSubmission,
    });
  } catch (error: any) {
    console.error('Task submission error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
