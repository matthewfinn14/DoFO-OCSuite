import { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import {
  Target,
  Megaphone,
  Compass,
  Eye,
  Heart,
  Zap,
  Shield,
  Star,
  Flag,
  Plus,
  X,
  CheckCircle,
  Circle,
  BookOpen,
  UserCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Collapsible Help Section component
function HelpSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-sky-400" />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ReadOnly text display component
function ReadOnlyText({ value, placeholder, className = '' }) {
  return (
    <div className={`p-3 bg-slate-800 rounded-lg text-sm leading-relaxed min-h-[2.5rem] whitespace-pre-wrap ${value ? 'text-slate-200' : 'text-slate-500 italic'} ${className}`}>
      {value || placeholder || 'Not set'}
    </div>
  );
}

// Editable textarea component
function EditableTextarea({ value, onChange, placeholder, rows = 2, disabled = false }) {
  return (
    <textarea
      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 resize-y focus:outline-none focus:border-sky-500 disabled:opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
    />
  );
}

// Goal list component
function GoalList({ goals, onUpdate, canEdit, accentColor = 'slate' }) {
  const colorMap = {
    red: 'border-t-red-500',
    blue: 'border-t-blue-500',
    green: 'border-t-green-500',
    slate: ''
  };

  const addGoal = () => {
    onUpdate([...goals, { id: Date.now().toString(), text: '', completed: false }]);
  };

  const updateGoal = (index, updates) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const removeGoal = (id) => {
    onUpdate(goals.filter(g => g.id !== id));
  };

  return (
    <div className={`bg-slate-900 rounded-lg p-3 border border-slate-800 ${colorMap[accentColor]} ${accentColor !== 'slate' ? 'border-t-2' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-300">
          {accentColor === 'slate' ? 'Season Goals' : `${accentColor === 'red' ? 'OFF' : accentColor === 'blue' ? 'DEF' : 'ST'} Weekly`}
        </h3>
        {canEdit && (
          <button onClick={addGoal} className="p-1 text-slate-400 hover:text-white">
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {goals.length === 0 && (
          <p className="text-slate-500 italic text-xs text-center py-2">No goals set</p>
        )}
        {goals.map((goal, index) => (
          <div key={goal.id} className="flex items-center gap-2 bg-slate-800 p-1.5 rounded text-sm">
            {canEdit ? (
              <>
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={(e) => updateGoal(index, { completed: e.target.checked })}
                  className="w-3.5 h-3.5 rounded"
                />
                <input
                  type="text"
                  value={goal.text}
                  onChange={(e) => updateGoal(index, { text: e.target.value })}
                  placeholder="Goal..."
                  className={`flex-1 bg-transparent border-none text-xs p-1 focus:outline-none ${goal.completed ? 'line-through opacity-50' : 'text-white'}`}
                />
                <button onClick={() => removeGoal(goal.id)} className="text-red-400 hover:text-red-300 p-0.5">
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                {goal.completed ? (
                  <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle size={14} className="text-slate-500 flex-shrink-0" />
                )}
                <span className={`flex-1 text-xs ${goal.completed ? 'line-through opacity-60' : ''}`}>
                  {goal.text || 'Untitled goal'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Position Big Three row
function PositionRow({ posKey, label, values, onUpdate, canEdit, assignedName, onAssign, isHeadCoach }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs font-semibold text-sky-400">{label}</span>
        <button
          onClick={onAssign}
          className={`text-[0.65rem] px-1 ${assignedName ? 'text-emerald-400' : 'text-slate-500'} ${isHeadCoach ? 'cursor-pointer hover:text-white' : 'cursor-default'}`}
          disabled={!isHeadCoach}
        >
          [{assignedName || (isHeadCoach ? 'assign' : 'none')}]
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-[0.65rem] font-semibold text-slate-500 w-4">#{i + 1}</span>
            <input
              type="text"
              value={values?.[i] || ''}
              onChange={(e) => {
                if (!canEdit) return;
                const updated = [...(values || ['', '', ''])];
                updated[i] = e.target.value;
                onUpdate(updated);
              }}
              readOnly={!canEdit}
              className={`flex-1 px-2 py-1 text-[0.7rem] rounded border border-slate-700 ${canEdit ? 'bg-slate-800 text-white' : 'bg-slate-800/50 text-slate-400'} focus:outline-none focus:border-sky-500`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { school, staff, culture, updateCulture } = useSchool();
  const { userProfile, isHeadCoach } = useAuth();

  // Local state for debounced updates
  const [localCulture, setLocalCulture] = useState(null);

  // Use local state if editing, otherwise use context
  const currentCulture = localCulture || culture;

  // Debounced save
  const handleCultureChange = (field, value) => {
    const updated = { ...currentCulture, [field]: value };
    setLocalCulture(updated);
    // Debounce the actual save
    clearTimeout(window._cultureSaveTimeout);
    window._cultureSaveTimeout = setTimeout(() => {
      updateCulture({ [field]: value });
    }, 1000);
  };

  const handleNestedChange = (parent, field, value) => {
    const updated = {
      ...currentCulture,
      [parent]: { ...currentCulture[parent], [field]: value }
    };
    setLocalCulture(updated);
    clearTimeout(window._cultureSaveTimeout);
    window._cultureSaveTimeout = setTimeout(() => {
      updateCulture({ [parent]: updated[parent] });
    }, 1000);
  };

  const handleGoalsChange = (goalType, goals) => {
    const updated = {
      ...currentCulture,
      goals: { ...currentCulture.goals, [goalType]: goals }
    };
    setLocalCulture(updated);
    clearTimeout(window._cultureSaveTimeout);
    window._cultureSaveTimeout = setTimeout(() => {
      updateCulture({ goals: updated.goals });
    }, 500);
  };

  const handleBigThreeChange = (posKey, values) => {
    const updated = {
      ...currentCulture,
      positionBigThree: { ...currentCulture.positionBigThree, [posKey]: values }
    };
    setLocalCulture(updated);
    clearTimeout(window._cultureSaveTimeout);
    window._cultureSaveTimeout = setTimeout(() => {
      updateCulture({ positionBigThree: updated.positionBigThree });
    }, 500);
  };

  const handleAssignCoach = (posKey) => {
    if (!isHeadCoach) return;
    const staffList = staff.filter(s => s.id !== userProfile?.id);
    const options = staffList.map(s => s.name).join('\n');
    const current = getAssignedName(posKey);
    const input = prompt(`Assign coach to ${posKey}:\n\nCurrent: ${current || 'None'}\n\nAvailable coaches:\n${options}\n\nEnter coach name (or leave blank to unassign):`);

    if (input === null) return;

    if (input.trim() === '') {
      const updated = { ...currentCulture.positionBigThreeAssignments };
      delete updated[posKey];
      updateCulture({ positionBigThreeAssignments: updated });
    } else {
      const found = staff.find(s => s.name.toLowerCase() === input.trim().toLowerCase());
      if (found) {
        updateCulture({
          positionBigThreeAssignments: {
            ...currentCulture.positionBigThreeAssignments,
            [posKey]: found.id
          }
        });
      } else {
        alert('Coach not found. Please enter exact name.');
      }
    }
  };

  const getAssignedName = (posKey) => {
    const assignedId = currentCulture.positionBigThreeAssignments?.[posKey];
    if (!assignedId) return null;
    const assigned = staff.find(s => s.id === assignedId);
    return assigned?.name || 'Unknown';
  };

  const canEditPosition = (posKey) => {
    if (isHeadCoach) return true;
    const assignedId = currentCulture.positionBigThreeAssignments?.[posKey];
    return assignedId && assignedId === userProfile?.id;
  };

  const addCustomGroup = () => {
    const name = prompt('Enter position group name (e.g., "ILB", "OLB", "S", "CB", "Slot"):');
    if (!name?.trim()) return;

    const category = prompt('Which category? Enter: offense, defense, or st')?.toLowerCase()?.trim();
    if (!['offense', 'defense', 'st'].includes(category)) {
      alert('Please enter: offense, defense, or st');
      return;
    }

    const key = 'CUSTOM_' + Date.now();
    updateCulture({
      customBigThreeGroups: [...(currentCulture.customBigThreeGroups || []), { key, name: name.trim(), category }],
      positionBigThree: { ...currentCulture.positionBigThree, [key]: ['', '', ''] }
    });
  };

  const removeCustomGroup = (key) => {
    if (!confirm('Remove this position group?')) return;

    const newGroups = (currentCulture.customBigThreeGroups || []).filter(g => g.key !== key);
    const newBigThree = { ...currentCulture.positionBigThree };
    delete newBigThree[key];
    const newAssignments = { ...currentCulture.positionBigThreeAssignments };
    delete newAssignments[key];

    updateCulture({
      customBigThreeGroups: newGroups,
      positionBigThree: newBigThree,
      positionBigThreeAssignments: newAssignments
    });
  };

  const offenseCustom = (currentCulture.customBigThreeGroups || []).filter(g => g.category === 'offense');
  const defenseCustom = (currentCulture.customBigThreeGroups || []).filter(g => g.category === 'defense');
  const stCustom = (currentCulture.customBigThreeGroups || []).filter(g => g.category === 'st');

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Target size={24} /> Alignment Dashboard
        </h1>
        {!isHeadCoach && (
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">View Only</span>
        )}
      </div>

      {/* Help Section */}
      <HelpSection title="What is the Alignment Dashboard?">
        <div className="pt-3 space-y-3">
          <div>
            <h4 className="text-white font-medium mb-1">Purpose</h4>
            <p>
              The Alignment Dashboard is your program's cultural foundation. It defines the "why" behind everything
              your team does—from your season motto to position-specific focus points. This is where you document
              your program's identity so every coach and player understands what you stand for.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">What It Connects To</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Position Big 3:</strong> Links to your Position Groups in System Setup—coaches assigned there will see their Big 3 here</li>
              <li><strong>Goals:</strong> Track season and weekly goals that can be referenced in practice plans and game prep</li>
              <li><strong>Standards:</strong> Document expectations that can be shared with players and referenced throughout the season</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Why Set This Up?</h4>
            <p>
              Teams with clearly defined culture and expectations perform better because everyone is on the same page.
              This dashboard gives your staff a single source of truth for "how we do things here." Share it at the
              start of the season, reference it during tough weeks, and use it to hold each other accountable.
            </p>
          </div>
        </div>
      </HelpSection>

      {/* Season Theme */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-4 mb-3 border-l-4 border-sky-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-sky-400" />
            <span className="text-sm font-semibold text-slate-400">Season Theme:</span>
          </div>
          {isHeadCoach ? (
            <input
              type="text"
              value={currentCulture.seasonMotto || ''}
              onChange={(e) => handleCultureChange('seasonMotto', e.target.value)}
              placeholder="e.g., 'All In', 'Championship Mindset', 'Finish Strong'"
              className="flex-1 px-3 py-2 text-xl font-bold italic text-center bg-transparent border border-dashed border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          ) : (
            <div className={`flex-1 text-center text-2xl font-bold italic tracking-wide ${currentCulture.seasonMotto ? 'text-sky-400' : 'text-slate-500'}`}>
              {currentCulture.seasonMotto ? `"${currentCulture.seasonMotto}"` : 'Theme not set'}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Mission/Vision/Values + Philosophies */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Compass size={14} /> Mission
            </h3>
            {isHeadCoach ? (
              <EditableTextarea
                value={currentCulture.teamMission || ''}
                onChange={(v) => handleCultureChange('teamMission', v)}
                placeholder="What is your team's purpose?"
                rows={2}
              />
            ) : (
              <ReadOnlyText value={currentCulture.teamMission} placeholder="Mission not defined" />
            )}
          </div>

          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Eye size={14} /> Vision
            </h3>
            {isHeadCoach ? (
              <EditableTextarea
                value={currentCulture.teamVision || ''}
                onChange={(v) => handleCultureChange('teamVision', v)}
                placeholder="Where is your team going?"
                rows={2}
              />
            ) : (
              <ReadOnlyText value={currentCulture.teamVision} placeholder="Vision not defined" />
            )}
          </div>

          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Heart size={14} /> Core Values
            </h3>
            {isHeadCoach ? (
              <EditableTextarea
                value={currentCulture.teamNonNegotiables || ''}
                onChange={(v) => handleCultureChange('teamNonNegotiables', v)}
                placeholder="What values define your program?"
                rows={2}
              />
            ) : (
              <ReadOnlyText value={currentCulture.teamNonNegotiables} placeholder="Core values not defined" />
            )}
          </div>
        </div>

        {/* Right Column - Philosophies */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 border-l-4 border-l-red-500">
            <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
              <Zap size={14} /> Offense Philosophy
            </h3>
            {isHeadCoach ? (
              <EditableTextarea
                value={currentCulture.offensePhilosophy || ''}
                onChange={(v) => handleCultureChange('offensePhilosophy', v)}
                placeholder="How do we attack?"
                rows={2}
              />
            ) : (
              <ReadOnlyText value={currentCulture.offensePhilosophy} placeholder="Philosophy not defined" />
            )}
          </div>

          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <Shield size={14} /> Defense Philosophy
            </h3>
            {isHeadCoach ? (
              <EditableTextarea
                value={currentCulture.defensePhilosophy || ''}
                onChange={(v) => handleCultureChange('defensePhilosophy', v)}
                placeholder="How do we stop them?"
                rows={2}
              />
            ) : (
              <ReadOnlyText value={currentCulture.defensePhilosophy} placeholder="Philosophy not defined" />
            )}
          </div>

          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 border-l-4 border-l-green-500">
            <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <Star size={14} /> Special Teams Philosophy
            </h3>
            {isHeadCoach ? (
              <EditableTextarea
                value={currentCulture.specialTeamsPhilosophy || ''}
                onChange={(v) => handleCultureChange('specialTeamsPhilosophy', v)}
                placeholder="How do we win the hidden game?"
                rows={2}
              />
            ) : (
              <ReadOnlyText value={currentCulture.specialTeamsPhilosophy} placeholder="Philosophy not defined" />
            )}
          </div>
        </div>
      </div>

      {/* Goals Section - 4 columns */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <GoalList
          goals={currentCulture.goals?.teamSeason || []}
          onUpdate={(g) => handleGoalsChange('teamSeason', g)}
          canEdit={isHeadCoach}
          accentColor="slate"
        />
        <GoalList
          goals={currentCulture.goals?.offenseWeekly || []}
          onUpdate={(g) => handleGoalsChange('offenseWeekly', g)}
          canEdit={isHeadCoach}
          accentColor="red"
        />
        <GoalList
          goals={currentCulture.goals?.defenseWeekly || []}
          onUpdate={(g) => handleGoalsChange('defenseWeekly', g)}
          canEdit={isHeadCoach}
          accentColor="blue"
        />
        <GoalList
          goals={currentCulture.goals?.stWeekly || []}
          onUpdate={(g) => handleGoalsChange('stWeekly', g)}
          canEdit={isHeadCoach}
          accentColor="green"
        />
      </div>

      {/* Program Standards */}
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 mb-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen size={16} /> Program Standards
          </h3>
          <span className="text-xs text-sky-400 italic">Coaches: Enforce these daily!</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'practice', label: 'Practice', placeholder: 'Practice expectations...' },
            { key: 'meeting', label: 'Meetings/Film', placeholder: 'Meeting room expectations...' },
            { key: 'weightRoom', label: 'Weight Room', placeholder: 'Weight room expectations...' },
            { key: 'life', label: 'Life', placeholder: 'Off-field expectations...' },
            { key: 'school', label: 'School', placeholder: 'Academic expectations...' },
            { key: 'travel', label: 'Travel', placeholder: 'Travel expectations...' }
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">{label}</label>
              {isHeadCoach ? (
                <EditableTextarea
                  value={currentCulture.standards?.[key] || ''}
                  onChange={(v) => handleNestedChange('standards', key, v)}
                  placeholder={placeholder}
                  rows={2}
                />
              ) : (
                <ReadOnlyText value={currentCulture.standards?.[key]} placeholder="Not set" className="text-xs" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coaches' Expectations */}
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 mb-3">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <UserCheck size={14} /> Coaches' Expectations
        </h3>
        {isHeadCoach ? (
          <EditableTextarea
            value={currentCulture.coachesExpectations || ''}
            onChange={(v) => handleCultureChange('coachesExpectations', v)}
            placeholder="What do we expect from our coaches?"
            rows={2}
          />
        ) : (
          <ReadOnlyText value={currentCulture.coachesExpectations} placeholder="Expectations not defined" />
        )}
      </div>

      {/* Position Group Big Three */}
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Target size={16} /> Position Group "Big Three" Emphasis
          </h3>
          {isHeadCoach && (
            <button onClick={addCustomGroup} className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700 flex items-center gap-1">
              <Plus size={12} /> Add Group
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Each position group's top 3 focus areas. {isHeadCoach && <span className="text-sky-400">Click [assign] to assign a coach.</span>}
        </p>

        {/* Overall Big Three */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="bg-slate-900 p-3 rounded-lg border-t-2 border-t-red-500">
            <h4 className="text-sm text-red-400 mb-2 flex items-center gap-2">
              <Zap size={14} /> Overall Offense
            </h4>
            <PositionRow
              posKey="OVERALL_OFF"
              label="Team Offense"
              values={currentCulture.positionBigThree?.OVERALL_OFF}
              onUpdate={(v) => handleBigThreeChange('OVERALL_OFF', v)}
              canEdit={canEditPosition('OVERALL_OFF')}
              assignedName={getAssignedName('OVERALL_OFF')}
              onAssign={() => handleAssignCoach('OVERALL_OFF')}
              isHeadCoach={isHeadCoach}
            />
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border-t-2 border-t-blue-500">
            <h4 className="text-sm text-blue-400 mb-2 flex items-center gap-2">
              <Shield size={14} /> Overall Defense
            </h4>
            <PositionRow
              posKey="OVERALL_DEF"
              label="Team Defense"
              values={currentCulture.positionBigThree?.OVERALL_DEF}
              onUpdate={(v) => handleBigThreeChange('OVERALL_DEF', v)}
              canEdit={canEditPosition('OVERALL_DEF')}
              assignedName={getAssignedName('OVERALL_DEF')}
              onAssign={() => handleAssignCoach('OVERALL_DEF')}
              isHeadCoach={isHeadCoach}
            />
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border-t-2 border-t-green-500">
            <h4 className="text-sm text-green-400 mb-2 flex items-center gap-2">
              <Star size={14} /> Overall Special Teams
            </h4>
            <PositionRow
              posKey="OVERALL_ST"
              label="Team ST"
              values={currentCulture.positionBigThree?.OVERALL_ST}
              onUpdate={(v) => handleBigThreeChange('OVERALL_ST', v)}
              canEdit={canEditPosition('OVERALL_ST')}
              assignedName={getAssignedName('OVERALL_ST')}
              onAssign={() => handleAssignCoach('OVERALL_ST')}
              isHeadCoach={isHeadCoach}
            />
          </div>
        </div>

        {/* Position Groups by Category */}
        <div className="grid grid-cols-3 gap-3">
          {/* Offense */}
          <div>
            <h4 className="text-sm text-red-400 mb-2 pb-1 border-b-2 border-red-500">Offense by Position</h4>
            {['QB', 'RB', 'WR', 'TE', 'OL'].map(pos => (
              <PositionRow
                key={pos}
                posKey={pos}
                label={pos}
                values={currentCulture.positionBigThree?.[pos]}
                onUpdate={(v) => handleBigThreeChange(pos, v)}
                canEdit={canEditPosition(pos)}
                assignedName={getAssignedName(pos)}
                onAssign={() => handleAssignCoach(pos)}
                isHeadCoach={isHeadCoach}
              />
            ))}
            {offenseCustom.map(group => (
              <div key={group.key} className="relative">
                {isHeadCoach && (
                  <button
                    onClick={() => removeCustomGroup(group.key)}
                    className="absolute right-0 top-0 text-red-400 hover:text-red-300 opacity-60"
                  >
                    <X size={10} />
                  </button>
                )}
                <PositionRow
                  posKey={group.key}
                  label={group.name}
                  values={currentCulture.positionBigThree?.[group.key]}
                  onUpdate={(v) => handleBigThreeChange(group.key, v)}
                  canEdit={canEditPosition(group.key)}
                  assignedName={getAssignedName(group.key)}
                  onAssign={() => handleAssignCoach(group.key)}
                  isHeadCoach={isHeadCoach}
                />
              </div>
            ))}
          </div>

          {/* Defense */}
          <div>
            <h4 className="text-sm text-blue-400 mb-2 pb-1 border-b-2 border-blue-500">Defense by Position</h4>
            {['DL', 'LB', 'DB'].map(pos => (
              <PositionRow
                key={pos}
                posKey={pos}
                label={pos}
                values={currentCulture.positionBigThree?.[pos]}
                onUpdate={(v) => handleBigThreeChange(pos, v)}
                canEdit={canEditPosition(pos)}
                assignedName={getAssignedName(pos)}
                onAssign={() => handleAssignCoach(pos)}
                isHeadCoach={isHeadCoach}
              />
            ))}
            {defenseCustom.map(group => (
              <div key={group.key} className="relative">
                {isHeadCoach && (
                  <button
                    onClick={() => removeCustomGroup(group.key)}
                    className="absolute right-0 top-0 text-red-400 hover:text-red-300 opacity-60"
                  >
                    <X size={10} />
                  </button>
                )}
                <PositionRow
                  posKey={group.key}
                  label={group.name}
                  values={currentCulture.positionBigThree?.[group.key]}
                  onUpdate={(v) => handleBigThreeChange(group.key, v)}
                  canEdit={canEditPosition(group.key)}
                  assignedName={getAssignedName(group.key)}
                  onAssign={() => handleAssignCoach(group.key)}
                  isHeadCoach={isHeadCoach}
                />
              </div>
            ))}
          </div>

          {/* Special Teams */}
          <div>
            <h4 className="text-sm text-green-400 mb-2 pb-1 border-b-2 border-green-500">Special Teams by Unit</h4>
            {['KO', 'KOR', 'PUNT', 'PR', 'FG', 'FGB'].map(pos => (
              <PositionRow
                key={pos}
                posKey={pos}
                label={pos === 'KO' ? 'Kickoff' : pos === 'KOR' ? 'KO Return' : pos === 'PUNT' ? 'Punt' : pos === 'PR' ? 'Punt Return' : pos === 'FG' ? 'FG / PAT' : 'FG Block'}
                values={currentCulture.positionBigThree?.[pos]}
                onUpdate={(v) => handleBigThreeChange(pos, v)}
                canEdit={canEditPosition(pos)}
                assignedName={getAssignedName(pos)}
                onAssign={() => handleAssignCoach(pos)}
                isHeadCoach={isHeadCoach}
              />
            ))}
            {stCustom.map(group => (
              <div key={group.key} className="relative">
                {isHeadCoach && (
                  <button
                    onClick={() => removeCustomGroup(group.key)}
                    className="absolute right-0 top-0 text-red-400 hover:text-red-300 opacity-60"
                  >
                    <X size={10} />
                  </button>
                )}
                <PositionRow
                  posKey={group.key}
                  label={group.name}
                  values={currentCulture.positionBigThree?.[group.key]}
                  onUpdate={(v) => handleBigThreeChange(group.key, v)}
                  canEdit={canEditPosition(group.key)}
                  assignedName={getAssignedName(group.key)}
                  onAssign={() => handleAssignCoach(group.key)}
                  isHeadCoach={isHeadCoach}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
