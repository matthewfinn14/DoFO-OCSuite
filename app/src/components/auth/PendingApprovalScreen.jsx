import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PendingApprovalScreen() {
  const { user, accessRequest, logout, refreshAuthState } = useAuth();

  const submittedDate = accessRequest?.requestedAt
    ? new Date(accessRequest.requestedAt).toLocaleDateString()
    : 'recently';

  // Poll for approval status changes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAuthState();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [refreshAuthState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-lg text-center shadow-2xl">
        <div className="text-6xl mb-4">&#8987;</div>

        <h1 className="text-2xl font-bold mb-2 text-sky-400">
          Request Pending
        </h1>

        <p className="text-slate-400 mb-6">
          Thanks for your interest in DoFO! We received your request on {submittedDate} and will review it shortly.
        </p>

        <div className="bg-slate-900/50 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold text-slate-300 mb-3">Your Request Details:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="text-slate-300">{accessRequest?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">School:</span>
              <span className="text-slate-300">{accessRequest?.schoolName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role:</span>
              <span className="text-slate-300">{accessRequest?.role || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-300">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <p className="text-amber-300 text-sm">
            We typically respond within 24-48 hours. Check your email for updates!
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={refreshAuthState}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm"
          >
            Check Status
          </button>
          <button
            onClick={logout}
            className="px-6 py-2 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-800 text-sm"
          >
            Sign Out
          </button>
        </div>

        <p className="text-slate-600 text-xs mt-6">
          Questions? Contact us at support@digitaldofo.com
        </p>
      </div>
    </div>
  );
}
