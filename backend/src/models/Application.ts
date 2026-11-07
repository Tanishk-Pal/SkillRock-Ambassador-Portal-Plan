import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  city: string;
  state: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interview' | 'selected' | 'not_selected';
  convertedToAmbassador?: boolean;
  ambassadorSrid?: string;
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
    city: { type: String },
    state: { type: String },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'interview', 'selected', 'not_selected'],
      default: 'submitted',
    },
    convertedToAmbassador: { type: Boolean, default: false },
    ambassadorSrid: { type: String },
  },
  { timestamps: true }
);

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
