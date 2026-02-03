import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Star,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Save,
  CheckCircle2,
  Clock,
  User,
  Play,
  Film,
  AlertTriangle,
  Zap,
  FileText,
  X,
  HelpCircle
} from 'lucide-react';

// Days of the week for practice
const PRACTICE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper Box Component for new coaches
function CoachHelperBox({ isLight, showByDefault = true }) {
  const [isExpanded, setIsExpanded] = useState(showByDefault);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className={`mb-6 rounded-xl border ${
      isLight
        ? 'bg-violet-50 border-violet-200'
        : 'bg-violet-900/20 border-violet-800'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between text-left ${
          isLight ? 'hover:bg-violet-100/50' : 'hover:bg-violet-900/30'
        } rounded-xl transition-colors`}
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className={isLight ? 'text-violet-600' : 'text-violet-400'} />
          <span className={`font-medium ${isLight ? 'text-violet-800' : 'text-violet-300'}`}>
            New to Practice Review? Here's how it works
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className={`text-xs px-2 py-1 rounded ${
              isLight ? 'text-violet-600 hover:bg-violet-200' : 'text-violet-400 hover:bg-violet-800'
            }`}
          >
            Dismiss
          </button>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className={`px-4 pb-4 ${isLight ? 'text-violet-900' : 'text-violet-100'}`}>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs">1</span>
                Select a Practice Day
              </h4>
              <p className={`ml-8 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
                Use the sidebar to pick which day's practice you want to review. Only days with practice plans will be available.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs">2</span>
                Start Film Review
              </h4>
              <p className={`ml-8 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
                Click "Start Film Review" to slide through each scripted rep. Watch the film, then rate how well the play was executed.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs">3</span>
                Tag What Worked (or Didn't)
              </h4>
              <p className={`ml-8 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
                Use the quick-tap tags to note why a play succeeded or failed. Tags are set up in Self-Scout Setup and help you spot trends.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs">4</span>
                Rate Position Groups
              </h4>
              <p className={`ml-8 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
                After reviewing plays, scroll down to rate each position group's overall practice performance and add coaching notes.
              </p>
            </div>
          </div>
          <div className={`mt-4 pt-3 border-t text-xs ${
            isLight ? 'border-violet-200 text-violet-600' : 'border-violet-700 text-violet-400'
          }`}>
            <strong>Pro tip:</strong> In the Film Review wizard, use keyboard shortcuts: Arrow keys to navigate, 1-5 to rate, Esc to close. Reviews are saved to each play's history automatically.
          </div>
        </div>
      )}
    </div>
  );
}

