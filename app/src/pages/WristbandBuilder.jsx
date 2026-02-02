import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { usePlayBank } from '../context/PlayBankContext';
import PlayDiagramEditor from '../components/diagrams/PlayDiagramEditor';
import DiagramPreview from '../components/diagrams/DiagramPreview';
import WristbandPrint from '../components/print/templates/WristbandPrint';
import {
  Watch,
  Plus,
  Printer,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Library,
  ExternalLink
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
  const { year, phase, week: weekParam, weekId: legacyWeekId } = useParams();
  const {
    playsArray,
    weeks,
    currentWeekId,
    updateWeek,
    updatePlay,
    programLevels,
    activeLevelId,
    setActiveLevelId,
    setupConfig,
    updateSetupConfig,
    offensePositions
  } = useSchool();

  // Get formations and personnelGroupings from setupConfig
  const formations = useMemo(() => setupConfig?.formations || [], [setupConfig?.formations]);
  const personnelGroupings = useMemo(() => setupConfig?.personnelGroupings || [], [setupConfig?.personnelGroupings]);

  const {
    startBatchSelect,
    singleSelectMode,
    selectedPlayId: contextSelectedPlayId,
    startSingleSelect,
    clearSelectedPlay,
    stopSingleSelect,
    batchAddEvent,
    clearBatchAddEvent
  } = usePlayBank();

  // State
  const [activeCardId, setActiveCardId] = useState('card100');
  const [cardDimensions, setCardDimensions] = useState({ width: 4.75, height: 2.8 }); // inches
  const [wizPrintVariant, setWizPrintVariant] = useState('skill'); // 'skill' or 'oline' for WIZ cards

  // WIZ editing state
  const [editingSkillPlay, setEditingSkillPlay] = useState(null);
  const [editingOLPlay, setEditingOLPlay] = useState(null);
  const [showOLLibraryForPlay, setShowOLLibraryForPlay] = useState(null);

  // Use context's selectedPlayId for wristband assignment
  const selectedPlayId = contextSelectedPlayId;

  // Start single select mode when component mounts
  useEffect(() => {
    startSingleSelect();
    return () => stopSingleSelect();
  }, [startSingleSelect, stopSingleSelect]);

  // Handler to save a new formation template
  const handleSaveFormation = useCallback((newFormation) => {
    const existingFormations = setupConfig?.formations || [];
    const updatedFormations = [...existingFormations, newFormation];
    updateSetupConfig({ formations: updatedFormations });
  }, [setupConfig?.formations, updateSetupConfig]);

  // Custom default positions for formation building
  const customDefaultPositions = useMemo(() => setupConfig?.defaultFormationPositions || {}, [setupConfig]);

  // Handler to save custom default positions
  const handleSaveDefaultPositions = useCallback((positions) => {
    updateSetupConfig({ defaultFormationPositions: positions });
  }, [updateSetupConfig]);

  // Get current week - support both new URL structure and legacy
  const currentWeek = useMemo(() => {
    // Legacy URL format: /week/:weekId/wristband
    if (legacyWeekId) {
      return weeks.find(w => w.id === legacyWeekId);
    }
    // New URL format: /:year/:phase/:week/wristband
    if (weekParam) {
      return weeks.find(w => {
        const wYear = w.year?.toString() || new Date(w.startDate || w.createdAt).getFullYear().toString();
        const wPhase = w.phase?.toLowerCase();
        const wNum = w.weekNumber?.toString() || w.name?.match(/\d+/)?.[0];
        return wYear === year && wPhase === phase && wNum === weekParam;
      }) || weeks.find(w => w.id === currentWeekId);
    }
    return weeks.find(w => w.id === currentWeekId);
  }, [weeks, year, phase, weekParam, legacyWeekId, currentWeekId]);

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

  // Handle Batch Add Event from PlayBank sidebar
  useEffect(() => {
    if (!batchAddEvent || batchAddEvent.destination !== 'wristband') return;

    const { playIds } = batchAddEvent;

    // Get current slots and find empty ones
    const currentSlots = { ...(currentCard.slots || {}) };
    const emptySlots = slots.filter(slot => !currentSlots[slot]?.playId && !slotMap[slot]);

    // Determine wristband type
    const wristbandType = currentCard.type === 'wiz' ? 'wiz' : currentCard.type === 'mini-scripts' ? 'mini' : 'standard';

    // Assign plays to empty slots in order (until full)
    let addedCount = 0;
    playIds.forEach((playId, index) => {
      if (index < emptySlots.length) {
        const slot = emptySlots[index];
        currentSlots[slot] = { playId };

        // Also update the play object with wristband info
        updatePlay(playId, {
          wristbandSlot: slot,
          wristbandType: wristbandType
        });
        addedCount++;
      }
    });

    // Update card settings with new slots
    if (addedCount > 0) {
      const newWristbandSettings = {
        ...(currentWeek?.wristbandSettings || {}),
        [selectedLevel]: {
          ...wristbandSettings,
          [activeCardId]: { ...currentCard, slots: currentSlots }
        }
      };
      updateWeek(currentWeek.id, { wristbandSettings: newWristbandSettings });
    }

    // Notify user if some plays couldn't fit
    if (addedCount < playIds.length) {
      const remaining = playIds.length - addedCount;
      alert(`Added ${addedCount} plays to wristband. ${remaining} plays couldn't fit - card is full.`);
    }

    clearBatchAddEvent();
  }, [batchAddEvent, clearBatchAddEvent, slots, currentCard, slotMap, updatePlay, currentWeek, selectedLevel, wristbandSettings, activeCardId, updateWeek]);

  // Get OL schemes with diagrams for library selection
  const olSchemes = useMemo(() => {
    const protections = (setupConfig?.passProtections || []).filter(p => p.diagramData?.length > 0);
    const runBlocking = (setupConfig?.runBlocking || []).filter(r => r.diagramData?.length > 0);
    return { protections, runBlocking };
  }, [setupConfig]);

  // Get position colors and names for diagram editor
  const positionColors = useMemo(() => setupConfig?.positionColors || {}, [setupConfig]);
  const positionNames = useMemo(() => setupConfig?.positionNames || {}, [setupConfig]);

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

    // Store in wristbandSettings slots
    const newSlots = { ...(currentCard.slots || {}), [slot]: { playId: play.id } };
    updateCardSettings({ slots: newSlots });

    // Also update the play object with wristband info
    const wristbandType = currentCard.type === 'wiz' ? 'wiz' : currentCard.type === 'mini-scripts' ? 'mini' : 'standard';
    updatePlay(play.id, {
      wristbandSlot: slot,
      wristbandType: wristbandType
    });

    clearSelectedPlay();
  };

  // Clear slot
  const handleClearSlot = (slot) => {
    // Get the play that was in this slot to clear its wristband info
    const play = getPlayForSlot(slot);
    if (play) {
      updatePlay(play.id, { wristbandSlot: null, wristbandType: null });
    }

    const newSlots = { ...(currentCard.slots || {}) };
    delete newSlots[slot];
    updateCardSettings({ slots: newSlots });
  };

  // Clear entire card
  const handleClearCard = () => {
    if (!confirm('Clear all plays from this card?')) return;

    // Clear wristband info from all plays on this card
    const cardSlots = currentCard.slots || {};
    Object.values(cardSlots).forEach(slotData => {
      if (slotData?.playId) {
        updatePlay(slotData.playId, { wristbandSlot: null, wristbandType: null, wristbandColumn: null });
      }
    });

    // Also check slotMap for plays assigned to slots in this card's range
    slots.forEach(slot => {
      const play = slotMap[slot];
      if (play) {
        updatePlay(play.id, { wristbandSlot: null, wristbandType: null, wristbandColumn: null });
      }
    });

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

  // Batch add plays to wristband slots
  const handleBatchAddToWristband = useCallback(() => {
    startBatchSelect((playIds) => {
      // Get current slots and find empty ones
      const currentSlots = { ...(currentCard.slots || {}) };
      const emptySlots = slots.filter(slot => !currentSlots[slot]?.playId && !slotMap[slot]);

      // Determine wristband type
      const wristbandType = currentCard.type === 'wiz' ? 'wiz' : currentCard.type === 'mini-scripts' ? 'mini' : 'standard';

      // Assign plays to empty slots in order
      playIds.forEach((playId, index) => {
        if (index < emptySlots.length) {
          const slot = emptySlots[index];
          currentSlots[slot] = { playId };

          // Also update the play object with wristband info
          updatePlay(playId, {
            wristbandSlot: slot,
            wristbandType: wristbandType
          });
        }
      });

      updateCardSettings({ slots: currentSlots });
    }, 'Add to Wristband');
  }, [slots, currentCard.slots, currentCard.type, slotMap, startBatchSelect, updateCardSettings, updatePlay]);

  // Get row color
  const getRowColor = (rowIndex, cardColor) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = Math.floor(rowIndex / 2) % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  // Handle WIZ Skill diagram edit
  const handleEditSkillDiagram = (play) => {
    if (play) {
      setEditingSkillPlay(play);
    }
  };

  // Save WIZ Skill diagram
  const handleSaveSkillDiagram = (data) => {
    if (editingSkillPlay && updatePlay) {
      updatePlay(editingSkillPlay.id, { wizSkillData: data.elements });
    }
    setEditingSkillPlay(null);
  };

  // Edit WIZ OL diagram
  const handleEditOLDiagram = (play) => {
    if (play) {
      setEditingOLPlay(play);
    }
  };

  // Save WIZ OL diagram - now receives wizOlineRef from library
  const handleSaveOLDiagram = (data) => {
    if (editingOLPlay && updatePlay) {
      if (data.wizOlineRef) {
        // Saving to library - link play to the scheme
        updatePlay(editingOLPlay.id, {
          wizOlineRef: data.wizOlineRef,
          wizOlineData: null, // Clear any standalone data
          olCall: data.wizOlineRef.name
        });
      } else if (data.elements) {
        // Legacy: direct save (shouldn't happen anymore)
        updatePlay(editingOLPlay.id, {
          wizOlineData: data.elements,
          olCall: data.olCall || editingOLPlay.olCall
        });
      }
    }
    setEditingOLPlay(null);
  };

  // Save to OL Library (from diagram editor)
  const handleSaveToOLLibrary = async ({ elements, name, type, overwrite = false }) => {
    const listKey = type === 'protection' ? 'passProtections' : 'runBlocking';
    const currentList = setupConfig?.[listKey] || [];

    // Check for existing scheme with same name
    const existingIndex = currentList.findIndex(s => s.name?.toUpperCase() === name.toUpperCase());

    if (existingIndex >= 0 && !overwrite) {
      // Name exists - this will be handled by the modal in PlayDiagramEditor
      return { exists: true, existingScheme: currentList[existingIndex] };
    }

    const newScheme = {
      id: overwrite && existingIndex >= 0 ? currentList[existingIndex].id : `ol-${Date.now()}`,
      name: name.toUpperCase(),
      diagramData: elements
    };

    let updatedList;
    if (overwrite && existingIndex >= 0) {
      // Replace existing
      updatedList = [...currentList];
      updatedList[existingIndex] = newScheme;
    } else {
      // Add new
      updatedList = [...currentList, newScheme];
    }

    await updateSetupConfig({ [listKey]: updatedList });
    return { success: true };
  };

  // Handle OL library selection
  const handleSelectOLScheme = (play) => {
    if (play && !play.wizOlineRef) {
      setShowOLLibraryForPlay(play);
    }
  };

  // Assign OL scheme to play
  const handleAssignOLScheme = (scheme, type) => {
    if (showOLLibraryForPlay && updatePlay) {
      updatePlay(showOLLibraryForPlay.id, {
        wizOlineRef: {
          id: scheme.id,
          name: scheme.name,
          type: type,
          diagramData: scheme.diagramData
        }
      });
    }
    setShowOLLibraryForPlay(null);
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
    <>
      {/* Print-only content - renders the wristband cards for printing */}
      <div className="hidden print:block" style={{ margin: 0, padding: 0 }}>
        <WristbandPrint
          weekId={currentWeek?.id}
          levelId={selectedLevel}
          format="player"
          cardSelection={[activeCardId]}
          showSlotNumbers={true}
          showFormation={true}
          wizType={wizPrintVariant}
          cardWidth={cardDimensions.width}
          cardHeight={cardDimensions.height}
        />
      </div>

      <div className="flex h-full print:hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-sky-500/20 rounded-lg">
              <Watch size={20} className="text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Wristband Builder</h1>
              <p className="text-slate-400 text-sm">{currentWeek.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {programLevels?.length > 0 && (
              <select
                id="wristband-program-level"
                value={selectedLevel}
                onChange={(e) => setActiveLevelId(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                aria-label="Program level"
              >
                {programLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleBatchAddToWristband}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 text-sm"
            >
              <CheckSquare size={16} /> Batch Add
            </button>
            {currentCard.type === 'wiz' && (
              <select
                value={wizPrintVariant}
                onChange={(e) => setWizPrintVariant(e.target.value)}
                className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                title="Select which WIZ card to print"
              >
                <option value="skill">SKILL</option>
                <option value="oline">OLINE</option>
              </select>
            )}
            <button
              onClick={() => window.print()}
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
            <label htmlFor="wristband-layout-type" className="text-slate-400 text-sm">Layout:</label>
            <select
              id="wristband-layout-type"
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
            <label htmlFor="wristband-opponent" className="text-slate-400 text-sm">Opponent:</label>
            <input
              id="wristband-opponent"
              type="text"
              value={currentCard.opponent || ''}
              onChange={(e) => updateCardSettings({ opponent: e.target.value })}
              placeholder="Opponent"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="wristband-iteration" className="text-slate-400 text-sm">Iter:</label>
            <input
              id="wristband-iteration"
              type="text"
              value={currentCard.iteration || '1'}
              onChange={(e) => updateCardSettings({ iteration: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm w-12"
            />
          </div>
          {currentCard.type !== 'wiz' && (
            <div className="flex items-center gap-2">
              <label htmlFor="wristband-card-color" className="text-slate-400 text-sm">Color:</label>
              <select
                id="wristband-card-color"
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
              {/* SKILL Card - WIZ dimensions: 4.75" x 2.8" */}
              <div style={{ width: '475px', height: '280px' }}>
                <WizGrid
                  slots={slots}
                  title={`${currentCard.opponent || 'OPPONENT'} ${currentCard.iteration || '1'}`}
                  viewType="skill"
                  getPlayForSlot={getPlayForSlot}
                  onAssign={handleAssignSlot}
                  onClear={handleClearSlot}
                  onEditDiagram={handleEditSkillDiagram}
                  selectedPlayId={selectedPlayId}
                  updatePlay={updatePlay}
                  positionColors={positionColors}
                  positionNames={positionNames}
                />
              </div>
              {/* OLINE Card - WIZ dimensions: 4.75" x 2.8" */}
              <div style={{ width: '475px', height: '280px' }}>
                <WizGrid
                  slots={slots}
                  title={`${currentCard.opponent || 'OPPONENT'} ${currentCard.iteration || '1'}`}
                  viewType="oline"
                  getPlayForSlot={getPlayForSlot}
                  onAssign={handleAssignSlot}
                  onClear={handleClearSlot}
                  onEditDiagram={handleEditOLDiagram}
                  onSelectOLScheme={handleSelectOLScheme}
                  olSchemes={olSchemes}
                  selectedPlayId={selectedPlayId}
                  updatePlay={updatePlay}
                  positionColors={positionColors}
                  positionNames={positionNames}
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
                  updatePlay={updatePlay}
                />
              </div>
              {/* Preview Section - Standard dimensions: 5" x 2.8", aspect ratio 25:14 */}
              <div className="mt-6">
                <span className="text-white font-medium block mb-2">Preview</span>
                <div style={{ width: '500px', height: '280px' }}>
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
            /* Standard Layout - larger for editing, prints at proper dimensions */
            <div style={{ width: '800px', height: '448px' }}>
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

      {/* WIZ Skill Diagram Editor Modal */}
      {editingSkillPlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden">
            <PlayDiagramEditor
              mode="wiz-skill"
              initialData={editingSkillPlay.wizSkillData ? { elements: editingSkillPlay.wizSkillData } : null}
              formations={formations}
              personnelGroupings={personnelGroupings}
              offensePositions={offensePositions}
              positionColors={positionColors}
              positionNames={positionNames}
              customDefaultPositions={customDefaultPositions}
              onSaveDefaultPositions={handleSaveDefaultPositions}
              playName={editingSkillPlay.formation ? `${editingSkillPlay.formation} ${editingSkillPlay.name}` : editingSkillPlay.name}
              onSaveFormation={handleSaveFormation}
              onSave={handleSaveSkillDiagram}
              onCancel={() => setEditingSkillPlay(null)}
            />
          </div>
        </div>
      )}

      {/* WIZ OL Diagram Editor Modal */}
      {editingOLPlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden">
            <PlayDiagramEditor
              mode="wiz-oline"
              initialData={editingOLPlay.wizOlineData ? { elements: editingOLPlay.wizOlineData } : null}
              playName={editingOLPlay.formation ? `${editingOLPlay.formation} ${editingOLPlay.name}` : editingOLPlay.name}
              olCallText={editingOLPlay.olCall || editingOLPlay.wizOlineRef?.name || ''}
              olSchemes={olSchemes}
              onSaveToOLLibrary={handleSaveToOLLibrary}
              onSave={handleSaveOLDiagram}
              onCancel={() => setEditingOLPlay(null)}
            />
          </div>
        </div>
      )}

      {/* OL Library Selection Modal */}
      {showOLLibraryForPlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Select OL Scheme</h3>
                <p className="text-sm text-slate-400">For: {showOLLibraryForPlay.name}</p>
              </div>
              <button
                onClick={() => setShowOLLibraryForPlay(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Pass Protections */}
              {olSchemes.protections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Pass Protections
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {olSchemes.protections.map(prot => (
                      <button
                        key={prot.id}
                        onClick={() => handleAssignOLScheme(prot, 'protection')}
                        className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-sky-500 transition-colors text-left"
                      >
                        <p className="font-medium text-white mb-2">{prot.name}</p>
                        <DiagramPreview
                          elements={prot.diagramData}
                          width={150}
                          height={100}
                          positionColors={positionColors}
                          positionNames={positionNames}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Run Blocking */}
              {olSchemes.runBlocking.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Run Blocking Schemes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {olSchemes.runBlocking.map(scheme => (
                      <button
                        key={scheme.id}
                        onClick={() => handleAssignOLScheme(scheme, 'runBlocking')}
                        className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-sky-500 transition-colors text-left"
                      >
                        <p className="font-medium text-white mb-2">{scheme.name}</p>
                        <DiagramPreview
                          elements={scheme.diagramData}
                          width={150}
                          height={100}
                          positionColors={positionColors}
                          positionNames={positionNames}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {olSchemes.protections.length === 0 && olSchemes.runBlocking.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Library size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No OL schemes with diagrams in your library yet.</p>
                  <p className="text-sm mt-2">
                    Add diagrams in System Setup → WIZ Library for OL
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid black', background: 'white', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'black',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '9pt',
        padding: '3px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span>{cardLabel}</span>
        <span>{title}</span>
      </div>
      {/* Table Grid - using CSS grid for even row distribution */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: `repeat(${rowCount}, 1fr)`,
        overflow: 'hidden'
      }}>
        {tableRows.map((rowGroup, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 28px 1fr',
              background: getRowColor(rowIndex),
              borderBottom: rowIndex < rowCount - 1 ? '1px solid #333' : 'none',
              minHeight: 0
            }}
          >
            {rowGroup.map((slot, colIndex) => {
              if (slot === undefined) {
                return [
                  <div key={`empty-slot-${colIndex}`} style={{ borderRight: '1px solid #333' }} />,
                  <div key={`empty-play-${colIndex}`} style={{ borderRight: colIndex === 0 ? '1px solid #333' : 'none' }} />
                ];
              }
              const play = getPlayForSlot(slot);
              const isClickable = selectedPlayId && !play;
              return [
                <div
                  key={`slot-${slot}`}
                  style={{
                    fontWeight: 'bold',
                    padding: '0 2px',
                    borderRight: '1px solid #333',
                    borderLeft: colIndex === 1 ? '1px solid #333' : 'none',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black'
                  }}
                >
                  {slot}
                </div>,
                <div
                  key={`play-${slot}`}
                  onClick={() => isClickable && onAssign(slot)}
                  style={{
                    padding: '0 3px',
                    borderRight: colIndex === 0 ? '1px solid #333' : 'none',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'black',
                    cursor: isClickable ? 'pointer' : 'default',
                    background: isClickable ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                    {play ? (play.formation ? `${play.formation} ${play.name}` : play.name) : ''}
                  </span>
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
                </div>
              ];
            })}
          </div>
        ))}
      </div>
      <style>{`
        div:hover .clear-btn { display: block !important; }
      `}</style>
    </div>
  );
}

// WIZ Grid Component
function WizGrid({ slots, title, viewType, getPlayForSlot, onAssign, onClear, onEditDiagram, onSelectOLScheme, olSchemes, selectedPlayId, updatePlay, positionColors, positionNames }) {
  const [editingSlot, setEditingSlot] = useState(null);
  const [editValue, setEditValue] = useState('');

  const rows = [];
  for (let i = 0; i < slots.length; i += 4) {
    rows.push(slots.slice(i, i + 4));
  }

  // Handle double-click to edit WIZ abbreviation
  const handleDoubleClick = (slot, play) => {
    if (!play || viewType !== 'skill') return;

    // Get full play call for reference
    const fullPlayCall = play.formation
      ? `${play.formation} ${play.name}`
      : (play.name || '');

    // Start editing with current abbreviation or full name
    setEditingSlot(slot);
    setEditValue(play.wizAbbreviation || fullPlayCall);
  };

  // Save the WIZ abbreviation
  const handleSaveAbbreviation = (play) => {
    if (!play) return;

    const fullPlayCall = play.formation
      ? `${play.formation} ${play.name}`
      : (play.name || '');

    // If edit value matches full name, clear the abbreviation (reset)
    // Otherwise save the new abbreviation
    if (editValue.trim() === fullPlayCall || editValue.trim() === '') {
      updatePlay(play.id, { wizAbbreviation: null });
    } else {
      updatePlay(play.id, { wizAbbreviation: editValue.trim() });
    }

    setEditingSlot(null);
    setEditValue('');
  };

  // Handle key press in edit input
  const handleKeyDown = (e, play) => {
    if (e.key === 'Enter') {
      handleSaveAbbreviation(play);
    } else if (e.key === 'Escape') {
      setEditingSlot(null);
      setEditValue('');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid black', background: 'white', overflow: 'hidden' }}>
      {/* Header - compact to match print proportions */}
      <div style={{
        background: '#dc2626',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '6pt',
        padding: '1px 4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        height: '10px',
        minHeight: '10px'
      }}>
        <span style={{ textTransform: 'uppercase' }}>{viewType === 'skill' ? 'SKILL' : 'OLINE'}</span>
        <span>{title}</span>
      </div>
      {/* Grid - fixed layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', overflow: 'hidden' }}>
        {rows.map((rowSlots, rIndex) => (
          <div key={rIndex} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderBottom: rIndex < rows.length - 1 ? '1px solid black' : 'none',
            minHeight: 0
          }}>
            {rowSlots.map((slot, cIndex) => {
              const play = getPlayForSlot(slot);
              const isClickable = selectedPlayId && !play;
              const isEditing = editingSlot === slot;

              // For SKILL view: show wizAbbreviation if exists, otherwise full play call
              // For OLINE view: show OL call text (olCall), or library scheme name, or empty
              const fullPlayCall = play?.formation
                ? `${play.formation} ${play.name}`
                : (play?.name || '');
              const displayName = viewType === 'skill'
                ? (play?.wizAbbreviation || fullPlayCall)
                : (play?.olCall || play?.wizOlineRef?.name || '');

              // Get diagram data for preview - fall back to other diagram sources
              const diagramData = viewType === 'skill'
                ? (play?.wizSkillData || play?.rooskiSkillData || (Array.isArray(play?.diagramData) ? play?.diagramData : play?.diagramData?.elements))
                : (play?.wizOlineData || play?.wizOlineRef?.diagramData);

              // For OLINE view without any OL diagram, show option to select
              const showOLSelector = viewType === 'oline' && play && !play.wizOlineRef && !play.wizOlineData?.length;

              return (
                <div
                  key={slot}
                  onClick={() => isClickable && onAssign(slot)}
                  className="group"
                  style={{
                    borderRight: cIndex < 3 ? '1px solid black' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: isClickable ? 'pointer' : 'default',
                    background: isClickable ? 'rgba(56, 189, 248, 0.2)' : 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: 0,
                    minHeight: 0
                  }}
                >
                  {/* Clear button - appears on hover */}
                  {play && onClear && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClear(slot); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        zIndex: 10,
                        width: '14px',
                        height: '14px',
                        fontSize: '10px',
                        background: 'rgba(239,68,68,0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}
                      title="Clear slot"
                    >
                      ×
                    </button>
                  )}
                  {/* Diagram area - constrained to cell */}
                  <div
                    onClick={(e) => {
                      if (play && onEditDiagram) {
                        e.stopPropagation();
                        onEditDiagram(play, viewType);
                      }
                    }}
                    style={{
                      flex: 1,
                      position: 'relative',
                      background: '#f9fafb',
                      cursor: play ? 'pointer' : 'default',
                      overflow: 'hidden',
                      minHeight: 0
                    }}
                  >
                    {diagramData?.length > 0 ? (
                      <div style={{ position: 'absolute', inset: 0 }}>
                        <DiagramPreview elements={diagramData} fillContainer={true} mode={viewType === 'skill' ? 'wiz-skill' : 'wiz-oline'} positionColors={positionColors} positionNames={positionNames} />
                      </div>
                    ) : play && !diagramData?.length ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '16px', opacity: 0.5 }} title="Click to edit diagram">✏️</span>
                      </div>
                    ) : null}
                  </div>
                  {/* Bottom row: slot number + play/scheme name - matches print proportions */}
                  <div style={{
                    display: 'flex',
                    borderTop: '1px solid black',
                    height: '11px',
                    minHeight: '11px',
                    maxHeight: '11px',
                    background: 'white',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: '18px',
                      minWidth: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '5pt',
                      fontWeight: 'bold',
                      color: '#000',
                      borderRight: '1px solid black',
                      flexShrink: 0
                    }}>
                      {slot}
                    </div>
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleDoubleClick(slot, play);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '5pt',
                        fontWeight: 'bold',
                        padding: '0 2px',
                        overflow: 'hidden',
                        color: '#000',
                        minWidth: 0,
                        cursor: play && viewType === 'skill' ? 'pointer' : 'default'
                      }}
                      title={viewType === 'skill' && play ? `Double-click to ${play.wizAbbreviation ? 'edit' : 'set'} abbreviation` : ''}
                    >
                      {isEditing ? (
                        <input
                          id={`wiz-abbreviation-${slot}`}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveAbbreviation(play)}
                          onKeyDown={(e) => handleKeyDown(e, play)}
                          autoFocus
                          aria-label="WIZ abbreviation"
                          style={{
                            width: '100%',
                            height: '9px',
                            fontSize: '5pt',
                            fontWeight: 'bold',
                            border: '1px solid #3b82f6',
                            borderRadius: '1px',
                            padding: '0 1px',
                            outline: 'none',
                            background: '#eff6ff'
                          }}
                        />
                      ) : showOLSelector ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOLScheme && onSelectOLScheme(play);
                          }}
                          style={{
                            fontSize: '5pt',
                            color: '#3b82f6',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          + Select OL Scheme
                        </button>
                      ) : (
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          width: '100%'
                        }}>
                          {displayName}
                        </span>
                      )}
                    </div>
                  </div>
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
function MiniScriptEditor({ rows, plays, startCoord, onUpdateRow, onRemoveRow, onMoveRow, onAddRow, updatePlay }) {
  // Calculate coordinates for each play-row (excluding headers)
  const getRowCoordinates = () => {
    let coord = startCoord;
    const coords = {};
    rows.forEach((row) => {
      if (row.type !== 'header') {
        coords[row.id] = coord++;
      }
    });
    return coords;
  };

  const rowCoords = getRowCoordinates();

  // Handle play column change - update play's wristband properties
  const handlePlayChange = (rowId, column, value) => {
    const coord = rowCoords[rowId];
    const colKey = column === 'A' ? 'col1' : 'col3';
    const colIdKey = column === 'A' ? 'col1Id' : 'col3Id';

    // Find matching play by name
    const matchedPlay = plays.find(p => p.phase === 'offense' && p.name === value);

    if (matchedPlay) {
      // Update the play's wristband properties
      updatePlay(matchedPlay.id, {
        wristbandSlot: coord,
        wristbandType: 'mini',
        wristbandColumn: column
      });
      onUpdateRow(rowId, { [colKey]: value, [colIdKey]: matchedPlay.id });
    } else {
      // Just update the text value
      onUpdateRow(rowId, { [colKey]: value, [colIdKey]: '' });
    }
  };

  // Handle blur - attempt to match play when user finishes typing
  const handlePlayBlur = (rowId, column, value) => {
    if (!value) return;
    const coord = rowCoords[rowId];
    const colIdKey = column === 'A' ? 'col1Id' : 'col3Id';
    const row = rows.find(r => r.id === rowId);

    // If we already have a matched play ID, skip
    if (row && row[colIdKey]) return;

    // Try to match by name
    const matchedPlay = plays.find(p => p.phase === 'offense' && p.name === value);
    if (matchedPlay) {
      updatePlay(matchedPlay.id, {
        wristbandSlot: coord,
        wristbandType: 'mini',
        wristbandColumn: column
      });
      onUpdateRow(rowId, { [colIdKey]: matchedPlay.id });
    }
  };

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        if (row.type === 'header') {
          return (
            <div key={row.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700">
              <div className="flex flex-col flex-1">
                <label htmlFor={`header-label-${row.id}`} className="text-xs text-slate-400 mb-1">Header Label</label>
                <input
                  id={`header-label-${row.id}`}
                  value={row.label || ''}
                  onChange={(e) => onUpdateRow(row.id, { label: e.target.value })}
                  className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm font-bold"
                  placeholder="SECTION HEADER"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor={`header-color-${row.id}`} className="text-xs text-slate-400 mb-1">Color</label>
                <select
                  id={`header-color-${row.id}`}
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
          const coord = rowCoords[row.id];
          return (
            <div key={row.id} className="grid grid-cols-[50px_80px_1fr_80px_1fr_60px] gap-2 items-center p-2 bg-slate-800 rounded border border-slate-700">
              <div className="text-center text-white font-bold text-sm">{coord}</div>
              <input
                id={`tempo-a-${row.id}`}
                value={row.col0 || ''}
                onChange={(e) => onUpdateRow(row.id, { col0: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Tempo"
                aria-label={`Tempo A for row ${coord}`}
              />
              <input
                id={`play-a-${row.id}`}
                value={row.col1 || ''}
                onChange={(e) => handlePlayChange(row.id, 'A', e.target.value)}
                onBlur={(e) => handlePlayBlur(row.id, 'A', e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Play A"
                list={`plays-a-${row.id}`}
                aria-label={`Play A for row ${coord}`}
              />
              <datalist id={`plays-a-${row.id}`}>
                {plays.filter(p => p.phase === 'offense').map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
              <input
                id={`tempo-b-${row.id}`}
                value={row.col2 || ''}
                onChange={(e) => onUpdateRow(row.id, { col2: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Tempo"
                aria-label={`Tempo B for row ${coord}`}
              />
              <input
                id={`play-b-${row.id}`}
                value={row.col3 || ''}
                onChange={(e) => handlePlayChange(row.id, 'B', e.target.value)}
                onBlur={(e) => handlePlayBlur(row.id, 'B', e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                placeholder="Play B"
                list={`plays-b-${row.id}`}
                aria-label={`Play B for row ${coord}`}
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

