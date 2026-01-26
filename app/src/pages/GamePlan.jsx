import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { PlayCard } from '../components/playbook';
import {
  Plus,
  Layout,
  Grid,
  List,
  Search,
  ChevronDown,
  ChevronRight,
  Book,
  Save,
  Printer,
  Trash2,
  X,
  GripVertical
} from 'lucide-react';

// Default game plan layouts
const DEFAULT_LAYOUTS = {
  MATRIX: {
    id: 'MATRIX',
    name: "Strike 'Em Out",
    cols: [
      { id: 'FB_L', label: 'FB L', fullLabel: 'Base/Initial Left' },
      { id: 'FB_R', label: 'FB R', fullLabel: 'Base/Initial Right' },
      { id: 'CB_L', label: 'CB L', fullLabel: 'Base w/ Dressing Left' },
      { id: 'CB_R', label: 'CB R', fullLabel: 'Base w/ Dressing Right' },
      { id: 'CU_L', label: 'CU L', fullLabel: 'Convert Left' },
      { id: 'CU_R', label: 'CU R', fullLabel: 'Convert Right' },
      { id: 'SO_L', label: 'SO L', fullLabel: 'Explosive Left' },
      { id: 'SO_R', label: 'SO R', fullLabel: 'Explosive Right' }
    ],
    formations: [
      { id: '887', label: '887', color: '#ef4444' },
      { id: '888', label: '888', color: '#ef4444' },
      { id: '687', label: '687', color: '#fbbf24' },
      { id: '688', label: '688', color: '#fbbf24' },
      { id: '881', label: '881', color: '#facc15' },
      { id: '984', label: '984', color: '#4ade80' },
      { id: '983', label: '983', color: '#4ade80' },
      { id: '488', label: '488', color: '#60a5fa' },
      { id: '487', label: '487', color: '#60a5fa' },
      { id: 'jets', label: 'Jets/Specials', color: '#a8a29e' }
    ]
  }
};

// Call sheet categories
const CALL_SHEET_SECTIONS = [
  { id: 'openers', label: 'Openers', description: 'First few plays of the drive' },
  { id: 'run_game', label: 'Run Game', description: 'Running plays by formation' },
  { id: 'quick_game', label: 'Quick Game', description: 'Quick passing concepts' },
  { id: 'dropback', label: 'Dropback', description: 'Traditional passing plays' },
  { id: 'red_zone', label: 'Red Zone', description: 'Inside the 20' },
  { id: 'goal_line', label: 'Goal Line', description: 'Inside the 5' },
  { id: 'two_min', label: '2-Min Offense', description: 'Hurry-up plays' },
  { id: 'specials', label: 'Specials/Gadgets', description: 'Trick plays and specials' }
];

