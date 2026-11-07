import mongoose, { Document, Schema } from 'mongoose';

export interface ICommissionSetting extends Document {
  defaultRatePercent: number;
  fixedCommissionPerCourse: number;
  effectiveDate: Date;
  eligibilityRules: string;
  courseSpecificRates: {
    courseId: string;
    ratePercent: number;
  }[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSettingSchema = new Schema<ICommissionSetting>(
  {
    defaultRatePercent: {
      type: Number,
      required: true,
      default: 20,
    },
    fixedCommissionPerCourse: {
      type: Number,
      default: 0,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    eligibilityRules: {
      type: String,
      default: 'Commission applies to verified paid course enrolments only. Cancelled or refunded orders are void.',
    },
    courseSpecificRates: [
      {
        courseId: String,
        ratePercent: Number,
      },
    ],
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

export const CommissionSetting = mongoose.model<ICommissionSetting>(
  'CommissionSetting',
  commissionSettingSchema
);
