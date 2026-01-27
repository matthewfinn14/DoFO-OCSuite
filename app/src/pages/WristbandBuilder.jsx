import { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  Watch,
  Plus,
  Printer,
  X,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  PanelRightOpen,
  PanelRightClose
} from 'lucide-react';

// Card tab definitions
const CARD_TABS = [
  { id: 'card100', label: '100s', slotPrefix: 1, startSlot: 101 },
  { id: 'card200', label: '200s', slotPrefix: 2, startSlot: 201 },
  { id: 'card300', label: '300s', slotPrefix: 3, startSlot: 301 },
  { id: 'card400', label: '400s', slotPrefix: 4, startSlot: 401 },
  { id: 'card500', label: '500s', slotPrefix: 5, startSlot: 501 },
  { id: 'card600', label: '600s', slotPrefix: 6, startSlot: 601 },
  { id: 'cardStaples', label: 'STAPLES', slotPrefix: 0, startSlot: 10 }
];

// Layout types
const LAYOUT_TYPES = [
  { id: 'standard', label: 'Standard' },
  { id: 'wiz', label: 'WIZ (16-slot grid)' },
  { id: 'mini-scripts', label: 'Mini-Scripts' }
];

// Color map for alternating row shades
const COLOR_MAP = {
  'green-light': '#d1fae5', 'green-medium': '#a7f3d0',
  'orange-light': '#fed7aa', 'orange-medium': '#fdba74',
  'red-light': '#fecaca', 'red-medium': '#fca5a5',
  'blue-light': '#bfdbfe', 'blue-medium': '#93c5fd',
  'yellow-light': '#fef08a', 'yellow-medium': '#fde047',
  'purple-light': '#e9d5ff', 'purple-medium': '#d8b4fe',
  'teal-light': '#99f6e4', 'teal-medium': '#5eead4',
  'pink-light': '#fbcfe8', 'pink-medium': '#f9a8d4'
};

// Header colors for mini-scripts
const HEADER_COLORS = {
  gray: { bg: '#d1d5db', text: '#000' },
  black: { bg: '#000', text: '#fff' },
  red: { bg: '#ef4444', text: '#fff' },
  blue: { bg: '#3b82f6', text: '#fff' },
  green: { bg: '#22c55e', text: '#000' },
  orange: { bg: '#f97316', text: '#000' }
};

// Card colors
const CARD_COLORS = [
  { id: 'white', label: 'White' },
  { id: 'green', label: 'Green' },
  { id: 'orange', label: 'Orange' },
  { id: 'blue', label: 'Blue' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'red', label: 'Red' },
  { id: 'purple', label: 'Purple' },
  { id: 'pink', label: 'Pink' },
  { id: 'teal', label: 'Teal' }
];

// Default card settings
const getDefaultCardSettings = () => ({
  type: 'standard',
  opponent: '',
  iteration: '1',
  color: 'white',
  rows: []
});

