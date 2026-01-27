import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, LogOut, Mail } from 'lucide-react';

/**
 * Screen shown when a user's school trial/subscription has expired or been suspended
 */
export default function SubscriptionExpired({ school, subscriptionStatus }) {
  const { logout, user } = useAuth();

  const {
    isExpired,
    isSuspended,
    trialEndDate,
    daysRemaining
  } = subscriptionStatus || {};

  // Format the expiration date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Determine the message based on status
  const getStatusInfo = () => {
    if (isSuspended) {
      return {
        icon: <AlertCircle size={64} className="text-amber-400" />,
        title: 'Account Suspended',
        message: 'Your school\'s account has been suspended. Please contact your administrator for more information.',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-300'
      };
    }

    // Expired (including trial expired)
    const daysExpired = daysRemaining ? Math.abs(daysRemaining) : 0;
    return {
      icon: <Clock size={64} className="text-red-400" />,
      title: 'Your Trial Has Expired',
      message: trialEndDate
        ? `Your trial ended on ${formatDate(trialEndDate)}.`
        : 'Your trial period has ended.',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-300',
      daysExpired
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-lg text-center shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {statusInfo.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2 text-white">
          {statusInfo.title}
        </h1>

        {/* School name */}
        {school?.name && (
          <p className="text-slate-400 mb-4">
            {school.name} {school.mascot && `${school.mascot}`}
          </p>
        )}

        {/* Message */}
        <p className="text-slate-300 mb-6">
          {statusInfo.message}
        </p>

        {/* Status box */}
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 mb-6`}>
          <p className={`${statusInfo.textColor} text-sm`}>
            {isSuspended ? (
              'Please reach out to your site administrator to reactivate your account.'
            ) : (
              'To continue using DoFO OC Suite, please contact your site administrator to extend your trial or activate your subscription.'
            )}
          </p>
        </div>

        {/* Contact info */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Mail size={16} />
            <span>Contact: </span>
            <a
              href="mailto:admin@digitaldofo.com"
              className="text-sky-400 hover:text-sky-300"
            >
              admin@digitaldofo.com
            </a>
          </div>
        </div>

        {/* User info */}
        <div className="text-sm text-slate-500 mb-6">
          Signed in as: {user?.email}
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs mt-6">
          DoFO OC Suite - Digital Offensive Football Operations
        </p>
      </div>
    </div>
  );
}