// Star Rating Component
function StarRating({ rating, onChange, size = 'normal', disabled = false }) {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === 'large' ? 28 : size === 'small' ? 16 : 20;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={`transition-colors ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <Star
              size={starSize}
              className={`transition-colors ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600 hover:text-amber-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// Film Review Wizard - slide by slide flow through plays with button-based tags
function FilmReviewWizard({
  isOpen,
  onClose,
  scriptedSegments,
  plays,
  scriptReviews,
  onUpdatePlayRating,
  onUpdatePlayNotes,
  onToggleWorkedTag,
  onToggleDidntWorkTag,
  filmReviewTags,
  positionGroups,
  isLight,
  dayLabel,
  weekId,
  weekName
}) {
  // Flatten all script rows from all segments
  const allPlays = useMemo(() => {
    const result = [];
    scriptedSegments.forEach((segment, segIdx) => {
      (segment.script || []).forEach((row, rowIdx) => {
        result.push({
          ...row,
          segmentType: segment.type,
          segmentIndex: segIdx,
          playIndex: rowIdx,
          play: plays[row.playId]
        });
      });
    });
    return result;
  }, [scriptedSegments, plays]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPlay = allPlays[currentIndex];
  const playReview = currentPlay ? scriptReviews[currentPlay.id] : null;

  const workedTags = filmReviewTags?.worked || [];
  const didntWorkTags = filmReviewTags?.didntWork || [];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < allPlays.length - 1) setCurrentIndex(currentIndex + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          if (currentPlay) onUpdatePlayRating(currentPlay.id, parseInt(e.key));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, allPlays.length, currentPlay, onUpdatePlayRating, onClose]);

  if (!isOpen || allPlays.length === 0) return null;

  const playName = currentPlay?.play
    ? (currentPlay.play.formation ? `${currentPlay.play.formation} ${currentPlay.play.name}` : currentPlay.play.name)
    : currentPlay?.playName || 'Unknown Play';

  const reviewedCount = allPlays.filter(p => scriptReviews[p.id]?.rating > 0).length;

  // Check if a tag is selected
  const isWorkedTagSelected = (tagId) => (playReview?.workedTags || []).includes(tagId);
  const isDidntWorkTagSelected = (tagId) => (playReview?.didntWorkTags || []).includes(tagId);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`w-full max-w-5xl mx-4 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white' : 'bg-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Film Review - {dayLabel}
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Play {currentIndex + 1} of {allPlays.length} • {reviewedCount} reviewed
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'}`}
            >
              <X size={24} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
            </button>
          </div>
          {/* Keyboard hints */}
          <div className={`flex items-center gap-4 mt-2 text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>←</kbd> Prev</span>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>→</kbd> Next</span>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>1-5</kbd> Rate</span>
            <span><kbd className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-800 text-slate-400'}`}>Esc</kbd> Close</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`h-1.5 flex-shrink-0 ${isLight ? 'bg-gray-200' : 'bg-slate-800'}`}>
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${((currentIndex + 1) / allPlays.length) * 100}%` }}
          />
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Play Info Card */}
          <div className={`rounded-xl p-6 mb-6 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className={`text-xs uppercase tracking-wide mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  {currentPlay.segmentType} • Rep {currentPlay.playIndex + 1}
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {playName}
                </h3>
                <div className={`flex flex-wrap gap-2 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {currentPlay.hash && (
                    <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                      {currentPlay.hash} hash
                    </span>
                  )}
                  {currentPlay.dn && (
                    <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                      {currentPlay.dn}
                    </span>
                  )}
                  {currentPlay.defense && (
                    <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                      vs {currentPlay.defense}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs uppercase tracking-wide mb-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Rating
                </div>
                <StarRating
                  rating={playReview?.rating || 0}
                  onChange={(val) => onUpdatePlayRating(currentPlay.id, val)}
                  size="large"
                />
              </div>
            </div>
          </div>

          {/* Tag Sections */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Reasons It Worked */}
            <div className={`rounded-xl p-4 ${isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-900/20 border border-emerald-800'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                <Zap size={16} />
                Why It Worked
              </h4>
              <div className="flex flex-wrap gap-2">
                {workedTags.length === 0 ? (
                  <p className={`text-xs ${isLight ? 'text-emerald-600' : 'text-emerald-500/70'}`}>
                    No tags defined. Add them in Self-Scout Setup.
                  </p>
                ) : (
                  workedTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onToggleWorkedTag(currentPlay.id, tag.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isWorkedTagSelected(tag.id)
                          ? 'bg-emerald-500 text-white shadow-lg scale-105'
                          : isLight
                            ? 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-emerald-900/30 text-emerald-400 border border-emerald-700 hover:bg-emerald-900/50'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Reasons It Didn't Work */}
            <div className={`rounded-xl p-4 ${isLight ? 'bg-orange-50 border border-orange-200' : 'bg-orange-900/20 border border-orange-800'}`}>
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? 'text-orange-800' : 'text-orange-400'}`}>
                <AlertTriangle size={16} />
                Why It Didn't Work
              </h4>
              <div className="flex flex-wrap gap-2">
                {didntWorkTags.length === 0 ? (
                  <p className={`text-xs ${isLight ? 'text-orange-600' : 'text-orange-500/70'}`}>
                    No tags defined. Add them in Self-Scout Setup.
                  </p>
                ) : (
                  didntWorkTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onToggleDidntWorkTag(currentPlay.id, tag.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDidntWorkTagSelected(tag.id)
                          ? 'bg-orange-500 text-white shadow-lg scale-105'
                          : isLight
                            ? 'bg-white text-orange-700 border border-orange-300 hover:bg-orange-100'
                            : 'bg-orange-900/30 text-orange-400 border border-orange-700 hover:bg-orange-900/50'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Notes - single text input for additional context */}
          <div className={`rounded-xl p-4 ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/30 border border-slate-700'}`}>
            <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              Additional Notes (optional)
            </label>
            <input
              type="text"
              value={playReview?.notes || ''}
              onChange={(e) => onUpdatePlayNotes(currentPlay.id, e.target.value)}
              placeholder="Any additional context for this rep..."
              className={`w-full px-4 py-3 rounded-lg text-sm ${
                isLight
                  ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className={`px-6 py-4 border-t flex-shrink-0 flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
        }`}>
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium ${
              currentIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
              {currentIndex + 1} / {allPlays.length}
            </div>
            {playReview?.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-sm font-medium">{playReview.rating}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (currentIndex === allPlays.length - 1) {
                onClose();
              } else {
                setCurrentIndex(currentIndex + 1);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600`}
          >
            {currentIndex === allPlays.length - 1 ? 'Done' : 'Next'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Script Play Review Card - flat layout for speedy input
function ScriptPlayReviewCard({
  scriptRow,
  play,
  playReview,
  onUpdateRating,
  onUpdateNotes,
  onUpdateToImprove,
  onUpdateToEmphasize,
  onUpdateGroupNote,
  positionGroups,
  isLight,
  index
}) {
  const [showGroupNotes, setShowGroupNotes] = useState(false);

  const playName = play
    ? (play.formation ? `${play.formation} ${play.name}` : play.name)
    : scriptRow.playName || 'Unknown Play';

  const allGroups = [
    ...(positionGroups?.OFFENSE || []),
    ...(positionGroups?.DEFENSE || []),
    ...(positionGroups?.SPECIAL_TEAMS || [])
  ];

  return (
    <div className={`rounded-lg border p-4 ${
      isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'
    }`}>
      {/* Top Row: Number, Play Name, Rating */}
      <div className="flex items-center gap-4 mb-3">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
          isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-400'
        }`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {playName}
          </div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            {scriptRow.hash && `${scriptRow.hash}`}
            {scriptRow.dn && ` • ${scriptRow.dn}`}
            {scriptRow.defense && ` vs ${scriptRow.defense}`}
          </div>
        </div>

        <StarRating
          rating={playReview?.rating || 0}
          onChange={(val) => onUpdateRating(scriptRow.id, val)}
          size="normal"
        />
      </div>

      {/* Input Row: Notes, To Improve, To Emphasize */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            value={playReview?.notes || ''}
            onChange={(e) => onUpdateNotes(scriptRow.id, e.target.value)}
            placeholder="Notes..."
            className={`w-full px-2 py-1.5 rounded text-sm ${
              isLight
                ? 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
            } focus:outline-none`}
          />
        </div>
        <div>
          <input
            type="text"
            value={playReview?.toImprove || ''}
            onChange={(e) => onUpdateToImprove(scriptRow.id, e.target.value)}
            placeholder="To improve..."
            className={`w-full px-2 py-1.5 rounded text-sm ${
              isLight
                ? 'bg-orange-50 border border-orange-200 text-gray-900 placeholder-orange-300 focus:border-orange-400'
                : 'bg-orange-500/10 border border-orange-500/30 text-white placeholder-orange-400/50 focus:border-orange-500'
            } focus:outline-none`}
          />
        </div>
        <div>
          <input
            type="text"
            value={playReview?.toEmphasize || ''}
            onChange={(e) => onUpdateToEmphasize(scriptRow.id, e.target.value)}
            placeholder="To emphasize..."
            className={`w-full px-2 py-1.5 rounded text-sm ${
              isLight
                ? 'bg-emerald-50 border border-emerald-200 text-gray-900 placeholder-emerald-300 focus:border-emerald-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-white placeholder-emerald-400/50 focus:border-emerald-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      {/* Position Group Notes - collapsible but simple */}
      <div className="mt-2">
        <button
          onClick={() => setShowGroupNotes(!showGroupNotes)}
          className={`flex items-center gap-1 text-xs ${
            isLight ? 'text-gray-400 hover:text-gray-600' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          {showGroupNotes ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Position notes
        </button>

        {showGroupNotes && (
          <div className="mt-2 flex flex-wrap gap-2">
            {allGroups.map(group => (
              <div key={group.id} className="flex items-center gap-1">
                <span className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  {group.abbrev}:
                </span>
                <input
                  type="text"
                  value={playReview?.groupNotes?.[group.id] || ''}
                  onChange={(e) => onUpdateGroupNote(scriptRow.id, group.id, e.target.value)}
                  placeholder="..."
                  className={`w-24 px-1.5 py-0.5 rounded text-xs ${
                    isLight
                      ? 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400'
                      : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-600'
                  } focus:outline-none focus:border-amber-500`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Script Segment Review - reviews all plays in a segment
function ScriptSegmentReview({
  segment,
  segmentIndex,
  plays,
  scriptReviews,
  onUpdatePlayRating,
  onUpdatePlayNotes,
  onUpdatePlayToImprove,
  onUpdatePlayToEmphasize,
  onUpdatePlayGroupNote,
  positionGroups,
  isLight,
  isExpanded,
  onToggleExpand
}) {
  const scriptRows = segment.script || [];
  const reviewedCount = scriptRows.filter(row => scriptReviews[row.id]?.rating > 0).length;
  const avgRating = useMemo(() => {
    const ratings = scriptRows
      .map(row => scriptReviews[row.id]?.rating)
      .filter(r => r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }, [scriptRows, scriptReviews]);

  if (scriptRows.length === 0) return null;

  return (
    <div className={`rounded-lg border ${
      isLight ? 'bg-white border-gray-200' : 'bg-slate-800/30 border-slate-700'
    }`}>
      {/* Segment Header */}
      <button
        onClick={onToggleExpand}
        className={`w-full px-4 py-3 flex items-center justify-between ${
          isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-700/30'
        } transition-colors rounded-t-lg`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'
          }`}>
            <Film size={16} />
          </div>
          <div className="text-left">
            <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Period {segmentIndex + 1}: {segment.type || 'Segment'}
            </div>
            <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              {scriptRows.length} plays • {reviewedCount} reviewed
              {segment.duration && ` • ${segment.duration} min`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Script Plays */}
      {isExpanded && (
        <div className={`px-4 pb-4 border-t ${isLight ? 'border-gray-100' : 'border-slate-700'}`}>
          <div className="pt-3 space-y-2">
            {scriptRows.map((row, idx) => {
              const play = plays[row.playId];
              return (
                <ScriptPlayReviewCard
                  key={row.id}
                  scriptRow={row}
                  play={play}
                  playReview={scriptReviews[row.id]}
                  onUpdateRating={onUpdatePlayRating}
                  onUpdateNotes={onUpdatePlayNotes}
                  onUpdateToImprove={onUpdatePlayToImprove}
                  onUpdateToEmphasize={onUpdatePlayToEmphasize}
                  onUpdateGroupNote={onUpdatePlayGroupNote}
                  positionGroups={positionGroups}
                  isLight={isLight}
                  index={idx}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Position Group Review Card (for summary section)
function PositionGroupCard({
  group,
  review,
  onUpdateRating,
  onUpdateNotes,
  coaches,
  isLight,
  isExpanded,
  onToggleExpand
}) {
  const groupCoaches = useMemo(() => {
    const coachIds = group.coachIds || (group.coachId ? [group.coachId] : []);
    return coaches.filter(c => coachIds.includes(c.id));
  }, [group, coaches]);

  return (
    <div className={`rounded-lg border ${
      isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'
    }`}>
      <button
        onClick={onToggleExpand}
        className={`w-full px-4 py-3 flex items-center justify-between ${
          isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-700/50'
        } transition-colors rounded-lg`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
            isLight ? 'bg-gray-100 text-gray-700' : 'bg-slate-700 text-slate-300'
          }`}>
            {group.abbrev || group.name?.substring(0, 2)}
          </div>
          <div className="text-left">
            <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {group.name}
            </div>
            {groupCoaches.length > 0 && (
              <div className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <User size={10} />
                {groupCoaches.map(c => c.name).join(', ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StarRating
            rating={review?.rating || 0}
            onChange={(val) => onUpdateRating(group.id, val)}
            size="normal"
          />
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className={`px-4 pb-4 border-t ${isLight ? 'border-gray-100' : 'border-slate-700'}`}>
          <div className="pt-3">
            <textarea
              value={review?.notes || ''}
              onChange={(e) => onUpdateNotes(group.id, e.target.value)}
              placeholder="Add notes about this position group's practice performance..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                isLight
                  ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                  : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
              } focus:outline-none`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticeReview() {
  const { weekId } = useParams();
  const {
    weeks,
    plays,
    staff,
    settings,
    school,
    setupConfig,
    updateWeek,
    updatePlay,
    setCurrentWeekId
  } = useSchool();

  // Set current week context
  if (weekId) {
    setCurrentWeekId(weekId);
  }

  // Theme
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  // Get current week
  const currentWeek = weeks.find(w => w.id === weekId);

  // State
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [expandedSegments, setExpandedSegments] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [showFilmWizard, setShowFilmWizard] = useState(false);

  // Get practice plans for the week
  const practicePlans = currentWeek?.practicePlans || {};

  // Get practice reviews from the week
  const practiceReviews = currentWeek?.practiceReviews || {};

  // Get position groups from setup config
  const positionGroups = setupConfig?.positionGroups || {};

  // Days that have practice plans
  const daysWithPractice = useMemo(() => {
    return PRACTICE_DAYS.filter(day => practicePlans[day]);
  }, [practicePlans]);

  // Current day's practice plan and review
  const currentDayPlan = practicePlans[selectedDay];
  const currentDayReview = practiceReviews[selectedDay] || {
    overallRating: 0,
    overallNotes: '',
    groups: {},
    scriptReviews: {}
  };

  // Get scripted segments for the current day
  const scriptedSegments = useMemo(() => {
    if (!currentDayPlan?.segments) return [];
    return currentDayPlan.segments.filter(seg => seg.hasScript && seg.script?.length > 0);
  }, [currentDayPlan]);

  // Helper to find playId from script row id
  const getPlayIdFromRowId = useCallback((rowId) => {
    for (const segment of scriptedSegments) {
      const row = (segment.script || []).find(r => r.id === rowId);
      if (row?.playId) return row.playId;
    }
    return null;
  }, [scriptedSegments]);

  // Save film review to play's history
  const saveFilmReviewToPlay = useCallback((playId, reviewData) => {
    if (!playId || !plays[playId]) return;

    const play = plays[playId];
    const existingReviews = play.filmReviews || [];

    // Create a unique key for this review (week + day + row)
    const reviewKey = `${weekId}_${selectedDay}_${reviewData.rowId}`;

    // Check if we already have a review for this rep
    const existingIndex = existingReviews.findIndex(r => r.key === reviewKey);

    const filmReview = {
      key: reviewKey,
      weekId,
      weekName: currentWeek?.name || currentWeek?.opponent || `Week ${currentWeek?.weekNumber || ''}`,
      day: selectedDay,
      date: new Date().toISOString(),
      rating: reviewData.rating,
      workedTags: reviewData.workedTags || [],
      didntWorkTags: reviewData.didntWorkTags || [],
      notes: reviewData.notes || ''
    };

    let updatedReviews;
    if (existingIndex >= 0) {
      // Update existing review
      updatedReviews = [...existingReviews];
      updatedReviews[existingIndex] = filmReview;
    } else {
      // Add new review
      updatedReviews = [...existingReviews, filmReview];
    }

    updatePlay(playId, { filmReviews: updatedReviews });
  }, [plays, weekId, selectedDay, currentWeek, updatePlay]);

  // Save handler
  const saveReview = useCallback(async (dayReview) => {
    setIsSaving(true);
    try {
      const updatedReviews = {
        ...practiceReviews,
        [selectedDay]: {
          ...dayReview,
          updatedAt: new Date().toISOString()
        }
      };
      await updateWeek(weekId, { practiceReviews: updatedReviews });
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [practiceReviews, selectedDay, weekId, updateWeek]);

  // Script play review handlers
  const handleUpdatePlayRating = useCallback((rowId, rating) => {
    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          rating
        }
      }
    };
    saveReview(updatedReview);

    // Also save to play's film history
    const playId = getPlayIdFromRowId(rowId);
    if (playId) {
      const currentScriptReview = currentDayReview.scriptReviews?.[rowId] || {};
      saveFilmReviewToPlay(playId, {
        rowId,
        rating,
        workedTags: currentScriptReview.workedTags,
        didntWorkTags: currentScriptReview.didntWorkTags,
        notes: currentScriptReview.notes
      });
    }
  }, [currentDayReview, saveReview, getPlayIdFromRowId, saveFilmReviewToPlay]);

  const handleUpdatePlayNotes = useCallback((rowId, notes) => {
    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          notes
        }
      }
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  const handleUpdatePlayToImprove = useCallback((rowId, toImprove) => {
    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          toImprove
        }
      }
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  const handleUpdatePlayToEmphasize = useCallback((rowId, toEmphasize) => {
    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          toEmphasize
        }
      }
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  const handleUpdatePlayGroupNote = useCallback((rowId, groupId, note) => {
    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          groupNotes: {
            ...currentDayReview.scriptReviews?.[rowId]?.groupNotes,
            [groupId]: note
          }
        }
      }
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  // Toggle worked tag (add or remove)
  const handleToggleWorkedTag = useCallback((rowId, tagId) => {
    const currentTags = currentDayReview.scriptReviews?.[rowId]?.workedTags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];

    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          workedTags: newTags
        }
      }
    };
    saveReview(updatedReview);

    // Also save to play's film history
    const playId = getPlayIdFromRowId(rowId);
    if (playId) {
      const currentScriptReview = currentDayReview.scriptReviews?.[rowId] || {};
      saveFilmReviewToPlay(playId, {
        rowId,
        rating: currentScriptReview.rating,
        workedTags: newTags,
        didntWorkTags: currentScriptReview.didntWorkTags,
        notes: currentScriptReview.notes
      });
    }
  }, [currentDayReview, saveReview, getPlayIdFromRowId, saveFilmReviewToPlay]);

  // Toggle didn't work tag (add or remove)
  const handleToggleDidntWorkTag = useCallback((rowId, tagId) => {
    const currentTags = currentDayReview.scriptReviews?.[rowId]?.didntWorkTags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];

    const updatedReview = {
      ...currentDayReview,
      scriptReviews: {
        ...currentDayReview.scriptReviews,
        [rowId]: {
          ...currentDayReview.scriptReviews?.[rowId],
          didntWorkTags: newTags
        }
      }
    };
    saveReview(updatedReview);

    // Also save to play's film history
    const playId = getPlayIdFromRowId(rowId);
    if (playId) {
      const currentScriptReview = currentDayReview.scriptReviews?.[rowId] || {};
      saveFilmReviewToPlay(playId, {
        rowId,
        rating: currentScriptReview.rating,
        workedTags: currentScriptReview.workedTags,
        didntWorkTags: newTags,
        notes: currentScriptReview.notes
      });
    }
  }, [currentDayReview, saveReview, getPlayIdFromRowId, saveFilmReviewToPlay]);

  // Position group handlers
  const handleUpdateGroupRating = useCallback((groupId, rating) => {
    const updatedReview = {
      ...currentDayReview,
      groups: {
        ...currentDayReview.groups,
        [groupId]: {
          ...currentDayReview.groups?.[groupId],
          rating
        }
      }
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  const handleUpdateGroupNotes = useCallback((groupId, notes) => {
    const updatedReview = {
      ...currentDayReview,
      groups: {
        ...currentDayReview.groups,
        [groupId]: {
          ...currentDayReview.groups?.[groupId],
          notes
        }
      }
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  const handleUpdateOverallRating = useCallback((rating) => {
    const updatedReview = {
      ...currentDayReview,
      overallRating: rating
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  const handleUpdateOverallNotes = useCallback((notes) => {
    const updatedReview = {
      ...currentDayReview,
      overallNotes: notes
    };
    saveReview(updatedReview);
  }, [currentDayReview, saveReview]);

  // Toggle helpers
  const toggleSegment = (segmentId) => {
    setExpandedSegments(prev =>
      prev.includes(segmentId) ? prev.filter(id => id !== segmentId) : [...prev, segmentId]
    );
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // Calculate average rating for a day
  const getDayAverageRating = useCallback((day) => {
    const dayReview = practiceReviews[day];
    if (!dayReview) return 0;

    // First check script reviews
    const scriptRatings = Object.values(dayReview.scriptReviews || {})
      .map(r => r.rating)
      .filter(r => r > 0);

    // Then group ratings
    const groupRatings = Object.values(dayReview.groups || {})
      .map(g => g.rating)
      .filter(r => r > 0);

    const allRatings = [...scriptRatings, ...groupRatings];
    if (allRatings.length === 0) return dayReview.overallRating || 0;
    return allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
  }, [practiceReviews]);

  // Position groups arrays
  const offenseGroups = positionGroups?.OFFENSE || [];
  const defenseGroups = positionGroups?.DEFENSE || [];
  const stGroups = positionGroups?.SPECIAL_TEAMS || [];

  if (!currentWeek) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Star size={64} className="text-amber-400 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Practice Review
          </h1>
          <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            Select a week from the sidebar to review practice performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Practice Review
            </h1>
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              {currentWeek.name || currentWeek.opponent || `Week ${currentWeek.weekNumber || ''}`}
              {currentWeek.opponent && ` vs ${currentWeek.opponent}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <CheckCircle2 size={12} className="text-emerald-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isSaving && (
              <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                <Clock size={12} className="animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Day Selector Sidebar */}
        <div className={`w-48 border-r flex-shrink-0 overflow-y-auto ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800 bg-slate-900/30'
        }`}>
          <div className="p-3">
            <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
              isLight ? 'text-gray-500' : 'text-slate-500'
            }`}>
              Practice Days
            </h3>
            <div className="space-y-1">
              {PRACTICE_DAYS.map((day) => {
                const hasPractice = practicePlans[day];
                const avgRating = getDayAverageRating(day);
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    disabled={!hasPractice}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      !hasPractice
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 text-white'
                        : isLight
                        ? 'hover:bg-gray-200 text-gray-700'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{day}</span>
                      {hasPractice && avgRating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className={`text-xs ${isSelected ? 'text-white' : 'text-amber-400'}`}>
                            {avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Helper box for new coaches */}
          <CoachHelperBox isLight={isLight} showByDefault={daysWithPractice.length === 0} />

          {daysWithPractice.length === 0 ? (
            <div className={`text-center py-12 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">No practice plans yet</p>
              <p className="text-sm">
                Create practice plans in the Practice Planner to enable reviews.
              </p>
            </div>
          ) : !currentDayPlan ? (
            <div className={`text-center py-12 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No practice scheduled for {selectedDay}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SCRIPT REVIEW SECTION */}
              {scriptedSegments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Film size={20} className={isLight ? 'text-violet-600' : 'text-violet-400'} />
                      <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Film Review
                      </h2>
                      <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        ({scriptedSegments.reduce((sum, seg) => sum + (seg.script?.length || 0), 0)} plays)
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFilmWizard(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                    >
                      <Play size={14} />
                      Start Film Review
                    </button>
                  </div>

                  <div className="space-y-3">
                    {scriptedSegments.map((segment, idx) => (
                      <ScriptSegmentReview
                        key={segment.id}
                        segment={segment}
                        segmentIndex={idx}
                        plays={plays}
                        scriptReviews={currentDayReview.scriptReviews || {}}
                        onUpdatePlayRating={handleUpdatePlayRating}
                        onUpdatePlayNotes={handleUpdatePlayNotes}
                        onUpdatePlayToImprove={handleUpdatePlayToImprove}
                        onUpdatePlayToEmphasize={handleUpdatePlayToEmphasize}
                        onUpdatePlayGroupNote={handleUpdatePlayGroupNote}
                        positionGroups={positionGroups}
                        isLight={isLight}
                        isExpanded={expandedSegments.includes(segment.id)}
                        onToggleExpand={() => toggleSegment(segment.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* OVERALL PRACTICE RATING */}
              <div className={`rounded-lg p-4 ${isLight ? 'bg-gray-50' : 'bg-slate-800/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      Overall Practice Rating
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      Rate the overall quality of {selectedDay}'s practice
                    </p>
                  </div>
                  <StarRating
                    rating={currentDayReview.overallRating || 0}
                    onChange={handleUpdateOverallRating}
                    size="large"
                  />
                </div>
                <textarea
                  value={currentDayReview.overallNotes || ''}
                  onChange={(e) => handleUpdateOverallNotes(e.target.value)}
                  placeholder="Overall notes for this practice..."
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                    isLight
                      ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500'
                      : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                  } focus:outline-none`}
                />
              </div>

              {/* POSITION GROUP SUMMARY RATINGS */}
              <div>
                <h2 className={`text-lg font-bold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Position Group Summary
                </h2>

                {offenseGroups.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                      isLight ? 'text-gray-500' : 'text-slate-500'
                    }`}>
                      Offense
                    </h4>
                    <div className="space-y-2">
                      {offenseGroups.map((group) => (
                        <PositionGroupCard
                          key={group.id}
                          group={group}
                          review={currentDayReview.groups?.[group.id]}
                          onUpdateRating={handleUpdateGroupRating}
                          onUpdateNotes={handleUpdateGroupNotes}
                          coaches={staff || []}
                          isLight={isLight}
                          isExpanded={expandedGroups.includes(group.id)}
                          onToggleExpand={() => toggleGroup(group.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {defenseGroups.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                      isLight ? 'text-gray-500' : 'text-slate-500'
                    }`}>
                      Defense
                    </h4>
                    <div className="space-y-2">
                      {defenseGroups.map((group) => (
                        <PositionGroupCard
                          key={group.id}
                          group={group}
                          review={currentDayReview.groups?.[group.id]}
                          onUpdateRating={handleUpdateGroupRating}
                          onUpdateNotes={handleUpdateGroupNotes}
                          coaches={staff || []}
                          isLight={isLight}
                          isExpanded={expandedGroups.includes(group.id)}
                          onToggleExpand={() => toggleGroup(group.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {stGroups.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                      isLight ? 'text-gray-500' : 'text-slate-500'
                    }`}>
                      Special Teams
                    </h4>
                    <div className="space-y-2">
                      {stGroups.map((group) => (
                        <PositionGroupCard
                          key={group.id}
                          group={group}
                          review={currentDayReview.groups?.[group.id]}
                          onUpdateRating={handleUpdateGroupRating}
                          onUpdateNotes={handleUpdateGroupNotes}
                          coaches={staff || []}
                          isLight={isLight}
                          isExpanded={expandedGroups.includes(group.id)}
                          onToggleExpand={() => toggleGroup(group.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Film Review Wizard */}
      <FilmReviewWizard
        isOpen={showFilmWizard}
        onClose={() => setShowFilmWizard(false)}
        scriptedSegments={scriptedSegments}
        plays={plays}
        scriptReviews={currentDayReview.scriptReviews || {}}
        onUpdatePlayRating={handleUpdatePlayRating}
        onUpdatePlayNotes={handleUpdatePlayNotes}
        onToggleWorkedTag={handleToggleWorkedTag}
        onToggleDidntWorkTag={handleToggleDidntWorkTag}
        filmReviewTags={setupConfig?.filmReviewTags || { worked: [], didntWork: [] }}
        positionGroups={positionGroups}
        isLight={isLight}
        dayLabel={selectedDay}
        weekId={weekId}
        weekName={currentWeek?.name || currentWeek?.opponent || `Week ${currentWeek?.weekNumber || ''}`}
      />
    </div>
  );
}
