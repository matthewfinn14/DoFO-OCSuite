import { useState, useMemo } from 'react';
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
  Settings,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Print templates
const PRINT_TEMPLATES = [
  {
    id: 'playbook_cards',
    name: 'Playbook Cards',
    description: 'Print play cards for study or distribution',
    icon: Grid,
    category: 'playbook'
  },
  {
    id: 'playbook_list',
    name: 'Play List',
    description: 'Print a list view of all plays',
    icon: List,
    category: 'playbook'
  },
  {
    id: 'wristband',
    name: 'Wristband',
    description: 'Print wristband cards for game day',
    icon: Watch,
    category: 'gameday'
  },
  {
    id: 'call_sheet',
    name: 'Call Sheet',
    description: 'Print game plan call sheet',
    icon: ClipboardList,
    category: 'gameday'
  },
  {
    id: 'depth_chart',
    name: 'Depth Chart',
    description: 'Print depth charts by position',
    icon: Users,
    category: 'roster'
  },
  {
    id: 'roster',
    name: 'Roster List',
    description: 'Print full roster with details',
    icon: Users,
    category: 'roster'
  },
  {
    id: 'practice_script',
    name: 'Practice Script',
    description: 'Print practice plan with plays',
    icon: Calendar,
    category: 'practice'
  }
];

// Paper sizes
const PAPER_SIZES = [
  { id: 'letter', label: 'Letter (8.5" x 11")' },
  { id: 'legal', label: 'Legal (8.5" x 14")' },
  { id: 'a4', label: 'A4' },
  { id: 'wristband', label: 'Wristband (3" x 5")' }
];

// Categories
const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'gameday', label: 'Game Day' },
  { id: 'roster', label: 'Roster' },
  { id: 'practice', label: 'Practice' }
];

export default function PrintCenter() {
  const { plays, roster, depthCharts, wristbands, weeks } = useSchool();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [printSettings, setPrintSettings] = useState({
    paperSize: 'letter',
    orientation: 'portrait',
    showDiagrams: true,
    showFormation: true,
    showTags: false,
    cardsPerPage: 4
  });

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (filterCategory === 'all') return PRINT_TEMPLATES;
    return PRINT_TEMPLATES.filter(t => t.category === filterCategory);
  }, [filterCategory]);

  // Get play stats
  const playStats = useMemo(() => {
    const offense = plays.filter(p => p.phase === 'offense').length;
    const defense = plays.filter(p => p.phase === 'defense').length;
    const special = plays.filter(p => p.phase === 'special_teams').length;
    return { offense, defense, special, total: plays.length };
  }, [plays]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Render print preview based on template
  const renderPreview = () => {
    if (!selectedTemplate) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <FileText size={48} className="mb-4 text-slate-600" />
          <p>Select a template to preview</p>
        </div>
      );
    }

    switch (selectedTemplate.id) {
      case 'playbook_cards':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {plays.slice(0, 4).map(play => (
                <div key={play.id} className="bg-white text-black p-4 rounded-lg border">
                  <h3 className="font-bold text-lg">{play.name}</h3>
                  <p className="text-sm text-gray-600">{play.formation}</p>
                  <div className="h-32 bg-gray-100 rounded mt-2 flex items-center justify-center text-gray-400">
                    [Diagram]
                  </div>
                </div>
              ))}
            </div>
            {plays.length > 4 && (
              <p className="text-slate-400 text-sm text-center">
                + {plays.length - 4} more plays
              </p>
            )}
          </div>
        );

      case 'playbook_list':
        return (
          <div className="bg-white text-black rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Play</th>
                  <th className="px-3 py-2 text-left">Formation</th>
                  <th className="px-3 py-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {plays.slice(0, 8).map((play, idx) => (
                  <tr key={play.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-medium">{play.name}</td>
                    <td className="px-3 py-2">{play.formation || '-'}</td>
                    <td className="px-3 py-2">{play.bucket || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'depth_chart':
        return (
          <div className="bg-white text-black p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Depth Chart - Offense</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Pos</th>
                  <th className="px-3 py-2 text-left">1st</th>
                  <th className="px-3 py-2 text-left">2nd</th>
                </tr>
              </thead>
              <tbody>
                {['QB', 'RB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'].map((pos, idx) => (
                  <tr key={pos} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-bold">{pos}</td>
                    <td className="px-3 py-2">-</td>
                    <td className="px-3 py-2">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'roster':
        return (
          <div className="bg-white text-black p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Team Roster</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Pos</th>
                  <th className="px-3 py-2 text-left">Year</th>
                </tr>
              </thead>
              <tbody>
                {roster.slice(0, 10).map((player, idx) => (
                  <tr key={player.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-bold">{player.number || '-'}</td>
                    <td className="px-3 py-2">{player.name}</td>
                    <td className="px-3 py-2">{player.position || '-'}</td>
                    <td className="px-3 py-2">{player.year || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'wristband':
        return (
          <div className="bg-white text-black p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/2] border-2 rounded flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][Math.floor(idx / 3)]
                  }}
                >
                  <span className={Math.floor(idx / 3) === 3 ? 'text-black' : 'text-white'}>
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-slate-500">
            <p>Preview not available for this template</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Print Center</h1>
          <p className="text-slate-400">
            {playStats.total} plays • {roster.length} players
          </p>
        </div>
        {selectedTemplate && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Printer size={18} />
            Print
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Template List */}
        <div className="w-80 flex-shrink-0">
          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterCategory === cat.id
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full p-4 rounded-lg text-left ${
                  selectedTemplate?.id === template.id
                    ? 'bg-sky-500/20 border border-sky-500'
                    : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedTemplate?.id === template.id ? 'bg-sky-500' : 'bg-slate-800'
                  }`}>
                    <template.icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview & Settings */}
        <div className="flex-1">
          {/* Settings Bar */}
          {selectedTemplate && (
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Paper:</span>
                  <select
                    value={printSettings.paperSize}
                    onChange={e => setPrintSettings({ ...printSettings, paperSize: e.target.value })}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                  >
                    {PAPER_SIZES.map(size => (
                      <option key={size.id} value={size.id}>{size.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Orientation:</span>
                  <select
                    value={printSettings.orientation}
                    onChange={e => setPrintSettings({ ...printSettings, orientation: e.target.value })}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                {selectedTemplate.id === 'playbook_cards' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Cards/Page:</span>
                    <select
                      value={printSettings.cardsPerPage}
                      onChange={e => setPrintSettings({ ...printSettings, cardsPerPage: parseInt(e.target.value) })}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="6">6</option>
                      <option value="9">9</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={printSettings.showDiagrams}
                    onChange={e => setPrintSettings({ ...printSettings, showDiagrams: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                  />
                  Show Diagrams
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">
                {selectedTemplate ? `Preview: ${selectedTemplate.name}` : 'Print Preview'}
              </h3>
              {selectedTemplate && (
                <span className="text-sm text-slate-400">
                  Scaled preview - actual print may differ
                </span>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 min-h-[400px]">
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
