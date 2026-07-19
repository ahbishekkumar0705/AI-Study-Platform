import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  User,
  ShieldAlert,
  Lock,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const Profile = () => {
  const { user, updateUserProfile, deleteUserAccount } = useAuth();
  const navigate = useNavigate();

  // Username form
  const [username, setUsername] = useState(user?.username || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account form
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Pre-selected premium avatars list
  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150', // Male default
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', // Female default
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150', // Professional
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', // Casual female
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=150', // Cartoonish boy
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150'  // Artistic female
  ];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      await updateUserProfile(username, profilePicture);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    try {
      const response = await api.put('/profile/password', { currentPassword, newPassword });
      setPasswordSuccess(response.data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Password change failed.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return;
    if (!window.confirm('WARNING: Are you absolutely sure? This action is permanent and cannot be undone. All documents, study metrics, index vectors, and quiz profiles will be deleted forever.')) return;

    setDeleteError('');
    setDeleteLoading(true);

    try {
      await deleteUserAccount();
      navigate('/');
    } catch (err) {
      setDeleteError(err);
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Profile Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Modify credentials, change profile avatars, or permanently delete your account database.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section 1: Edit Profile details */}
          <div className="p-8 rounded-3xl glass-card space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Personal Info
            </h3>

            {profileError && <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold">{profileError}</div>}
            {profileSuccess && <div className="p-3 bg-green-500/10 text-green-500 rounded-xl text-xs font-semibold">{profileSuccess}</div>}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Choose Profile Avatar</label>
                <div className="flex flex-wrap gap-3">
                  {avatars.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setProfilePicture(url)}
                      className={`h-11 w-11 rounded-full overflow-hidden transition-all relative ${
                        profilePicture === url ? 'ring-4 ring-indigo-500 scale-105' : 'hover:scale-105'
                      }`}
                    >
                      <img src={url} alt="avatar option" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                />
              </div>

              {/* Email Address Read-Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Email Address (Primary)</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-3 bg-slate-200/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 rounded-xl text-sm text-slate-400 opacity-70 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all"
              >
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Details'}
              </button>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div className="p-8 rounded-3xl glass-card space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-500" />
              Security credentials
            </h3>

            {passwordError && <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold">{passwordError}</div>}
            {passwordSuccess && <div className="p-3 bg-green-500/10 text-green-500 rounded-xl text-xs font-semibold">{passwordSuccess}</div>}

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all"
              >
                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Section 3: Delete Account (Hazard Panel) */}
        <div className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-500">Hazard Zone: Delete Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Deleting your account is permanent. It unlinks physical file uploads from disk, deletes all indexing embeddings from vector stores, and clears quizzes, flashcards, chats, and progress files.
              </p>
            </div>
          </div>

          {deleteError && <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold">{deleteError}</div>}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 font-bold select-none">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700 h-4.5 w-4.5 cursor-pointer"
              />
              I understand that this action is permanent and non-reversible
            </label>

            <button
              onClick={handleDeleteAccount}
              disabled={!confirmDelete || deleteLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-red-600/10"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Delete Forever</>}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
