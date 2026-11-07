export interface Ambassador {
  id: string;
  _id?: string;
  srid: string;
  name: string;
  email: string;
  phone?: string;
  college: string;
  linkedin?: string;
  instagram?: string;
  city?: string;
  state?: string;
  avatar?: string;
  totalPoints: number;
  currentRank: number;
  badgeTier: string;
  badges: string[];
  activitiesCount: number;
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  role: 'ambassador';
}

export interface Task {
  _id: string;
  taskNumber: number;
  title: string;
  category: 'Product Trials' | 'Content Creation' | 'Monthly Highlights' | 'Product Understanding' | 'Campus Leadership';
  submissionType?: 'reel_challenge' | 'monthly_highlight' | 'campus_growth' | 'affiliate_sales' | 'custom';
  briefMonth: string;
  shortDescription: string;
  fullDescription: string;
  instructions: string[];
  points: number;
  deadline: string;
  isMandatory: boolean;
  allowedSubmissionTypes: ('text' | 'url' | 'image' | 'document' | 'video_url')[];
  submissionRequirements: string[];
  status: 'active' | 'draft' | 'archived';
  userStatus?: string;
  submission?: TaskSubmission | null;
}

export interface TaskSubmissionData {
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

export interface TaskSubmission {
  _id: string;
  taskId: string | any;
  ambassadorId: string | any;
  srid: string;
  submissionData: TaskSubmissionData;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  awardedPoints: number;
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  resubmissionCount: number;
  verifiedSalesSummary?: {
    totalPaidOrders: number;
    totalRevenue: number;
    totalCommission: number;
  };
}

export interface PointsTransaction {
  _id: string;
  ambassadorId: string;
  srid: string;
  amount: number;
  type: 'task_completion' | 'bonus' | 'deduction' | 'referral_sale' | 'manual_adjustment';
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

export interface CourseSale {
  _id: string;
  orderId: string;
  paymentId: string;
  courseId: string;
  courseName: string;
  coursePrice: number;
  srid: string;
  ambassadorName: string;
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'cancelled';
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: 'eligible' | 'approved' | 'paid' | 'void';
  buyerName?: string;
  buyerEmail?: string;
  saleTimestamp: string;
}

export interface RewardTier {
  _id: string;
  monthLabel?: string;
  tierCategory: string;
  pointsRequired: number;
  physicalRewards: string;
  digitalRewards: string;
  badgeColor: string;
  orderIndex: number;
  isActive: boolean;
}

export interface Application {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  college?: string;
  city?: string;
  state?: string;
  status: string;
  convertedToAmbassador?: boolean;
  ambassadorSrid?: string;
  createdAt: string;
}

export interface DashboardData {
  ambassador: Ambassador;
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
  };
  salesStats: {
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    pendingSales: number;
  };
  recentTransactions: PointsTransaction[];
}
