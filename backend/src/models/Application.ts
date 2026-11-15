import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  university?: string;
  degree?: string;
  year?: string;
  branch?: string;
  city: string;
  state: string;
  preferredLanguage?: string;
  weeklyAvailability?: string;
  whyAmbassador?: string;
  personalGoal?: string;
  skillrockValue?: string;
  priorExperience?: string;
  priorExperienceDescription?: string;
  videoType?: 'link' | 'upload';
  videoUrl?: string;
  videoFilePath?: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interview' | 'selected' | 'not_selected';
  convertedToAmbassador?: boolean;
  ambassadorSrid?: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    applicationId: { type: String },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    college: { type: String },
    university: { type: String },
    degree: { type: String },
    year: { type: String },
    branch: { type: String },
    city: { type: String },
    state: { type: String },
    preferredLanguage: { type: String },
    weeklyAvailability: { type: String },
    whyAmbassador: { type: String },
    personalGoal: { type: String },
    skillrockValue: { type: String },
    priorExperience: { type: String },
    priorExperienceDescription: { type: String },
    videoType: { type: String, enum: ['link', 'upload'] },
    videoUrl: { type: String },
    videoFilePath: { type: String },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'interview', 'selected', 'not_selected'],
      default: 'submitted',
    },
    convertedToAmbassador: { type: Boolean, default: false },
    ambassadorSrid: { type: String },
    submittedAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
