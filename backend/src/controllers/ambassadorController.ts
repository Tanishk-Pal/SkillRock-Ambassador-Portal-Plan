import { Request, Response } from 'express';
import { Ambassador } from '../models/Ambassador';
import { Task } from '../models/Task';
import { TaskSubmission } from '../models/TaskSubmission';
import { PointsTransaction } from '../models/PointsTransaction';
import { CourseSale } from '../models/CourseSale';

export const getAmbassadorDashboard = async (req: Request, res: Response) => {
  try {
    const ambassadorId = req.user!.id;
    const ambassador = await Ambassador.findById(ambassadorId).select('-passwordHash');

    if (!ambassador) {
      return res.status(404).json({ success: false, message: 'Ambassador not found.' });
    }

    // 1. Fetch active tasks
    const activeTasks = await Task.find({ status: 'active' }).sort({ taskNumber: 1 });
    const totalActiveTasks = activeTasks.length;

    // 2. Fetch submissions for this ambassador
    const submissions = await TaskSubmission.find({ ambassadorId }).lean();
    const approvedSubmissions = submissions.filter((s) => s.status === 'approved');
    const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected');
    const pendingSubmissions = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review');

    // 3. Map task completion status
    const approvedTaskIds = new Set(approvedSubmissions.map((s) => s.taskId.toString()));
    const completedTasksCount = approvedTaskIds.size;

    // 4. Fetch sales attributed to this ambassador's SRID
    const sales = await CourseSale.find({ srid: ambassador.srid }).sort({ saleTimestamp: -1 }).lean();
    const paidSales = sales.filter((s) => s.paymentStatus === 'paid');
    const totalSalesCount = paidSales.length;
    const totalSalesRevenue = paidSales.reduce((acc, s) => acc + s.coursePrice, 0);
    const totalCommissionEarned = paidSales.reduce((acc, s) => acc + s.commissionAmount, 0);

    // 5. Recent points activity
    const recentTransactions = await PointsTransaction.find({ ambassadorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,
      dashboard: {
        ambassador: {
          id: ambassador._id,
          srid: ambassador.srid,
          name: ambassador.name,
          email: ambassador.email,
          college: ambassador.college,
          linkedin: ambassador.linkedin || '',
          instagram: ambassador.instagram || '',
          city: ambassador.city,
          state: ambassador.state,
          avatar: ambassador.avatar,
          totalPoints: ambassador.totalPoints,
          currentRank: ambassador.currentRank,
          badgeTier: ambassador.badgeTier,
          badges: ambassador.badges,
          status: ambassador.status,
          joinedAt: ambassador.joinedAt,
        },
        taskStats: {
          totalTasks: totalActiveTasks,
          completedTasks: completedTasksCount,
          pendingTasks: pendingSubmissions.length,
          approvedSubmissions: approvedSubmissions.length,
          rejectedSubmissions: rejectedSubmissions.length,
        },
        salesStats: {
          totalSales: totalSalesCount,
          totalRevenue: totalSalesRevenue,
          totalCommission: totalCommissionEarned,
          pendingSales: sales.filter((s) => s.paymentStatus === 'pending').length,
        },
        recentTransactions,
      },
    });
  } catch (error: any) {
    console.error('Dashboard Fetch Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPointsLedger = async (req: Request, res: Response) => {
  try {
    const ambassadorId = req.user!.id;
    const transactions = await PointsTransaction.find({ ambassadorId })
      .sort({ createdAt: -1 })
      .lean();

    const ambassador = await Ambassador.findById(ambassadorId).select('totalPoints currentRank badgeTier');

    return res.json({
      success: true,
      totalPoints: ambassador?.totalPoints || 0,
      currentRank: ambassador?.currentRank || 1,
      badgeTier: ambassador?.badgeTier || 'The Explorer',
      transactions,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySales = async (req: Request, res: Response) => {
  try {
    const srid = req.user!.srid;
    if (!srid) {
      return res.status(400).json({ success: false, message: 'No SRID associated with account.' });
    }

    const sales = await CourseSale.find({ srid }).sort({ saleTimestamp: -1 }).lean();

    const summary = {
      totalSales: sales.length,
      paidSales: sales.filter((s) => s.paymentStatus === 'paid').length,
      pendingSales: sales.filter((s) => s.paymentStatus === 'pending').length,
      cancelledOrRefunded: sales.filter((s) => s.paymentStatus === 'cancelled' || s.paymentStatus === 'refunded').length,
      totalRevenue: sales
        .filter((s) => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + s.coursePrice, 0),
      totalCommission: sales
        .filter((s) => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + s.commissionAmount, 0),
    };

    return res.json({
      success: true,
      summary,
      sales,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAmbassadorProfile = async (req: Request, res: Response) => {
  try {
    const ambassadorId = req.user!.id;
    const { phone, city, state, avatar, college, linkedin, instagram } = req.body;

    const ambassador = await Ambassador.findById(ambassadorId);
    if (!ambassador) {
      return res.status(404).json({ success: false, message: 'Ambassador not found.' });
    }

    if (college !== undefined && college.trim()) ambassador.college = college.trim();
    if (linkedin !== undefined) ambassador.linkedin = linkedin.trim();
    if (instagram !== undefined) ambassador.instagram = instagram.trim();
    if (phone !== undefined) ambassador.phone = phone.trim();
    if (city !== undefined) ambassador.city = city.trim();
    if (state !== undefined) ambassador.state = state.trim();
    if (avatar !== undefined) ambassador.avatar = avatar.trim();

    await ambassador.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      ambassador: {
        id: ambassador._id,
        name: ambassador.name,
        email: ambassador.email,
        phone: ambassador.phone,
        college: ambassador.college,
        linkedin: ambassador.linkedin || '',
        instagram: ambassador.instagram || '',
        city: ambassador.city,
        state: ambassador.state,
        avatar: ambassador.avatar,
        srid: ambassador.srid,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
