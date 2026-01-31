import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitAccessRequest, getAccessRequest } from '../../services/auth';

export default function AccessRequestForm() {
  const { user, refreshAuthState, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    schoolName: '',
    role: 'Head Coach',
    phone: '',
    howHeard: ''
  });

  // Check for existing request on mount
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const existingRequest = await getAccessRequest(user.email);
        if (existingRequest && existingRequest.status) {
          // Request exists, refresh auth state to move to appropriate screen
          refreshAuthState();
        }
      } catch (err) {
        console.warn("Error checking existing request:", err);
      }
      setChecking(false);
    };

    if (user?.email) {
      checkExisting();
    }
  }, [user?.email, refreshAuthState]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.schoolName) {
      setError('Please fill in your name and school name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Double-check for existing request before submitting
      const existingRequest = await getAccessRequest(user.email);
      if (existingRequest && existingRequest.status) {
        refreshAuthState();
        return;
      }

      await submitAccessRequest({
        ...formData,
        email: user.email,
        uid: user.uid,
      });

      // Refresh auth state to move to pending approval screen
      refreshAuthState();

    } catch (err) {
      console.error('Error submitting request:', err);
      setError(`Failed to submit request: ${err.message || 'Unknown error'}. Please try again or contact support.`);
    }
    setLoading(false);
  };

  // Show loading while checking for existing request
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <div className="text-xl mb-4">Checking access status...</div>
          <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-lg shadow-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-sky-400">
          Request Access to DoFO
        </h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          Tell us about your program and we'll get you set up.
        </p>

        {error && (
          <div className="bg-red-900/50 text-red-300 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-slate-300 text-sm">Your Name *</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white placeholder-slate-500"
              placeholder="e.g. Coach Smith"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="schoolName" className="block mb-2 text-slate-300 text-sm">School / Program Name *</label>
            <input
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
              className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white placeholder-slate-500"
              placeholder="e.g. East Dillon High School"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="role" className="block mb-2 text-slate-300 text-sm">Your Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white"
              >
                <option value="Head Coach">Head Coach</option>
                <option value="Offensive Coordinator">Offensive Coordinator</option>
                <option value="Defensive Coordinator">Defensive Coordinator</option>
                <option value="Position Coach">Position Coach</option>
                <option value="Director of Operations">Director of Operations</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="phone" className="block mb-2 text-slate-300 text-sm">Phone (optional)</label>
              <input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white placeholder-slate-500"
                placeholder="555-123-4567"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="howHeard" className="block mb-2 text-slate-300 text-sm">How did you hear about us?</label>
            <select
              id="howHeard"
              name="howHeard"
              value={formData.howHeard}
              onChange={e => setFormData({ ...formData, howHeard: e.target.value })}
              className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white"
            >
              <option value="">Select...</option>
              <option value="Coaching Clinic">Coaching Clinic</option>
              <option value="Another Coach">Another Coach</option>
              <option value="Social Media">Social Media</option>
              <option value="Google Search">Google Search</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-400 text-slate-900 font-bold rounded-lg hover:bg-sky-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Request Access'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-xs">
          Signed in as {user?.email}
          <br />
          <button
            onClick={logout}
            className="text-slate-400 underline hover:text-slate-300 mt-2"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
