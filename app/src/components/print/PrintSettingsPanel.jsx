import { Settings } from 'lucide-react';

/**
 * Dynamic settings panel that shows template-specific options
 */
export default function PrintSettingsPanel({
  template,
  settings,
  onChange,
  weekData,
  roster,
  staff
}) {
  if (!template) {
    return (
      <div className="p-4 border-b border-gray-200">
        <div className="text-gray-400 text-sm text-center py-4">
          Select a template to see settings
        </div>
      </div>
    );
  }

  const updateSetting = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  // Render settings based on template type
  const renderSettings = () => {
    switch (template.id) {
      case 'wristband':
        return <WristbandSettings settings={settings} onChange={updateSetting} weekData={weekData} />;
      case 'coach_wristband':
        return <CoachWristbandSettings settings={settings} onChange={updateSetting} weekData={weekData} />;
      case 'depth_chart':
        return <DepthChartSettings settings={settings} onChange={updateSetting} />;
      case 'practice_plan':
        return <PracticePlanSettings settings={settings} onChange={updateSetting} staff={staff} />;
      case 'game_plan':
        return <GamePlanSettings settings={settings} onChange={updateSetting} />;
      case 'pregame':
        return <PreGameSettings settings={settings} onChange={updateSetting} />;
      case 'roster':
        return <RosterSettings settings={settings} onChange={updateSetting} />;
      case 'playbook':
        return <PlaybookSettings settings={settings} onChange={updateSetting} />;
      default:
        return <CommonSettings settings={settings} onChange={updateSetting} />;
    }
  };

  return (
    <div className="p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Settings size={14} />
        {template.name} Settings
      </div>
      {renderSettings()}
    </div>
  );
}

// Common settings (orientation, etc.)
function CommonSettings({ settings, onChange }) {
  return (
    <>
      <SettingsField label="Orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>
      <SettingsCheckbox
        checked={settings.includeLogo !== false}
        onChange={(e) => onChange('includeLogo', e.target.checked)}
        label="Include team logo"
      />
    </>
  );
}

// Wristband-specific settings
function WristbandSettings({ settings, onChange, weekData }) {
  const cardOptions = [
    { id: 'card100', label: '100s' },
    { id: 'card200', label: '200s' },
    { id: 'card300', label: '300s' },
    { id: 'card400', label: '400s' },
    { id: 'card500', label: '500s' },
    { id: 'card600', label: '600s' },
    { id: 'cardStaples', label: 'Staples' },
  ];

  return (
    <>
      <SettingsField label="Format">
        <select
          value={settings.format || 'player'}
          onChange={(e) => onChange('format', e.target.value)}
        >
          <option value="player">Player (4 per page, 5" x 2.8")</option>
          <option value="coach">Coach (2 per page, 7.5" x 4")</option>
        </select>
      </SettingsField>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Cards to Print</label>
        <div className="space-y-2">
          {cardOptions.map(card => (
            <SettingsCheckbox
              key={card.id}
              checked={(settings.cardSelection || ['card100']).includes(card.id)}
              onChange={(e) => {
                const current = settings.cardSelection || ['card100'];
                const updated = e.target.checked
                  ? [...current, card.id]
                  : current.filter(c => c !== card.id);
                onChange('cardSelection', updated);
              }}
              label={card.label}
            />
          ))}
        </div>
      </div>

      <SettingsField label="WIZ Card Type">
        <select
          value={settings.wizType || 'both'}
          onChange={(e) => onChange('wizType', e.target.value)}
        >
          <option value="both">OC / Play Caller (SKILL & OLINE)</option>
          <option value="skill">Skill Coach (SKILL only)</option>
          <option value="oline">OL Coach (OLINE only)</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        checked={settings.showSlotNumbers !== false}
        onChange={(e) => onChange('showSlotNumbers', e.target.checked)}
        label="Show slot numbers"
      />

      <SettingsCheckbox
        checked={settings.showFormation === true}
        onChange={(e) => onChange('showFormation', e.target.checked)}
        label="Show formation names"
      />
    </>
  );
}

// Coach's consolidated wristband settings
function CoachWristbandSettings({ settings, onChange, weekData }) {
  return (
    <>
      <SettingsField label="Consolidation Mode">
        <select
          value={settings.consolidationMode || 'byCard'}
          onChange={(e) => onChange('consolidationMode', e.target.value)}
        >
          <option value="byCard">Grouped by Card (100s, 200s, etc.)</option>
          <option value="merged">All Slots Merged</option>
        </select>
      </SettingsField>

      <SettingsField label="Font Size">
        <select
          value={settings.fontSize || 'medium'}
          onChange={(e) => onChange('fontSize', e.target.value)}
        >
          <option value="small">Small (8pt)</option>
          <option value="medium">Medium (10pt)</option>
          <option value="large">Large (12pt)</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        checked={settings.showColorCoding !== false}
        onChange={(e) => onChange('showColorCoding', e.target.checked)}
        label="Show color coding"
      />
    </>
  );
}

