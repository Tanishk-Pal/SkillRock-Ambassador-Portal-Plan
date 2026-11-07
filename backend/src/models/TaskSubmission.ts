import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface ITaskSubmission extends Document {
  taskId: mongoose.Types.ObjectId;
  ambassadorId: mongoose.Types.ObjectId;
  srid: string;
  submissionData: {
    textResponse?: string;
    links?: string[];
    filePaths?: string[];
    videoUrl?: string;
  };
  status: SubmissionStatus;
  awardedPoints: number;
  adminFeedback?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
  resubmissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSubmissionSchema = new Schema<ITaskSubmission>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
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
    submissionData: {
      textResponse: { type: String, default: '' },
      links: { type: [String], default: [] },
      filePaths: { type: [String], default: [] },
      videoUrl: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted',
      index: true,
    },
    awardedPoints: {
      type: Number,
      default: 0,
    },
    adminFeedback: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewedAt: Date,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    resubmissionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

taskSubmissionSchema.index({ taskId: 1, ambassadorId: 1, createdAt: -1 });

export const TaskSubmission = mongoose.model<ITaskSubmission>('TaskSubmission', taskSubmissionSchema);
