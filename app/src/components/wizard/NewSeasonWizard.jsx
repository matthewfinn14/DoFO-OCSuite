import { useState } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  Users,
  Settings,
  LayoutTemplate,
  Heart,
  Clipboard,
  GraduationCap,
  Archive,
  RefreshCw,
  Loader2,
  History,
  Download
} from 'lucide-react';

/**
 * New Season Wizard
 * Helps users transition to a new season by selecting what data to carry over
 */
export default function NewSeasonWizard({
  isOpen,
  onClose,
  currentYear,
  roster,
  plays,
  setupConfig,
  culture,
  settings,
  archivedSeasons = {},
  onStartNewSeason,
  onImportTemplates
}) {
  const [step, setStep] = useState(1);
  const [newYear, setNewYear] = useState((parseInt(currentYear) + 1).toString());
  const [processing, setProcessing] = useState(false);

  // Import options
  const [importOptions, setImportOptions] = useState({
    playbook: true,
    setupConfig: true,
    templates: true,
    culture: true,
    roster: true,
    wristbandConfigs: false,
    depthCharts: false
  });

  // Import from archived season
  const [importFromArchive, setImportFromArchive] = useState(null);
  const [archiveTemplateTypes, setArchiveTemplateTypes] = useState(['practice', 'gameplan', 'pregame']);

  // Roster handling
  const [rosterAction, setRosterAction] = useState('archive-seniors'); // 'archive-seniors', 'keep-all', 'archive-all'
  const [seniorYear, setSeniorYear] = useState('SR');

  // Get available archived seasons for template import
  const archivedYears = Object.keys(archivedSeasons).sort((a, b) => parseInt(b) - parseInt(a));

  // Preview counts
  const playCount = Array.isArray(plays) ? plays.length : Object.keys(plays || {}).length;
  const rosterCount = roster?.length || 0;
  const templateCount = (setupConfig?.practiceTemplates?.length || 0) +
                        (setupConfig?.gameplanTemplates?.length || 0) +
                        (setupConfig?.pregameTemplates?.length || 0);

  // Count templates in selected archive
  const archiveTemplateCount = importFromArchive && archivedSeasons[importFromArchive]?.setupConfig
    ? (archivedSeasons[importFromArchive].setupConfig.practiceTemplates?.length || 0) +
      (archivedSeasons[importFromArchive].setupConfig.gameplanTemplates?.length || 0) +
      (archivedSeasons[importFromArchive].setupConfig.pregameTemplates?.length || 0)
    : 0;

  // Count seniors
  const seniorCount = roster?.filter(p =>
    p.year?.toUpperCase() === seniorYear.toUpperCase() ||
    p.grade?.toUpperCase() === seniorYear.toUpperCase()
  ).length || 0;

  const isLight = settings?.theme === 'light';

  const toggleOption = (key) => {
    setImportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartNewSeason = async () => {
    setProcessing(true);
    try {
      // Start the new season
      await onStartNewSeason({
        newYear,
        importOptions,
        rosterAction,
        seniorYear
      });

      // Import templates from archived season if selected
      if (importFromArchive && archiveTemplateTypes.length > 0 && onImportTemplates) {
        await onImportTemplates(importFromArchive, archiveTemplateTypes);
      }

      onClose();
    } catch (err) {
      console.error('Error starting new season:', err);
      alert('Failed to start new season: ' + err.message);
    }
    setProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl ${
        isLight ? 'bg-white' : 'bg-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800 bg-slate-800/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20">
              <Calendar className="text-sky-400" size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Start New Season
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Step {step} of 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-200' : 'hover:bg-slate-700'}`}
          >
            <X size={20} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
          </button>
        </div>

        {/* Progress bar */}
        <div className={`h-1 ${isLight ? 'bg-gray-200' : 'bg-slate-800'}`}>
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Year */}
          {step === 1 && (
            <div>
              <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Select New Season Year
              </h3>
              <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                You're currently in the <strong>{currentYear}</strong> season. What year will your new season be?
              </p>

              <div className="flex items-center gap-4 mb-6">
                <div className={`flex-1 p-4 rounded-lg border-2 ${
                  isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'
                }`}>
                  <label className={`block text-sm mb-2 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                    Current Season
                  </label>
                  <div className={`text-3xl font-bold ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
                    {currentYear}
                  </div>
                </div>

                <ChevronRight size={32} className={isLight ? 'text-gray-400' : 'text-slate-600'} />

                <div className={`flex-1 p-4 rounded-lg border-2 border-sky-500 ${
                  isLight ? 'bg-sky-50' : 'bg-sky-500/10'
                }`}>
                  <label htmlFor="new-year-input" className={`block text-sm mb-2 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
                    New Season
                  </label>
                  <input
                    id="new-year-input"
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    min={parseInt(currentYear)}
                    max={parseInt(currentYear) + 10}
                    className={`text-3xl font-bold w-full bg-transparent border-none focus:outline-none ${
                      isLight ? 'text-sky-700' : 'text-sky-400'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={isLight ? 'text-amber-600' : 'text-amber-400'} size={20} />
                  <div>
                    <p className={`font-medium ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                      This will create a fresh start
                    </p>
                    <p className={`text-sm mt-1 ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>
                      Your current season data will be archived. You'll choose what to bring forward in the next step.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Import Options */}
          {step === 2 && (
            <div>
              <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                What do you want to bring forward?
              </h3>
              <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Select the data you want to import into your {newYear} season.
              </p>

              <div className="space-y-3">
                {/* Playbook */}
                <ImportOption
                  icon={BookOpen}
                  label="Playbook"
                  description={`${playCount} plays - Your complete play library`}
                  checked={importOptions.playbook}
                  onChange={() => toggleOption('playbook')}
                  recommended
                  isLight={isLight}
                />

                {/* Setup Config */}
                <ImportOption
                  icon={Settings}
                  label="System Setup"
                  description="Formations, positions, schemes, terminology, and all configurations"
                  checked={importOptions.setupConfig}
                  onChange={() => toggleOption('setupConfig')}
                  recommended
                  isLight={isLight}
                />

                {/* Templates */}
                <ImportOption
                  icon={LayoutTemplate}
                  label="Templates"
                  description={`${templateCount} templates - Practice plans, game plans, pregame schedules`}
                  checked={importOptions.templates}
                  onChange={() => toggleOption('templates')}
                  recommended
                  isLight={isLight}
                />

                {/* Culture */}
                <ImportOption
                  icon={Heart}
                  label="Program Culture"
                  description="Mission, vision, philosophy, standards, and team values"
                  checked={importOptions.culture}
                  onChange={() => toggleOption('culture')}
                  isLight={isLight}
                />

                {/* Roster */}
                <ImportOption
                  icon={Users}
                  label="Roster"
                  description={`${rosterCount} players - Player database with grades and info`}
                  checked={importOptions.roster}
                  onChange={() => toggleOption('roster')}
                  isLight={isLight}
                />

                {/* Wristband Configs */}
                <ImportOption
                  icon={Clipboard}
                  label="Wristband Configurations"
                  description="Saved wristband layouts and settings"
                  checked={importOptions.wristbandConfigs}
                  onChange={() => toggleOption('wristbandConfigs')}
                  isLight={isLight}
                />
              </div>

              {/* Import from archived seasons */}
              {archivedYears.length > 0 && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/10 border-purple-500/30'
                }`}>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
                    <History size={16} />
                    Import from Previous Seasons
                  </h4>
                  <p className={`text-sm mb-3 ${isLight ? 'text-purple-700' : 'text-purple-300/80'}`}>
                    Bring in templates from an archived season (e.g., a call sheet layout you liked).
                  </p>

                  <div className="flex items-center gap-3">
                    <select
                      value={importFromArchive || ''}
                      onChange={(e) => setImportFromArchive(e.target.value || null)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        isLight
                          ? 'bg-white border-purple-300 text-gray-900'
                          : 'bg-slate-800 border-purple-500/50 text-white'
                      }`}
                    >
                      <option value="">Select a season...</option>
                      {archivedYears.map(year => {
                        const archived = archivedSeasons[year];
                        const count = (archived?.setupConfig?.practiceTemplates?.length || 0) +
                                     (archived?.setupConfig?.gameplanTemplates?.length || 0) +
                                     (archived?.setupConfig?.pregameTemplates?.length || 0);
                        return (
                          <option key={year} value={year}>
                            {year} Season ({count} templates)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {importFromArchive && archiveTemplateCount > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['practice', 'gameplan', 'pregame'].map(type => {
                        const count = archivedSeasons[importFromArchive]?.setupConfig?.[`${type}Templates`]?.length || 0;
                        if (count === 0) return null;
                        const isSelected = archiveTemplateTypes.includes(type);
                        return (
                          <button
                            key={type}
                            onClick={() => {
                              if (isSelected) {
                                setArchiveTemplateTypes(prev => prev.filter(t => t !== type));
                              } else {
                                setArchiveTemplateTypes(prev => [...prev, type]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              isSelected
                                ? isLight
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-purple-500 text-white border-purple-500'
                                : isLight
                                  ? 'bg-white text-purple-700 border-purple-300 hover:border-purple-400'
                                  : 'bg-slate-800 text-purple-400 border-purple-500/50 hover:border-purple-500'
                            }`}
                          >
                            {type === 'practice' ? 'Practice' : type === 'gameplan' ? 'Game Plan' : 'Pregame'} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* What gets reset */}
              <div className={`mt-6 p-4 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                  <RefreshCw size={16} />
                  These will start fresh:
                </h4>
                <ul className={`text-sm space-y-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  <li>• Weekly schedule and game opponents</li>
                  <li>• Game plans and call sheets</li>
                  <li>• Practice grades and game grades</li>
                  <li>• Coaches notes and meeting notes</li>
                  <li>• Depth charts (unless imported above)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Roster Handling */}
          {step === 3 && (
            <div>
              <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Handle Your Roster
              </h3>
              <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                {importOptions.roster
                  ? `You have ${rosterCount} players. How do you want to handle graduating seniors?`
                  : "You chose not to import your roster. You'll start with an empty roster."
                }
              </p>

              {importOptions.roster ? (
                <>
                  <div className="space-y-3 mb-6">
                    <RosterOption
                      icon={GraduationCap}
                      label="Archive Seniors"
                      description={`Move ${seniorCount} seniors to archive, keep ${rosterCount - seniorCount} underclassmen`}
                      selected={rosterAction === 'archive-seniors'}
                      onClick={() => setRosterAction('archive-seniors')}
                      recommended
                      isLight={isLight}
                    />

                    <RosterOption
                      icon={Users}
                      label="Keep All Players"
                      description="Import entire roster as-is (you can archive manually later)"
                      selected={rosterAction === 'keep-all'}
                      onClick={() => setRosterAction('keep-all')}
                      isLight={isLight}
                    />

                    <RosterOption
                      icon={Archive}
                      label="Archive All"
                      description="Start with a completely fresh roster"
                      selected={rosterAction === 'archive-all'}
                      onClick={() => setRosterAction('archive-all')}
                      isLight={isLight}
                    />
                  </div>

                  {rosterAction === 'archive-seniors' && (
                    <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
                      <label htmlFor="senior-year-select" className={`block text-sm mb-2 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        What year/grade indicates a senior?
                      </label>
                      <select
                        id="senior-year-select"
                        value={seniorYear}
                        onChange={(e) => setSeniorYear(e.target.value)}
                        className={`w-full p-2 rounded-lg border ${
                          isLight
                            ? 'bg-white border-gray-300 text-gray-900'
                            : 'bg-slate-700 border-slate-600 text-white'
                        }`}
                      >
                        <option value="SR">SR (Senior)</option>
                        <option value="12">12 (12th Grade)</option>
                        <option value="Senior">Senior</option>
                        <option value="4">4 (4th Year)</option>
                      </select>
                      <p className={`text-sm mt-2 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        {seniorCount} player{seniorCount !== 1 ? 's' : ''} will be archived based on this selection
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
                  isLight ? 'border-gray-300 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
                }`}>
                  <Users size={48} className={`mx-auto mb-3 ${isLight ? 'text-gray-400' : 'text-slate-600'}`} />
                  <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                    You'll start the {newYear} season with an empty roster.
                  </p>
                  <button
                    onClick={() => {
                      toggleOption('roster');
                      setStep(2);
                    }}
                    className="mt-3 text-sky-500 hover:text-sky-400 text-sm font-medium"
                  >
                    Go back and import roster
                  </button>
                </div>
              )}

              {/* Summary */}
              <div className={`mt-6 p-4 rounded-lg border ${
                isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <h4 className={`font-bold mb-2 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  Ready to start {newYear} season
                </h4>
                <div className={`text-sm space-y-1 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                  <p>Importing: {[
                    importOptions.playbook && 'Playbook',
                    importOptions.setupConfig && 'System Setup',
                    importOptions.templates && 'Templates',
                    importOptions.culture && 'Culture',
                    importOptions.roster && 'Roster',
                    importOptions.wristbandConfigs && 'Wristbands'
                  ].filter(Boolean).join(', ') || 'Nothing'}</p>
                  {importOptions.roster && (
                    <p>Roster: {rosterAction === 'archive-seniors'
                      ? `Archiving ${seniorCount} seniors, keeping ${rosterCount - seniorCount}`
                      : rosterAction === 'keep-all'
                        ? `Keeping all ${rosterCount} players`
                        : 'Starting fresh'
                    }</p>
                  )}
                  {importFromArchive && archiveTemplateTypes.length > 0 && (
                    <p className={isLight ? 'text-purple-700' : 'text-purple-300'}>
                      + Importing {archiveTemplateTypes.join(', ')} templates from {importFromArchive}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800 bg-slate-800/50'
        }`}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isLight
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <ChevronLeft size={18} />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleStartNewSeason}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Season...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Start {newYear} Season
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Import option checkbox component
function ImportOption({ icon: Icon, label, description, checked, onChange, recommended, isLight }) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
        checked
          ? isLight
            ? 'border-sky-500 bg-sky-50'
            : 'border-sky-500 bg-sky-500/10'
          : isLight
            ? 'border-gray-200 bg-white hover:border-gray-300'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        checked
          ? 'bg-sky-500/20 text-sky-500'
          : isLight
            ? 'bg-gray-100 text-gray-500'
            : 'bg-slate-700 text-slate-400'
      }`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            checked
              ? isLight ? 'text-sky-700' : 'text-sky-400'
              : isLight ? 'text-gray-900' : 'text-white'
          }`}>
            {label}
          </span>
          {recommended && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              Recommended
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          {description}
        </p>
      </div>

      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
        checked
          ? 'bg-sky-500 border-sky-500'
          : isLight
            ? 'border-gray-300'
            : 'border-slate-600'
      }`}>
        {checked && <Check size={14} className="text-white" />}
      </div>
    </button>
  );
}

// Roster option radio component
function RosterOption({ icon: Icon, label, description, selected, onClick, recommended, isLight }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
        selected
          ? isLight
            ? 'border-sky-500 bg-sky-50'
            : 'border-sky-500 bg-sky-500/10'
          : isLight
            ? 'border-gray-200 bg-white hover:border-gray-300'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        selected
          ? 'bg-sky-500/20 text-sky-500'
          : isLight
            ? 'bg-gray-100 text-gray-500'
            : 'bg-slate-700 text-slate-400'
      }`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            selected
              ? isLight ? 'text-sky-700' : 'text-sky-400'
              : isLight ? 'text-gray-900' : 'text-white'
          }`}>
            {label}
          </span>
          {recommended && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              Recommended
            </span>
          )}
        </div>
        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          {description}
        </p>
      </div>

      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        selected
          ? 'border-sky-500'
          : isLight
            ? 'border-gray-300'
            : 'border-slate-600'
      }`}>
        {selected && <div className="w-3 h-3 rounded-full bg-sky-500" />}
      </div>
    </button>
  );
}
