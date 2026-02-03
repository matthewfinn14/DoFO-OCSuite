import { Settings, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Dynamic settings panel that shows template-specific options
 */
export default function PrintSettingsPanel({
  template,
  settings,
  onChange,
  weekData,
  roster,
  staff,
  layout = 'vertical'
}) {
  if (!template) {
    return (
      <div className={`border-b border-gray-200 ${layout === 'vertical' ? 'p-4' : 'px-4 py-2'}`}>
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
    const props = { settings, onChange: updateSetting, layout };
    switch (template.id) {
      case 'wristband':
        return <WristbandSettings {...props} weekData={weekData} />;
      case 'coach_wristband':
        return <CoachWristbandSettings {...props} weekData={weekData} />;
      case 'depth_chart':
        return <DepthChartSettings {...props} />;
      case 'practice_plan':
        return <PracticePlanSettings {...props} staff={staff} />;
      case 'practice_plan_coach':
        return <PracticePlanCoachSettings {...props} staff={staff} weekData={weekData} />;
      case 'game_plan':
        return <GamePlanSettings {...props} />;
      case 'pregame':
        return <PreGameSettings {...props} />;
      case 'roster':
        return <RosterSettings {...props} />;
      case 'playbook':
        return <PlaybookSettings {...props} />;
      default:
        return <CommonSettings {...props} />;
    }
  };

  return (
    <div className={layout === 'vertical' ? 'p-4' : 'flex items-center gap-4 flex-wrap'}>
      {layout === 'vertical' && (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Settings size={14} />
          {template.name} Settings
        </div>
      )}
      {renderSettings()}
    </div>
  );
}

// Common settings (orientation, etc.)
function CommonSettings({ settings, onChange, layout }) {
  return (
    <>
      <SettingsField label="Orientation" layout={layout} id="print-settings-orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>
      <SettingsCheckbox
        id="print-settings-include-logo"
        checked={settings.includeLogo !== false}
        onChange={(e) => onChange('includeLogo', e.target.checked)}
        label="Include team logo"
        layout={layout}
      />
    </>
  );
}

// Wristband-specific settings
function WristbandSettings({ settings, onChange, weekData, layout }) {
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
      <SettingsField label="Format" layout={layout} id="print-settings-wristband-format">
        <select
          value={settings.format || 'player'}
          onChange={(e) => onChange('format', e.target.value)}
        >
          <option value="player">Player (4 per page, 4.75" x 2.8")</option>
          <option value="coach">Coach (2 per page, 7.5" x 4")</option>
        </select>
      </SettingsField>

      {layout === 'horizontal' ? (
        <MultiSelectDropdown
          id="print-settings-wristband-cards"
          label="Cards"
          options={cardOptions}
          selectedIds={settings.cardSelection || ['card100']}
          onChange={(updated) => onChange('cardSelection', updated)}
        />
      ) : (
        <div className="mb-4">
          <label id="print-settings-wristband-cards-label" className="block text-sm font-medium text-gray-700 mb-2">Cards to Print</label>
          <div className="space-y-2" role="group" aria-labelledby="print-settings-wristband-cards-label">
            {cardOptions.map(card => (
              <SettingsCheckbox
                key={card.id}
                id={`print-settings-wristband-card-${card.id}`}
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
      )}

      <SettingsField label="WIZ Card Type" layout={layout} id="print-settings-wristband-wiz-type">
        <select
          value={settings.wizType || 'skill'}
          onChange={(e) => onChange('wizType', e.target.value)}
        >
          <option value="skill">SKILL</option>
          <option value="oline">OLINE</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        id="print-settings-wristband-show-slot-numbers"
        checked={settings.showSlotNumbers !== false}
        onChange={(e) => onChange('showSlotNumbers', e.target.checked)}
        label="Show slot numbers"
        layout={layout}
      />

      <SettingsCheckbox
        id="print-settings-wristband-show-formation"
        checked={settings.showFormation === true}
        onChange={(e) => onChange('showFormation', e.target.checked)}
        label="Show formation names"
        layout={layout}
      />
    </>
  );
}

// Coach's consolidated wristband settings
function CoachWristbandSettings({ settings, onChange, weekData, layout }) {
  return (
    <>
      <SettingsField label="Consolidation Mode" layout={layout} id="print-settings-coach-wristband-consolidation-mode">
        <select
          value={settings.consolidationMode || 'byCard'}
          onChange={(e) => onChange('consolidationMode', e.target.value)}
        >
          <option value="byCard">Grouped by Card (100s, 200s, etc.)</option>
          <option value="merged">All Slots Merged</option>
        </select>
      </SettingsField>

      <SettingsField label="Font Size" layout={layout} id="print-settings-coach-wristband-font-size">
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
        id="print-settings-coach-wristband-show-color-coding"
        checked={settings.showColorCoding !== false}
        onChange={(e) => onChange('showColorCoding', e.target.checked)}
        label="Show color coding"
        layout={layout}
      />
    </>
  );
}

// Depth chart settings
function DepthChartSettings({ settings, onChange, layout }) {
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
      <SettingsField label="View Mode" layout={layout} id="print-settings-depth-chart-view-mode">
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
        layout === 'horizontal' ? (
          <MultiSelectDropdown
            id="print-settings-depth-chart-formation-pages"
            label="Formation Pages"
            options={formationPairOptions}
            selectedIds={settings.formationPairs || ['offense-defense']}
            onChange={(updated) => onChange('formationPairs', updated.length > 0 ? updated : ['offense-defense'])}
          />
        ) : (
          <div className="mb-4">
            <label id="print-settings-depth-chart-formation-pages-label" className="block text-sm font-medium text-gray-700 mb-2">Formation Pages to Print</label>
            <div className="space-y-2" role="group" aria-labelledby="print-settings-depth-chart-formation-pages-label">
              {formationPairOptions.map(pair => (
                <SettingsCheckbox
                  key={pair.id}
                  id={`print-settings-depth-chart-formation-pair-${pair.id}`}
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
        )
      ) : (
        layout === 'horizontal' ? (
          <MultiSelectDropdown
            id="print-settings-depth-chart-charts"
            label="Charts"
            options={chartTypes}
            selectedIds={settings.chartTypes || ['offense', 'defense']}
            onChange={(updated) => onChange('chartTypes', updated)}
          />
        ) : (
          <div className="mb-4">
            <label id="print-settings-depth-chart-charts-label" className="block text-sm font-medium text-gray-700 mb-2">Charts to Print</label>
            <div className="space-y-2" role="group" aria-labelledby="print-settings-depth-chart-charts-label">
              {chartTypes.map(chart => (
                <SettingsCheckbox
                  key={chart.id}
                  id={`print-settings-depth-chart-chart-${chart.id}`}
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
        )
      )}

      <SettingsField label="Depth Levels" layout={layout} id="print-settings-depth-chart-depth-levels">
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
          id="print-settings-depth-chart-show-backups"
          checked={settings.showBackups !== false}
          onChange={(e) => onChange('showBackups', e.target.checked)}
          label="Show backups"
          layout={layout}
        />
      )}
    </>
  );
}

// Practice plan settings
function PracticePlanSettings({ settings, onChange, staff, layout }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <>
      <SettingsCheckbox
        id="print-settings-practice-plan-coach-view"
        checked={settings.coachView === true}
        onChange={(e) => onChange('coachView', e.target.checked)}
        label="Coach-specific view"
        layout={layout}
      />

      {settings.coachView && staff?.length > 0 && (
        <SettingsField label="Filter by Coach" layout={layout} id="print-settings-practice-plan-coach-filter">
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

      {layout === 'horizontal' ? (
        <MultiSelectDropdown
          id="print-settings-practice-plan-days"
          label="Days"
          options={days.map(d => ({ id: d, label: d }))}
          selectedIds={settings.days || days.slice(0, 5)}
          onChange={(updated) => onChange('days', updated)}
        />
      ) : (
        <div className="mb-4">
          <label id="print-settings-practice-plan-days-label" className="block text-sm font-medium text-gray-700 mb-2">Days to Print</label>
          <div className="space-y-2" role="group" aria-labelledby="print-settings-practice-plan-days-label">
            {days.map(day => (
              <SettingsCheckbox
                key={day}
                id={`print-settings-practice-plan-day-${day.toLowerCase()}`}
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
      )}

      <SettingsCheckbox
        id="print-settings-practice-plan-include-scripts"
        checked={settings.includeScripts === true}
        onChange={(e) => onChange('includeScripts', e.target.checked)}
        label="Include scripts"
        layout={layout}
      />

      <SettingsField label="Orientation" layout={layout} id="print-settings-practice-plan-orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        id="print-settings-practice-plan-show-notes"
        checked={settings.showNotes !== false}
        onChange={(e) => onChange('showNotes', e.target.checked)}
        label="Show notes"
        layout={layout}
      />

      <SettingsCheckbox
        id="print-settings-practice-plan-show-contact-level"
        checked={settings.showContactLevel === true}
        onChange={(e) => onChange('showContactLevel', e.target.checked)}
        label="Show contact level"
        layout={layout}
      />
    </>
  );
}

// Practice plan coach view settings
function PracticePlanCoachSettings({ settings, onChange, staff, weekData, layout }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get days that have practice plans
  const daysWithPlans = days.filter(day => {
    const dayKey = day.toLowerCase();
    const dayPlan = weekData?.practicePlans?.[dayKey] || weekData?.practicePlans?.[day];
    return dayPlan?.segments?.length > 0;
  });

  return (
    <>
      <SettingsField label="Day" layout={layout} id="print-settings-coach-view-day">
        <select
          value={settings.day || 'Monday'}
          onChange={(e) => onChange('day', e.target.value)}
        >
          {days.map(day => {
            const hasPlan = daysWithPlans.includes(day);
            return (
              <option key={day} value={day}>
                {day}{hasPlan ? '' : ' (no plan)'}
              </option>
            );
          })}
        </select>
      </SettingsField>

      <SettingsField label="Coach" layout={layout} id="print-settings-coach-view-coach">
        <select
          value={settings.coachId || ''}
          onChange={(e) => onChange('coachId', e.target.value || null)}
        >
          <option value="">All Staff</option>
          {(staff || []).map(coach => (
            <option key={coach.id || coach.email} value={coach.id || coach.email}>
              {coach.name || coach.email}
            </option>
          ))}
        </select>
      </SettingsField>

      <SettingsField label="Orientation" layout={layout} id="print-settings-coach-view-orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        id="print-settings-coach-view-include-scripts"
        checked={settings.includeScripts !== false}
        onChange={(e) => onChange('includeScripts', e.target.checked)}
        label="Scripts"
        layout={layout}
      />
    </>
  );
}

// Game plan settings
function GamePlanSettings({ settings, onChange, layout }) {
  return (
    <>
      <SettingsField label="View Type" layout={layout} id="print-settings-game-plan-view-type">
        <select
          value={settings.viewType || 'sheet'}
          onChange={(e) => onChange('viewType', e.target.value)}
        >
          <option value="sheet">Call Sheet</option>
          <option value="fzdnd">Field Zone (FZDnD)</option>
          <option value="matrix">Matrix View</option>
        </select>
      </SettingsField>

      <SettingsField label="Page Format" layout={layout} id="print-settings-game-plan-page-format">
        <select
          value={settings.pageFormat || '2-page'}
          onChange={(e) => onChange('pageFormat', e.target.value)}
        >
          <option value="2-page">2-Page (1 sheet front/back)</option>
          <option value="4-page">4-Page Booklet (17x11 spread)</option>
        </select>
      </SettingsField>

      <SettingsField label="Font Size" layout={layout} id="print-settings-game-plan-font-size">
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
        id="print-settings-game-plan-include-logo"
        checked={settings.includeLogo !== false}
        onChange={(e) => onChange('includeLogo', e.target.checked)}
        label="Tm Logo"
        layout={layout}
      />

      <SettingsCheckbox
        id="print-settings-game-plan-include-opponent"
        checked={settings.includeOpponent !== false}
        onChange={(e) => onChange('includeOpponent', e.target.checked)}
        label="Opp Name"
        layout={layout}
      />
    </>
  );
}

// Pre-game timeline settings
function PreGameSettings({ settings, onChange, layout }) {
  return (
    <>
      <SettingsField label="Kickoff Time" layout={layout} id="print-settings-pregame-game-time">
        <input
          type="time"
          value={settings.gameTime || '19:00'}
          onChange={(e) => onChange('gameTime', e.target.value)}
        />
      </SettingsField>

      <SettingsField label="Orientation" layout={layout} id="print-settings-pregame-orientation">
        <select
          value={settings.orientation || 'portrait'}
          onChange={(e) => onChange('orientation', e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </SettingsField>

      <SettingsCheckbox
        id="print-settings-pregame-include-checkboxes"
        checked={settings.includeCheckboxes !== false}
        onChange={(e) => onChange('includeCheckboxes', e.target.checked)}
        label="Checkboxes"
        layout={layout}
      />

      <SettingsCheckbox
        id="print-settings-pregame-show-notes"
        checked={settings.showNotes !== false}
        onChange={(e) => onChange('showNotes', e.target.checked)}
        label="Notes"
        layout={layout}
      />
    </>
  );
}

// Roster/attendance settings
function RosterSettings({ settings, onChange, layout }) {
  const columns = [
    { id: 'number', label: 'Jersey' },
    { id: 'name', label: 'Name' },
    { id: 'position', label: 'Pos' },
    { id: 'year', label: 'Year' },
    { id: 'height', label: 'Ht' },
    { id: 'weight', label: 'Wt' }
  ];

  return (
    <>
      <SettingsField label="Sort By" layout={layout} id="print-settings-roster-sort-by">
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

      {layout === 'horizontal' ? (
        <MultiSelectDropdown
          id="print-settings-roster-columns"
          label="Columns"
          options={columns}
          selectedIds={settings.columns || ['number', 'name', 'position', 'year']}
          onChange={(updated) => onChange('columns', updated)}
        />
      ) : (
        <div className="mb-4">
          <label id="print-settings-roster-columns-label" className="block text-sm font-medium text-gray-700 mb-2">Columns to Show</label>
          <div className="space-y-2" role="group" aria-labelledby="print-settings-roster-columns-label">
            {columns.map(col => (
              <SettingsCheckbox
                key={col.id}
                id={`print-settings-roster-column-${col.id}`}
                checked={(settings.columns || ['number', 'name', 'position', 'year']).includes(col.id)}
                onChange={(e) => {
                  const current = settings.columns || ['number', 'name', 'position', 'year'];
                  const updated = e.target.checked
                    ? [...current, col.id]
                    : current.filter(c => c !== col.id);
                  onChange('columns', updated);
                }}
                label={col.label}
              />
            ))}
          </div>
        </div>
      )}

      <SettingsCheckbox
        id="print-settings-roster-checkbox-column"
        checked={settings.checkboxColumn !== false}
        onChange={(e) => onChange('checkboxColumn', e.target.checked)}
        label="Att. Box"
        layout={layout}
      />

      {settings.checkboxColumn !== false && (
        <SettingsField label="Box Size" layout={layout} id="print-settings-roster-checkbox-size">
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
function PlaybookSettings({ settings, onChange, layout }) {
  return (
    <>
      <SettingsField label="View Mode" layout={layout} id="print-settings-playbook-view-mode">
        <select
          value={settings.viewMode || 'cards'}
          onChange={(e) => onChange('viewMode', e.target.value)}
        >
          <option value="cards">Card View</option>
          <option value="list">List View</option>
        </select>
      </SettingsField>

      {settings.viewMode !== 'list' && (
        <SettingsField label="Cards/Page" layout={layout} id="print-settings-playbook-cards-per-page">
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
        id="print-settings-playbook-show-diagrams"
        checked={settings.showDiagrams !== false}
        onChange={(e) => onChange('showDiagrams', e.target.checked)}
        label="Show diagrams"
        layout={layout}
      />

      <SettingsCheckbox
        id="print-settings-playbook-show-formation"
        checked={settings.showFormation !== false}
        onChange={(e) => onChange('showFormation', e.target.checked)}
        label="Show formation"
        layout={layout}
      />

      <SettingsCheckbox
        id="print-settings-playbook-show-tags"
        checked={settings.showTags === true}
        onChange={(e) => onChange('showTags', e.target.checked)}
        label="Show tags"
        layout={layout}
      />
    </>
  );
}

function SettingsField({ label, children, layout, id }) {
  if (layout === 'horizontal') {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-gray-500 whitespace-nowrap uppercase tracking-wide">{label}</label>
        <div className="relative">
          {/* Inject compact styles into children if they are selects/inputs */}
          {children.type === 'select' ? (
            <select
              {...children.props}
              id={id}
              className="w-full pl-2 pr-8 py-1.5 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
            >
              {children.props.children}
            </select>
          ) : (
            <input
              {...children.props}
              id={id}
              className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {children.type === 'select' ? (
          <select
            {...children.props}
            id={id}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {children.props.children}
          </select>
        ) : (
          <input
            {...children.props}
            id={id}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        )}
      </div>
    </div>
  );
}

function SettingsCheckbox({ checked, onChange, label, layout, id }) {
  if (layout === 'horizontal') {
    return (
      <label htmlFor={id} className={`flex items-center gap-1.5 cursor-pointer select-none px-3 py-1.5 rounded transition-colors border ${checked
        ? 'bg-sky-50 border-sky-200 text-sky-700'
        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only" // Hidden native checkbox
        />
        {checked && <Check size={12} strokeWidth={3} />}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </label>
    );
  }

  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer mb-2">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

/**
 * Helper component for multi-select checklists in horizontal mode
 */
function MultiSelectDropdown({ label, options, selectedIds, onChange, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const baseId = id || `print-settings-multiselect-${label.toLowerCase().replace(/\s+/g, '-')}`;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={`${baseId}-button`}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 ${isOpen ? 'ring-2 ring-sky-500 border-sky-500' : ''}`}
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="bg-gray-100 text-gray-600 px-1.5 rounded text-xs font-bold">
          {selectedIds.length}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {options.map(option => {
              const optionId = `${baseId}-option-${option.id}`;
              return (
                <label
                  key={option.id}
                  htmlFor={optionId}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id={optionId}
                    checked={selectedIds.includes(option.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...selectedIds, option.id]
                        : selectedIds.filter(id => id !== option.id);
                      onChange(updated);
                    }}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
