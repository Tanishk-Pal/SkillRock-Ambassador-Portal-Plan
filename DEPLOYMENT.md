# SkillRock Ambassador Portal — Deployment Guide

This guide details deploying the SkillRock Student Ambassador Portal to production using **Render** (Backend API) and **Vercel** (Frontend Web App).

---

## 1. Backend Deployment (Render)

1. Create a **New Web Service** on Render connected to `SkillRock-Ambassador-Portal-Plan`.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Environment Variables:
   - `PORT`: `5001`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.nkgqyg5.mongodb.net/?retryWrites=true&w=majority`
   - `MONGODB_DB_NAME`: `ssap_campus_db`
   - `JWT_SECRET`: `<secure-random-64-char-string>`
   - `ADMIN_EMAIL`: `admin@skillrock.in`
   - `ADMIN_DEFAULT_PASSWORD`: `<strong-admin-password>`
   - `FRONTEND_URL`: `https://skillrock-ambassador.vercel.app`
   - `DEFAULT_COMMISSION_PERCENT`: `20`

---

## 2. Frontend Deployment (Vercel)

1. Import GitHub Repository `SkillRock-Ambassador-Portal-Plan` into Vercel.
2. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Rewrite Rule in `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://your-render-backend.onrender.com/api/$1" },
       { "source": "/uploads/(.*)", "destination": "https://your-render-backend.onrender.com/uploads/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 3. Production Verification Checklist

- [ ] Admin logs in at `/admin/login` using credentials.
- [ ] 1-Click activation tested on an applicant at `/admin/applicants`.
- [ ] Ambassador logs in at `/login` with assigned SRID.
- [ ] Task proof submission verified at `/tasks`.
- [ ] Task review and atomic points awarding tested at `/admin/submissions`.
- [ ] Leaderboard live recalculation verified at `/leaderboard`.
- [ ] Course referral attribution tested via `/api/sales/record-sale`.
