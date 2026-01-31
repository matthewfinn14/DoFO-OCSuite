import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  FileText,
  Target,
  CheckCircle,
  Circle,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

// Phase configurations
const PHASE_CONFIG = {
  offseason: {
    title: 'Offseason',
    subtitle: 'Winter/Spring development and player improvement',
    color: '#6366f1',
    focusAreas: ['Player Development', 'Scheme Installation', 'Weight Room', 'Film Study', 'Recruiting']
  },
  summer: {
    title: 'Summer',
    subtitle: 'Conditioning, 7-on-7, and team building',
    color: '#f59e0b',
    focusAreas: ['Conditioning', '7-on-7', 'Passing League', 'Team Building', 'Camp Prep']
  },
  preseason: {
    title: 'Pre-Season',
    subtitle: 'Fall camp and game preparation',
    color: '#ef4444',
    focusAreas: ['Install Offense', 'Install Defense', 'Special Teams', 'Depth Chart', 'Scrimmages']
  },
  season: {
    title: 'In-Season',
    subtitle: 'Weekly game preparation and execution',
    color: '#22c55e',
    focusAreas: ['Game Plan', 'Practice', 'Film Review', 'Player Health', 'Adjustments']
  }
};

export default function SeasonalPhase({ phase = 'offseason' }) {
  const { weeks, updateWeeks, plays, roster } = useSchool();
  const navigate = useNavigate();

  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.offseason;

  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showWeekEditor, setShowWeekEditor] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);

  // Get weeks for this phase
  const phaseWeeks = useMemo(() => {
    return weeks.filter(w => w.phase === phase).sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [weeks, phase]);

  // Open week editor
  const openWeekEditor = (week = null) => {
    setEditingWeek(week || {
      id: `week_${Date.now()}`,
      phase: phase,
      number: phaseWeeks.length + 1,
      name: '',
      opponent: '',
      date: '',
      location: 'home',
      goals: [],
      notes: ''
    });
    setShowWeekEditor(true);
  };

  // Save week
  const saveWeek = () => {
    if (!editingWeek) return;

    const exists = weeks.find(w => w.id === editingWeek.id);
    let newWeeks;

    if (exists) {
      newWeeks = weeks.map(w => w.id === editingWeek.id ? editingWeek : w);
    } else {
      newWeeks = [...weeks, editingWeek];
    }

    updateWeeks(newWeeks);
    setShowWeekEditor(false);
    setEditingWeek(null);
  };

  // Delete week
  const deleteWeek = (weekId) => {
    if (!confirm('Delete this week?')) return;
    const newWeeks = weeks.filter(w => w.id !== weekId);
    updateWeeks(newWeeks);
    if (selectedWeek?.id === weekId) setSelectedWeek(null);
  };

  // Quick actions for week
  const weekActions = [
    { label: 'Game Plan', icon: Target, path: '/game-plan' },
    { label: 'Practice', icon: Calendar, path: '/practice' },
    { label: 'Depth Charts', icon: Users, path: '/depth-charts' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-10 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <div>
              <h1 className="text-3xl font-bold text-white">{config.title}</h1>
              <p className="text-slate-400">{config.subtitle}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => openWeekEditor()}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
        >
          <Plus size={18} />
          Add Week
        </button>
      </div>

      {/* Focus Areas */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Focus Areas</h3>
        <div className="flex flex-wrap gap-2">
          {config.focusAreas.map(area => (
            <span
              key={area}
              className="px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Weeks Grid */}
      {phaseWeeks.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Weeks Added</h3>
          <p className="text-slate-400 mb-4">Add weeks to start planning your {config.title.toLowerCase()} schedule</p>
          <button
            onClick={() => openWeekEditor()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add First Week
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phaseWeeks.map(week => (
            <div
              key={week.id}
              className={`bg-slate-900 rounded-lg border overflow-hidden cursor-pointer transition-all ${
                selectedWeek?.id === week.id
                  ? 'border-sky-500 ring-1 ring-sky-500'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setSelectedWeek(week)}
            >
              <div
                className="h-2"
                style={{ backgroundColor: config.color }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">
                      Week {week.number}{week.name ? `: ${week.name}` : ''}
                    </h3>
                    {week.opponent && (
                      <p className="text-sm text-slate-400">
                        {week.location === 'away' ? '@' : 'vs'} {week.opponent}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openWeekEditor(week); }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteWeek(week.id); }}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {week.date && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <Calendar size={14} />
                    {new Date(week.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}

                {/* Goals */}
                {week.goals && week.goals.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {week.goals.slice(0, 3).map((goal, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {goal.completed ? (
                          <CheckCircle size={12} className="text-green-400" />
                        ) : (
                          <Circle size={12} className="text-slate-500" />
                        )}
                        <span className={goal.completed ? 'text-slate-500 line-through' : 'text-slate-300'}>
                          {goal.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                  {weekActions.map(action => (
                    <button
                      key={action.path}
                      onClick={(e) => { e.stopPropagation(); navigate(action.path); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded"
                    >
                      <action.icon size={12} />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Week Editor Modal */}
      {showWeekEditor && editingWeek && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {weeks.find(w => w.id === editingWeek.id) ? 'Edit Week' : 'Add Week'}
              </h3>
              <button
                onClick={() => { setShowWeekEditor(false); setEditingWeek(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="week-editor-number" className="text-sm text-slate-400 block mb-1">Week Number</label>
                  <input
                    id="week-editor-number"
                    type="number"
                    value={editingWeek.number || ''}
                    onChange={e => setEditingWeek({ ...editingWeek, number: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label htmlFor="week-editor-date" className="text-sm text-slate-400 block mb-1">Date</label>
                  <input
                    id="week-editor-date"
                    type="date"
                    value={editingWeek.date || ''}
                    onChange={e => setEditingWeek({ ...editingWeek, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="week-editor-name" className="text-sm text-slate-400 block mb-1">Week Name (optional)</label>
                <input
                  id="week-editor-name"
                  type="text"
                  value={editingWeek.name || ''}
                  onChange={e => setEditingWeek({ ...editingWeek, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Homecoming, Rivalry Week"
                />
              </div>

              {phase === 'season' && (
                <>
                  <div>
                    <label htmlFor="week-editor-opponent" className="text-sm text-slate-400 block mb-1">Opponent</label>
                    <input
                      id="week-editor-opponent"
                      type="text"
                      value={editingWeek.opponent || ''}
                      onChange={e => setEditingWeek({ ...editingWeek, opponent: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="Opponent name"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Location</label>
                    <div className="flex gap-4">
                      <label htmlFor="week-editor-location-home" className="flex items-center gap-2 text-white">
                        <input
                          id="week-editor-location-home"
                          type="radio"
                          name="week-editor-location"
                          checked={editingWeek.location === 'home'}
                          onChange={() => setEditingWeek({ ...editingWeek, location: 'home' })}
                          className="text-sky-500"
                        />
                        Home
                      </label>
                      <label htmlFor="week-editor-location-away" className="flex items-center gap-2 text-white">
                        <input
                          id="week-editor-location-away"
                          type="radio"
                          name="week-editor-location"
                          checked={editingWeek.location === 'away'}
                          onChange={() => setEditingWeek({ ...editingWeek, location: 'away' })}
                          className="text-sky-500"
                        />
                        Away
                      </label>
                      <label htmlFor="week-editor-location-neutral" className="flex items-center gap-2 text-white">
                        <input
                          id="week-editor-location-neutral"
                          type="radio"
                          name="week-editor-location"
                          checked={editingWeek.location === 'neutral'}
                          onChange={() => setEditingWeek({ ...editingWeek, location: 'neutral' })}
                          className="text-sky-500"
                        />
                        Neutral
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="week-editor-notes" className="text-sm text-slate-400 block mb-1">Notes</label>
                <textarea
                  id="week-editor-notes"
                  value={editingWeek.notes || ''}
                  onChange={e => setEditingWeek({ ...editingWeek, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                  rows={3}
                  placeholder="Week notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowWeekEditor(false); setEditingWeek(null); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveWeek}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
              >
                Save Week
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
