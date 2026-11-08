// frontend/tests/mock-api.mjs
// Authoritative mock API responses for E2E responsive testing

export const mockAmbassadorUser = {
  id: 'amb-1',
  _id: 'amb-1',
  srid: 'SR1001',
  name: 'Sarah Connor',
  email: 'sarah@skillrock.com',
  phone: '+1 (555) 234-5678',
  role: 'ambassador',
  totalPoints: 2450,
  currentRank: 3,
  badgeTier: 'The Explorer',
  college: 'Stanford University',
  city: 'San Francisco',
  state: 'CA',
  linkedin: 'https://linkedin.com/in/sarah-connor',
  instagram: 'https://instagram.com/sarah_c',
  avatar: '',
  badges: ['Top Performer', 'Campus Lead'],
  activitiesCount: 14,
  status: 'active',
  joinedAt: '2026-01-15T00:00:00.000Z',
};

export const mockDashboardData = {
  ambassador: mockAmbassadorUser,
  taskStats: {
    totalTasks: 12,
    completedTasks: 8,
    pendingTasks: 2,
    approvedSubmissions: 7,
    rejectedSubmissions: 1,
  },
  salesStats: {
    totalSales: 15,
    totalRevenue: 45000,
    totalCommission: 6750,
    pendingSales: 1,
  },
  recentTransactions: [
    {
      _id: 'tx-1',
      ambassadorId: 'amb-1',
      srid: 'SR1001',
      amount: 250,
      type: 'task_completion',
      reason: 'Campus Workshop Reels',
      balanceAfter: 2450,
      createdAt: '2026-11-01T10:00:00.000Z',
    },
    {
      _id: 'tx-2',
      ambassadorId: 'amb-1',
      srid: 'SR1001',
      amount: 500,
      type: 'referral_sale',
      reason: 'Full Stack Web Dev Referral',
      balanceAfter: 2200,
      createdAt: '2026-10-28T14:30:00.000Z',
    },
  ],
};

export const mockTasks = [
  {
    _id: 'task-101',
    taskNumber: 1,
    title: 'Instagram Campus Reel Challenge',
    category: 'Content Creation',
    submissionType: 'reel_challenge',
    briefMonth: 'November 2026',
    shortDescription: 'Create a 30s reel showcasing SkillRock courses to campus peers.',
    fullDescription: 'Post an engaging reel with #SkillRockCampus and tag @skillrockedu on Instagram.',
    instructions: ['Film in campus library or lab', 'Tag official account @skillrockedu', 'Submit link here'],
    points: 300,
    deadline: '2026-11-30T23:59:59.000Z',
    isMandatory: true,
    allowedSubmissionTypes: ['url'],
    submissionRequirements: ['Public Instagram reel link'],
    status: 'active',
    userStatus: 'pending',
    submission: null,
  },
  {
    _id: 'task-102',
    taskNumber: 2,
    title: 'Peer Course Trial Feedback',
    category: 'Product Trials',
    submissionType: 'custom',
    briefMonth: 'November 2026',
    shortDescription: 'Gather feedback from 5 peers on the Python course trial module.',
    fullDescription: 'Collect constructive feedback on UX, content quality, and quizzes from fellow students.',
    instructions: ['Interview 5 peers', 'Fill the feedback summary form'],
    points: 200,
    deadline: '2026-11-25T23:59:59.000Z',
    isMandatory: false,
    allowedSubmissionTypes: ['text'],
    submissionRequirements: ['Summary of peer feedback'],
    status: 'active',
    userStatus: 'approved',
    submission: {
      _id: 'sub-102',
      taskId: 'task-102',
      ambassadorId: 'amb-1',
      srid: 'SR1001',
      submissionData: { textResponse: '5 peer interviews completed with positive feedback on Python quizzes.' },
      status: 'approved',
      awardedPoints: 200,
      submittedAt: '2026-11-05T12:00:00.000Z',
      resubmissionCount: 0,
    },
  },
];

export const mockRewards = [
  {
    _id: 'rew-1',
    monthLabel: 'November 2026',
    tierCategory: 'Tier 1: Bronze',
    pointsRequired: 500,
    physicalRewards: 'SkillRock Swag Pack (Stickers, Pen, Bottle)',
    digitalRewards: 'Certificate of Recognition',
    badgeColor: 'bg-amber-600',
    orderIndex: 1,
    isActive: true,
  },
  {
    _id: 'rew-2',
    monthLabel: 'November 2026',
    tierCategory: 'Tier 2: Silver',
    pointsRequired: 1200,
    physicalRewards: 'SkillRock Hoodie + Tech Backpack',
    digitalRewards: 'LinkedIn Recommendation + Free Course Voucher',
    badgeColor: 'bg-slate-400',
    orderIndex: 2,
    isActive: true,
  },
  {
    _id: 'rew-3',
    monthLabel: 'November 2026',
    tierCategory: 'Tier 3: Gold',
    pointsRequired: 2500,
    physicalRewards: 'Noise Cancelling Wireless Headphones + Glass Trophy',
    digitalRewards: '1-on-1 Executive Mentorship + Priority Placement',
    badgeColor: 'bg-amber-400',
    orderIndex: 3,
    isActive: true,
  },
];

