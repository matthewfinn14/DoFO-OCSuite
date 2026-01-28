import { useState, useMemo, useCallback } from 'react';
import { useSchool } from '../../../context/SchoolContext';
import { X, Save, Loader2, Plus, Minus, Search } from 'lucide-react';

export default function GradingModal({
  type = 'practice', // 'practice' or 'game'
  weekId,
  currentWeek,
  plays = [],
  session = null, // Existing session to edit, or null for new
  setupConfig,
  onClose
}) {
  const { savePracticeGradeSession, saveGameGradeSession, weeks } = useSchool();

  const isPractice = type === 'practice';
  const volumeLabel = isPractice ? 'Reps' : 'Calls';

  // Get week info
  const week = currentWeek || weeks?.find(w => w.id === weekId);

  // Initialize form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Session metadata
  const [dayLabel, setDayLabel] = useState(session?.dayLabel || '');
  const [sessionDate, setSessionDate] = useState(
    session?.date || new Date().toISOString().split('T')[0]
  );
  const [opponent, setOpponent] = useState(session?.opponent || week?.opponent || '');

  // Grades data - initialize from session or empty
  const [grades, setGrades] = useState(() => {
    if (session?.grades) {
      // Convert to a map for easier lookup
      return Object.fromEntries(
        session.grades.map(g => [g.playId, g])
      );
    }
    return {};
  });

  // Day options for practice
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Filter plays by search
  const filteredPlays = useMemo(() => {
    if (!searchTerm) return plays;

    const term = searchTerm.toLowerCase();
    return plays.filter(p =>
      (p.name || '').toLowerCase().includes(term) ||
      (p.callText || '').toLowerCase().includes(term) ||
      (p.formation || '').toLowerCase().includes(term)
    );
  }, [plays, searchTerm]);

  // Update grade for a play
  const updateGrade = useCallback((playId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [playId]: {
        ...prev[playId],
        playId,
        [field]: Math.max(0, parseInt(value) || 0)
      }
    }));
  }, []);

  // Quick increment/decrement
  const adjustGrade = useCallback((playId, field, delta) => {
    setGrades(prev => {
      const current = prev[playId]?.[field] || 0;
      const newValue = Math.max(0, current + delta);
      return {
        ...prev,
        [playId]: {
          ...prev[playId],
          playId,
          [field]: newValue
        }
      };
    });
  }, []);

  // Calculate totals for summary
  const totals = useMemo(() => {
    const volumeKey = isPractice ? 'reps' : 'calls';
    const efficientKey = isPractice ? 'efficientReps' : 'efficientCalls';
    const explosiveKey = isPractice ? 'explosiveReps' : 'explosiveCalls';

    let totalVolume = 0;
    let totalEfficient = 0;
    let totalExplosive = 0;
    let playsGraded = 0;

    Object.values(grades).forEach(g => {
      const volume = g[volumeKey] || 0;
      if (volume > 0) {
        playsGraded++;
        totalVolume += volume;
        totalEfficient += g[efficientKey] || 0;
        totalExplosive += g[explosiveKey] || 0;
      }
    });

    return {
      totalVolume,
      totalEfficient,
      totalExplosive,
      playsGraded,
      efficiencyRate: totalVolume > 0 ? ((totalEfficient / totalVolume) * 100).toFixed(1) : '0',
      explosiveRate: totalVolume > 0 ? ((totalExplosive / totalVolume) * 100).toFixed(1) : '0'
    };
  }, [grades, isPractice]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const volumeKey = isPractice ? 'reps' : 'calls';

      // Convert grades map to array, filtering out empty entries
      const gradesArray = Object.values(grades).filter(g => (g[volumeKey] || 0) > 0);

      if (gradesArray.length === 0) {
        setError('Please grade at least one play');
        setSaving(false);
        return;
      }

      const sessionData = {
        id: session?.id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        weekId,
        date: sessionDate,
        grades: gradesArray,
        ...(isPractice ? { dayLabel } : { opponent })
      };

      if (isPractice) {
        await savePracticeGradeSession(sessionData);
      } else {
        await saveGameGradeSession(sessionData);
      }

      onClose();
    } catch (err) {
      console.error('Error saving grades:', err);
      setError(err.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {session ? 'Edit' : 'Add'} {isPractice ? 'Practice' : 'Game'} Grades
            </h2>
            <p className="text-sm text-slate-400">
              {week?.name} {week?.opponent ? `vs ${week.opponent}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Session Info */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="grid grid-cols-2 gap-4">
            {isPractice ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Practice Day</label>
                <select
                  value={dayLabel}
                  onChange={(e) => setDayLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                >
                  <option value="">Select day...</option>
                  {dayOptions.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Opponent</label>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="vs..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-700">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plays..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Grades Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Play</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-slate-400 w-24">{volumeLabel}</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-slate-400 w-24">Efficient</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-slate-400 w-24">Explosive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredPlays.map(play => {
                const grade = grades[play.id] || {};
                const volumeKey = isPractice ? 'reps' : 'calls';
                const efficientKey = isPractice ? 'efficientReps' : 'efficientCalls';
                const explosiveKey = isPractice ? 'explosiveReps' : 'explosiveCalls';

                return (
                  <tr key={play.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2">
                      <div className="text-white">{play.name || play.callText || play.id}</div>
                      {play.formation && (
                        <div className="text-xs text-slate-500">{play.formation}</div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <GradeInput
                        value={grade[volumeKey] || 0}
                        onChange={(v) => updateGrade(play.id, volumeKey, v)}
                        onIncrement={() => adjustGrade(play.id, volumeKey, 1)}
                        onDecrement={() => adjustGrade(play.id, volumeKey, -1)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <GradeInput
                        value={grade[efficientKey] || 0}
                        onChange={(v) => updateGrade(play.id, efficientKey, v)}
                        onIncrement={() => adjustGrade(play.id, efficientKey, 1)}
                        onDecrement={() => adjustGrade(play.id, efficientKey, -1)}
                        color="emerald"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <GradeInput
                        value={grade[explosiveKey] || 0}
                        onChange={(v) => updateGrade(play.id, explosiveKey, v)}
                        onIncrement={() => adjustGrade(play.id, explosiveKey, 1)}
                        onDecrement={() => adjustGrade(play.id, explosiveKey, -1)}
                        color="purple"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-slate-400">
                <span className="text-white font-medium">{totals.playsGraded}</span> plays graded
              </span>
              <span className="text-slate-400">
                <span className="text-white font-medium">{totals.totalVolume}</span> total {volumeLabel.toLowerCase()}
              </span>
              <span className="text-slate-400">
                Efficiency: <span className={`font-medium ${
                  parseFloat(totals.efficiencyRate) >= 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}>{totals.efficiencyRate}%</span>
              </span>
              <span className="text-slate-400">
                Explosive: <span className="font-medium text-purple-400">{totals.explosiveRate}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2 bg-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Grades
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Grade Input Component with +/- buttons
function GradeInput({ value, onChange, onIncrement, onDecrement, color = 'slate' }) {
  const colorClasses = {
    slate: 'focus:border-sky-500',
    emerald: 'focus:border-emerald-500 text-emerald-400',
    purple: 'focus:border-purple-500 text-purple-400'
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={onDecrement}
        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-12 px-1 py-1 bg-slate-700 border border-slate-600 rounded text-center text-sm ${colorClasses[color]}`}
        placeholder="0"
      />
      <button
        type="button"
        onClick={onIncrement}
        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
