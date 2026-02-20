import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useLogout } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  id: number;
  username: string;
  setupComplete: boolean;
  mode: string | null;
  sex: string | null;
  heightInches: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  age: number | null;
  activityLevel: string | null;
  dailyCalories: number | null;
  dailyProtein: number | null;
  waterGoalOz: number | null;
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  active: 'Active',
  very_active: 'Very Active',
};

const MODE_LABELS: Record<string, string> = {
  lose: 'Lose Weight',
  gain: 'Gain Weight',
  maintain: 'Maintain Weight',
};

function formatHeight(inches: number | null): string {
  if (inches == null) return '--';
  const ft = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${ft}'${remaining}"`;
}

export default function Profile() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    mode: 'lose' as string,
    sex: 'male' as string,
    heightInches: 66,
    currentWeight: 150,
    goalWeight: 140,
    age: 30,
    activityLevel: 'moderate' as string,
    waterGoalOz: 64,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Change password state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data } = await api.get('/profile');
      setProfile(data.user);
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  function openEditForm() {
    if (!profile) return;
    setEditForm({
      mode: profile.mode ?? 'lose',
      sex: profile.sex ?? 'male',
      heightInches: profile.heightInches ?? 66,
      currentWeight: profile.currentWeight ?? 150,
      goalWeight: profile.goalWeight ?? 140,
      age: profile.age ?? 30,
      activityLevel: profile.activityLevel ?? 'moderate',
      waterGoalOz: profile.waterGoalOz ?? 64,
    });
    setEditError(null);
    setEditing(true);
  }

  async function handleEditSave() {
    try {
      setEditSaving(true);
      setEditError(null);
      const { data } = await api.put('/profile', editForm);
      setProfile(data.user);
      setEditing(false);
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    try {
      setPasswordSaving(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      const { data } = await api.get('/nutrition/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weighttracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail - user will notice no download
    } finally {
      setExporting(false);
    }
  }

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-64 text-accent-red">
        {error || 'Failed to load profile'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-accent-gold">Profile & Settings</h1>

      {/* Account Info */}
      <div className="rpg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Account</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-muted">Username</span>
            <p className="text-text-primary font-medium">{profile.username}</p>
          </div>
          <div>
            <span className="text-text-muted">Member Since</span>
            <p className="text-text-primary font-medium">
              {user ? `User #${user.id}` : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Stats */}
      <div className="rpg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Character Stats</h2>
          <button
            onClick={openEditForm}
            className="px-4 py-1.5 bg-accent-gold text-bg-primary rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <StatItem label="Mode" value={profile.mode ? MODE_LABELS[profile.mode] || profile.mode : '--'} />
          <StatItem label="Sex" value={profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '--'} />
          <StatItem label="Height" value={formatHeight(profile.heightInches)} />
          <StatItem label="Current Weight" value={profile.currentWeight ? `${profile.currentWeight} lbs` : '--'} />
          <StatItem label="Goal Weight" value={profile.goalWeight ? `${profile.goalWeight} lbs` : '--'} />
          <StatItem label="Age" value={profile.age != null ? String(profile.age) : '--'} />
          <StatItem label="Activity" value={profile.activityLevel ? ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel : '--'} />
          <StatItem label="Daily Calories" value={profile.dailyCalories != null ? `${profile.dailyCalories} kcal` : '--'} highlight />
          <StatItem label="Daily Protein" value={profile.dailyProtein != null ? `${profile.dailyProtein}g` : '--'} highlight />
          <StatItem label="Water Goal" value={profile.waterGoalOz != null ? `${profile.waterGoalOz} oz (${profile.waterGoalOz / 8} glasses)` : '--'} />
        </div>
      </div>

      {/* Edit Profile Form */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rpg-card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-accent-gold mb-4">Edit Profile</h3>

            <div className="space-y-4">
              {/* Mode */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">Goal Mode</label>
                <select
                  value={editForm.mode}
                  onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                >
                  <option value="lose">Lose Weight</option>
                  <option value="gain">Gain Weight</option>
                  <option value="maintain">Maintain Weight</option>
                </select>
              </div>

              {/* Sex */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">Sex</label>
                <select
                  value={editForm.sex}
                  onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">
                  Height ({Math.floor(editForm.heightInches / 12)}'{editForm.heightInches % 12}")
                </label>
                <input
                  type="range"
                  min="48"
                  max="96"
                  value={editForm.heightInches}
                  onChange={(e) => setEditForm({ ...editForm, heightInches: parseInt(e.target.value) })}
                  className="w-full accent-accent-gold"
                />
              </div>

              {/* Current Weight */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">Current Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="700"
                  value={editForm.currentWeight}
                  onChange={(e) => setEditForm({ ...editForm, currentWeight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                />
              </div>

              {/* Goal Weight */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">Goal Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="700"
                  value={editForm.goalWeight}
                  onChange={(e) => setEditForm({ ...editForm, goalWeight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">Age</label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                />
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">Activity Level</label>
                <select
                  value={editForm.activityLevel}
                  onChange={(e) => setEditForm({ ...editForm, activityLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>

              {/* Water Goal */}
              <div>
                <label className="block text-text-secondary text-sm mb-1">
                  Water Goal ({editForm.waterGoalOz} oz / {editForm.waterGoalOz / 8} glasses)
                </label>
                <input
                  type="range"
                  min="32"
                  max="256"
                  step="8"
                  value={editForm.waterGoalOz}
                  onChange={(e) => setEditForm({ ...editForm, waterGoalOz: parseInt(e.target.value) })}
                  className="w-full accent-accent-gold"
                />
              </div>

              {editError && (
                <p className="text-accent-red text-sm">{editError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 bg-accent-gold text-bg-primary py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-bg-secondary text-text-secondary py-2 rounded-lg font-medium hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="rpg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
          {!showPassword && (
            <button
              onClick={() => {
                setShowPassword(true);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              className="px-4 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Change
            </button>
          )}
        </div>

        {showPassword && (
          <div className="space-y-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-hover rounded-lg text-text-primary focus:outline-none focus:border-accent-gold"
              />
            </div>

            {passwordError && <p className="text-accent-red text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-accent-green text-sm">{passwordSuccess}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="flex-1 bg-accent-gold text-bg-primary py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => {
                  setShowPassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="flex-1 bg-bg-secondary text-text-secondary py-2 rounded-lg font-medium hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rpg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Data & Account</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 bg-bg-secondary text-text-primary rounded-lg font-medium hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50 border border-bg-hover"
          >
            {exporting ? 'Exporting...' : 'Export Data (JSON)'}
          </button>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex-1 px-4 py-2.5 bg-accent-red/20 text-accent-red rounded-lg font-medium hover:bg-accent-red/30 transition-colors cursor-pointer disabled:opacity-50 border border-accent-red/30"
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className={`font-medium ${highlight ? 'text-accent-gold' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}