export const mockLeaderboard = [
  {
    _id: 'amb-top-1',
    name: 'David Miller',
    college: 'MIT',
    srid: 'SR1009',
    totalPoints: 3400,
    currentRank: 1,
    badgeTier: 'Diamond Ambassador',
  },
  {
    _id: 'amb-top-2',
    name: 'Emma Watson',
    college: 'Harvard University',
    srid: 'SR1004',
    totalPoints: 2980,
    currentRank: 2,
    badgeTier: 'Platinum Ambassador',
  },
  {
    _id: 'amb-1',
    name: 'Sarah Connor',
    college: 'Stanford University',
    srid: 'SR1001',
    totalPoints: 2450,
    currentRank: 3,
    badgeTier: 'Gold Ambassador',
  },
  {
    _id: 'amb-top-4',
    name: 'Liam Chen',
    college: 'UC Berkeley',
    srid: 'SR1012',
    totalPoints: 2100,
    currentRank: 4,
    badgeTier: 'Gold Ambassador',
  },
];

const mockTransactionsList = [
  {
    _id: 'pt-1',
    ambassadorId: 'amb-1',
    srid: 'SR1001',
    amount: 300,
    type: 'task_completion',
    reason: 'Reel Challenge Submission Approval',
    balanceAfter: 2450,
    createdAt: '2026-11-04T12:00:00.000Z',
  },
  {
    _id: 'pt-2',
    ambassadorId: 'amb-1',
    srid: 'SR1001',
    amount: 500,
    type: 'referral_sale',
    reason: 'Course Sale: Full Stack Web Dev',
    balanceAfter: 2150,
    createdAt: '2026-11-02T15:30:00.000Z',
  },
];

export const mockPointsHistory = {
  success: true,
  totalPoints: 2450,
  currentRank: 3,
  badgeTier: 'The Explorer',
  transactions: mockTransactionsList,
  pointsHistory: mockTransactionsList,
};

export const mockSales = {
  success: true,
  sales: [
    {
      _id: 'sale-1',
      orderId: 'ORD-9821',
      paymentId: 'PAY-112233',
      courseId: 'c-101',
      courseName: 'Full Stack Web Development Boot Camp',
      coursePrice: 4999,
      srid: 'SR1001',
      ambassadorName: 'Sarah Connor',
      paymentStatus: 'paid',
      commissionRate: 15,
      commissionAmount: 750,
      commissionStatus: 'approved',
      buyerName: 'John Doe',
      buyerEmail: 'john@example.com',
      saleTimestamp: '2026-11-02T15:30:00.000Z',
    },
    {
      _id: 'sale-2',
      orderId: 'ORD-9844',
      paymentId: 'PAY-112244',
      courseId: 'c-102',
      courseName: 'AI & Data Engineering Masterclass',
      coursePrice: 6999,
      srid: 'SR1001',
      ambassadorName: 'Sarah Connor',
      paymentStatus: 'paid',
      commissionRate: 15,
      commissionAmount: 1050,
      commissionStatus: 'eligible',
      buyerName: 'Alice Smith',
      buyerEmail: 'alice@example.com',
      saleTimestamp: '2026-11-04T18:15:00.000Z',
    },
  ],
  summary: {
    totalSales: 15,
    totalRevenue: 45000,
    totalCommission: 6750,
    paidCommission: 5000,
    pendingCommission: 1750,
  },
};

export function handleMockApiRequest(url) {
  const pathname = new URL(url).pathname;

  if (pathname.includes('/auth/me')) {
    return { success: true, user: mockAmbassadorUser };
  }
  if (pathname.includes('/ambassador/dashboard')) {
    return { success: true, dashboard: mockDashboardData };
  }
  if (pathname.includes('/tasks')) {
    return { success: true, tasks: mockTasks };
  }
  if (pathname.includes('/rewards')) {
    return { success: true, tiers: mockRewards, rewards: mockRewards };
  }
  if (pathname.includes('/leaderboard')) {
    return {
      success: true,
      topThree: mockLeaderboard.slice(0, 3),
      rankings: mockLeaderboard.slice(3),
      leaderboard: mockLeaderboard,
    };
  }
  if (pathname.includes('/ambassador/points')) {
    return mockPointsHistory;
  }
  if (pathname.includes('/ambassador/sales')) {
    return mockSales;
  }
  if (pathname.includes('/ambassador/profile')) {
    return { success: true, user: mockAmbassadorUser };
  }
  if (pathname.includes('/admin/dashboard')) {
    return {
      success: true,
      stats: {
        totalAmbassadors: 42,
        activeAmbassadors: 38,
        totalPointsAwarded: 84000,
        totalRevenue: 350000,
      },
    };
  }

  // Fallback for any other API route
  return { success: true };
}
