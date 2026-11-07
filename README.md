# SkillRock Student Ambassador Portal

> **Production-ready, dedicated web portal for approved SkillRock Student Ambassadors and Program Administrators.**  
> Inspired by the Google Student Ambassador (GSA) portal architecture, crafted with official SkillRock brand identity (`#4F46E5` violet, `#F97316` orange, `#0F172A` navy, and modern light card design).

---

## 🌟 Overview

The **SkillRock Student Ambassador Portal (SSAP)** provides approved campus ambassadors with a personalized dashboard to track monthly leadership tasks, view live rankings, monitor paid course referral sales, and claim milestone rewards. 

Platform administrators can manage the entire ambassador lifecycle, review task proofs, dynamically update tasks, adjust points with immutable audit logs, and convert applicants from the public SSAP application pool with a single click.

---

## 📸 Key Design & Architecture Highlights

Inspired by the **Google Student Ambassador Portal**:
- **Floating Score Pill**: Sticky header displaying live ambassador score (e.g., `Score: 2025 pts`).
- **Floating Card Sidebar**: Clean left navigation (Home, Tasks, About & Rewards, My Score, Leaderboard, My Sales, Profile, Logout).
- **Vibrant Hero Card**: Gradient banner showing Ambassador First Name, Unique SRID (`SR1001`), Rank (`#12`), and Tier Badge card (*The Architect / Gold Badge*).
- **2×2 Dynamic Task Grid**: 4 monthly challenges with "MONTH'S BRIEF", mandatory/optional badges, proof submission forms, and review status.
- **Reward Structure Table**: Clean 4-tier milestone table (Bronze Explorer, Silver Navigator, Gold Architect, Sapphire Visionary) displaying points, e-vouchers, physical gear, and digital badges.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Responsive on mobile, tablet, and desktop (`Port 5174`) |
| **Backend API** | Node.js, Express, TypeScript | REST API with JWT auth, bcrypt, multer file uploads (`Port 5001`) |
| **Database** | MongoDB Atlas (`ssap_campus_db`) | Live Atlas cluster, indexed models, audit-logged points |
| **Course Checkout** | Integration API | `/api/sales/validate-srid/:srid` & `/api/sales/record-sale` |

---

## 🚀 Key Features

### 1. Ambassador Experience
- **Secure Authentication**: Email and password login, token-based forgot password & reset flow.
- **Personalized Dashboard**: Name, SRID, badge tier, rank, completed tasks counter, sales tally, and recent points activity.
- **Dynamic 4-Task Pipeline**:
  - Task 1: Product Trials (*Fest Stall Challenge: Build Night With Nano Banana*)
  - Task 2: Content Creation (*Campus Reel: Turn a Random Idea Into a Visualized Brand*)
  - Task 3: Monthly Highlights (*LinkedIn Ambassador Growth Journey*)
  - Task 4: Product Understanding (*Product Usability Walkthrough & Feedback Survey*)
- **Configurable Proof Submission**: Supports text summaries, links (Reels, LinkedIn, Google Drive), and uploaded photos/PDFs.
- **Points & Real-Time Leaderboard**: Live rankings with top 3 podium highlight (Gold, Silver, Bronze) and search filtering.
- **Course Referral & Sales Attribution**: Unique SRID attribution for SkillRock courses (e.g. ₹199 Python Programming Course), earning 20% commission (₹39.80 per sale) upon verified payment.
- **My Points Ledger**: Immutable audit log of every point transaction with timestamps and reasons.
- **About & Rewards**: Full breakdown of reward tiers, e-vouchers, and physical swag.

### 2. Admin Console (`/admin`)
- **Executive Dashboard**: Real-time metrics on ambassadors, pending tasks, approved submissions, course revenue, and commission payable.
- **Ambassador Management**: Add new ambassadors, edit details, adjust points, suspend/activate, and search by SRID or college.
- **1-Click Applicant Conversion**: Directly browse the 14 submitted applications from MongoDB Atlas and activate them into ambassadors with auto-generated SRIDs and welcome bonuses!
- **Task Management**: Dynamic CRUD for tasks, points, deadlines, instructions, and allowed submission formats.
- **Submission Reviews**: Review submitted proofs, view uploaded files/links, approve with automatic atomic points award, or reject with feedback.
- **Sales & Commission Engine**: View all course sales across SRIDs, manage commission payouts, and filter by payment status.
- **Reward Tiers & Settings**: Edit points thresholds and commission rates (default 20%).

---

## 🏃 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection string (pre-configured in `.env.example`)

### 1. Run the Backend API
```bash
cd backend
npm install
npm run build
npm start
# Server starts on http://localhost:5001
```

### 2. Run the Frontend App
```bash
cd frontend
npm install
npm run dev
# Web app starts on http://localhost:5174
```

---

## 🔑 Default Credentials

### Program Admin
- **URL**: `http://localhost:5174/admin/login`
- **Email**: `admin@skillrock.in`
- **Password**: `Admin@SSAP2026!`

### Test Ambassador
- **URL**: `http://localhost:5174/login`
- **Email**: `aarav.sharma@iitb.ac.in` (or any converted applicant)
- **Password**: `SkillRock@2026`

---

## 🧪 Automated End-to-End Verification

The backend includes a comprehensive 15-assertion test suite in `backend/src/tests/test_e2e.ts`:

```bash
cd backend
npm test
```

**Results:**
- ✅ Admin account existence & bcrypt hash verification
- ✅ Dynamic 4 task slots validation
- ✅ Unique sequential SRID generation (`SR1001`, `SR1002`...)
- ✅ Ambassador account creation & authentication
- ✅ Task proof submission flow
- ✅ Submission review & atomic points awarding
- ✅ Immutable `PointsTransaction` audit record creation
- ✅ Course sale referral attribution (20% commission on ₹199 course)
- ✅ Anti-replay duplicate sale protection
- ✅ 1-Click applicant conversion from MongoDB Atlas

---

## 📄 License

Proprietary © 2026 SkillRock Platform. All rights reserved.
