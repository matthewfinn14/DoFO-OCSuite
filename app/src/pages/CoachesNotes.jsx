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
  ChevronRight
} from 'lucide-react';

// Note categories for the meeting notes grid
const NOTE_CATEGORIES = [
  { key: 'emphasis', label: 'Emphasis / Focus' },
  { key: 'personnel', label: 'Personnel Considerations' },
  { key: 'practice', label: 'Practice Needs' },
  { key: 'improve', label: 'Areas to Improve' },
  { key: 'emphasize', label: 'Areas to Emphasize' },
  { key: 'opponents', label: 'Opponents to Watch' },
  { key: 'misc', label: 'Misc' }
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

// Phase colors for position group rows
const PHASE_COLORS = {
  OFFENSE: { bg: 'bg-sky-500/10', border: 'border-l-sky-500', text: 'text-sky-400' },
  DEFENSE: { bg: 'bg-red-500/10', border: 'border-l-red-500', text: 'text-red-400' },
  SPECIAL_TEAMS: { bg: 'bg-purple-500/10', border: 'border-l-purple-500', text: 'text-purple-400' }
};

export default function CoachesNotes() {
  const { weekId } = useParams();
  const { weeks, currentWeekId, meetingNotes, updateMeetingNotes, setupConfig, staff } = useSchool();
  const { user, isHeadCoach, isTeamAdmin, isSiteAdmin } = useAuth();

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

  // State for collapsed position groups section
  const [showPositionGroups, setShowPositionGroups] = useState(true);

  // Get position groups from setup config
  const positionGroups = setupConfig?.positionGroups || { OFFENSE: [], DEFENSE: [], SPECIAL_TEAMS: [] };

  // Build list of position groups with their assigned staff (show all groups, not just ones with coaches)
  const positionGroupEntries = useMemo(() => {
    const entries = [];

    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = positionGroups[phase] || [];
      phaseGroups.forEach(group => {
        const staffMember = group.coachId ? staff?.find(s => s.id === group.coachId) : null;

        entries.push({
          id: `pg_${group.id}`,
          groupId: group.id,
          staffId: staffMember?.id || null,
          // Display name: coach name if assigned, otherwise group name
          name: staffMember?.name || group.name,
          displayLabel: staffMember?.name || group.name,
          groupName: group.name,
          groupAbbrev: group.abbrev,
          phase,
          hasCoach: !!staffMember
        });
      });
    });

    return entries;
  }, [positionGroups, staff]);

  // Get custom coaches (ones manually added that aren't coordinators or position group coaches)
  const customCoaches = useMemo(() => {
    const pgCoachNames = positionGroupEntries.filter(e => e.hasCoach).map(e => e.name);
    return coaches.filter(c =>
      !DEFAULT_COACHES.includes(c) &&
      !pgCoachNames.includes(c)
    );
  }, [coaches, positionGroupEntries]);

  // Check if current user can edit a coach's row
  const canEdit = isHeadCoach || isTeamAdmin || isSiteAdmin;

  const canEditRow = (coach, staffId = null) => {
    // Head coach, team admin, site admin can edit everything
    if (canEdit) return true;

    // Check role mapping for coordinators
    const allowedRoles = ROLE_MAP[coach] || [coach];
    const userRole = user?.role || '';

    // Match by role
    if (allowedRoles.some(r => r.toLowerCase() === userRole.toLowerCase())) {
      return true;
    }

    // Match by name for custom coaches
    if (user?.displayName === coach || user?.email?.split('@')[0] === coach.toLowerCase()) {
      return true;
    }

    // Match by staff ID for position group coaches
    if (staffId) {
      const staffMember = staff?.find(s => s.id === staffId);
      if (staffMember) {
        // Check if user email matches staff email
        if (staffMember.email && user?.email === staffMember.email) {
          return true;
        }
        // Check if user display name matches staff name
        if (user?.displayName === staffMember.name) {
          return true;
        }
      }
    }

    return false;
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

  // Get groups that have coach assignments or Big 3 set
  const activePositionGroups = useMemo(() => {
    const groups = [];

    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = positionGroups[phase] || [];
      phaseGroups.forEach(group => {
        // Include if has coach assigned or has Big 3 items
        const hasBig3 = group.big3 && group.big3.some(b => b);
        if (group.coachId || hasBig3) {
          const coach = staff?.find(s => s.id === group.coachId);
          groups.push({
            ...group,
            phase,
            coachName: coach?.name || null
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
          <h1 className="text-2xl font-bold text-white mb-2">Meeting Notes</h1>
          <p className="text-slate-400 mb-6">
            Select a week from the sidebar to view or edit meeting notes.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={28} className="text-amber-400" />
            Meeting Notes
          </h1>
          <p className="text-slate-400 mt-1">
            {week.name}{week.opponent ? ` vs ${week.opponent}` : ''}
          </p>
        </div>

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

      {/* Notes Grid */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300 min-w-[100px] sticky left-0 bg-slate-800 z-10">
                  Coach
                </th>
                {NOTE_CATEGORIES.map(cat => (
                  <th
                    key={cat.key}
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-400 min-w-[150px]"
                  >
                    {cat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Coordinators Section */}
              {DEFAULT_COACHES.map((coach, idx) => {
                const editable = canEditRow(coach);

                return (
                  <tr
                    key={coach}
                    className={`${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} border-t border-slate-800`}
                  >
                    <td className="px-4 py-2 sticky left-0 bg-inherit z-10">
                      <span className="font-semibold text-sky-400">{coach}</span>
                    </td>
                    {NOTE_CATEGORIES.map(cat => (
                      <td key={cat.key} className="px-2 py-2">
                        <textarea
                          value={data[coach]?.[cat.key] || ''}
                          onChange={(e) => editable && updateNote(coach, cat.key, e.target.value)}
                          placeholder={editable ? `${coach} ${cat.label.toLowerCase()}...` : ''}
                          readOnly={!editable}
                          rows={3}
                          className={`w-full px-2 py-1.5 text-xs rounded border resize-y min-h-[60px] ${
                            editable
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 cursor-default'
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Position Groups by Phase */}
              {['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].map(phase => {
                const phaseEntries = positionGroupEntries.filter(e => e.phase === phase);
                if (phaseEntries.length === 0) return null;

                const phaseColors = PHASE_COLORS[phase];
                const phaseLabel = phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.charAt(0) + phase.slice(1).toLowerCase();

                return (
                  <React.Fragment key={phase}>
                    {/* Phase Header Row */}
                    <tr className="bg-slate-800/50">
                      <td
                        colSpan={NOTE_CATEGORIES.length + 1}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${phaseColors.text} border-l-2 ${phaseColors.border}`}
                      >
                        {phaseLabel} Position Groups
                      </td>
                    </tr>

                    {/* Position Group Rows */}
                    {phaseEntries.map((entry, idx) => {
                      const editable = canEditRow(entry.name, entry.staffId);
                      // Use group name as the key for notes storage (consistent regardless of coach assignment)
                      const noteKey = entry.groupAbbrev || entry.groupName;

                      return (
                        <tr
                          key={entry.id}
                          className={`${phaseColors.bg} border-t border-slate-800 border-l-2 ${phaseColors.border}`}
                        >
                          <td className={`px-4 py-2 sticky left-0 z-10 ${phaseColors.bg}`}>
                            <div className="flex flex-col">
                              <span className={`font-semibold ${phaseColors.text}`}>
                                {entry.hasCoach ? entry.name : entry.groupName}
                              </span>
                              <span className="text-[0.65rem] text-slate-500">
                                {entry.hasCoach ? entry.groupAbbrev : (entry.hasCoach === false ? 'No coach assigned' : '')}
                              </span>
                            </div>
                          </td>
                          {NOTE_CATEGORIES.map(cat => (
                            <td key={cat.key} className="px-2 py-2">
                              <textarea
                                value={data[noteKey]?.[cat.key] || ''}
                                onChange={(e) => editable && updateNote(noteKey, cat.key, e.target.value)}
                                placeholder={editable ? `${entry.groupAbbrev} ${cat.label.toLowerCase()}...` : ''}
                                readOnly={!editable}
                                rows={3}
                                className={`w-full px-2 py-1.5 text-xs rounded border resize-y min-h-[60px] ${
                                  editable
                                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none'
                                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 cursor-default'
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Custom Coaches Section */}
              {customCoaches.length > 0 && (
                <>
                  <tr className="bg-slate-800/50">
                    <td
                      colSpan={NOTE_CATEGORIES.length + 1}
                      className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"
                    >
                      Additional Coaches
                    </td>
                  </tr>
                  {customCoaches.map((coach, idx) => {
                    const editable = canEditRow(coach);

                    return (
                      <tr
                        key={coach}
                        className={`${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} border-t border-slate-800`}
                      >
                        <td className="px-4 py-2 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300">{coach}</span>
                            {canEdit && (
                              <button
                                onClick={() => handleRemoveCoach(coach)}
                                className="p-1 text-slate-500 hover:text-red-400"
                                title="Remove coach"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                        {NOTE_CATEGORIES.map(cat => (
                          <td key={cat.key} className="px-2 py-2">
                            <textarea
                              value={data[coach]?.[cat.key] || ''}
                              onChange={(e) => editable && updateNote(coach, cat.key, e.target.value)}
                              placeholder={editable ? `${coach} ${cat.label.toLowerCase()}...` : ''}
                              readOnly={!editable}
                              rows={3}
                              className={`w-full px-2 py-1.5 text-xs rounded border resize-y min-h-[60px] ${
                                editable
                                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none'
                                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 cursor-default'
                              }`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Group Focus Points */}
      {activePositionGroups.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowPositionGroups(!showPositionGroups)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers size={20} className="text-purple-400" />
              Position Group Focus Points
            </h2>
            {showPositionGroups ? (
              <ChevronDown size={20} className="text-slate-400" />
            ) : (
              <ChevronRight size={20} className="text-slate-400" />
            )}
          </button>

          {showPositionGroups && (
            <div className="p-4 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      className={`rounded-lg border border-slate-700 border-l-4 p-3 ${phaseColor}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${badgeColor}`}>
                          {group.abbrev || group.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {group.coachName || 'No coach'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {group.big3 && group.big3.filter(b => b).length > 0 ? (
                          group.big3.filter(b => b).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center bg-slate-700 rounded-full text-[0.6rem] font-bold text-slate-300">
                                {i + 1}
                              </span>
                              <span className="text-slate-300">{item}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No Big 3 set</span>
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
          <div className="bg-slate-900 rounded-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Add Coach</h3>
              <button
                onClick={() => { setShowAddCoach(false); setNewCoachName(''); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <label className="text-sm text-slate-400 block mb-2">
                Coach Title or Name
              </label>
              <input
                type="text"
                value={newCoachName}
                onChange={(e) => setNewCoachName(e.target.value)}
                placeholder="e.g., QB Coach, LB Coach"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCoach();
                  if (e.key === 'Escape') { setShowAddCoach(false); setNewCoachName(''); }
                }}
              />
              <p className="text-xs text-slate-500 mt-2">
                This coach will be added to this week's meeting notes.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowAddCoach(false); setNewCoachName(''); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
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
