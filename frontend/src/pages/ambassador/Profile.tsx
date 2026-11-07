import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { ambassadorAPI } from '../../services/api';
import {
  User,
  Mail,
  School,
  MapPin,
  Phone,
  Shield,
  CheckCircle2,
  Linkedin,
  Instagram,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [college, setCollege] = useState(user?.college || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    // Validation
    if (!college.trim()) {
      setError('College name is required.');
      setLoading(false);
      return;
    }

    if (!linkedin.trim()) {
      setError('LinkedIn profile is mandatory. Please provide your public LinkedIn URL or handle.');
      setLoading(false);
      return;
    }

    if (!instagram.trim()) {
      setError('Instagram ID is mandatory. Please provide your public Instagram handle or link.');
      setLoading(false);
      return;
    }

    try {
      const res = await ambassadorAPI.updateProfile({
        college: college.trim(),
        linkedin: linkedin.trim(),
        instagram: instagram.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        avatar: avatar.trim(),
      });
      if (res.data.success) {
        setSuccess('Profile updated successfully! Your public IDs are now active on your dashboard.');
        await refreshUser();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Update failed:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        <Sidebar />

        <div className="flex-1 space-y-6">
          {/* Profile Header */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  user?.name?.charAt(0) || <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-indigo-600">{user?.srid}</span>
                  <span>•</span>
                  <span>{college || user?.college || 'College Campus'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Shield className="w-4 h-4" /> Verified Ambassador
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Campus & Public Social Profiles</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your college and social profiles are accurate. Both social profiles must be accessible to the public.
              </p>
            </div>

            {/* Mandatory Public Account Notice */}
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Mandatory Public Profile Policy:</strong>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Your LinkedIn and Instagram profiles must be set to <strong>Public</strong>. Private accounts cannot be verified by the SkillRock team, and task submissions (such as reels, event announcements, and highlights) will be marked as rejected.
                </p>
              </div>
            </div>

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5 max-w-xl">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm outline-none cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Locked to your verified ambassador record.</p>
              </div>

              {/* College / Institute */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  College / Institute Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    placeholder="e.g. Bansal College of Engineering"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Displayed in your dashboard and rankings.</p>
              </div>

              {/* LinkedIn Profile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>LinkedIn Profile <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Public Required
                  </span>
                </label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-[#0A66C2] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    required
                    placeholder="e.g. linkedin.com/in/yourname or yourname"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter your public LinkedIn URL or username (e.g. <span className="font-mono">https://linkedin.com/in/khushi</span>).
                </p>
              </div>

              {/* Instagram Handle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Instagram ID / Handle <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    No Private Accounts
                  </span>
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-[#E1306C] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    required
                    placeholder="e.g. @khushi or https://instagram.com/khushi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Must be public so administrators can verify your reels and event stories.
                </p>
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City & State
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bhopal, MP"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
                >
                  {loading ? 'Saving Changes...' : 'Save & Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
