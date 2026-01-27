import { useState, useRef, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { uploadSchoolLogo, deleteSchoolLogo } from '../services/storage';
import {
  Settings,
  Upload,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Palette,
  Sun,
  Moon
} from 'lucide-react';

export default function AccountSettings() {
  const { school, settings, updateSettings } = useSchool();
  const { currentSchool, isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  // Local state for settings
  const [accentColor, setAccentColor] = useState(settings?.accentColor || '#0ea5e9');
  const [theme, setTheme] = useState(settings?.theme || 'dark');

  // Sync local state with settings when they load/change
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
    if (settings?.accentColor) {
      setAccentColor(settings.accentColor);
    }
  }, [settings?.theme, settings?.accentColor]);

  // Admins can edit logo and accent color
  const canEditAdvanced = isHeadCoach || isTeamAdmin || isSiteAdmin;

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload to Firebase Storage and get URL
      const logoUrl = await uploadSchoolLogo(currentSchool.id, file);

      // Save URL to Firestore
      await updateSettings({ teamLogo: logoUrl });

      setSuccess('Logo uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the team logo?')) return;

    setUploading(true);
    setError(null);

    try {
      // Delete from Firebase Storage
      await deleteSchoolLogo(currentSchool.id);

      // Remove URL from Firestore
      await updateSettings({ teamLogo: null });

      setSuccess('Logo removed');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error removing logo:', err);
      setError(err.message || 'Failed to remove logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    setError(null);
    try {
      await updateSettings({
        accentColor,
        theme
      });
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={32} className="text-sky-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm">Customize your experience</p>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center gap-3">
          <Check size={20} className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-200">{success}</span>
        </div>
      )}

      {/* Theme Section - Available to all users */}
      <section className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette size={20} className="text-slate-400" />
          Display Theme
        </h2>

        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-4">Choose your preferred display mode.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Moon size={18} />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Sun size={18} />
              <span>Light</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Check size={18} />
          <span>Save Theme</span>
        </button>
      </section>

      {/* Team Logo Section - Admin only */}
      {canEditAdvanced && (
        <section className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-slate-400" />
            Team Logo
          </h2>

          <div className="flex items-start gap-6">
            {/* Current logo preview */}
            <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-600">
              {settings?.teamLogo ? (
                <img
                  src={settings.teamLogo}
                  alt="Team Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon size={32} className="text-slate-500" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-slate-400 text-sm mb-4">
                Upload your team logo. It will appear in the sidebar and on printed materials.
                Recommended size: 400x400px or larger. Max file size: 5MB.
              </p>

              <div className="flex gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 cursor-pointer transition-colors">
                  {uploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                {settings?.teamLogo && (
                  <button
                    onClick={handleRemoveLogo}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Accent Color Section - Admin only */}
      {canEditAdvanced && (
        <section className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette size={20} className="text-slate-400" />
            Accent Color
          </h2>

          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-4">
              Choose a custom accent color for your team's branding throughout the app.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-600"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm w-32"
                placeholder="#0ea5e9"
              />
              <div
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: accentColor }}
              >
                Preview
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Check size={18} />
            <span>Save Color</span>
          </button>
        </section>
      )}

      {/* School Info (Read-only) */}
      <section className="bg-slate-800/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">School Information</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-slate-400">School Name</dt>
            <dd className="text-white">{school?.name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-400">Mascot</dt>
            <dd className="text-white">{school?.mascot || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-400">School ID</dt>
            <dd className="text-slate-500 font-mono text-sm">{currentSchool?.id}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