export default function GamePlan() {
  const { playsArray, currentWeek, updateWeeks, weeks } = useSchool();

  const [activeTab, setActiveTab] = useState('call-sheet'); // 'call-sheet', 'matrix'
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlaySelector, setShowPlaySelector] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Get game plan data from current week
  const gamePlan = currentWeek?.offensiveGamePlan || { sets: [], miniScripts: [] };

  // Get plays for the current game plan
  const gamePlanPlays = useMemo(() => {
    const playIds = new Set();
    gamePlan.sets?.forEach(set => {
      set.playIds?.forEach(id => playIds.add(id));
    });
    return playsArray.filter(p => playIds.has(p.id));
  }, [gamePlan, playsArray]);

  // Filter plays for selector
  const filteredPlays = useMemo(() => {
    if (!searchTerm) return playsArray.slice(0, 50);
    const search = searchTerm.toLowerCase();
    return playsArray.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.formation?.toLowerCase().includes(search)
    ).slice(0, 50);
  }, [playsArray, searchTerm]);

  // Group plays by section
  const playsBySection = useMemo(() => {
    const grouped = {};
    CALL_SHEET_SECTIONS.forEach(section => {
      const set = gamePlan.sets?.find(s => s.id === section.id);
      grouped[section.id] = set?.playIds?.map(id => playsArray.find(p => p.id === id)).filter(Boolean) || [];
    });
    return grouped;
  }, [gamePlan, playsArray]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleAddPlayToSection = (sectionId, playId) => {
    if (!currentWeek) return;

    const currentGamePlan = currentWeek.offensiveGamePlan || { sets: [], miniScripts: [] };
    const existingSet = currentGamePlan.sets?.find(s => s.id === sectionId);

    let newSets;
    if (existingSet) {
      // Add to existing set
      newSets = currentGamePlan.sets.map(s =>
        s.id === sectionId
          ? { ...s, playIds: [...(s.playIds || []), playId] }
          : s
      );
    } else {
      // Create new set
      newSets = [...(currentGamePlan.sets || []), { id: sectionId, playIds: [playId] }];
    }

    const updatedWeeks = weeks.map(w =>
      w.id === currentWeek.id
        ? { ...w, offensiveGamePlan: { ...currentGamePlan, sets: newSets } }
        : w
    );

    updateWeeks(updatedWeeks);
    setShowPlaySelector(false);
    setActiveSection(null);
  };

  const handleRemovePlayFromSection = (sectionId, playId) => {
    if (!currentWeek) return;

    const currentGamePlan = currentWeek.offensiveGamePlan || { sets: [], miniScripts: [] };
    const newSets = currentGamePlan.sets.map(s =>
      s.id === sectionId
        ? { ...s, playIds: (s.playIds || []).filter(id => id !== playId) }
        : s
    );

    const updatedWeeks = weeks.map(w =>
      w.id === currentWeek.id
        ? { ...w, offensiveGamePlan: { ...currentGamePlan, sets: newSets } }
        : w
    );

    updateWeeks(updatedWeeks);
  };

  const openPlaySelector = (sectionId) => {
    setActiveSection(sectionId);
    setShowPlaySelector(true);
    setSearchTerm('');
  };

  if (!currentWeek) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-4">Game Plan</h1>
        <div className="bg-slate-900 rounded-lg p-8 text-center">
          <Book size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Week Selected</h3>
          <p className="text-slate-500">
            Select a week from the sidebar to build your game plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Game Plan</h1>
          <p className="text-slate-400">
            {currentWeek.name}
            {currentWeek.opponent && ` vs. ${currentWeek.opponent}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mb-6">
        <button
          onClick={() => setActiveTab('call-sheet')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 ${
            activeTab === 'call-sheet'
              ? 'bg-sky-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <List size={18} />
          Call Sheet
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 ${
            activeTab === 'matrix'
              ? 'bg-sky-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Grid size={18} />
          Play Matrix
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 mb-6">
        <div className="bg-slate-900 rounded-lg px-4 py-3 border border-slate-800">
          <div className="text-2xl font-bold text-white">{gamePlanPlays.length}</div>
          <div className="text-xs text-slate-500 uppercase">Plays in Plan</div>
        </div>
        <div className="bg-slate-900 rounded-lg px-4 py-3 border border-slate-800">
          <div className="text-2xl font-bold text-white">{playsArray.length}</div>
          <div className="text-xs text-slate-500 uppercase">Total Plays</div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'call-sheet' ? (
        <div className="space-y-4">
          {CALL_SHEET_SECTIONS.map(section => {
            const sectionPlays = playsBySection[section.id] || [];
            const isExpanded = expandedSections[section.id] !== false;

            return (
              <div key={section.id} className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    <div className="text-left">
                      <div className="font-semibold text-white">{section.label}</div>
                      <div className="text-xs text-slate-500">{section.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 text-sm rounded">
                      {sectionPlays.length} plays
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openPlaySelector(section.id); }}
                      className="p-1.5 bg-sky-500/20 text-sky-400 rounded hover:bg-sky-500/30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4">
                    {sectionPlays.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p>No plays added yet.</p>
                        <button
                          onClick={() => openPlaySelector(section.id)}
                          className="mt-2 text-sky-400 hover:text-sky-300"
                        >
                          + Add plays
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sectionPlays.map((play, idx) => (
                          <div
                            key={`${section.id}-${play.id}-${idx}`}
                            className="flex items-center gap-2 bg-slate-800 rounded-lg p-2"
                          >
                            <div className="text-slate-500 cursor-grab">
                              <GripVertical size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{play.name}</div>
                              {play.formation && (
                                <div className="text-xs text-slate-500">{play.formation}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemovePlayFromSection(section.id, play.id)}
                              className="p-1 text-slate-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <MatrixView
          layout={DEFAULT_LAYOUTS.MATRIX}
          gamePlan={gamePlan}
          plays={playsArray}
          onAddPlay={handleAddPlayToSection}
        />
      )}

      {/* Play Selector Modal */}
      {showPlaySelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Add Play to {CALL_SHEET_SECTIONS.find(s => s.id === activeSection)?.label}</h3>
              <button
                onClick={() => { setShowPlaySelector(false); setActiveSection(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search plays..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredPlays.map(play => (
                  <button
                    key={play.id}
                    onClick={() => handleAddPlayToSection(activeSection, play.id)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-left"
                  >
                    <div className="w-12 h-10 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                      <Book size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{play.name}</div>
                      <div className="text-xs text-slate-500">{play.formation || 'No formation'}</div>
                    </div>
                    {play.wristbandSlot && (
                      <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded">
                        #{play.wristbandSlot}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Matrix view component
function MatrixView({ layout, gamePlan, plays, onAddPlay }) {
  const { cols, formations } = layout;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-slate-800">
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase w-24">
              Formation
            </th>
            {cols.map(col => (
              <th
                key={col.id}
                className="px-2 py-2 text-center text-xs font-semibold text-slate-400 uppercase"
                title={col.fullLabel}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formations.map((formation, rowIdx) => (
            <tr
              key={formation.id}
              className={rowIdx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
            >
              <td
                className="px-3 py-2 text-sm font-medium text-white border-r border-slate-800"
                style={{ borderLeftColor: formation.color, borderLeftWidth: 3 }}
              >
                {formation.label}
              </td>
              {cols.map(col => {
                const cellId = `${formation.id}_${col.id}`;
                const cellSet = gamePlan.sets?.find(s => s.id === cellId);
                const cellPlays = cellSet?.playIds?.map(id => plays.find(p => p.id === id)).filter(Boolean) || [];

                return (
                  <td
                    key={col.id}
                    className="px-2 py-2 text-center border-r border-slate-800 last:border-r-0"
                  >
                    {cellPlays.length > 0 ? (
                      <div className="space-y-1">
                        {cellPlays.map((play, i) => (
                          <div
                            key={`${play.id}-${i}`}
                            className="px-2 py-1 bg-slate-800 rounded text-xs text-white truncate"
                            title={play.name}
                          >
                            {play.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddPlay(cellId)}
                        className="w-full py-3 text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 rounded"
                      >
                        +
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
