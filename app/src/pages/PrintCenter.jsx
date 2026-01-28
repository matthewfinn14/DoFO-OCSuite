import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Printer,
  FileText,
  Grid,
  List,
  Users,
  Watch,
  Calendar,
  ClipboardList,
  Clock,
  BookOpen,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// Import print components
import PrintPreview from '../components/print/PrintPreview';
import WeekSelector from '../components/print/WeekSelector';
import PrintSettingsPanel from '../components/print/PrintSettingsPanel';

// Import print templates
import WristbandPrint from '../components/print/templates/WristbandPrint';
import CoachWristbandPrint from '../components/print/templates/CoachWristbandPrint';
import DepthChartPrint from '../components/print/templates/DepthChartPrint';
import PracticePlanPrint from '../components/print/templates/PracticePlanPrint';
import GamePlanPrint from '../components/print/templates/GamePlanPrint';
import PreGamePrint from '../components/print/templates/PreGamePrint';
import RosterPrint from '../components/print/templates/RosterPrint';
import PlaybookPrint from '../components/print/templates/PlaybookPrint';

// Import styles
import '../styles/print-center.css';

// Template definitions
const PRINT_TEMPLATES = [
  {
    id: 'wristband',
    name: 'Wristbands',
    description: 'Player or coach wristband cards',
    icon: Watch,
    category: 'gameday',
    component: WristbandPrint,
    defaultSettings: {
      format: 'player',
      cardSelection: ['card100'],
      showSlotNumbers: true,
      showFormation: true,
      wizType: 'both'
    },
    orientation: 'landscape'
  },
  {
    id: 'coach_wristband',
    name: "Coach's Play Sheet",
    description: 'Consolidated mega-card with all plays',
    icon: ClipboardList,
    category: 'gameday',
    component: CoachWristbandPrint,
    defaultSettings: {
      cardSelection: ['card100', 'card200', 'card300', 'card400'],
      consolidationMode: 'byCard',
      fontSize: 'medium',
      showColorCoding: true
    },
    orientation: 'landscape'
  },
  {
    id: 'depth_chart',
    name: 'Depth Charts',
    description: 'Position depth charts (full or half-sheet)',
    icon: Users,
    category: 'roster',
    component: DepthChartPrint,
    defaultSettings: {
      viewMode: 'full',
      chartTypes: ['offense', 'defense'],
      depthLevels: 2,
      showBackups: true
    },
    orientation: 'portrait'
  },
  {
    id: 'practice_plan',
    name: 'Practice Plan',
    description: 'Daily practice schedules with scripts',
    icon: Calendar,
    category: 'practice',
    component: PracticePlanPrint,
    defaultSettings: {
      coachView: false,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      includeScripts: true,
      orientation: 'landscape',
      showNotes: true,
      showContactLevel: true
    },
    orientation: 'landscape'
  },
  {
    id: 'game_plan',
    name: 'Game Plan',
    description: 'Call sheets and game strategy',
    icon: ClipboardList,
    category: 'gameday',
    component: GamePlanPrint,
    defaultSettings: {
      viewType: 'sheet',
      orientation: 'landscape',
      includeLogo: true,
      includeOpponent: true,
      fontSize: 'medium'
    },
    orientation: 'landscape'
  },
  {
    id: 'pregame',
    name: 'Pre-Game Timeline',
    description: 'Game day schedule checklist',
    icon: Clock,
    category: 'gameday',
    component: PreGamePrint,
    defaultSettings: {
      gameTime: '19:00',
      timeFormat: 'both',
      includeCheckboxes: true,
      showNotes: true,
      orientation: 'portrait'
    },
    orientation: 'portrait'
  },
  {
    id: 'roster',
    name: 'Roster / Attendance',
    description: 'Team roster with attendance checkboxes',
    icon: Users,
    category: 'roster',
    component: RosterPrint,
    defaultSettings: {
      sortBy: 'number',
      columns: ['number', 'name', 'position', 'year'],
      checkboxColumn: true,
      checkboxSize: 'medium',
      title: 'Attendance Sheet'
    },
    orientation: 'portrait'
  },
  {
    id: 'playbook',
    name: 'Playbook',
    description: 'Play cards or list view',
    icon: BookOpen,
    category: 'playbook',
    component: PlaybookPrint,
    defaultSettings: {
      viewMode: 'cards',
      cardsPerPage: 4,
      showDiagrams: true,
      showFormation: true,
      showTags: false
    },
    orientation: 'portrait'
  }
];

// Categories for filtering
const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'gameday', label: 'Game Day' },
  { id: 'practice', label: 'Practice' },
  { id: 'roster', label: 'Roster' },
  { id: 'playbook', label: 'Playbook' }
];

