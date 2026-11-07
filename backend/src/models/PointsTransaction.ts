import mongoose, { Document, Schema } from 'mongoose';

export type PointsTransactionType =
  | 'task_completion'
  | 'bonus'
  | 'deduction'
  | 'referral_sale'
  | 'manual_adjustment';

export interface IPointsTransaction extends Document {
  ambassadorId: mongoose.Types.ObjectId;
  srid: string;
  amount: number;
  type: PointsTransactionType;
  reason: string;
  relatedTaskId?: mongoose.Types.ObjectId;
  relatedSubmissionId?: mongoose.Types.ObjectId;
  relatedSaleId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  balanceAfter: number;
  createdAt: Date;
}

const pointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    ambassadorId: {
      type: Schema.Types.ObjectId,
      ref: 'Ambassador',
      required: true,
      index: true,
    },
    srid: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['task_completion', 'bonus', 'deduction', 'referral_sale', 'manual_adjustment'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    relatedSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskSubmission',
    },
    relatedSaleId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseSale',
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pointsTransactionSchema.index({ ambassadorId: 1, createdAt: -1 });

export const PointsTransaction = mongoose.model<IPointsTransaction>(
  'PointsTransaction',
  pointsTransactionSchema
);