export default function WristbandBuilder() {
  const { year, phase, week: weekParam } = useParams();
  const {
    playsArray,
    weeks,
    currentWeekId,
    updateWeek,
    programLevels,
    activeLevelId,
    setActiveLevelId
  } = useSchool();

  // State
  const [activeCardId, setActiveCardId] = useState('card100');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBucket, setFilterBucket] = useState('all');
  const [showPlayBank, setShowPlayBank] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPlayId, setSelectedPlayId] = useState(null);

  // Get current week
  const currentWeek = useMemo(() => {
    if (weekParam) {
      return weeks.find(w => {
        const wYear = w.year?.toString() || new Date(w.startDate || w.createdAt).getFullYear().toString();
        const wPhase = w.phase?.toLowerCase();
        const wNum = w.weekNumber?.toString() || w.name?.match(/\d+/)?.[0];
        return wYear === year && wPhase === phase && wNum === weekParam;
      }) || weeks.find(w => w.id === currentWeekId);
    }
    return weeks.find(w => w.id === currentWeekId);
  }, [weeks, year, phase, weekParam, currentWeekId]);

  // Get selected level
  const selectedLevel = activeLevelId || programLevels?.[0]?.id || 'varsity';

  // Get wristband settings for current week and level
  const wristbandSettings = useMemo(() => {
    if (!currentWeek) return {};
    const settings = currentWeek.wristbandSettings || {};
    return settings[selectedLevel] || {};
  }, [currentWeek, selectedLevel]);

  // Get current card settings
  const currentCard = useMemo(() => {
    return wristbandSettings[activeCardId] || getDefaultCardSettings();
  }, [wristbandSettings, activeCardId]);

  // Get active tab config
  const activeTab = CARD_TABS.find(t => t.id === activeCardId);

  // Build slot map for quick lookup
  const slotMap = useMemo(() => {
    const map = {};
    playsArray.forEach(p => {
      if (p.wristbandSlot) map[p.wristbandSlot] = p;
      if (p.staplesSlot) map[p.staplesSlot] = p;
    });
    return map;
  }, [playsArray]);

  // Generate slots for current card
  const slots = useMemo(() => {
    if (!activeTab) return [];
    if (activeCardId === 'cardStaples') {
      return Array.from({ length: 80 }, (_, i) => 10 + i);
    }
    const isWiz = currentCard.type === 'wiz';
    const count = isWiz ? 16 : 48;
    return Array.from({ length: count }, (_, i) => activeTab.startSlot + i);
  }, [activeCardId, activeTab, currentCard.type]);

  // Filter plays for sidebar
  const filteredPlays = useMemo(() => {
    const offensivePlays = playsArray.filter(p => p.phase === 'offense');
    if (!searchTerm && filterBucket === 'all') return offensivePlays;

    return offensivePlays.filter(play => {
      const matchesSearch = !searchTerm ||
        play.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        play.formation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBucket = filterBucket === 'all' || play.bucket === filterBucket;
      return matchesSearch && matchesBucket;
    });
  }, [playsArray, searchTerm, filterBucket]);

  // Get unique buckets
  const buckets = useMemo(() => {
    const cats = new Set(playsArray.filter(p => p.phase === 'offense').map(p => p.bucket).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [playsArray]);

  // Update card settings
  const updateCardSettings = (updates) => {
    if (!currentWeek) return;
    const newWristbandSettings = {
      ...(currentWeek.wristbandSettings || {}),
      [selectedLevel]: {
        ...wristbandSettings,
        [activeCardId]: { ...currentCard, ...updates }
      }
    };
    updateWeek(currentWeek.id, { wristbandSettings: newWristbandSettings });
  };

  // Assign play to slot
  const handleAssignSlot = (slot) => {
    if (!selectedPlayId) return;
    const play = playsArray.find(p => p.id === selectedPlayId);
    if (!play) return;

    // For now, store in wristbandSettings slots
    const newSlots = { ...(currentCard.slots || {}), [slot]: { playId: play.id } };
    updateCardSettings({ slots: newSlots });
    setSelectedPlayId(null);
  };

  // Clear slot
  const handleClearSlot = (slot) => {
    const newSlots = { ...(currentCard.slots || {}) };
    delete newSlots[slot];
    updateCardSettings({ slots: newSlots });
  };

  // Clear entire card
  const handleClearCard = () => {
    if (!confirm('Clear all plays from this card?')) return;
    updateCardSettings({ slots: {}, rows: [] });
  };

  // Get play for slot
  const getPlayForSlot = (slot) => {
    // First check card-specific slots
    const slotData = currentCard.slots?.[slot];
    if (slotData?.playId) {
      return playsArray.find(p => p.id === slotData.playId);
    }
    // Fallback to global slotMap
    return slotMap[slot];
  };

  // Mini-scripts row handlers
  const handleAddRow = (type = 'play') => {
    const newRow = type === 'header'
      ? { id: Date.now().toString(), type: 'header', label: 'SECTION HEADER', color: 'gray' }
      : { id: Date.now().toString(), type: 'play-row', col0: '', col1: '', col1Id: '', col2: '', col3: '', col3Id: '' };
    updateCardSettings({ rows: [...(currentCard.rows || []), newRow] });
  };

  const handleUpdateRow = (rowId, updates) => {
    const newRows = (currentCard.rows || []).map(r => r.id === rowId ? { ...r, ...updates } : r);
    updateCardSettings({ rows: newRows });
  };

  const handleRemoveRow = (rowId) => {
    const newRows = (currentCard.rows || []).filter(r => r.id !== rowId);
    updateCardSettings({ rows: newRows });
  };

  const handleMoveRow = (rowId, direction) => {
    const rows = [...(currentCard.rows || [])];
    const index = rows.findIndex(r => r.id === rowId);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;
    [rows[index], rows[newIndex]] = [rows[newIndex], rows[index]];
    updateCardSettings({ rows });
  };

  // Get row color
  const getRowColor = (rowIndex, cardColor) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = Math.floor(rowIndex / 2) % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  if (!currentWeek) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-4">Wristband Builder</h1>
        <div className="bg-slate-900 rounded-lg p-8 text-center border border-slate-800">
          <Watch size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Week Selected</h3>
          <p className="text-slate-500">Select a week from the sidebar to build wristbands.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Play Bank Sidebar */}
      {showPlayBank && (
        <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search plays..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm placeholder-slate-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredPlays.slice(0, 100).map(play => (
              <div
                key={play.id}
                onClick={() => setSelectedPlayId(selectedPlayId === play.id ? null : play.id)}
                className={`p-2 rounded cursor-pointer mb-1 ${
                  selectedPlayId === play.id
                    ? 'bg-sky-500/30 border border-sky-500'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm truncate">{play.name}</span>
                  {play.wristbandSlot && (
                    <span className="text-xs text-sky-400 font-bold ml-2">{play.wristbandSlot}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate">{play.formation || 'No formation'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPlayBank(!showPlayBank)}
              className={`p-2 rounded ${showPlayBank ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {showPlayBank ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Wristband Builder</h1>
              <p className="text-slate-400 text-sm">{currentWeek.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {programLevels?.length > 0 && (
              <select
                value={selectedLevel}
                onChange={(e) => setActiveLevelId(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
              >
                {programLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={handleClearCard}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
            >
              Clear Card
            </button>
            <button
              onClick={() => {
                if (!confirm('Clear ALL cards?')) return;
                const newSettings = { ...(currentWeek.wristbandSettings || {}), [selectedLevel]: {} };
                updateWeek(currentWeek.id, { wristbandSettings: newSettings });
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Card Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {CARD_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCardId(tab.id)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                activeCardId === tab.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Row */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-slate-900 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Layout:</span>
            <select
              value={currentCard.type || 'standard'}
              onChange={(e) => updateCardSettings({ type: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
            >
              {LAYOUT_TYPES.map(lt => (
                <option key={lt.id} value={lt.id}>{lt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Opponent:</span>
            <input
              type="text"
              value={currentCard.opponent || ''}
              onChange={(e) => updateCardSettings({ opponent: e.target.value })}
              placeholder="Opponent"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Iter:</span>
            <input
              type="text"
              value={currentCard.iteration || '1'}
              onChange={(e) => updateCardSettings({ iteration: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm w-12"
            />
          </div>
          {currentCard.type !== 'wiz' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Color:</span>
              <select
                value={currentCard.color || 'white'}
                onChange={(e) => updateCardSettings({ color: e.target.value })}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
              >
                {CARD_COLORS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Card Preview */}
        <div className="flex justify-center">
          {currentCard.type === 'wiz' ? (
            <div className="flex flex-col gap-4">
              {/* SKILL Card */}
              <div style={{ aspectRatio: '5 / 3', width: '500px' }}>
                <WizGrid
                  slots={slots}
                  title={`${currentCard.opponent || 'OPPONENT'} ${currentCard.iteration || '1'}`}
                  viewType="skill"
                  getPlayForSlot={getPlayForSlot}
                  onAssign={handleAssignSlot}
                  onClear={handleClearSlot}
                  selectedPlayId={selectedPlayId}
                />
              </div>
              {/* OLINE Card */}
              <div style={{ aspectRatio: '5 / 3', width: '500px' }}>
                <WizGrid
                  slots={slots}
                  title={`${currentCard.opponent || 'OPPONENT'} ${currentCard.iteration || '1'}`}
                  viewType="oline"
                  getPlayForSlot={getPlayForSlot}
                  onAssign={handleAssignSlot}
                  onClear={handleClearSlot}
                  selectedPlayId={selectedPlayId}
                />
              </div>
            </div>
          ) : currentCard.type === 'mini-scripts' ? (
            <div className="w-full max-w-4xl">
              {/* Editor Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Script Editor</span>
                  <button
                    onClick={() => handleAddRow('header')}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-sm hover:bg-slate-700"
                  >
                    + Add Section Header
                  </button>
                </div>
                <MiniScriptEditor
                  rows={currentCard.rows || []}
                  plays={playsArray}
                  startCoord={activeTab?.startSlot || 101}
                  onUpdateRow={handleUpdateRow}
                  onRemoveRow={handleRemoveRow}
                  onMoveRow={handleMoveRow}
                  onAddRow={handleAddRow}
                />
              </div>
              {/* Preview Section */}
              <div className="mt-6">
                <span className="text-white font-medium block mb-2">Preview</span>
                <div style={{ width: '500px', aspectRatio: '5 / 3' }}>
                  <MiniScriptPreview
                    rows={currentCard.rows || []}
                    plays={playsArray}
                    startCoord={activeTab?.startSlot || 101}
                    title={currentCard.opponent || 'OPPONENT'}
                    cardColor={currentCard.color}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Standard Layout */
            <div style={{ width: '500px', aspectRatio: '5 / 3' }}>
              <SpreadsheetTable
                slots={slots}
                title={`${currentCard.opponent || 'OPPONENT'} ${currentCard.iteration || '1'}`}
                cardLabel={activeTab?.label || '100s'}
                cardColor={currentCard.color}
                getPlayForSlot={getPlayForSlot}
                onAssign={handleAssignSlot}
                onClear={handleClearSlot}
                selectedPlayId={selectedPlayId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <PrintModal
          wristbandSettings={wristbandSettings}
          activeCardId={activeCardId}
          playsArray={playsArray}
          slotMap={slotMap}
          getPlayForSlot={getPlayForSlot}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

// Spreadsheet Table Component (Standard Layout)
function SpreadsheetTable({ slots, title, cardLabel, cardColor, getPlayForSlot, onAssign, onClear, selectedPlayId }) {
  // Split into odd/even for two columns
  const col1 = slots.filter((_, i) => i % 2 === 0);
  const col2 = slots.filter((_, i) => i % 2 === 1);
  const rowCount = Math.max(col1.length, col2.length);
  const tableRows = [];
  for (let i = 0; i < rowCount; i++) {
    tableRows.push([col1[i], col2[i]]);
  }

  const getRowColor = (rowIndex) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = rowIndex % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid black', background: 'white' }}>
      {/* Header */}
      <div style={{
        background: 'black',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '10pt',
        padding: '2px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{cardLabel}</span>
        <span>{title}</span>
      </div>
      {/* Table Grid */}
      <table style={{ borderCollapse: 'collapse', width: '100%', flex: 1, tableLayout: 'fixed' }}>
        <tbody>
          {tableRows.map((rowGroup, rowIndex) => (
            <tr key={rowIndex} style={{ background: getRowColor(rowIndex) }}>
              {rowGroup.map((slot, colIndex) => {
                if (slot === undefined) {
                  return (
                    <td key={`empty-${colIndex}`} colSpan={2} style={{ border: '1px solid #333' }} />
                  );
                }
                const play = getPlayForSlot(slot);
                const isClickable = selectedPlayId && !play;
                return [
                  <td
                    key={`slot-${slot}`}
                    style={{
                      fontWeight: 'bold',
                      width: '32px',
                      padding: '0 4px',
                      border: '1px solid #333',
                      fontSize: '0.55rem',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      color: 'black'
                    }}
                  >
                    {slot}
                  </td>,
                  <td
                    key={`play-${slot}`}
                    onClick={() => isClickable && onAssign(slot)}
                    style={{
                      padding: '0 4px',
                      border: '1px solid #333',
                      fontSize: '0.55rem',
                      verticalAlign: 'middle',
                      color: 'black',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: isClickable ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      position: 'relative'
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {play?.name || ''}
                      {play?.formation && !play.name?.toLowerCase().includes(play.formation?.toLowerCase()) && ` - ${play.formation}`}
                    </div>
                    {play && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onClear(slot); }}
                        style={{
                          position: 'absolute',
                          right: '2px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '10px',
                          background: 'rgba(239,68,68,0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          padding: '0 3px',
                          lineHeight: '12px',
                          display: 'none'
                        }}
                        className="clear-btn"
                      >
                        ×
                      </button>
                    )}
                  </td>
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        td:hover .clear-btn { display: block !important; }
      `}</style>
    </div>
  );
}

// WIZ Grid Component
function WizGrid({ slots, title, viewType, getPlayForSlot, onAssign, onClear, selectedPlayId }) {
  const rows = [];
  for (let i = 0; i < slots.length; i += 4) {
    rows.push(slots.slice(i, i + 4));
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid black', background: 'white' }}>
      {/* Header */}
      <div style={{
        background: '#dc2626',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '10pt',
        padding: '2px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ textTransform: 'uppercase' }}>{viewType === 'skill' ? 'SKILL' : 'OLINE'}</span>
        <span>{title}</span>
      </div>
      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {rows.map((rowSlots, rIndex) => (
          <div key={rIndex} style={{
            flex: 1,
            display: 'flex',
            borderBottom: rIndex < rows.length - 1 ? '1px solid black' : 'none'
          }}>
            {rowSlots.map((slot, cIndex) => {
              const play = getPlayForSlot(slot);
              const isClickable = selectedPlayId && !play;
              return (
                <div
                  key={slot}
                  onClick={() => isClickable && onAssign(slot)}
                  style={{
                    flex: 1,
                    borderRight: cIndex < 3 ? '1px solid black' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: isClickable ? 'pointer' : 'default',
                    background: isClickable ? 'rgba(56, 189, 248, 0.2)' : 'white',
                    position: 'relative'
                  }}
                >
                  {/* Diagram area placeholder */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                    {play && (
                      <span style={{ fontSize: '8px', color: '#999', textAlign: 'center' }}>
                        {viewType === 'skill' ? '✏️' : '🔧'}
                      </span>
                    )}
                  </div>
                  {/* Bottom row: slot number + play name */}
                  <div style={{
                    display: 'flex',
                    borderTop: '1px solid black',
                    height: '16px',
                    background: 'white'
                  }}>
                    <div style={{
                      width: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8pt',
                      fontWeight: 'bold',
                      color: '#000',
                      borderRight: '1px solid black'
                    }}>
                      {slot}
                    </div>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '6pt',
                      fontWeight: 'bold',
                      padding: '0 3px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      color: '#000'
                    }}>
                      {play?.name || ''}
                    </div>
                  </div>
                  {/* Clear button */}
                  {play && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClear(slot); }}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        fontSize: '10px',
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        padding: '0 4px',
                        lineHeight: '14px'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Mini-Script Editor Component
function MiniScriptEditor({ rows, plays, startCoord, onUpdateRow, onRemoveRow, onMoveRow, onAddRow }) {
  let currentCoord = startCoord;

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        if (row.type === 'header') {
          return (
            <div key={row.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700">
              <div className="flex flex-col flex-1">
                <label className="text-xs text-slate-400 mb-1">Header Label</label>
                <input
                  value={row.label || ''}
                  onChange={(e) => onUpdateRow(row.id, { label: e.target.value })}
                  className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm font-bold"
                  placeholder="SECTION HEADER"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1">Color</label>
                <select
                  value={row.color || 'gray'}
                  onChange={(e) => onUpdateRow(row.id, { color: e.target.value })}
                  className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                >
                  {Object.keys(HEADER_COLORS).map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1 items-end pb-1">
                <button onClick={() => onMoveRow(row.id, -1)} className="p-1 text-slate-400 hover:text-white">↑</button>
                <button onClick={() => onMoveRow(row.id, 1)} className="p-1 text-slate-400 hover:text-white">↓</button>
                <button onClick={() => onRemoveRow(row.id)} className="p-1 text-red-400 hover:text-red-300">×</button>
              </div>
            </div>
          );
        } else {
          const coord = currentCoord++;
          return (
            <div key={row.id} className="grid grid-cols-[50px_80px_1fr_80px_1fr_60px] gap-2 items-center p-2 bg-slate-800 rounded border border-slate-700">
              <div className="text-center text-white font-bold text-sm">{coord}</div>
              <input
                value={row.col0 || ''}
                onChange={(e) => onUpdateRow(row.id, { col0: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Tempo"
              />
              <input
                value={row.col1 || ''}
                onChange={(e) => onUpdateRow(row.id, { col1: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Play A"
                list={`plays-a-${row.id}`}
              />
              <datalist id={`plays-a-${row.id}`}>
                {plays.filter(p => p.phase === 'offense').map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
              <input
                value={row.col2 || ''}
                onChange={(e) => onUpdateRow(row.id, { col2: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Tempo"
              />
              <input
                value={row.col3 || ''}
                onChange={(e) => onUpdateRow(row.id, { col3: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Play B"
                list={`plays-b-${row.id}`}
              />
              <datalist id={`plays-b-${row.id}`}>
                {plays.filter(p => p.phase === 'offense').map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
              <div className="flex gap-1 justify-end">
                <button onClick={() => onMoveRow(row.id, -1)} className="p-1 text-slate-400 hover:text-white">↑</button>
                <button onClick={() => onMoveRow(row.id, 1)} className="p-1 text-slate-400 hover:text-white">↓</button>
                <button onClick={() => onRemoveRow(row.id)} className="p-1 text-red-400 hover:text-red-300">×</button>
              </div>
            </div>
          );
        }
      })}
      <button
        onClick={() => onAddRow('play')}
        className="w-full py-2 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 text-sm"
      >
        + Add Play Row
      </button>
    </div>
  );
}

// Mini-Script Preview Component
function MiniScriptPreview({ rows, plays, startCoord, title, cardColor }) {
  let currentCoord = startCoord;
  let playRowIndex = 0;

  const getRowColor = (idx) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = idx % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid black', background: 'white' }}>
      {/* Header */}
      <div style={{
        background: 'black',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '10pt',
        padding: '2px 8px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>SCRIPT</span>
        <span>{title}</span>
      </div>
      {/* Table */}
      <table style={{ borderCollapse: 'collapse', width: '100%', flex: 1, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '38px' }} />
          <col style={{ width: '50px' }} />
          <col />
          <col style={{ width: '50px' }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: '#e5e5e5', fontSize: '8pt', fontWeight: 'bold' }}>
            <th style={{ border: '1px solid #333', padding: '2px' }}>#</th>
            <th style={{ border: '1px solid #333', padding: '2px' }}>TEMPO</th>
            <th style={{ border: '1px solid #333', padding: '2px' }}>PLAY A</th>
            <th style={{ border: '1px solid #333', padding: '2px' }}>TEMPO</th>
            <th style={{ border: '1px solid #333', padding: '2px' }}>PLAY B</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === 'header') {
              const hc = HEADER_COLORS[row.color] || HEADER_COLORS.gray;
              return (
                <tr key={row.id}>
                  <td colSpan={5} style={{
                    background: hc.bg,
                    color: hc.text,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '2px 8px',
                    border: '1px solid #333',
                    fontSize: '0.55rem'
                  }}>
                    {row.label}
                  </td>
                </tr>
              );
            } else {
              const coord = currentCoord++;
              const bg = getRowColor(playRowIndex++);
              return (
                <tr key={row.id} style={{ background: bg }}>
                  <td style={{ border: '1px solid #333', textAlign: 'center', fontWeight: 'bold', fontSize: '0.55rem', color: 'black' }}>{coord}</td>
                  <td style={{ border: '1px solid #333', textAlign: 'center', fontSize: '0.55rem', color: 'black', background: row.col0 ? '#fed7aa' : 'transparent' }}>{row.col0}</td>
                  <td style={{ border: '1px solid #333', padding: '0 4px', fontSize: '0.55rem', color: 'black' }}>{row.col1}</td>
                  <td style={{ border: '1px solid #333', textAlign: 'center', fontSize: '0.55rem', color: 'black', background: row.col2 ? '#fed7aa' : 'transparent' }}>{row.col2}</td>
                  <td style={{ border: '1px solid #333', padding: '0 4px', fontSize: '0.55rem', color: 'black' }}>{row.col3}</td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}

// Print Modal
function PrintModal({ wristbandSettings, activeCardId, playsArray, slotMap, getPlayForSlot, onClose }) {
  const [printType, setPrintType] = useState('player'); // 'player' or 'coach'

  const handlePrint = () => {
    window.print();
  };

  const card = wristbandSettings[activeCardId] || getDefaultCardSettings();
  const tab = CARD_TABS.find(t => t.id === activeCardId);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Print Wristbands</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-slate-400">Format:</span>
            <button
              onClick={() => setPrintType('player')}
              className={`px-4 py-2 rounded ${printType === 'player' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Player (4 per page)
            </button>
            <button
              onClick={() => setPrintType('coach')}
              className={`px-4 py-2 rounded ${printType === 'coach' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Coach (2 per page)
            </button>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            Print will include the currently selected card ({tab?.label}). Use browser print dialog for best results.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">
            Cancel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">
            <Printer size={18} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
