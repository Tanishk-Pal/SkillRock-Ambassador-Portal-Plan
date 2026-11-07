import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import { Admin } from '../models/Admin';
import { Ambassador } from '../models/Ambassador';
import { Task } from '../models/Task';
import { RewardTier } from '../models/RewardTier';
import { CommissionSetting } from '../models/CommissionSetting';
import { recalculateAllRanks } from '../services/pointsService';

dotenv.config();

export const seedDatabase = async () => {
  await connectDB();
  console.log('[Seed] Initializing database defaults...');

  // 1. Admin Account Configuration
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@skillrock.in').toLowerCase().trim();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'SkillRock@Admin2026';
  const passwordHash = await bcrypt.hash(password, 12);

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({
      email: adminEmail,
      passwordHash,
      name: 'SSAP Admin',
      role: 'superadmin',
    });
    console.log(`[Seed] Created Admin account: ${adminEmail}`);
  } else {
    existingAdmin.passwordHash = passwordHash;
    await existingAdmin.save();
    console.log(`[Seed] Updated Admin credentials for: ${adminEmail}`);
  }

  // Also ensure secondary admin matches configured password if set
  if (process.env.ADMIN_DEFAULT_PASSWORD) {
    const customAdmin = await Admin.findOne({ email: adminEmail });
    if (customAdmin) {
      customAdmin.passwordHash = passwordHash;
      await customAdmin.save();
    }
  }

  // 2. Initial 4 Dynamic Tasks
  const taskCount = await Task.countDocuments();
  if (taskCount === 0) {
    const initialTasks = [
      {
        taskNumber: 1,
        title: 'Fest Stall Challenge: Build Night With Nano Banana',
        category: 'Product Trials',
        briefMonth: "MONTH'S BRIEF",
        shortDescription: 'Every month, we drop a new Fun Night theme - a SkillRock Feature, wild creative brief, and one mission: get your campus to make something.',
        fullDescription: 'Host a mini 2-hour "Build Night" workshop on your campus or in your hostel study area. Introduce your peers to SkillRock\'s Learn & Build courses. Have at least 5 students complete a hands-on coding task and submit their project repository or live deployment.',
        instructions: [
          'Choose a quiet hall, classroom, or virtual Google Meet room for your session.',
          'Walk participants through creating their free SkillRock account at skillrock.onrender.com.',
          'Guide them to start the Python or Web Engineering module.',
          'Take 2-3 clear photographs of the session or screenshot of the Meet room.',
          'Collect feedback from at least 3 participants.',
          'Submit the photos, participant list/emails, and a short summary of how the night went.',
        ],
        points: 500,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
        isMandatory: true,
        allowedSubmissionTypes: ['text', 'url', 'image'],
        submissionRequirements: [
          'Summary of session (minimum 100 words)',
          'Public Google Drive link or photos of attendees',
          'List of participant names & college emails',
        ],
        status: 'active',
      },
      {
        taskNumber: 2,
        title: 'Campus Reel: Turn a Random Idea Into a Real Visualized Brand',
        category: 'Content Creation',
        briefMonth: "MONTH'S BRIEF",
        shortDescription: 'Every month we drop a theme. You make a reel, post it, and show the world what SkillRock students can actually build.',
        fullDescription: 'Create a creative, high-energy 30-60 second Instagram Reel or LinkedIn video showcasing how SkillRock bridges student curiosity into deployable tech skills. Highlight your verified Ambassador ID (SRID) in the caption or video description.',
        instructions: [
          'Record in good lighting with clear audio (9:16 vertical video).',
          'Showcase your student ambassador badge or the SkillRock learning dashboard.',
          'Use official hashtags: #SkillRock #StudentAmbassador #LearnAndBuild #TechCampus',
          'Include your unique SRID in the caption for peer course enrollment attribution.',
          'Post on Instagram or LinkedIn and keep the post public.',
          'Submit your post link and a screenshot of the video metrics.',
        ],
        points: 600,
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        isMandatory: true,
        allowedSubmissionTypes: ['url', 'video_url', 'image'],
        submissionRequirements: [
          'Direct public link to the Reel / Post',
          'Screenshot of the post showing views/engagement',
          'Short note on audience response',
        ],
        status: 'active',
      },
      {
        taskNumber: 3,
        title: 'Monthly Highlights: Document Your Ambassador Growth Journey',
        category: 'Monthly Highlights',
        briefMonth: "MONTH'S BRIEF",
        shortDescription: 'Every month, post about your ambassador journey on LinkedIn — your wins, your events, your growth. Any format works: reel, static post, or carousel.',
        fullDescription: 'Write a reflective professional post on LinkedIn documenting your milestones as a SkillRock Student Ambassador. Share key learnings from campus leadership, student mentorship, and technological skills gained.',
        instructions: [
          'Craft an authentic post on LinkedIn with 150-300 words.',
          'Tag SkillRock and mention the Student Ambassador Program.',
          'Include an engaging photo, graphic, or carousel slide.',
          'Tag at least 2 peers or campus club members who joined you.',
          'Submit the URL of your live LinkedIn post.',
        ],
        points: 400,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isMandatory: true,
        allowedSubmissionTypes: ['url', 'text'],
        submissionRequirements: [
          'Live LinkedIn post URL',
          'Brief excerpt of key reader comments received',
        ],
        status: 'active',
      },
      {
        taskNumber: 4,
        title: 'Product Understanding: Feature Walkthrough & Student Feedback Survey',
        category: 'Product Understanding',
        briefMonth: "MONTH'S BRIEF",
        shortDescription: 'Introduce 3 student participants to SkillRock in Chrome, walk them through its features, and log their response by asking them to fill pre and post survey forms.',
        fullDescription: 'Conduct a 1-on-1 or small group usability walkthrough of the SkillRock learning player and course catalog. Gather raw, unbiased feedback regarding the platform navigation, course video speed, and project submissions to help SkillRock engineers improve the UX.',
        instructions: [
          'Choose 3 students who are beginners or exploring tech.',
          'Ask them to browse skillrock.onrender.com/learning/courses and attempt the first lesson.',
          'Observe any friction points (login, video playback, course layout).',
          'Have them fill a quick feedback form or answer 4 questions.',
          'Synthesize their feedback into a structured bulleted summary.',
        ],
        points: 300,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isMandatory: false,
        allowedSubmissionTypes: ['text', 'document', 'url'],
        submissionRequirements: [
          'Structured UX feedback report (minimum 3 actionable suggestions)',
          'Participants names & feedback quotes',
        ],
        status: 'active',
      },
    ];

    await Task.insertMany(initialTasks);
    console.log('[Seed] Inserted 4 initial dynamic task slots.');
  }

  // 3. Reward Tiers
  const rewardTierCount = await RewardTier.countDocuments();
  if (rewardTierCount === 0) {
    const defaultTiers = [
      {
        tierCategory: 'The Explorer (Bronze)',
        pointsRequired: 600,
        physicalRewards: '₹500 e-voucher + Premium SkillRock Diary',
        digitalRewards: 'Bronze Ambassador Badge & Digital Credential',
        badgeColor: '#CD7F32',
        orderIndex: 1,
        isActive: true,
      },
      {
        tierCategory: 'The Navigator (Silver)',
        pointsRequired: 1200,
        physicalRewards: '₹500 e-voucher + SkillRock Tech Sling Bag',
        digitalRewards: 'Silver Ambassador Badge & Verified Credential',
        badgeColor: '#94A3B8',
        orderIndex: 2,
        isActive: true,
      },
      {
        tierCategory: 'The Architect (Gold)',
        pointsRequired: 1800,
        physicalRewards: '₹1000 e-voucher + Matt Black Insulated Bottle',
        digitalRewards: 'Gold Ambassador Badge & Leadership Certificate',
        badgeColor: '#F59E0B',
        orderIndex: 3,
        isActive: true,
      },
      {
        tierCategory: 'The Visionary (Sapphire)',
        pointsRequired: 2400,
        physicalRewards: '₹1000 e-voucher + Exclusive SkillRock Varsity Jacket',
        digitalRewards: 'Sapphire Ambassador Badge & Letter of Recommendation',
        badgeColor: '#3B82F6',
        orderIndex: 4,
        isActive: true,
      },
    ];
    await RewardTier.insertMany(defaultTiers);
    console.log('[Seed] Inserted 4 default reward tiers.');
  }

  // 4. Commission Settings
  const commissionCount = await CommissionSetting.countDocuments();
  if (commissionCount === 0) {
    await CommissionSetting.create({
      defaultRatePercent: 20,
      fixedCommissionPerCourse: 0,
      eligibilityRules: '20% commission on verified paid course enrolments. Cancelled or refunded orders are void.',
    });
    console.log('[Seed] Initialized 20% default commission settings.');
  }

  // 5. Backfill SRID and Default Password for existing Ambassadors if needed
  const ambassadors = await Ambassador.find();
  const defaultPasswordHash = await bcrypt.hash('SkillRock@2026', 12);
  let updatedCount = 0;

  for (let i = 0; i < ambassadors.length; i++) {
    const amb = ambassadors[i];
    let dirty = false;

    if (!amb.srid || amb.srid.trim() === '') {
      amb.srid = `SR${1001 + i}`;
      dirty = true;
    }
    if (!amb.passwordHash || amb.passwordHash.trim() === '') {
      amb.passwordHash = defaultPasswordHash;
      dirty = true;
    }
    if (dirty) {
      await amb.save();
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`[Seed] Backfilled SRID and default password for ${updatedCount} ambassadors.`);
  }

  // 6. Recalculate ranks
  await recalculateAllRanks();
  console.log('[Seed] Database initialization complete!');
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
