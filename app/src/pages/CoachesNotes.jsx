import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  ArrowLeft,
  Plus,
  X,
  Layers,
  Users,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';

// Note categories for the meeting notes
const NOTE_CATEGORIES = [
  { key: 'emphasis', label: 'Emphasis / Focus', placeholder: 'Key points to focus on this week...' },
  { key: 'personnel', label: 'Personnel Considerations', placeholder: 'Lineup changes, injuries, rotations...' },
  { key: 'practice', label: 'Practice Needs', placeholder: 'Drills, reps, situations to cover...' },
  { key: 'improve', label: 'Areas to Improve', placeholder: 'What needs work from last week...' },
  { key: 'emphasize', label: 'Areas to Emphasize', placeholder: 'Strengths to build on...' },
  { key: 'opponents', label: 'Opponents to Watch', placeholder: 'Key players, tendencies, schemes...' },
  { key: 'misc', label: 'Misc', placeholder: 'Other notes...' }
];

// Default coaches (coordinators)
const DEFAULT_COACHES = ['HC', 'OC', 'DC', 'STC'];

// Role mapping for editing permissions
const ROLE_MAP = {
  'HC': ['Head Coach', 'head_coach'],
  'OC': ['Offensive Coordinator', 'offensive_coordinator', 'OC'],
  'DC': ['Defensive Coordinator', 'defensive_coordinator', 'DC'],
  'STC': ['Special Teams Coordinator', 'special_teams_coordinator', 'STC', 'ST Coordinator']
};

// Coach colors
const COACH_COLORS = {
  'HC': { bg: 'bg-amber-500/10', border: 'border-l-amber-500', text: 'text-amber-400', badge: 'bg-amber-500' },
  'OC': { bg: 'bg-sky-500/10', border: 'border-l-sky-500', text: 'text-sky-400', badge: 'bg-sky-500' },
  'DC': { bg: 'bg-red-500/10', border: 'border-l-red-500', text: 'text-red-400', badge: 'bg-red-500' },
  'STC': { bg: 'bg-purple-500/10', border: 'border-l-purple-500', text: 'text-purple-400', badge: 'bg-purple-500' }
};

// Phase colors for position groups
const PHASE_COLORS = {
  OFFENSE: { bg: 'bg-sky-500/10', border: 'border-l-sky-500', text: 'text-sky-400', badge: 'bg-sky-500' },
  DEFENSE: { bg: 'bg-red-500/10', border: 'border-l-red-500', text: 'text-red-400', badge: 'bg-red-500' },
  SPECIAL_TEAMS: { bg: 'bg-purple-500/10', border: 'border-l-purple-500', text: 'text-purple-400', badge: 'bg-purple-500' }
};

