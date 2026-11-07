import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardTier extends Document {
  monthLabel?: string;
  tierCategory: string;
  pointsRequired: number;
  physicalRewards: string;
  digitalRewards: string;
  badgeColor: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rewardTierSchema = new Schema<IRewardTier>(
  {
    monthLabel: {
      type: String,
      default: 'MONTH 1',
    },
    tierCategory: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pointsRequired: {
      type: Number,
      required: true,
      min: 0,
    },
    physicalRewards: {
      type: String,
      required: true,
    },
    digitalRewards: {
      type: String,
      required: true,
    },
    badgeColor: {
      type: String,
      default: '#6366F1',
    },
    orderIndex: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

rewardTierSchema.index({ pointsRequired: 1 });

export const RewardTier = mongoose.model<IRewardTier>('RewardTier', rewardTierSchema);
