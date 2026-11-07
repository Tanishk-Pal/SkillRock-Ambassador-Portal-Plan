import mongoose from 'mongoose';
import { Ambassador } from '../models/Ambassador';
import { PointsTransaction, PointsTransactionType } from '../models/PointsTransaction';

export interface AwardPointsParams {
  ambassadorId: string | mongoose.Types.ObjectId;
  amount: number;
  type: PointsTransactionType;
  reason: string;
  relatedTaskId?: string | mongoose.Types.ObjectId;
  relatedSubmissionId?: string | mongoose.Types.ObjectId;
  relatedSaleId?: string | mongoose.Types.ObjectId;
  adminId?: string | mongoose.Types.ObjectId;
}

export const awardOrDeductPoints = async (params: AwardPointsParams) => {
  const amb = await Ambassador.findById(params.ambassadorId);
  if (!amb) {
    throw new Error('Ambassador not found');
  }

  // Calculate new total points (cannot go below 0)
  const newTotal = Math.max(0, amb.totalPoints + params.amount);
  amb.totalPoints = newTotal;
  amb.activitiesCount = (amb.activitiesCount || 0) + (params.amount > 0 ? 1 : 0);
  amb.recalculateBadgeTier();
  await amb.save();

  // Create immutable points audit transaction
  const tx = await PointsTransaction.create({
    ambassadorId: amb._id,
    srid: amb.srid,
    amount: params.amount,
    type: params.type,
    reason: params.reason,
    relatedTaskId: params.relatedTaskId,
    relatedSubmissionId: params.relatedSubmissionId,
    relatedSaleId: params.relatedSaleId,
    adminId: params.adminId,
    balanceAfter: newTotal,
  });

  // Re-rank all active ambassadors
  await recalculateAllRanks();

  return { ambassador: amb, transaction: tx };
};

export const recalculateAllRanks = async () => {
  const ambassadors = await Ambassador.find({ status: 'active' }).sort({ totalPoints: -1, createdAt: 1 });
  for (let i = 0; i < ambassadors.length; i++) {
    ambassadors[i].currentRank = i + 1;
    await ambassadors[i].save();
  }
};