// Collapsible Coach Section
function CoachSection({
  coach,
  label,
  subtitle,
  data,
  onUpdateNote,
  editable,
  isExpanded,
  onToggle,
  onRemove,
  canRemove,
  colors,
  isLight
}) {
  const noteData = data[coach] || {};
  const hasNotes = NOTE_CATEGORIES.some(cat => noteData[cat.key]?.trim());

  return (
    <div className={`rounded-lg border-l-4 ${colors.border} ${
      isLight ? 'bg-white border border-gray-200' : 'bg-slate-900 border border-slate-800'
    } overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between ${colors.bg} transition-colors ${
          isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.badge} text-white font-bold text-sm`}>
            {coach.length <= 3 ? coach : coach.substring(0, 2)}
          </div>
          <div className="text-left">
            <div className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {label}
            </div>
            {subtitle && (
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasNotes && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              Has notes
            </span>
          )}
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={`p-1 rounded ${isLight ? 'hover:bg-red-100 text-gray-400 hover:text-red-500' : 'hover:bg-red-500/20 text-slate-500 hover:text-red-400'}`}
              title="Remove coach"
            >
              <X size={14} />
            </button>
          )}
          {isExpanded ? (
            <ChevronDown size={20} className={isLight ? 'text-gray-400' : 'text-slate-400'} />
          ) : (
            <ChevronRight size={20} className={isLight ? 'text-gray-400' : 'text-slate-400'} />
          )}
        </div>
      </button>

      {/* Notes Content */}
      {isExpanded && (
        <div className={`p-4 space-y-4 ${isLight ? 'border-t border-gray-200' : 'border-t border-slate-800'}`}>
          {NOTE_CATEGORIES.map(cat => (
            <div key={cat.key}>
              <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                {cat.label}
              </label>
              <textarea
                value={noteData[cat.key] || ''}
                onChange={(e) => editable && onUpdateNote(coach, cat.key, e.target.value)}
                placeholder={editable ? cat.placeholder : ''}
                readOnly={!editable}
                rows={2}
                className={`w-full px-3 py-2 text-sm rounded-lg border resize-y min-h-[60px] ${
                  editable
                    ? isLight
                      ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none'
                    : isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-default'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400 cursor-default'
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoachesNotes() {
  const { weekId } = useParams();
  const { weeks, currentWeekId, meetingNotes, updateMeetingNotes, setupConfig, staff, settings, school } = useSchool();
  const { user, isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

  // Theme
  const theme = settings?.theme || school?.settings?.theme || 'dark';
  const isLight = theme === 'light';

  // Use weekId from params or fall back to currentWeekId
  const activeWeekId = weekId || currentWeekId;
  const week = weeks.find(w => w.id === activeWeekId);

  // Get or initialize notes for this week
  const weekNotes = meetingNotes[activeWeekId] || { coaches: DEFAULT_COACHES, data: {} };
  const coaches = weekNotes.coaches || DEFAULT_COACHES;
  const data = weekNotes.data || {};

  // State for adding coaches
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');

  // State for expanded sections
  const [expandedCoaches, setExpandedCoaches] = useState(new Set(['HC'])); // HC expanded by default
  const [showPositionGroups, setShowPositionGroups] = useState(true);

  // Get position groups from setup config
  const positionGroups = setupConfig?.positionGroups || { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] };

  // Build list of position groups with their assigned staff
  const positionGroupEntries = useMemo(() => {
    const entries = [];

    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = positionGroups[phase] || [];
      phaseGroups.forEach(group => {
        const coachIds = group.coachIds?.length > 0
          ? group.coachIds
          : (group.coachId ? [group.coachId] : []);

        if (coachIds.length > 0) {
          coachIds.forEach((coachId) => {
            const staffMember = staff?.find(s => s.id === coachId);
            if (staffMember) {
              entries.push({
                id: `pg_${group.id}_${coachId}`,
                groupId: group.id,
                staffId: staffMember.id,
                name: staffMember.name,
                displayLabel: staffMember.name,
                groupName: group.name,
                groupAbbrev: group.abbrev,
                phase,
                hasCoach: true
              });
            }
          });
        } else {
          entries.push({
            id: `pg_${group.id}`,
            groupId: group.id,
            staffId: null,
            name: group.name,
            displayLabel: group.name,
            groupName: group.name,
            groupAbbrev: group.abbrev,
            phase,
            hasCoach: false
          });
        }
      });
    });

    return entries;
  }, [positionGroups, staff]);

  // Get custom coaches (ones manually added)
  const customCoaches = useMemo(() => {
    const pgCoachNames = positionGroupEntries.filter(e => e.hasCoach).map(e => e.name);
    return coaches.filter(c =>
      !DEFAULT_COACHES.includes(c) &&
      !pgCoachNames.includes(c)
    );
  }, [coaches, positionGroupEntries]);

  // Check if current user can edit
  const canEdit = isHeadCoach || isTeamAdmin || isSiteAdmin;

  const canEditRow = (coach, staffId = null) => {
    if (canEdit) return true;

    const allowedRoles = ROLE_MAP[coach] || [coach];
    const userRole = user?.role || '';

    if (allowedRoles.some(r => r.toLowerCase() === userRole.toLowerCase())) {
      return true;
    }

    if (user?.displayName === coach || user?.email?.split('@')[0] === coach.toLowerCase()) {
      return true;
    }

    if (staffId) {
      const staffMember = staff?.find(s => s.id === staffId);
      if (staffMember) {
        if (staffMember.email && user?.email === staffMember.email) {
          return true;
        }
        if (user?.displayName === staffMember.name) {
          return true;
        }
      }
    }

    return false;
  };

  // Toggle section expansion
  const toggleCoach = (coach) => {
    setExpandedCoaches(prev => {
      const next = new Set(prev);
      if (next.has(coach)) {
        next.delete(coach);
      } else {
        next.add(coach);
      }
      return next;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    const allCoaches = [
      ...DEFAULT_COACHES,
      ...positionGroupEntries.map(e => e.groupAbbrev || e.groupName),
      ...customCoaches
    ];
    setExpandedCoaches(new Set(allCoaches));
  };

  const collapseAll = () => {
    setExpandedCoaches(new Set());
  };

  // Update a note value
  const updateNote = async (coach, category, value) => {
    const newData = {
      ...data,
      [coach]: {
        ...(data[coach] || {}),
        [category]: value
      }
    };

    await updateMeetingNotes(activeWeekId, {
      ...weekNotes,
      data: newData
    });
  };

  // Add a new coach
  const handleAddCoach = async () => {
    if (!newCoachName.trim()) return;

    const name = newCoachName.trim();
    if (coaches.includes(name)) {
      alert('This coach already exists.');
      return;
    }

    await updateMeetingNotes(activeWeekId, {
      ...weekNotes,
      coaches: [...coaches, name]
    });

    setNewCoachName('');
    setShowAddCoach(false);
    setExpandedCoaches(prev => new Set([...prev, name]));
  };

  // Remove a coach
  const handleRemoveCoach = async (coach) => {
    if (DEFAULT_COACHES.includes(coach)) {
      alert('Cannot remove default coordinators.');
      return;
    }

    if (!confirm(`Remove ${coach} from this week's notes?`)) return;

    const newData = { ...data };
    delete newData[coach];

    await updateMeetingNotes(activeWeekId, {
      ...weekNotes,
      coaches: coaches.filter(c => c !== coach),
      data: newData
    });
  };

  // Get groups with Big 3 set
  const activePositionGroups = useMemo(() => {
    const groups = [];

    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = positionGroups[phase] || [];
      phaseGroups.forEach(group => {
        const coachIds = group.coachIds?.length > 0
          ? group.coachIds
          : (group.coachId ? [group.coachId] : []);
        const hasCoaches = coachIds.length > 0;
        const hasBig3 = group.big3 && group.big3.some(b => b);

        if (hasCoaches || hasBig3) {
          const coachNames = coachIds
            .map(id => staff?.find(s => s.id === id)?.name)
            .filter(Boolean);
          groups.push({
            ...group,
            phase,
            coachName: coachNames.length > 0 ? coachNames.join(', ') : null,
            coachNames
          });
        }
      });
    });

    return groups;
  }, [positionGroups, staff]);

  // If no week selected
  if (!activeWeekId || !week) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <FileText size={64} className="text-amber-400 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Meeting Notes</h1>
          <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            Select a week from the sidebar to view or edit meeting notes.
          </p>
          <Link
            to="/dashboard"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              isLight ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            <FileText size={28} className="text-amber-400" />
            Meeting Notes
          </h1>
          <p className={`mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            {week.name}{week.opponent ? ` vs ${week.opponent}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Collapse all
          </button>
          {canEdit && (
            <button
              onClick={() => setShowAddCoach(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
            >
              <Plus size={18} />
              Add Coach
            </button>
          )}
        </div>
      </div>

      {/* Coordinators Section */}
      <div className="mb-6">
        <h2 className={`text-xs font-bold uppercase tracking-wide mb-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
          Coordinators
        </h2>
        <div className="space-y-3">
          {DEFAULT_COACHES.map(coach => (
            <CoachSection
              key={coach}
              coach={coach}
              label={coach === 'HC' ? 'Head Coach' : coach === 'OC' ? 'Offensive Coordinator' : coach === 'DC' ? 'Defensive Coordinator' : 'Special Teams Coordinator'}
              data={data}
              onUpdateNote={updateNote}
              editable={canEditRow(coach)}
              isExpanded={expandedCoaches.has(coach)}
              onToggle={() => toggleCoach(coach)}
              canRemove={false}
              colors={COACH_COLORS[coach]}
              isLight={isLight}
            />
          ))}
        </div>
      </div>

      {/* Position Groups by Phase */}
      {['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].map(phase => {
        const phaseEntries = positionGroupEntries.filter(e => e.phase === phase);
        if (phaseEntries.length === 0) return null;

        const phaseColors = PHASE_COLORS[phase];
        const phaseLabel = phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.charAt(0) + phase.slice(1).toLowerCase();

        return (
          <div key={phase} className="mb-6">
            <h2 className={`text-xs font-bold uppercase tracking-wide mb-3 ${phaseColors.text}`}>
              {phaseLabel} Position Groups
            </h2>
            <div className="space-y-3">
              {phaseEntries.map(entry => {
                const noteKey = entry.groupAbbrev || entry.groupName;
                return (
                  <CoachSection
                    key={entry.id}
                    coach={noteKey}
                    label={entry.hasCoach ? entry.name : entry.groupName}
                    subtitle={entry.hasCoach ? entry.groupName : 'No coach assigned'}
                    data={data}
                    onUpdateNote={updateNote}
                    editable={canEditRow(entry.name, entry.staffId)}
                    isExpanded={expandedCoaches.has(noteKey)}
                    onToggle={() => toggleCoach(noteKey)}
                    canRemove={false}
                    colors={phaseColors}
                    isLight={isLight}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Custom Coaches Section */}
      {customCoaches.length > 0 && (
        <div className="mb-6">
          <h2 className={`text-xs font-bold uppercase tracking-wide mb-3 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            Additional Coaches
          </h2>
          <div className="space-y-3">
            {customCoaches.map(coach => (
              <CoachSection
                key={coach}
                coach={coach}
                label={coach}
                data={data}
                onUpdateNote={updateNote}
                editable={canEditRow(coach)}
                isExpanded={expandedCoaches.has(coach)}
                onToggle={() => toggleCoach(coach)}
                onRemove={() => handleRemoveCoach(coach)}
                canRemove={canEdit}
                colors={{ bg: 'bg-slate-500/10', border: 'border-l-slate-500', text: 'text-slate-400', badge: 'bg-slate-500' }}
                isLight={isLight}
              />
            ))}
          </div>
        </div>
      )}

      {/* Position Group Focus Points */}
      {activePositionGroups.length > 0 && (
        <div className={`rounded-lg border overflow-hidden ${
          isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setShowPositionGroups(!showPositionGroups)}
            className={`w-full flex items-center justify-between px-4 py-3 ${
              isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800/50'
            }`}
          >
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              <Layers size={20} className="text-purple-400" />
              Position Group Focus Points (Big 3)
            </h2>
            {showPositionGroups ? (
              <ChevronDown size={20} className={isLight ? 'text-gray-400' : 'text-slate-400'} />
            ) : (
              <ChevronRight size={20} className={isLight ? 'text-gray-400' : 'text-slate-400'} />
            )}
          </button>

          {showPositionGroups && (
            <div className={`p-4 ${isLight ? 'border-t border-gray-200' : 'border-t border-slate-800'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePositionGroups.map(group => {
                  const phaseColor = group.phase === 'OFFENSE'
                    ? 'border-l-sky-500 bg-sky-500/5'
                    : group.phase === 'DEFENSE'
                      ? 'border-l-red-500 bg-red-500/5'
                      : 'border-l-purple-500 bg-purple-500/5';

                  const badgeColor = group.phase === 'OFFENSE'
                    ? 'bg-sky-500 text-white'
                    : group.phase === 'DEFENSE'
                      ? 'bg-red-500 text-white'
                      : 'bg-purple-500 text-white';

                  return (
                    <div
                      key={group.id}
                      className={`rounded-lg border border-l-4 p-3 ${phaseColor} ${
                        isLight ? 'border-gray-200' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${badgeColor}`}>
                          {group.abbrev || group.name}
                        </span>
                        <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                          {group.coachName || 'No coach'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {group.big3 && group.big3.filter(b => b).length > 0 ? (
                          group.big3.filter(b => b).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className={`w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full text-[0.6rem] font-bold ${
                                isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-300'
                              }`}>
                                {i + 1}
                              </span>
                              <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{item}</span>
                            </div>
                          ))
                        ) : (
                          <span className={`text-xs italic ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>No Big 3 set</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Coach Modal */}
      {showAddCoach && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-sm overflow-hidden ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isLight ? 'border-gray-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Add Coach</h3>
              <button
                onClick={() => { setShowAddCoach(false); setNewCoachName(''); }}
                className={`p-2 ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-slate-400 hover:text-white'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <label className={`text-sm block mb-2 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Coach Title or Name
              </label>
              <input
                type="text"
                value={newCoachName}
                onChange={(e) => setNewCoachName(e.target.value)}
                placeholder="e.g., QB Coach, LB Coach"
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-sky-500 ${
                  isLight
                    ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400'
                    : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
                }`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCoach();
                  if (e.key === 'Escape') { setShowAddCoach(false); setNewCoachName(''); }
                }}
              />
              <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                This coach will be added to this week's meeting notes.
              </p>
            </div>

            <div className={`flex justify-end gap-3 p-4 border-t ${
              isLight ? 'border-gray-200' : 'border-slate-800'
            }`}>
              <button
                onClick={() => { setShowAddCoach(false); setNewCoachName(''); }}
                className={`px-4 py-2 rounded-lg ${
                  isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCoach}
                disabled={!newCoachName.trim()}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Coach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
