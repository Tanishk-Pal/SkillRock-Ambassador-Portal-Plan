import mongoose, { Document, Schema } from 'mongoose';

export type TaskCategory =
  | 'Product Trials'
  | 'Content Creation'
  | 'Monthly Highlights'
  | 'Product Understanding'
  | 'Campus Leadership';

export type TaskSubmissionType =
  | 'reel_challenge'
  | 'monthly_highlight'
  | 'campus_growth'
  | 'affiliate_sales'
  | 'custom';

export type TaskStatus = 'active' | 'draft' | 'archived';

export interface ITask extends Document {
  taskNumber: number;
  title: string;
  category: TaskCategory;
  submissionType?: TaskSubmissionType;
  briefMonth: string;
  shortDescription: string;
  fullDescription: string;
  instructions: string[];
  points: number;
  deadline: Date;
  isMandatory: boolean;
  allowedSubmissionTypes: ('text' | 'url' | 'image' | 'document' | 'video_url')[];
  submissionRequirements: string[];
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    taskNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Product Trials',
        'Content Creation',
        'Monthly Highlights',
        'Product Understanding',
        'Campus Leadership',
      ],
      default: 'Product Trials',
    },
    submissionType: {
      type: String,
      enum: ['reel_challenge', 'monthly_highlight', 'campus_growth', 'affiliate_sales', 'custom'],
      default: 'custom',
    },
    briefMonth: {
      type: String,
      default: "MONTH'S BRIEF",
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    fullDescription: {
      type: String,
      required: true,
    },
    instructions: {
      type: [String],
      default: [],
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    deadline: {
      type: Date,
      required: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    allowedSubmissionTypes: {
      type: [String],
      enum: ['text', 'url', 'image', 'document', 'video_url'],
      default: ['text', 'url'],
    },
    submissionRequirements: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