export default function PrintCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    playsArray,
    roster,
    weeks,
    currentWeekId,
    activeLevelId,
    staff,
    settings
  } = useSchool();

  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(currentWeekId);
  const [selectedLevelId, setSelectedLevelId] = useState(activeLevelId);
  const [filterCategory, setFilterCategory] = useState('all');
  const [printSettings, setPrintSettings] = useState({});
  const [previewScale, setPreviewScale] = useState(0.5);

  // Handle URL deep linking
  useEffect(() => {
    const templateParam = searchParams.get('template');
    const weekParam = searchParams.get('week');
    const formatParam = searchParams.get('format');

    if (templateParam) {
      const template = PRINT_TEMPLATES.find(t => t.id === templateParam);
      if (template) {
        setSelectedTemplateId(templateParam);
        setPrintSettings({
          ...template.defaultSettings,
          ...(formatParam ? { format: formatParam } : {})
        });
      }
    }

    if (weekParam) {
      setSelectedWeekId(weekParam);
    }
  }, [searchParams]);

  // Update URL when selections change
  useEffect(() => {
    if (selectedTemplateId) {
      const params = new URLSearchParams();
      params.set('template', selectedTemplateId);
      if (selectedWeekId) params.set('week', selectedWeekId);
      if (printSettings.format) params.set('format', printSettings.format);
      setSearchParams(params, { replace: true });
    }
  }, [selectedTemplateId, selectedWeekId, printSettings.format]);

  // Get selected template
  const selectedTemplate = useMemo(() => {
    return PRINT_TEMPLATES.find(t => t.id === selectedTemplateId);
  }, [selectedTemplateId]);

  // Get current week data
  const weekData = useMemo(() => {
    return weeks.find(w => w.id === selectedWeekId);
  }, [weeks, selectedWeekId]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (filterCategory === 'all') return PRINT_TEMPLATES;
    return PRINT_TEMPLATES.filter(t => t.category === filterCategory);
  }, [filterCategory]);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setPrintSettings(template.defaultSettings || {});
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get play/roster stats
  const stats = useMemo(() => ({
    plays: playsArray.length,
    players: roster.length,
    weeks: weeks.length
  }), [playsArray.length, roster.length, weeks.length]);

  // Determine orientation for preview
  const previewOrientation = useMemo(() => {
    // For wristbands, orientation depends on format
    if (selectedTemplate?.id === 'wristband') {
      // Player format = landscape, Coach format = portrait
      return printSettings.format === 'coach' ? 'portrait' : 'landscape';
    }
    if (printSettings.orientation) return printSettings.orientation;
    return selectedTemplate?.orientation || 'portrait';
  }, [printSettings.orientation, printSettings.format, selectedTemplate]);

  // Render the print template
  const renderTemplate = () => {
    if (!selectedTemplate) return null;

    const TemplateComponent = selectedTemplate.component;
    const templateProps = {
      ...printSettings,
      weekId: selectedWeekId,
      levelId: selectedLevelId
    };

    return <TemplateComponent {...templateProps} />;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 print:block print:h-auto print:bg-white">
      {/* Sidebar - Template Selection & Settings */}
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto print:hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Print Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.plays} plays · {stats.players} players
          </p>
        </div>

        {/* Week Selector */}
        <WeekSelector
          selectedWeekId={selectedWeekId}
          onWeekChange={setSelectedWeekId}
          selectedLevelId={selectedLevelId}
          onLevelChange={setSelectedLevelId}
        />

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Template Category
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-sky-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Templates
          </div>
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedTemplateId === template.id
                    ? 'bg-sky-50 border-2 border-sky-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedTemplateId === template.id ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <template.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm ${
                      selectedTemplateId === template.id ? 'text-sky-700' : 'text-gray-900'
                    }`}>
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                  </div>
                  <ChevronRight size={16} className={`mt-1 ${
                    selectedTemplateId === template.id ? 'text-sky-500' : 'text-gray-400'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Template-Specific Settings */}
        {selectedTemplate && (
          <PrintSettingsPanel
            template={selectedTemplate}
            settings={printSettings}
            onChange={setPrintSettings}
            weekData={weekData}
            roster={roster}
            staff={staff}
          />
        )}
      </div>

      {/* Main Content - Preview */}
      <div className="flex-1 flex flex-col bg-gray-100 print:p-0 print:bg-white">
        {/* Toolbar */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-4">
            {selectedTemplate ? (
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedTemplate.name}
              </h2>
            ) : (
              <h2 className="text-lg font-semibold text-gray-400">
                Select a template
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedTemplate && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Printer size={18} />
                Print
              </button>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-6 print:p-0">
          {selectedTemplate ? (
            <PrintPreview
              orientation={previewOrientation}
              scale={previewScale}
              onScaleChange={setPreviewScale}
            >
              {renderTemplate()}
            </PrintPreview>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText size={64} className="mb-4 text-gray-300" />
              <p className="text-lg text-gray-500">Select a template to preview</p>
              <p className="text-sm mt-2">Choose from the sidebar to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export templates for use by other components
export { PRINT_TEMPLATES };
