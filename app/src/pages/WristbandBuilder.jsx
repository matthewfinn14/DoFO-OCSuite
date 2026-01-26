import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Watch,
  Plus,
  Printer,
  Settings,
  X,
  Search,
  Grid,
  List,
  ChevronDown,
  GripVertical,
  Trash2,
  Copy
} from 'lucide-react';

// Wristband color categories
const WRISTBAND_COLORS = [
  { id: 'red', label: 'Red', color: '#ef4444', bg: 'bg-red-500' },
  { id: 'blue', label: 'Blue', color: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'green', label: 'Green', color: '#22c55e', bg: 'bg-green-500' },
  { id: 'yellow', label: 'Yellow', color: '#eab308', bg: 'bg-yellow-500' },
  { id: 'orange', label: 'Orange', color: '#f97316', bg: 'bg-orange-500' },
  { id: 'purple', label: 'Purple', color: '#a855f7', bg: 'bg-purple-500' },
  { id: 'white', label: 'White', color: '#ffffff', bg: 'bg-white' },
  { id: 'black', label: 'Black', color: '#1f2937', bg: 'bg-gray-800' }
];

// Wristband layouts
const LAYOUTS = [
  { id: '2x4', label: '2x4 (8 plays)', rows: 4, cols: 2 },
  { id: '3x4', label: '3x4 (12 plays)', rows: 4, cols: 3 },
  { id: '4x4', label: '4x4 (16 plays)', rows: 4, cols: 4 },
  { id: '2x5', label: '2x5 (10 plays)', rows: 5, cols: 2 },
  { id: '3x5', label: '3x5 (15 plays)', rows: 5, cols: 3 }
];

