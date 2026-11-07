import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Ambassador Pages
import { Login } from './pages/ambassador/Login';
import { ForgotPassword } from './pages/ambassador/ForgotPassword';
import { ResetPassword } from './pages/ambassador/ResetPassword';
import { Dashboard } from './pages/ambassador/Dashboard';
import { Tasks } from './pages/ambassador/Tasks';
import { AboutRewards } from './pages/ambassador/AboutRewards';
import { Leaderboard } from './pages/ambassador/Leaderboard';
import { MySales } from './pages/ambassador/MySales';
import { MyPoints } from './pages/ambassador/MyPoints';
import { Profile } from './pages/ambassador/Profile';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AmbassadorManagement } from './pages/admin/AmbassadorManagement';
import { ApplicantConversion } from './pages/admin/ApplicantConversion';
import { TaskManagement } from './pages/admin/TaskManagement';
import { SubmissionsReview } from './pages/admin/SubmissionsReview';
import { SalesManagement } from './pages/admin/SalesManagement';
import { RewardsManagement } from './pages/admin/RewardsManagement';
import { CommissionSettings } from './pages/admin/CommissionSettings';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Ambassador Routes */}
          <Route element={<ProtectedRoute requiredRole="ambassador" />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/about" element={<AboutRewards />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/my-sales" element={<MySales />} />
            <Route path="/my-points" element={<MyPoints />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="ambassadors" element={<AmbassadorManagement />} />
              <Route path="applicants" element={<ApplicantConversion />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="submissions" element={<SubmissionsReview />} />
              <Route path="sales" element={<SalesManagement />} />
              <Route path="rewards" element={<RewardsManagement />} />
              <Route path="settings" element={<CommissionSettings />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
