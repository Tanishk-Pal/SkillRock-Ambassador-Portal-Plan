import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'cancelled';
export type CommissionStatus = 'eligible' | 'approved' | 'paid' | 'void';

export interface ICourseSale extends Document {
  orderId: string;
  paymentId: string;
  courseId: string;
  courseName: string;
  coursePrice: number;
  ambassadorId: mongoose.Types.ObjectId;
  srid: string;
  ambassadorName: string;
  paymentStatus: PaymentStatus;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: CommissionStatus;
  buyerName?: string;
  buyerEmail?: string;
  saleTimestamp: Date;
  adminOverrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSaleSchema = new Schema<ICourseSale>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    courseId: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    coursePrice: {
      type: Number,
      required: true,
      min: 0,
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
    ambassadorName: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'refunded', 'cancelled'],
      default: 'paid',
      index: true,
    },
    commissionRate: {
      type: Number,
      default: 20, // 20%
    },
    commissionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    commissionStatus: {
      type: String,
      enum: ['eligible', 'approved', 'paid', 'void'],
      default: 'eligible',
      index: true,
    },
    buyerName: {
      type: String,
      trim: true,
      default: '',
    },
    buyerEmail: {
      type: String,
      trim: true,
      default: '',
    },
    saleTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    adminOverrideReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

courseSaleSchema.index({ srid: 1, paymentStatus: 1 });

export const CourseSale = mongoose.model<ICourseSale>('CourseSale', courseSaleSchema);
