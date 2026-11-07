import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface ITaskSubmissionData {
  submissionType?: 'reel_challenge' | 'monthly_highlight' | 'campus_growth' | 'affiliate_sales' | 'custom';
  // Reel Challenge
  instagramReelUrl?: string;
  linkedinPostUrl?: string;
  driveVideoUrl?: string;
  // Monthly Highlight
  driveCarouselUrl?: string;
  // Campus Growth
  studentsReached?: number;
  registrationsGenerated?: number;
  studentsLearningStarted?: number;
  driveVideoLinks?: string[];
  // Affiliate & Sales
  coursesPromotedCount?: number;
  salesGeneratedCount?: number;
  courseNames?: string;
  promotionalUrls?: string[];
  // Common / Legacy
  textResponse?: string;
  additionalComments?: string;
  links?: string[];
  filePaths?: string[];
  videoUrl?: string;
  [key: string]: any;
}

export interface ITaskSubmission extends Document {
  taskId: mongoose.Types.ObjectId;
  ambassadorId: mongoose.Types.ObjectId;
  srid: string;
  submissionData: ITaskSubmissionData;
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
      type: Schema.Types.Mixed,
      default: {},
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
