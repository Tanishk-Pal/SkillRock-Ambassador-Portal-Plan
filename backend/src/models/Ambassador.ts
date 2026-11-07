import mongoose, { Document, Model, Schema } from 'mongoose';

export type BadgeTier = string;
export type AmbassadorStatus = 'active' | 'inactive' | 'suspended';

export interface IAmbassador extends Document {
  srid: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  college: string;
  city?: string;
  state?: string;
  avatar?: string;
  totalPoints: number;
  currentRank: number;
  badgeTier: BadgeTier | null;
  badges: string[];
  activitiesCount: number;
  status: AmbassadorStatus;
  applicationId?: mongoose.Types.ObjectId | string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  recalculateBadgeTier(): BadgeTier | null;
}

export interface IAmbassadorModel extends Model<IAmbassador> {
  calculateBadgeTier(points: number): BadgeTier | null;
}

const ambassadorSchema = new Schema<IAmbassador, IAmbassadorModel>(
  {
    srid: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false, // Can be generated upon initial activation
    },
    phone: {
      type: String,
      trim: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'India',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    currentRank: {
      type: Number,
      default: 1,
    },
    badgeTier: {
      type: String,
      default: 'The Explorer',
    },
    badges: {
      type: [String],
      default: ['The Explorer'],
    },
    activitiesCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ambassadorSchema.statics.calculateBadgeTier = function (points: number): BadgeTier | null {
  if (points >= 2400) return 'SkillRock Champ';
  if (points >= 1800) return 'The Changemaker';
  if (points >= 1200) return 'The Trailblazer';
  if (points >= 600) return 'The Explorer';
  return 'The Explorer';
};

ambassadorSchema.methods.recalculateBadgeTier = function (): BadgeTier | null {
  const tier = (this.constructor as IAmbassadorModel).calculateBadgeTier(this.totalPoints);
  this.badgeTier = tier;
  if (tier && !this.badges.includes(tier)) {
    this.badges.push(tier);
  }
  return tier;
};

export const Ambassador = mongoose.model<IAmbassador, IAmbassadorModel>('Ambassador', ambassadorSchema);
