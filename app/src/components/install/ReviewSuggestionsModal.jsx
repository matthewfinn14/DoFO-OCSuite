import { useState, useMemo } from 'react';
import {
  X,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  MessageSquare,
  CheckCircle2,
  XOctagon,
  Filter
} from 'lucide-react';

// Format relative time
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Status badge component
function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    accepted: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Accepted' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' }
  };
  const c = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// Suggestion card component
function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  phaseBuckets,
  isLight,
  isExpanded,
  onToggleExpand
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const bucket = phaseBuckets.find(b => b.id === suggestion.gamePlanTags?.bucketId);
  const isPending = suggestion.status === 'pending';

  const handleReject = () => {
    onReject(suggestion.id, rejectReason);
    setShowRejectInput(false);
    setRejectReason('');
  };

  return (
    <div className={`rounded-lg border ${
      isLight
        ? 'bg-white border-gray-200'
        : 'bg-slate-800/50 border-slate-700'
    }`}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className={`w-full px-4 py-3 flex items-center justify-between text-left ${
          isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-700/50'
        } transition-colors rounded-t-lg`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-400'
          }`}>
            <User size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {suggestion.playData?.formation && `${suggestion.playData.formation} `}
                {suggestion.playData?.name || 'Unnamed Play'}
              </span>
              <StatusBadge status={suggestion.status} />
            </div>
            <div className={`text-xs flex items-center gap-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              <span>{suggestion.suggestedBy?.name || 'Unknown'}</span>
              <span>•</span>
              <span>{formatRelativeTime(suggestion.suggestedAt)}</span>
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`px-4 pb-4 border-t ${isLight ? 'border-gray-100' : 'border-slate-700'}`}>
          {/* Play Details */}
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {suggestion.playData?.personnel && (
                <div>
                  <span className={`block text-xs font-medium uppercase ${
                    isLight ? 'text-gray-500' : 'text-slate-500'
                  }`}>Personnel</span>
                  <span className={isLight ? 'text-gray-900' : 'text-white'}>
                    {suggestion.playData.personnel}
                  </span>
                </div>
              )}
              {bucket && (
                <div>
                  <span className={`block text-xs font-medium uppercase ${
                    isLight ? 'text-gray-500' : 'text-slate-500'
                  }`}>Suggested Bucket</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: `${bucket.color}30`, color: bucket.color }}
                  >
                    {bucket.label}
                  </span>
                </div>
              )}
              {suggestion.gamePlanTags?.conceptFamily && (
                <div>
                  <span className={`block text-xs font-medium uppercase ${
                    isLight ? 'text-gray-500' : 'text-slate-500'
                  }`}>Concept Family</span>
                  <span className={isLight ? 'text-gray-900' : 'text-white'}>
                    {suggestion.gamePlanTags.conceptFamily}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {suggestion.notes && (
              <div className={`rounded-lg p-3 ${
                isLight ? 'bg-gray-50' : 'bg-slate-900/50'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs font-medium uppercase mb-1 ${
                  isLight ? 'text-gray-500' : 'text-slate-500'
                }`}>
                  <MessageSquare size={12} />
                  Coach's Notes
                </div>
                <p className={`text-sm ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  {suggestion.notes}
                </p>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {suggestion.status === 'rejected' && suggestion.rejectionReason && (
              <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase mb-1 text-red-400">
                  <XOctagon size={12} />
                  Rejection Reason
                </div>
                <p className="text-sm text-red-300">
                  {suggestion.rejectionReason}
                </p>
              </div>
            )}

            {/* Review Info (if reviewed) */}
            {suggestion.reviewedAt && (
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                {suggestion.status === 'accepted' ? 'Accepted' : 'Rejected'} by{' '}
                {suggestion.reviewedBy?.name || 'Unknown'}{' '}
                {formatRelativeTime(suggestion.reviewedAt)}
              </div>
            )}

            {/* Actions (only for pending) */}
            {isPending && (
              <div className="pt-2 border-t border-slate-700/50">
                {showRejectInput ? (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Optional: Provide feedback for the coach..."
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                        isLight
                          ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400'
                          : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
                      } focus:outline-none focus:border-red-500`}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReject}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <XCircle size={14} />
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectInput(false);
                          setRejectReason('');
                        }}
                        className={`px-3 py-1.5 text-sm rounded ${
                          isLight
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        } transition-colors`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAccept(suggestion.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      <Check size={14} />
                      Accept
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewSuggestionsModal({
  isOpen,
  onClose,
  suggestions,
  onAccept,
  onReject,
  setupConfig,
  phaseBuckets,
  isLight
}) {
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all' | 'accepted' | 'rejected'
  const [expandedIds, setExpandedIds] = useState([]);

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (filter === 'all') return suggestions;
    return suggestions.filter(s => s.status === filter);
  }, [suggestions, filter]);

  // Auto-expand first pending suggestion
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;

  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Review Play Suggestions
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                {pendingCount} pending • {acceptedCount} accepted • {rejectedCount} rejected
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-4">
            {[
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'accepted', label: 'Accepted', count: acceptedCount },
              { id: 'rejected', label: 'Rejected', count: rejectedCount },
              { id: 'all', label: 'All', count: suggestions.length }
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === id
                    ? 'bg-purple-500 text-white'
                    : isLight
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    filter === id
                      ? 'bg-white/20'
                      : isLight ? 'bg-gray-200' : 'bg-slate-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSuggestions.length === 0 ? (
            <div className={`text-center py-12 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">
                {filter === 'pending' ? 'No pending suggestions' : `No ${filter} suggestions`}
              </p>
              <p className="text-sm">
                {filter === 'pending'
                  ? "All caught up! Check back later for new suggestions from your coaches."
                  : "Try a different filter to see other suggestions."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={onAccept}
                  onReject={onReject}
                  phaseBuckets={phaseBuckets}
                  isLight={isLight}
                  isExpanded={expandedIds.includes(suggestion.id)}
                  onToggleExpand={() => toggleExpand(suggestion.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
        }`}>
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                isLight
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
