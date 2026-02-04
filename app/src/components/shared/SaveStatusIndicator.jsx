import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

/**
 * Global save status indicator
 * Shows the current sync state: idle, pending, saving, saved, error
 *
 * @param {Object} props
 * @param {boolean} props.showAlways - Show even when idle (default: false, only shows during activity)
 * @param {boolean} props.compact - Compact mode without text (default: false)
 * @param {boolean} props.isLight - Light theme flag
 */
export function SaveStatusIndicator({ showAlways = false, compact = false, isLight = false }) {
  const { saveStatus } = useSchool();

  // Don't show anything when idle unless showAlways is true
  if (saveStatus === 'idle' && !showAlways) {
    return null;
  }

  const configs = {
    idle: {
      icon: Cloud,
      text: 'All changes saved',
      colorClass: isLight ? 'text-gray-400' : 'text-slate-500',
      animate: false
    },
    pending: {
      icon: CloudOff,
      text: 'Unsaved changes...',
      colorClass: isLight ? 'text-amber-500' : 'text-amber-400',
      animate: false
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      colorClass: isLight ? 'text-sky-500' : 'text-sky-400',
      animate: true
    },
    saved: {
      icon: Check,
      text: 'Saved',
      colorClass: isLight ? 'text-emerald-500' : 'text-emerald-400',
      animate: false
    },
    error: {
      icon: AlertCircle,
      text: 'Save failed',
      colorClass: isLight ? 'text-red-500' : 'text-red-400',
      animate: false
    }
  };

  const config = configs[saveStatus] || configs.idle;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${config.colorClass}`}>
      <Icon
        size={compact ? 14 : 16}
        className={config.animate ? 'animate-spin' : ''}
      />
      {!compact && (
        <span className="text-sm">{config.text}</span>
      )}
    </div>
  );
}

export default SaveStatusIndicator;