export default function WristbandBuilder() {
  const { plays, wristbands, updateWristbands } = useSchool();

  const [activeWristband, setActiveWristband] = useState(null);
  const [showPlaySelector, setShowPlaySelector] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Get current wristband data
  const currentWristband = activeWristband ? wristbands?.[activeWristband] : null;
  const wristbandList = Object.entries(wristbands || {}).map(([id, data]) => ({ id, ...data }));

  // Get layout config
  const layoutConfig = LAYOUTS.find(l => l.id === (currentWristband?.layout || '3x4')) || LAYOUTS[1];

  // Filter plays for selector
  const filteredPlays = useMemo(() => {
    const offensivePlays = plays.filter(p => p.phase === 'offense');
    if (!searchTerm && filterCategory === 'all') return offensivePlays;

    return offensivePlays.filter(play => {
      const matchesSearch = !searchTerm ||
        play.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        play.formation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || play.bucket === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [plays, searchTerm, filterCategory]);

  // Get unique categories from plays
  const categories = useMemo(() => {
    const cats = new Set(plays.filter(p => p.phase === 'offense').map(p => p.bucket).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [plays]);

  // Create new wristband
  const handleCreateWristband = () => {
    const id = `wristband_${Date.now()}`;
    const newWristband = {
      name: 'New Wristband',
      layout: '3x4',
      slots: {},
      colorScheme: 'default',
      createdAt: new Date().toISOString()
    };

    updateWristbands({
      ...wristbands,
      [id]: newWristband
    });
    setActiveWristband(id);
  };

  // Delete wristband
  const handleDeleteWristband = (id) => {
    if (!confirm('Delete this wristband?')) return;
    const newWristbands = { ...wristbands };
    delete newWristbands[id];
    updateWristbands(newWristbands);
    if (activeWristband === id) {
      setActiveWristband(null);
    }
  };

  // Duplicate wristband
  const handleDuplicateWristband = (id) => {
    const source = wristbands[id];
    const newId = `wristband_${Date.now()}`;
    updateWristbands({
      ...wristbands,
      [newId]: {
        ...source,
        name: `${source.name} (Copy)`,
        createdAt: new Date().toISOString()
      }
    });
  };

  // Update wristband settings
  const updateCurrentWristband = (updates) => {
    if (!activeWristband) return;
    updateWristbands({
      ...wristbands,
      [activeWristband]: {
        ...currentWristband,
        ...updates
      }
    });
  };

  // Assign play to slot
  const handleAssignPlay = (playId) => {
    if (!activeWristband || activeSlot === null) return;

    const newSlots = { ...currentWristband.slots };
    newSlots[activeSlot] = playId;

    updateCurrentWristband({ slots: newSlots });
    setShowPlaySelector(false);
    setActiveSlot(null);
  };

  // Remove play from slot
  const handleRemovePlay = (slotIndex) => {
    const newSlots = { ...currentWristband.slots };
    delete newSlots[slotIndex];
    updateCurrentWristband({ slots: newSlots });
  };

  // Open play selector for a slot
  const openPlaySelector = (slotIndex) => {
    setActiveSlot(slotIndex);
    setShowPlaySelector(true);
    setSearchTerm('');
    setFilterCategory('all');
  };

  // Get play by ID
  const getPlay = (playId) => plays.find(p => p.id === playId);

  // Get color for row
  const getRowColor = (rowIndex) => {
    const colorIds = currentWristband?.colorOrder || WRISTBAND_COLORS.slice(0, layoutConfig.rows).map(c => c.id);
    return WRISTBAND_COLORS.find(c => c.id === colorIds[rowIndex]) || WRISTBAND_COLORS[0];
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Wristband Builder</h1>
          <p className="text-slate-400">
            {wristbandList.length} wristband{wristbandList.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreateWristband}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            New Wristband
          </button>
          {currentWristband && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              <Printer size={18} />
              Print
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Wristband List Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Wristbands</h3>

            {wristbandList.length === 0 ? (
              <div className="text-center py-8">
                <Watch size={32} className="mx-auto mb-2 text-slate-600" />
                <p className="text-slate-500 text-sm">No wristbands yet</p>
                <button
                  onClick={handleCreateWristband}
                  className="mt-3 text-sky-400 text-sm hover:text-sky-300"
                >
                  Create your first wristband
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {wristbandList.map(wb => (
                  <div
                    key={wb.id}
                    onClick={() => setActiveWristband(wb.id)}
                    className={`p-3 rounded-lg cursor-pointer group ${
                      activeWristband === wb.id
                        ? 'bg-sky-500/20 border border-sky-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white truncate">{wb.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicateWristband(wb.id); }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteWristband(wb.id); }}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {LAYOUTS.find(l => l.id === wb.layout)?.label || '3x4'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Wristband Editor */}
        <div className="flex-1">
          {!activeWristband ? (
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
              <Watch size={48} className="mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Wristband</h3>
              <p className="text-slate-400 mb-4">Choose a wristband from the list or create a new one</p>
              <button
                onClick={handleCreateWristband}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
              >
                <Plus size={18} />
                Create Wristband
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Wristband Settings Bar */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={currentWristband.name}
                    onChange={(e) => updateCurrentWristband({ name: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-lg"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Layout:</span>
                    <select
                      value={currentWristband.layout || '3x4'}
                      onChange={(e) => updateCurrentWristband({ layout: e.target.value })}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      {LAYOUTS.map(l => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg ${showSettings ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    <Settings size={18} />
                  </button>
                </div>

                {/* Color Settings */}
                {showSettings && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Row Colors</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: layoutConfig.rows }).map((_, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm w-16">Row {rowIndex + 1}:</span>
                          <select
                            value={getRowColor(rowIndex).id}
                            onChange={(e) => {
                              const colorOrder = currentWristband.colorOrder ||
                                WRISTBAND_COLORS.slice(0, layoutConfig.rows).map(c => c.id);
                              colorOrder[rowIndex] = e.target.value;
                              updateCurrentWristband({ colorOrder });
                            }}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                          >
                            {WRISTBAND_COLORS.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wristband Grid */}
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${layoutConfig.cols}, 1fr)` }}
                >
                  {Array.from({ length: layoutConfig.rows * layoutConfig.cols }).map((_, index) => {
                    const rowIndex = Math.floor(index / layoutConfig.cols);
                    const rowColor = getRowColor(rowIndex);
                    const playId = currentWristband.slots?.[index];
                    const play = playId ? getPlay(playId) : null;

                    return (
                      <div
                        key={index}
                        className="relative aspect-[3/2] rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: rowColor.color,
                          border: rowColor.id === 'white' ? '2px solid #374151' : 'none'
                        }}
                      >
                        {play ? (
                          <div className="absolute inset-0 p-2 flex flex-col">
                            <div className="flex items-start justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  rowColor.id === 'white' || rowColor.id === 'yellow'
                                    ? 'text-slate-800'
                                    : 'text-white'
                                }`}
                              >
                                {index + 1}
                              </span>
                              <button
                                onClick={() => handleRemovePlay(index)}
                                className={`p-0.5 rounded ${
                                  rowColor.id === 'white' || rowColor.id === 'yellow'
                                    ? 'text-slate-600 hover:text-red-600'
                                    : 'text-white/70 hover:text-white'
                                }`}
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                              <span
                                className={`font-bold text-sm leading-tight ${
                                  rowColor.id === 'white' || rowColor.id === 'yellow'
                                    ? 'text-slate-800'
                                    : 'text-white'
                                }`}
                              >
                                {play.name}
                              </span>
                              {play.formation && (
                                <span
                                  className={`text-xs mt-0.5 ${
                                    rowColor.id === 'white' || rowColor.id === 'yellow'
                                      ? 'text-slate-600'
                                      : 'text-white/70'
                                  }`}
                                >
                                  {play.formation}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPlaySelector(index)}
                            className={`absolute inset-0 flex items-center justify-center ${
                              rowColor.id === 'white' || rowColor.id === 'yellow'
                                ? 'text-slate-400 hover:text-slate-600'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                          >
                            <div className="text-center">
                              <Plus size={24} className="mx-auto" />
                              <span className="text-xs">{index + 1}</span>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Print Preview Info */}
              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
                <p>
                  <strong className="text-white">Printing Tip:</strong> Use landscape orientation
                  and set margins to "Minimum" for best results. Consider printing on cardstock
                  and laminating for durability.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Play Selector Modal */}
      {showPlaySelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                Select Play for Slot #{activeSlot + 1}
              </h3>
              <button
                onClick={() => { setShowPlaySelector(false); setActiveSlot(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="flex gap-3">
                <div className="relative flex-1">
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
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredPlays.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No plays found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredPlays.map(play => (
                    <button
                      key={play.id}
                      onClick={() => handleAssignPlay(play.id)}
                      className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-left"
                    >
                      <div className="font-medium text-white">{play.name}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {play.formation && <span>{play.formation}</span>}
                        {play.bucket && <span> • {play.bucket}</span>}
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