// Depth chart settings
function DepthChartSettings({ settings, onChange }) {
  const chartTypes = [
    { id: 'offense', label: 'Offense' },
    { id: 'defense', label: 'Defense' },
    { id: 'kickoff', label: 'Kickoff' },
    { id: 'kickoff_return', label: 'Kickoff Return' },
    { id: 'punt', label: 'Punt' },
    { id: 'punt_return', label: 'Punt Return' },
    { id: 'field_goal', label: 'Field Goal' },
  ];

  const formationPairOptions = [
    { id: 'offense-defense', label: 'Offense / Defense' },
    { id: 'kickoff', label: 'Kickoff / Kickoff Return' },
    { id: 'punt', label: 'Punt / Punt Return' },
    { id: 'field-goal', label: 'Field Goal / FG Block' },
    { id: 'onside', label: 'Onside Kick / Hands Team' },
  ];

  const isFormationView = settings.viewMode === 'formation';

  return (
    <>
      <SettingsField label="View Mode">
        <select
          value={settings.viewMode || 'full'}
          onChange={(e) => onChange('viewMode', e.target.value)}
        >
          <option value="full">Full Page (List)</option>
          <option value="halfSheet">Half-Sheet Pairs (2 per page)</option>
          <option value="formation">Formation View (Visual Layout)</option>
        </select>
      </SettingsField>

      {isFormationView ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Formation Pages to Print</label>
          <div className="space-y-2">
            {formationPairOptions.map(pair => (
              <SettingsCheckbox
                key={pair.id}
                checked={(settings.formationPairs || ['offense-defense']).includes(pair.id)}
                onChange={(e) => {
                  const current = settings.formationPairs || ['offense-defense'];
                  const updated = e.target.checked
                    ? [...current, pair.id]
                    : current.filter(p => p !== pair.id);
                  onChange('formationPairs', updated.length > 0 ? updated : ['offense-defense']);
                }}
                label={pair.label}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Charts to Print</label>
          <div className="space-y-2">
            {chartTypes.map(chart => (
              <SettingsCheckbox
                key={chart.id}
                checked={(settings.chartTypes || ['offense', 'defense']).includes(chart.id)}
                onChange={(e) => {
                  const current = settings.chartTypes || ['offense', 'defense'];
                  const updated = e.target.checked
                    ? [...current, chart.id]
                    : current.filter(c => c !== chart.id);
                  onChange('chartTypes', updated);
                }}
                label={chart.label}
              />
            ))}
          </div>
        </div>
      )}

      <SettingsField label="Depth Levels">
        <select
          value={settings.depthLevels || 2}
          onChange={(e) => onChange('depthLevels', parseInt(e.target.value))}
        >
          <option value="2">2 Deep</option>
          <option value="3">3 Deep</option>
        </select>
      </SettingsField>

      {!isFormationView && (
        <SettingsCheckbox
          checked={settings.showBackups !== false}
          onChange={(e) => onChange('showBackups', e.target.checked)}
          label="Show backup players"
        />
      )}
    </>
  );
}

// Practice plan settings
function PracticePlanSettings({ settings, onChange, staff }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <>
      <SettingsCheckbox
        checked={settings.coachView === true}
        onChange={(e) => onChange('coachView', e.target.checked)}
        label="Coach-specific view"
      />

      {settings.coachView && staff?.length > 0 && (
        <SettingsField label="Filter by Coach">
          <select
            value={settings.coachId || ''}
            onChange={(e) => onChange('coachId', e.target.value || null)}
          >
            <option value="">All Coaches</option>
            {staff.map(coach => (
              <option key={coach.id || coach.email} value={coach.id || coach.email}>
                {coach.name || coach.email}
              </option>
            ))}
          </select>
        </SettingsField>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Days to Print</label>
        <div className="space-y-2">
          {days.map(day => (
            <SettingsCheckbox
              key={day}
              checked={(settings.days || days.slice(0, 5)).includes(day)}
              onChange={(e) => {
                const current = settings.days || days.slice(0, 5);
                const updated = e.target.checked
                  ? [...current, day]
                  : current.filter(d => d !== day);
                onChange('days', updated);
              }}
              label={day}
            />
          ))}
        </div>
      </div>

      <SettingsCheckbox
        checked={settings.includeScripts === true}
        onChange={(e) => onChange('includeScripts', e.target.checked)}
        label="Include practice scripts"
      />

      <SettingsField label="Orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        checked={settings.showNotes !== false}
        onChange={(e) => onChange('showNotes', e.target.checked)}
        label="Show notes"
      />

      <SettingsCheckbox
        checked={settings.showContactLevel === true}
        onChange={(e) => onChange('showContactLevel', e.target.checked)}
        label="Show contact level"
      />
    </>
  );
}

// Game plan settings
function GamePlanSettings({ settings, onChange }) {
  return (
    <>
      <SettingsField label="View Type">
        <select
          value={settings.viewType || 'sheet'}
          onChange={(e) => onChange('viewType', e.target.value)}
        >
          <option value="sheet">Call Sheet</option>
          <option value="fzdnd">Field Zone (FZDnD)</option>
          <option value="matrix">Matrix View</option>
        </select>
      </SettingsField>

      <SettingsField label="Orientation">
        <select
          value={settings.orientation || 'landscape'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>
      </SettingsField>

      <SettingsField label="Font Size">
        <select
          value={settings.fontSize || 'medium'}
          onChange={(e) => onChange('fontSize', e.target.value)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        checked={settings.includeLogo !== false}
        onChange={(e) => onChange('includeLogo', e.target.checked)}
        label="Include team logo"
      />

      <SettingsCheckbox
        checked={settings.includeOpponent !== false}
        onChange={(e) => onChange('includeOpponent', e.target.checked)}
        label="Include opponent name"
      />
    </>
  );
}

// Pre-game timeline settings
function PreGameSettings({ settings, onChange }) {
  return (
    <>
      <SettingsField label="Game Time">
        <input
          type="time"
          value={settings.gameTime || '19:00'}
          onChange={(e) => onChange('gameTime', e.target.value)}
        />
      </SettingsField>

      <SettingsField label="Time Format">
        <select
          value={settings.timeFormat || 'actual'}
          onChange={(e) => onChange('timeFormat', e.target.value)}
        >
          <option value="actual">Actual Time (2:30 PM)</option>
          <option value="relative">Relative Time (-90 min)</option>
          <option value="both">Both</option>
        </select>
      </SettingsField>

      <SettingsField label="Orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        checked={settings.includeCheckboxes !== false}
        onChange={(e) => onChange('includeCheckboxes', e.target.checked)}
        label="Include checkboxes"
      />

      <SettingsCheckbox
        checked={settings.showNotes !== false}
        onChange={(e) => onChange('showNotes', e.target.checked)}
        label="Show notes"
      />
    </>
  );
}

// Roster/attendance settings
function RosterSettings({ settings, onChange }) {
  return (
    <>
      <SettingsField label="Sort By">
        <select
          value={settings.sortBy || 'number'}
          onChange={(e) => onChange('sortBy', e.target.value)}
        >
          <option value="number">Jersey Number</option>
          <option value="name">Name (A-Z)</option>
          <option value="position">Position</option>
          <option value="year">Year</option>
        </select>
      </SettingsField>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Columns to Show</label>
        <div className="space-y-2">
          {['number', 'name', 'position', 'year', 'height', 'weight'].map(col => (
            <SettingsCheckbox
              key={col}
              checked={(settings.columns || ['number', 'name', 'position', 'year']).includes(col)}
              onChange={(e) => {
                const current = settings.columns || ['number', 'name', 'position', 'year'];
                const updated = e.target.checked
                  ? [...current, col]
                  : current.filter(c => c !== col);
                onChange('columns', updated);
              }}
              label={col.charAt(0).toUpperCase() + col.slice(1)}
            />
          ))}
        </div>
      </div>

      <SettingsCheckbox
        checked={settings.checkboxColumn !== false}
        onChange={(e) => onChange('checkboxColumn', e.target.checked)}
        label="Include attendance checkbox"
      />

      {settings.checkboxColumn !== false && (
        <SettingsField label="Checkbox Size">
          <select
            value={settings.checkboxSize || 'medium'}
            onChange={(e) => onChange('checkboxSize', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </SettingsField>
      )}
    </>
  );
}

// Playbook settings
function PlaybookSettings({ settings, onChange }) {
  return (
    <>
      <SettingsField label="View Mode">
        <select
          value={settings.viewMode || 'cards'}
          onChange={(e) => onChange('viewMode', e.target.value)}
        >
          <option value="cards">Card View</option>
          <option value="list">List View</option>
        </select>
      </SettingsField>

      {settings.viewMode !== 'list' && (
        <SettingsField label="Cards Per Page">
          <select
            value={settings.cardsPerPage || 4}
            onChange={(e) => onChange('cardsPerPage', parseInt(e.target.value))}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="9">9</option>
          </select>
        </SettingsField>
      )}

      <SettingsCheckbox
        checked={settings.showDiagrams !== false}
        onChange={(e) => onChange('showDiagrams', e.target.checked)}
        label="Show diagrams"
      />

      <SettingsCheckbox
        checked={settings.showFormation !== false}
        onChange={(e) => onChange('showFormation', e.target.checked)}
        label="Show formation names"
      />

      <SettingsCheckbox
        checked={settings.showTags === true}
        onChange={(e) => onChange('showTags', e.target.checked)}
        label="Show play tags"
      />
    </>
  );
}

// Helper Components
function SettingsField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {children.type === 'select' ? (
          <select
            {...children.props}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {children.props.children}
          </select>
        ) : (
          <input
            {...children.props}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        )}
      </div>
    </div>
  );
}

function SettingsCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer mb-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
