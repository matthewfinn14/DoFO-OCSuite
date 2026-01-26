import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Users,
  Plus,
  Printer,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Search,
  Eye
} from 'lucide-react';

// Depth chart types
const DEPTH_CHART_TYPES = [
  { id: 'offense', label: 'Offense' },
  { id: 'defense', label: 'Defense' },
  { id: 'kickoff', label: 'Kickoff' },
  { id: 'kickoff_return', label: 'KO Return' },
  { id: 'punt', label: 'Punt' },
  { id: 'punt_return', label: 'Punt Return' },
  { id: 'field_goal', label: 'Field Goal' },
  { id: 'pat', label: 'PAT' }
];

// Default positions by chart type
const DEFAULT_POSITIONS = {
  offense: [
    { id: 'QB', label: 'QB', depth: 2 },
    { id: 'RB', label: 'RB', depth: 2 },
    { id: 'WR1', label: 'WR (X)', depth: 2 },
    { id: 'WR2', label: 'WR (Z)', depth: 2 },
    { id: 'WR3', label: 'WR (Slot)', depth: 2 },
    { id: 'TE', label: 'TE', depth: 2 },
    { id: 'LT', label: 'LT', depth: 2 },
    { id: 'LG', label: 'LG', depth: 2 },
    { id: 'C', label: 'C', depth: 2 },
    { id: 'RG', label: 'RG', depth: 2 },
    { id: 'RT', label: 'RT', depth: 2 }
  ],
  defense: [
    { id: 'DE1', label: 'DE', depth: 2 },
    { id: 'DT1', label: 'DT', depth: 2 },
    { id: 'DT2', label: 'NT', depth: 2 },
    { id: 'DE2', label: 'DE', depth: 2 },
    { id: 'OLB1', label: 'OLB', depth: 2 },
    { id: 'MLB', label: 'MLB', depth: 2 },
    { id: 'OLB2', label: 'OLB', depth: 2 },
    { id: 'CB1', label: 'CB', depth: 2 },
    { id: 'CB2', label: 'CB', depth: 2 },
    { id: 'FS', label: 'FS', depth: 2 },
    { id: 'SS', label: 'SS', depth: 2 }
  ],
  kickoff: [
    { id: 'K', label: 'Kicker', depth: 1 },
    { id: 'L1', label: 'L1', depth: 1 },
    { id: 'L2', label: 'L2', depth: 1 },
    { id: 'L3', label: 'L3', depth: 1 },
    { id: 'L4', label: 'L4', depth: 1 },
    { id: 'L5', label: 'L5', depth: 1 },
    { id: 'R1', label: 'R1', depth: 1 },
    { id: 'R2', label: 'R2', depth: 1 },
    { id: 'R3', label: 'R3', depth: 1 },
    { id: 'R4', label: 'R4', depth: 1 },
    { id: 'R5', label: 'R5', depth: 1 }
  ]
};

export default function DepthCharts() {
  const { roster, depthCharts, updateDepthCharts } = useSchool();

  const [activeChart, setActiveChart] = useState('offense');
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [activeDepthSlot, setActiveDepthSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get positions for current chart type
  const positions = DEFAULT_POSITIONS[activeChart] || DEFAULT_POSITIONS.offense;

  // Get depth chart data for current chart
  const currentChart = depthCharts[activeChart] || {};

  // Get player by ID
  const getPlayer = (playerId) => {
    return roster.find(p => p.id === playerId);
  };

  // Filter roster for selector
  const filteredRoster = useMemo(() => {
    const activeRoster = roster.filter(p => !p.archived);
    if (!searchTerm) return activeRoster;
    const search = searchTerm.toLowerCase();
    return activeRoster.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.number?.toString().includes(search) ||
      p.position?.toLowerCase().includes(search)
    );
  }, [roster, searchTerm]);

  const openPlayerSelector = (positionId, depthSlot) => {
    setActivePosition(positionId);
    setActiveDepthSlot(depthSlot);
    setShowPlayerSelector(true);
    setSearchTerm('');
  };

  const handleAssignPlayer = (playerId) => {
    const newChart = { ...currentChart };

    if (!newChart[activePosition]) {
      newChart[activePosition] = [];
    }

    // Ensure array has enough slots
    while (newChart[activePosition].length < activeDepthSlot) {
      newChart[activePosition].push(null);
    }

    // Set player at depth slot
    newChart[activePosition][activeDepthSlot - 1] = playerId;

    const newDepthCharts = {
      ...depthCharts,
      [activeChart]: newChart
    };

    updateDepthCharts(newDepthCharts);
    setShowPlayerSelector(false);
    setActivePosition(null);
    setActiveDepthSlot(null);
  };

  const handleRemovePlayer = (positionId, depthSlot) => {
    const newChart = { ...currentChart };

    if (newChart[positionId]) {
      newChart[positionId][depthSlot - 1] = null;
    }

    const newDepthCharts = {
      ...depthCharts,
      [activeChart]: newChart
    };

    updateDepthCharts(newDepthCharts);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Depth Charts</h1>
          <p className="text-slate-400">
            {roster.filter(p => !p.archived).length} active players
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

      {/* Chart Type Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DEPTH_CHART_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveChart(type.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeChart === type.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Depth Chart Grid */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 w-32">
                Position
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
                1st String
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
                2nd String
              </th>
              {activeChart === 'offense' || activeChart === 'defense' ? (
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">
                  3rd String
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, idx) => {
              const positionData = currentChart[pos.id] || [];
              const maxDepth = pos.depth || 2;

              return (
                <tr
                  key={pos.id}
                  className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                >
                  <td className="px-4 py-3 border-r border-slate-800">
                    <span className="font-semibold text-white">{pos.label}</span>
                  </td>

                  {[1, 2, 3].slice(0, maxDepth + 1).map(depth => {
                    const playerId = positionData[depth - 1];
                    const player = playerId ? getPlayer(playerId) : null;

                    return (
                      <td key={depth} className="px-4 py-3 border-r border-slate-800 last:border-r-0">
                        {player ? (
                          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sky-400 font-bold">#{player.number || '?'}</span>
                                <span className="font-medium text-white truncate">{player.name}</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {player.position} • {player.year || 'N/A'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemovePlayer(pos.id, depth)}
                              className="p-1 text-slate-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPlayerSelector(pos.id, depth)}
                            className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-slate-400 hover:border-slate-600"
                          >
                            + Add Player
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                Select Player for {positions.find(p => p.id === activePosition)?.label}
              </h3>
              <button
                onClick={() => { setShowPlayerSelector(false); setActivePosition(null); }}
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
                  placeholder="Search by name, number, or position..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredRoster.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users size={32} className="mx-auto mb-2" />
                  <p>No players found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRoster.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleAssignPlayer(player.id)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-left"
                    >
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-sky-400 font-bold">
                        {player.number || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-sm text-slate-500">
                          {player.position} • {player.year || 'N/A'} • {player.height || 'N/A'} • {player.weight || 'N/A'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
