import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Ambassador } from '../models/Ambassador';
import { Application } from '../models/Application';
import { Task } from '../models/Task';
import { TaskSubmission } from '../models/TaskSubmission';
import { CourseSale } from '../models/CourseSale';
import { PointsTransaction } from '../models/PointsTransaction';
import { RewardTier } from '../models/RewardTier';
import { CommissionSetting } from '../models/CommissionSetting';
import { generateNextSRID } from '../services/sridService';
import { awardOrDeductPoints, recalculateAllRanks } from '../services/pointsService';

export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalAmbassadors = await Ambassador.countDocuments();
    const activeAmbassadors = await Ambassador.countDocuments({ status: 'active' });
    const pendingApplicants = await Application.countDocuments({ convertedToAmbassador: { $ne: true } });

    const totalTasks = await Task.countDocuments();
    const activeTasks = await Task.countDocuments({ status: 'active' });

    const totalSubmissions = await TaskSubmission.countDocuments();
    const pendingSubmissions = await TaskSubmission.countDocuments({
      status: { $in: ['submitted', 'under_review'] },
    });
    const approvedSubmissions = await TaskSubmission.countDocuments({ status: 'approved' });

    const sales = await CourseSale.find().lean();
    const paidSales = sales.filter((s) => s.paymentStatus === 'paid');
    const totalRevenue = paidSales.reduce((acc, s) => acc + s.coursePrice, 0);
    const totalCommissionPayable = paidSales
      .filter((s) => s.commissionStatus === 'approved' || s.commissionStatus === 'eligible')
      .reduce((acc, s) => acc + s.commissionAmount, 0);

    const topAmbassadors = await Ambassador.find({ status: 'active' })
      .sort({ totalPoints: -1 })
      .limit(5)
      .select('name srid college totalPoints currentRank badgeTier avatar')
      .lean();

    return res.json({
      success: true,
      stats: {
        ambassadors: {
          total: totalAmbassadors,
          active: activeAmbassadors,
          pendingApplicants,
        },
        tasks: {
          total: totalTasks,
          active: activeTasks,
        },
        submissions: {
          total: totalSubmissions,
          pending: pendingSubmissions,
          approved: approvedSubmissions,
        },
        sales: {
          totalCount: paidSales.length,
          totalRevenue,
          commissionPayable: totalCommissionPayable,
        },
        topAmbassadors,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- Ambassador Management -------------------

export const getAllAmbassadors = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { college: regex }, { srid: regex }, { city: regex }];
    }

    const ambassadors = await Ambassador.find(filter).sort({ totalPoints: -1, createdAt: 1 }).lean();
    return res.json({ success: true, ambassadors });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAmbassador = async (req: Request, res: Response) => {
  try {
    const { name, email, college, linkedin, instagram, city, state, phone, password, srid, totalPoints } = req.body;

    if (!name || !email || !college) {
      return res.status(400).json({ success: false, message: 'Name, email, and college are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Ambassador.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An ambassador with this email already exists.' });
    }

    const finalSrid = srid ? srid.trim().toUpperCase() : await generateNextSRID();
    const sridConflict = await Ambassador.findOne({ srid: finalSrid });
    if (sridConflict) {
      return res.status(400).json({ success: false, message: `SRID ${finalSrid} is already assigned.` });
    }

    const passwordToHash = password && password.trim() ? password.trim() : 'SkillRock@2026';
    const passwordHash = await bcrypt.hash(passwordToHash, 12);

    const initialPoints = totalPoints !== undefined ? Number(totalPoints) : 0;
    const badgeTier = Ambassador.calculateBadgeTier(initialPoints) || 'The Explorer';

    const ambassador = await Ambassador.create({
      srid: finalSrid,
      name: name.trim(),
      email: cleanEmail,
      college: college.trim(),
      linkedin: linkedin ? linkedin.trim() : '',
      instagram: instagram ? instagram.trim() : '',
      city: city ? city.trim() : 'India',
      state: state ? state.trim() : '',
      phone: phone ? phone.trim() : '',
      passwordHash,
      totalPoints: initialPoints,
      badgeTier,
      badges: badgeTier ? [badgeTier] : ['The Explorer'],
      status: 'active',
    });

    await recalculateAllRanks();

    return res.status(201).json({
      success: true,
      message: `Ambassador created successfully with SRID ${finalSrid}. Initial password: ${passwordToHash}`,
      ambassador,
      initialPassword: passwordToHash,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAmbassador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, college, linkedin, instagram, city, state, phone, srid, status, password } = req.body;

    const ambassador = await Ambassador.findById(id);
    if (!ambassador) {
      return res.status(404).json({ success: false, message: 'Ambassador not found.' });
    }

    if (name) ambassador.name = name.trim();
    if (email) ambassador.email = email.trim().toLowerCase();
    if (college) ambassador.college = college.trim();
    if (linkedin !== undefined) ambassador.linkedin = linkedin.trim();
    if (instagram !== undefined) ambassador.instagram = instagram.trim();
    if (city !== undefined) ambassador.city = city.trim();
    if (state !== undefined) ambassador.state = state.trim();
    if (phone !== undefined) ambassador.phone = phone.trim();
    if (status) ambassador.status = status;

    if (srid && srid.trim().toUpperCase() !== ambassador.srid) {
      const conflict = await Ambassador.findOne({ srid: srid.trim().toUpperCase(), _id: { $ne: ambassador._id } });
      if (conflict) {
        return res.status(400).json({ success: false, message: `SRID ${srid} is already used.` });
      }
      ambassador.srid = srid.trim().toUpperCase();
    }

    if (password && password.trim()) {
      ambassador.passwordHash = await bcrypt.hash(password.trim(), 12);
    }

    await ambassador.save();
    return res.json({ success: true, message: 'Ambassador updated successfully.', ambassador });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAmbassador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ambassador = await Ambassador.findById(id);
    if (!ambassador) {
      return res.status(404).json({ success: false, message: 'Ambassador not found.' });
    }

    await Ambassador.findByIdAndDelete(id);
    await recalculateAllRanks();
    return res.json({ success: true, message: 'Ambassador removed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustPoints = async (req: Request, res: Response) => {
  try {
    const { ambassadorId, amount, reason } = req.body;
    if (!ambassadorId || amount === undefined || !reason) {
      return res.status(400).json({ success: false, message: 'ambassadorId, amount, and reason are required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a non-zero number.' });
    }

    const result = await awardOrDeductPoints({
      ambassadorId,
      amount: numAmount,
      type: numAmount > 0 ? 'bonus' : 'deduction',
      reason: reason.trim(),
      adminId: req.user!.id,
    });

    return res.json({
      success: true,
      message: `Successfully ${numAmount > 0 ? 'awarded' : 'deducted'} ${Math.abs(numAmount)} points.`,
      ambassador: result.ambassador,
      transaction: result.transaction,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- 1-Click Applicant Conversion -------------------

export const getApplicantsList = async (req: Request, res: Response) => {
  try {
    const applicants = await Application.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, applicants });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const convertApplicantToAmbassador = async (req: Request, res: Response) => {
  try {
    const { applicantId } = req.params;
    const applicant = await Application.findById(applicantId);

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant record not found.' });
    }

    // Check if already converted
    const cleanEmail = applicant.email.trim().toLowerCase();
    const existingAmb = await Ambassador.findOne({ email: cleanEmail });
    if (existingAmb) {
      applicant.convertedToAmbassador = true;
      applicant.ambassadorSrid = existingAmb.srid;
      await applicant.save();
      return res.json({
        success: true,
        message: `Applicant already exists as an ambassador with SRID ${existingAmb.srid}.`,
        ambassador: existingAmb,
      });
    }

    const nextSRID = await generateNextSRID();
    const tempPassword = 'SkillRock@' + nextSRID;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newAmbassador = await Ambassador.create({
      srid: nextSRID,
      name: applicant.fullName,
      email: cleanEmail,
      college: applicant.college || 'College Campus',
      linkedin: (applicant as any).linkedin || (applicant as any).linkedinUrl || '',
      instagram: (applicant as any).instagram || (applicant as any).instagramHandle || '',
      city: applicant.city || 'India',
      state: applicant.state || '',
      phone: applicant.phone || '',
      passwordHash,
      totalPoints: 0, // Ambassadors strictly start from 0 points
      badgeTier: 'The Explorer',
      badges: ['The Explorer'],
      status: 'active',
      applicationId: applicant._id,
    });

    applicant.convertedToAmbassador = true;
    applicant.ambassadorSrid = nextSRID;
    applicant.status = 'selected';
    await applicant.save();

    await recalculateAllRanks();

    return res.status(201).json({
      success: true,
      message: `Applicant successfully converted to Ambassador! SRID: ${nextSRID}, Temporary Password: ${tempPassword}`,
      ambassador: newAmbassador,
      credentials: {
        email: cleanEmail,
        srid: nextSRID,
        password: tempPassword,
      },
    });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- Task Management (Dynamic 4 Tasks) -------------------

export const getAllTasksAdmin = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ taskNumber: 1 }).lean();
    return res.json({ success: true, tasks });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createTaskAdmin = async (req: Request, res: Response) => {
  try {
    const {
      taskNumber,
      title,
      category,
      briefMonth,
      shortDescription,
      fullDescription,
      instructions,
      points,
      deadline,
      isMandatory,
      allowedSubmissionTypes,
      submissionRequirements,
    } = req.body;

    if (!title || !shortDescription || !fullDescription || points === undefined || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, descriptions, points, and deadline are required.' });
    }

    let finalTaskNumber = Number(taskNumber);
    if (!finalTaskNumber) {
      const maxTask = await Task.findOne().sort({ taskNumber: -1 });
      finalTaskNumber = maxTask ? maxTask.taskNumber + 1 : 1;
    }

    const task = await Task.create({
      taskNumber: finalTaskNumber,
      title: title.trim(),
      category: category || 'Product Trials',
      briefMonth: briefMonth || "MONTH'S BRIEF",
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      instructions: instructions || [],
      points: Number(points),
      deadline: new Date(deadline),
      isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
      allowedSubmissionTypes: allowedSubmissionTypes || ['text', 'url'],
      submissionRequirements: submissionRequirements || [],
      status: 'active',
    });

    return res.status(201).json({ success: true, message: 'Task created successfully.', task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(id, req.body, { new: true });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.json({ success: true, message: 'Task updated successfully.', task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTaskAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- Submission Review -------------------

export const getAllSubmissionsAdmin = async (req: Request, res: Response) => {
  try {
    const { status, taskId } = req.query;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (taskId) filter.taskId = taskId;

    const submissions = await TaskSubmission.find(filter)
      .populate('taskId', 'title points taskNumber category')
      .populate('ambassadorId', 'name email college srid avatar')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, submissions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewSubmissionAdmin = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { action, feedback, customPoints } = req.body; // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'." });
    }

    const submission = await TaskSubmission.findById(submissionId).populate('taskId');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (submission.status === 'approved' && action === 'approve') {
      return res.status(400).json({ success: false, message: 'Submission has already been approved.' });
    }

    const task: any = submission.taskId;
    const pointsToAward = customPoints !== undefined ? Number(customPoints) : task ? task.points : 500;

    if (action === 'approve') {
      submission.status = 'approved';
      submission.awardedPoints = pointsToAward;
      submission.adminFeedback = feedback || 'Excellent work! Task verified.';
      submission.reviewedBy = req.user!.id as any;
      submission.reviewedAt = new Date();
      await submission.save();

      // Award points atomically
      await awardOrDeductPoints({
        ambassadorId: submission.ambassadorId,
        amount: pointsToAward,
        type: 'task_completion',
        reason: `Completed Task #${task?.taskNumber || ''}: ${task?.title || 'Monthly Task'}`,
        relatedTaskId: task?._id,
        relatedSubmissionId: submission._id,
        adminId: req.user!.id,
      });

      return res.json({
        success: true,
        message: `Submission approved and ${pointsToAward} points awarded!`,
        submission,
      });
    } else {
      submission.status = 'rejected';
      submission.awardedPoints = 0;
      submission.adminFeedback = feedback || 'Requirements not met. Please review instructions and resubmit.';
      submission.reviewedBy = req.user!.id as any;
      submission.reviewedAt = new Date();
      await submission.save();

      return res.json({
        success: true,
        message: 'Submission rejected with feedback. Ambassador can resubmit.',
        submission,
      });
    }
  } catch (error: any) {
    console.error('Review submission error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- Sales & Commission Management -------------------

export const getAllSalesAdmin = async (req: Request, res: Response) => {
  try {
    const { status, srid } = req.query;
    const filter: any = {};
    if (status && status !== 'all') filter.paymentStatus = status;
    if (srid) filter.srid = String(srid).trim().toUpperCase();

    const sales = await CourseSale.find(filter).sort({ saleTimestamp: -1 }).lean();
    return res.json({ success: true, sales });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSaleCommissionStatus = async (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;
    const { commissionStatus, overrideReason } = req.body;

    const sale = await CourseSale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale record not found.' });
    }

    if (commissionStatus) sale.commissionStatus = commissionStatus;
    if (overrideReason) sale.adminOverrideReason = overrideReason;

    await sale.save();
    return res.json({ success: true, message: 'Commission status updated.', sale });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- Reward Tiers Management -------------------

export const getRewardTiersAdmin = async (_req: Request, res: Response) => {
  try {
    const tiers = await RewardTier.find().sort({ pointsRequired: 1 }).lean();
    return res.json({ success: true, tiers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRewardTierAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tier = await RewardTier.findByIdAndUpdate(id, req.body, { new: true });
    return res.json({ success: true, message: 'Reward tier updated.', tier });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- Commission Settings -------------------

export const getCommissionSettingsAdmin = async (_req: Request, res: Response) => {
  try {
    let setting = await CommissionSetting.findOne().sort({ createdAt: -1 });
    if (!setting) {
      setting = await CommissionSetting.create({
        defaultRatePercent: 20,
        fixedCommissionPerCourse: 0,
        eligibilityRules: '20% commission on verified paid course enrolments.',
      });
    }
    return res.json({ success: true, setting });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCommissionSettingsAdmin = async (req: Request, res: Response) => {
  try {
    const { defaultRatePercent, fixedCommissionPerCourse, eligibilityRules, courseSpecificRates } = req.body;
    let setting = await CommissionSetting.findOne().sort({ createdAt: -1 });
    if (!setting) {
      setting = new CommissionSetting();
    }

    if (defaultRatePercent !== undefined) setting.defaultRatePercent = Number(defaultRatePercent);
    if (fixedCommissionPerCourse !== undefined) setting.fixedCommissionPerCourse = Number(fixedCommissionPerCourse);
    if (eligibilityRules !== undefined) setting.eligibilityRules = eligibilityRules;
    if (courseSpecificRates) setting.courseSpecificRates = courseSpecificRates;
    setting.updatedBy = req.user!.id as any;

    await setting.save();
    return res.json({ success: true, message: 'Commission settings updated.', setting });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
