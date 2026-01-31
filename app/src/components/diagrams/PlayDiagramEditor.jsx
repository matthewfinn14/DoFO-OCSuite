import { useState, useRef, useEffect } from 'react';
import { MousePointer, Minus, Trash, RotateCcw, RotateCw, Save, X, RefreshCw, Users, Plus, Group, Ungroup } from 'lucide-react';

// Zigzag path generator
const getZigZagPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const A = points[i];
    const B = points[i + 1];
    const isLastSegment = i === points.length - 2;

    let targetB = B;
    let finalSegment = '';

    // If it's the last segment, leave a straight tail for the arrowhead
    if (isLastSegment) {
      const totalDist = Math.hypot(B.x - A.x, B.y - A.y);
      const arrowSpace = 5;
      if (totalDist > arrowSpace) {
        const ratio = (totalDist - arrowSpace) / totalDist;
        targetB = {
          x: A.x + (B.x - A.x) * ratio,
          y: A.y + (B.y - A.y) * ratio
        };
        finalSegment = ` L ${B.x},${B.y}`;
      }
    }

    const dist = Math.hypot(targetB.x - A.x, targetB.y - A.y);
    const steps = Math.floor(dist / 10);

    if (steps <= 0) {
      d += ` L ${targetB.x},${targetB.y}`;
    } else {
      const dx = (targetB.x - A.x) / steps;
      const dy = (targetB.y - A.y) / steps;
      const nx = -dy * 0.5;
      const ny = dx * 0.5;
      for (let j = 1; j <= steps; j++) {
        const mx = A.x + dx * j;
        const my = A.y + dy * j;
        if (j === steps) {
          d += ` L ${mx},${my}`;
        } else {
          const side = j % 2 === 0 ? 1 : -1;
          d += ` L ${mx + nx * side},${my + ny * side}`;
        }
      }
    }

    if (finalSegment) {
      d += finalSegment;
    }
  }
  return d;
};

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#facc15', '#8b5cf6', '#ec4899', '#06b6d4'];

// Default position colors (fallback only - user's positionColors from setup take precedence)
const DEFAULT_POSITION_COLORS = {
  'C': '#64748b', 'G': '#64748b', 'T': '#64748b',
  'LT': '#64748b', 'LG': '#64748b', 'RG': '#64748b', 'RT': '#64748b',
  'QB': '#1e3a5f', 'Q': '#1e3a5f',
  'RB': '#3b82f6', 'FB': '#6366f1',
  'X': '#a855f7', 'Z': '#22c55e', 'Y': '#eab308',
  'A': '#f97316', 'B': '#3b82f6', 'F': '#f97316', 'H': '#06b6d4',
  'TE': '#84cc16', 'WR': '#a855f7'
};

// Default WIZ OL Formation - C centered on canvas (450, 300 for 900x600 viewBox)
const getDefaultWizOLFormation = () => {
  const centerX = 450;
  const centerY = 300;
  const initialSize = 170;
  return [
    { id: Date.now() + 1, type: 'player', points: [{ x: centerX, y: centerY }], color: '#000000', label: 'C', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: Date.now() + 2, type: 'player', points: [{ x: centerX - 170, y: centerY + 15 }], color: '#000000', label: 'G', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: Date.now() + 3, type: 'player', points: [{ x: centerX + 170, y: centerY + 15 }], color: '#000000', label: 'G', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: Date.now() + 4, type: 'player', points: [{ x: centerX - 340, y: centerY + 30 }], color: '#000000', label: 'T', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: Date.now() + 5, type: 'player', points: [{ x: centerX + 340, y: centerY + 30 }], color: '#000000', label: 'T', shape: 'text-only', variant: 'filled', fontSize: initialSize },
  ];
};

// Default skill positions for 11 personnel (no personnel grouping selected)
const DEFAULT_SKILL_POSITIONS = ['QB', 'RB', 'X', 'Z', 'Y', 'A'];

// Default position placements on the canvas (wiz-card viewBox 950x600 - 1.58:1 ratio)
// LOS is around y=390, backfield around y=450-520
const SKILL_POSITION_PLACEMENTS = {
  'QB': { x: 510, y: 500 },     // Backfield, center
  'RB': { x: 420, y: 520 },     // Backfield, left of QB
  'FB': { x: 510, y: 460 },     // Behind QB (fullback)
  'X': { x: 80, y: 390 },       // Wide left on LOS
  'Z': { x: 710, y: 440 },      // Off ball, slot right
  'Y': { x: 870, y: 390 },      // Wide right on LOS
  'A': { x: 330, y: 450 },      // Off ball, slot left
  'H': { x: 750, y: 450 },      // H-back (wing right)
  'F': { x: 590, y: 500 },      // F-back (right of QB)
  'B': { x: 350, y: 520 },      // Extra back
  'TE': { x: 630, y: 395 },     // Tight end (on LOS)
  'WR': { x: 80, y: 390 },      // Wide receiver (default to X spot)
};

// Generate WIZ Skill Formation based on personnel grouping
const getWizSkillFormation = (positionColors = {}, positionNames = {}, skillPositions = DEFAULT_SKILL_POSITIONS) => {
  const getColor = (pos, fallback) => positionColors[pos] || DEFAULT_POSITION_COLORS[pos] || fallback;

  const wizCenter = 475; // 950/2 for wiz-card viewBox
  const wizLos = 390;    // LOS position (900x600 canvas)
  const initialSize = 50; // OL text size for WIZ Skill
  const spacing = 38;    // OL spacing (tighter gaps)
  const olY = wizLos;    // OL on the LOS

  const cOL = '#64748b';
  const baseTime = Date.now();
  const olGroupId = `ol-group-${baseTime}`; // Group ID for OL

  // Always include 5 OL (grouped by default) - positionKey used for saving/restoring defaults
  const elements = [
    { id: baseTime + 1, type: 'player', points: [{ x: wizCenter, y: olY }], color: getColor('C', cOL), label: 'C', shape: 'text-only', variant: 'filled', fontSize: initialSize, groupId: olGroupId, positionKey: 'C' },
    { id: baseTime + 2, type: 'player', points: [{ x: wizCenter - spacing, y: olY }], color: getColor('LG', cOL), label: 'G', shape: 'text-only', variant: 'filled', fontSize: initialSize, groupId: olGroupId, positionKey: 'LG' },
    { id: baseTime + 3, type: 'player', points: [{ x: wizCenter + spacing, y: olY }], color: getColor('RG', cOL), label: 'G', shape: 'text-only', variant: 'filled', fontSize: initialSize, groupId: olGroupId, positionKey: 'RG' },
    { id: baseTime + 4, type: 'player', points: [{ x: wizCenter - (spacing * 2), y: olY }], color: getColor('LT', cOL), label: 'T', shape: 'text-only', variant: 'filled', fontSize: initialSize, groupId: olGroupId, positionKey: 'LT' },
    { id: baseTime + 5, type: 'player', points: [{ x: wizCenter + (spacing * 2), y: olY }], color: getColor('RT', cOL), label: 'T', shape: 'text-only', variant: 'filled', fontSize: initialSize, groupId: olGroupId, positionKey: 'RT' },
  ];

  // Add skill players based on the provided positions
  skillPositions.forEach((pos, idx) => {
    const placement = SKILL_POSITION_PLACEMENTS[pos] || { x: wizCenter, y: wizLos + 60 };
    elements.push({
      id: baseTime + 10 + idx,
      type: 'player',
      points: [{ x: placement.x, y: placement.y }],
      color: getColor(pos, '#3b82f6'),
      label: positionNames[pos] || pos,
      shape: 'circle',
      variant: 'filled',
      positionKey: pos // Store original position key for personnel changes
    });
  });

  return elements;
};

export default function PlayDiagramEditor({
  initialData,
  onSave,
  onSaveAs,
  onCancel,
  onSaveFormation, // Callback to save a new formation template
  onSaveDefaultPositions, // Callback to save custom default positions
  mode = 'wiz-oline',
  readOnly = false,
  formations = [],
  personnelGroupings = [],
  offensePositions = [], // Available offense positions from setup
  positionColors = {},
  positionNames = {},
  customDefaultPositions = {}, // User's custom default positions { positionKey: { x, y } }
  playName = '' // Optional play name to display in toolbar
}) {
  const isWizSkill = mode === 'wiz-skill';
  const isWizOline = mode === 'wiz-oline';

  // ViewBox settings based on mode (wiz-skill uses wider aspect ratio to fit wristband cells)
  const viewBox = isWizSkill ? '0 0 950 600' : '0 0 950 600';
  const aspectRatio = '950 / 600';

  // Get available skill positions (non-OL positions)
  const OL_POSITIONS = ['LT', 'LG', 'C', 'RG', 'RT'];

  // Use offensePositions if provided (from setup config), otherwise fall back to positionNames keys or defaults
  const availableSkillPositions = offensePositions.length > 0
    ? offensePositions.filter(p => !OL_POSITIONS.includes(p))
    : (Object.keys(positionNames || {}).length > 0
      ? Object.keys(positionNames).filter(p => !OL_POSITIONS.includes(p))
      : DEFAULT_SKILL_POSITIONS);

  // Find base personnel grouping (marked with isBase) for default formation
  const basePersonnel = personnelGroupings.find(p => p.isBase) || personnelGroupings[0];
  const baseSkillPositions = basePersonnel?.positions?.filter(p => !['LT', 'LG', 'C', 'RG', 'RT'].includes(p)) || DEFAULT_SKILL_POSITIONS;

  // Track selected personnel grouping - default to base personnel if available
  const [selectedPersonnelId, setSelectedPersonnelId] = useState(basePersonnel?.id || '');

  // Initialize with data or default formation
  const [elements, setElements] = useState(() => {
    if (initialData && initialData.elements && initialData.elements.length > 0) {
      return initialData.elements;
    }
    if (isWizSkill) {
      // Use base personnel positions if available, otherwise fall back to defaults
      const defaultSkillPos = baseSkillPositions.length > 0
        ? baseSkillPositions
        : DEFAULT_SKILL_POSITIONS;
      return getWizSkillFormation(positionColors, positionNames, defaultSkillPos);
    }
    if (isWizOline) {
      return getDefaultWizOLFormation();
    }
    return [];
  });

  const [selectedTool, setSelectedTool] = useState('select');
  const [color, setColor] = useState('#000000');
  const [lineStyle, setLineStyle] = useState('solid');
  const [lineWidth, setLineWidth] = useState(7);
  const [endType, setEndType] = useState(isWizOline ? 't' : 'arrow'); // T-block for OL, arrow for skill

  // Text Size State for Wiz OL
  const [wizTextSize, setWizTextSize] = useState(isWizOline ? 170 : 24);
  const [customLetterInput, setCustomLetterInput] = useState('');

  // Formation selector state for wiz-skill
  const [selectedFormationId, setSelectedFormationId] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  // Segment-level selection: { elementId, segmentIndex } or null
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);

  // Drag state
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);

  // Helper to update elements with history
  const updateElements = (newElements, addToHistory = true) => {
    setElements(newElements);
    if (addToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const updateHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  // Keyboard arrow keys to move selected elements
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys when elements are selected
      if (selectedIds.size === 0 && !selectedSegment) return;

      // Don't handle if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrowKeys.includes(e.key)) return;

      e.preventDefault();

      // Move amount: 1px normally, 10px with shift
      const moveAmount = e.shiftKey ? 10 : 1;

      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowUp': dy = -moveAmount; break;
        case 'ArrowDown': dy = moveAmount; break;
        case 'ArrowLeft': dx = -moveAmount; break;
        case 'ArrowRight': dx = moveAmount; break;
      }

      // Move selected elements
      const newElements = elements.map(el => {
        if (selectedIds.has(el.id)) {
          return {
            ...el,
            points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
          };
        }
        return el;
      });

      updateElements(newElements);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedSegment, elements, updateElements]);

  // Define Formation - Save current player positions as a formation template
  // State for formation definition modal
  const [showDefineFormationModal, setShowDefineFormationModal] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [newFormationPersonnel, setNewFormationPersonnel] = useState('');

  const openDefineFormationModal = () => {
    // Extract player positions from current elements
    const playerElements = elements.filter(el => el.type === 'player');
    if (playerElements.length === 0) {
      alert('No players on the diagram to save as a formation.');
      return;
    }
    setNewFormationName('');
    setNewFormationPersonnel(selectedPersonnelId || '');
    setShowDefineFormationModal(true);
  };

  const saveFormationTemplate = () => {
    if (!newFormationName.trim()) return;

    // Extract player positions from current elements
    const playerElements = elements.filter(el => el.type === 'player');

    // Convert pixel coordinates to percentages (0-100) for portability
    // ViewBox is 900x600 for wiz-skill
    const positions = playerElements.map(el => {
      const point = el.points[0];
      const pos = {
        label: el.label,
        x: Math.round((point.x / 950) * 100 * 10) / 10, // Round to 1 decimal
        y: Math.round((point.y / 600) * 100 * 10) / 10,
        shape: el.shape || 'circle',
        variant: el.variant || 'filled'
      };
      // Only include optional fields if they have values (Firebase doesn't allow undefined)
      if (el.fontSize) pos.fontSize = el.fontSize;
      if (el.groupId) pos.groupId = 'grouped';
      return pos;
    });

    // Get personnel code from selected grouping
    const personnelGrouping = personnelGroupings.find(g => g.id === newFormationPersonnel);
    const personnelCode = personnelGrouping?.code || '';

    const newFormation = {
      id: `formation-${Date.now()}`,
      name: newFormationName.trim().toUpperCase(),
      phase: 'OFFENSE',
      personnelGroupingId: newFormationPersonnel || null,
      personnelCode: personnelCode,
      positions
    };

    if (onSaveFormation) {
      onSaveFormation(newFormation);
    }

    setShowDefineFormationModal(false);
    setNewFormationName('');
    setNewFormationPersonnel('');
  };

  // Load Formation from Library (for wiz-skill mode)
  const loadFormation = (formationId) => {
    const formation = formations.find(f => f.id === formationId);
    if (!formation || !formation.positions) return;

    const newElements = [];
    const getColor = (label) => positionColors[label] || DEFAULT_POSITION_COLORS[label] || '#3b82f6';
    const baseTime = Date.now();

    // Default config for positions that don't have saved shape/variant
    const positionConfig = {
      'C': { shape: 'text-only', fontSize: 50 },
      'G': { shape: 'text-only', fontSize: 50 },
      'T': { shape: 'text-only', fontSize: 50 },
      'LT': { shape: 'text-only', fontSize: 50 },
      'LG': { shape: 'text-only', fontSize: 50 },
      'RG': { shape: 'text-only', fontSize: 50 },
      'RT': { shape: 'text-only', fontSize: 50 },
    };

    // Check if any positions have groupId (for OL grouping)
    const hasOLGroup = formation.positions.some(p => p.groupId);
    const olGroupId = hasOLGroup ? `ol-group-${baseTime}` : null;

    const wizCenter = 475;
    formation.positions.forEach((pos, idx) => {
      // Convert percentage (0-100) to pixel coordinates for wiz-card viewBox (950x600)
      const x = (pos.x / 100) * 950;
      const y = (pos.y / 100) * 600;

      const defaultConfig = positionConfig[pos.label] || { shape: 'circle', variant: 'filled' };
      const isOL = ['C', 'G', 'T', 'LT', 'LG', 'RG', 'RT'].includes(pos.label);

      // Determine positionKey for OL (needed for Set Default to save uniquely)
      let positionKey = pos.label;
      if (pos.label === 'G') {
        positionKey = x < wizCenter ? 'LG' : 'RG';
      } else if (pos.label === 'T') {
        positionKey = x < wizCenter ? 'LT' : 'RT';
      }

      newElements.push({
        id: baseTime + idx,
        type: 'player',
        points: [{ x, y }],
        color: getColor(pos.label),
        label: positionNames[pos.label] || pos.label,
        shape: pos.shape || defaultConfig.shape || 'circle',
        variant: pos.variant || defaultConfig.variant || 'filled',
        fontSize: pos.fontSize || defaultConfig.fontSize,
        groupId: isOL && olGroupId ? olGroupId : pos.groupId,
        positionKey: isOL ? positionKey : pos.label // Unique key for OL
      });
    });

    setElements(newElements);
    updateHistory(newElements);
  };

  // Apply Personnel Grouping (changes skill players, keeps lines/routes)
  const applyPersonnelGrouping = (groupingId) => {
    const grouping = personnelGroupings.find(g => g.id === groupingId);
    if (!grouping || !grouping.positions) return;

    setSelectedPersonnelId(groupingId);

    const getColor = (label) => positionColors[label] || DEFAULT_POSITION_COLORS[label] || '#3b82f6';
    const baseTime = Date.now();

    // Keep all non-player elements (lines, routes, etc.) and OL
    const nonSkillElements = elements.filter(el => {
      if (el.type !== 'player') return true; // Keep all lines/routes
      if (el.shape === 'text-only') return true; // Keep OL (text-only)
      return false;
    });

    // Create new skill players based on the grouping
    const newSkillPlayers = [];
    const skillPositions = grouping.positions.filter(pos => !OL_POSITIONS.includes(pos));

    skillPositions.forEach((pos, idx) => {
      const placement = SKILL_POSITION_PLACEMENTS[pos] || { x: 377, y: 360 };
      newSkillPlayers.push({
        id: baseTime + 100 + idx,
        type: 'player',
        points: [{ x: placement.x, y: placement.y }],
        color: getColor(pos),
        label: positionNames[pos] || pos,
        shape: 'circle',
        variant: 'filled',
        positionKey: pos
      });
    });

    const newElements = [...nonSkillElements, ...newSkillPlayers];
    setElements(newElements);
    updateHistory(newElements);
  };

  // Load Personnel Grouping (for wiz-skill mode) - full reset
  const loadPersonnelGrouping = (groupingId) => {
    const grouping = personnelGroupings.find(g => g.id === groupingId);
    if (!grouping || !grouping.positions) return;

    setSelectedPersonnelId(groupingId);

    // Get skill positions from the grouping (excluding OL)
    const skillPositions = grouping.positions.filter(pos => !OL_POSITIONS.includes(pos));

    // Generate new formation with these positions
    const newElements = getWizSkillFormation(positionColors, positionNames, skillPositions);
    setElements(newElements);
    updateHistory(newElements);
  };

  // Add single player to diagram (for wiz-skill mode)
  const addSinglePlayer = (posKey) => {
    const wizCenter = 475;
    const wizLos = 390;
    const getColor = (label) => positionColors[label] || DEFAULT_POSITION_COLORS[label] || '#3b82f6';

    const isOL = ['C', 'LT', 'LG', 'RG', 'RT'].includes(posKey);
    // For display, use short label (G instead of LG, T instead of LT)
    const displayLabel = posKey === 'LG' || posKey === 'RG' ? 'G' : (posKey === 'LT' || posKey === 'RT' ? 'T' : posKey);
    const newPlayer = {
      id: Date.now(),
      type: 'player',
      points: [{ x: wizCenter, y: wizLos + (isOL ? 0 : 60) }],
      color: getColor(posKey),
      label: positionNames[posKey] || displayLabel,
      shape: isOL ? 'text-only' : 'circle',
      variant: 'filled',
      fontSize: isOL ? 50 : undefined,
      positionKey: posKey
    };

    const newElements = [...elements, newPlayer];
    setElements(newElements);
    updateHistory(newElements);
    setShowAddPlayer(false);
  };

  // Get SVG coordinates from mouse event
  const getPoint = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  // Group selected elements
  const handleGroup = () => {
    if (selectedIds.size < 2) return;
    const groupId = `group-${Date.now()}`;
    const newElements = elements.map(el =>
      selectedIds.has(el.id) ? { ...el, groupId } : el
    );
    updateElements(newElements);
  };

  // Ungroup selected elements
  const handleUngroup = () => {
    if (selectedIds.size === 0) return;
    // Find all groupIds in selected elements
    const selectedGroupIds = new Set();
    elements.forEach(el => {
      if (selectedIds.has(el.id) && el.groupId) {
        selectedGroupIds.add(el.groupId);
      }
    });
    if (selectedGroupIds.size === 0) return;

    // Remove groupId from all elements in those groups
    const newElements = elements.map(el =>
      el.groupId && selectedGroupIds.has(el.groupId) ? { ...el, groupId: undefined } : el
    );
    updateElements(newElements);
  };

  // Check if selected elements can be grouped/ungrouped
  const canGroup = selectedIds.size >= 2;
  const canUngroup = elements.some(el => selectedIds.has(el.id) && el.groupId);

  const handleMouseDown = (e) => {
    if (readOnly) return;
    if (isDraggingElements) return;
    if (selectedTool === 'delete') return;

    const point = getPoint(e);

    // Selection Box Logic
    if (selectedTool === 'select') {
      if (!e.shiftKey) {
        setSelectedIds(new Set());
        setSelectedSegment(null);
      }
      setSelectionBox({ start: point, current: point });
      return;
    }

    // Polyline drawing
    if (selectedTool === 'line') {
      if (!isDrawing) {
        setIsDrawing(true);

        // Smart Color: Check if we clicked on a player
        let drawColor = color;
        const hitRadius = isWizSkill ? 40 : 60;
        const hitPlayer = elements.find(el => {
          if (el.type !== 'player') return false;
          const p = el.points[0];
          const dist = Math.hypot(p.x - point.x, p.y - point.y);
          return dist < hitRadius;
        });

        if (hitPlayer) {
          drawColor = hitPlayer.color;
          setColor(drawColor);
        }

        setCurrentPath({
          id: Date.now(),
          type: 'poly',
          color: drawColor,
          style: lineStyle,
          endType,
          strokeWidth: lineWidth,
          points: [point, { x: point.x + 1, y: point.y + 1 }],
          segmentStyles: [lineStyle]
        });
      } else {
        // Add segment anchor
        setCurrentPath(prev => ({
          ...prev,
          points: [...prev.points.slice(0, -1), point, point],
          segmentStyles: [...(prev.segmentStyles || []), lineStyle]
        }));
      }
    }
  };

  const handleElementMouseDown = (e, elId) => {
    e.stopPropagation();
    if (selectedTool === 'delete') return;

    // Clear segment selection when clicking on elements
    setSelectedSegment(null);

    // Find the clicked element and check if it's in a group
    const clickedEl = elements.find(el => el.id === elId);
    const groupId = clickedEl?.groupId;

    const newSelected = new Set(selectedIds);
    if (e.shiftKey) {
      if (newSelected.has(elId)) {
        // If shift-clicking a grouped element, remove all group members
        if (groupId) {
          elements.forEach(el => {
            if (el.groupId === groupId) newSelected.delete(el.id);
          });
        } else {
          newSelected.delete(elId);
        }
      } else {
        // Add element (and all group members if grouped)
        if (groupId) {
          elements.forEach(el => {
            if (el.groupId === groupId) newSelected.add(el.id);
          });
        } else {
          newSelected.add(elId);
        }
      }
    } else {
      if (!newSelected.has(elId)) {
        newSelected.clear();
        // Select all elements in the same group
        if (groupId) {
          elements.forEach(el => {
            if (el.groupId === groupId) newSelected.add(el.id);
          });
        } else {
          newSelected.add(elId);
        }
      }
    }
    setSelectedIds(newSelected);

    setIsDraggingElements(true);
    setLastMousePos(getPoint(e));
  };

  const handleMouseMove = (e) => {
    const point = getPoint(e);

    // Selection box update
    if (selectionBox) {
      setSelectionBox(prev => ({ ...prev, current: point }));
      return;
    }

    // Dragging elements
    if (isDraggingElements) {
      const dx = point.x - lastMousePos.x;
      const dy = point.y - lastMousePos.y;

      setElements(prev => prev.map(el => {
        if (selectedIds.has(el.id)) {
          return {
            ...el,
            points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
          };
        }
        return el;
      }));
      setLastMousePos(point);
      return;
    }

    // Drawing line
    if (!isDrawing || !currentPath) return;

    if (selectedTool === 'line') {
      setCurrentPath(prev => {
        const newPoints = [...prev.points];
        newPoints[newPoints.length - 1] = point;
        return { ...prev, points: newPoints };
      });
    }
  };

  const handleDoubleClick = () => {
    if (!isDrawing || !currentPath) return;
    if (selectedTool === 'line') {
      const finalPath = { ...currentPath };

      // Filter duplicate points
      const uniquePoints = [];
      if (finalPath.points.length > 0) {
        uniquePoints.push(finalPath.points[0]);
        for (let i = 1; i < finalPath.points.length; i++) {
          const prev = uniquePoints[uniquePoints.length - 1];
          const curr = finalPath.points[i];
          const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
          if (dist > 2) {
            uniquePoints.push(curr);
          }
        }
      }

      finalPath.points = uniquePoints;
      setIsDrawing(false);

      if (finalPath.points.length > 1) {
        updateElements([...elements, finalPath]);
        setSelectedIds(new Set([finalPath.id]));
      }
      setCurrentPath(null);
    }
  };

  const handleMouseUp = () => {
    // Finish selection box
    if (selectionBox) {
      const x1 = Math.min(selectionBox.start.x, selectionBox.current.x);
      const y1 = Math.min(selectionBox.start.y, selectionBox.current.y);
      const x2 = Math.max(selectionBox.start.x, selectionBox.current.x);
      const y2 = Math.max(selectionBox.start.y, selectionBox.current.y);

      const newSelected = new Set(selectedIds);
      elements.forEach(el => {
        const isInside = el.points.some(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2);
        if (isInside) newSelected.add(el.id);
      });

      setSelectedIds(newSelected);
      setSelectionBox(null);
      return;
    }

    // Finish dragging
    if (isDraggingElements) {
      setIsDraggingElements(false);
      updateElements(elements);
      return;
    }
  };

  const handleClickElement = (elId) => {
    if (selectedTool === 'delete') {
      updateElements(elements.filter(el => el.id !== elId));
    }
  };

  // Flip formation
  const flipFormation = () => {
    const canvasWidth = 950; // Both modes use 950 width now
    const flippedElements = elements.map(el => {
      if (el.type === 'player' || el.type === 'poly' || el.type === 'free') {
        return {
          ...el,
          points: el.points.map(p => ({
            x: canvasWidth - p.x,
            y: p.y
          }))
        };
      }
      return el;
    });
    updateElements(flippedElements);
  };

  // Reset to default formation (uses selected personnel or base personnel)
  const resetFormation = () => {
    if (!confirm('Reset to default formation? This will clear your current diagram.')) return;
    // If a personnel is selected, use its positions; otherwise use base personnel
    const selectedGrouping = personnelGroupings.find(g => g.id === selectedPersonnelId);
    const positionsToUse = selectedGrouping
      ? selectedGrouping.positions.filter(p => !OL_POSITIONS.includes(p))
      : baseSkillPositions;
    const defaultFormation = isWizSkill
      ? getWizSkillFormation(positionColors, positionNames, positionsToUse.length > 0 ? positionsToUse : DEFAULT_SKILL_POSITIONS)
      : getDefaultWizOLFormation();
    setElements(defaultFormation);
    updateHistory(defaultFormation);
  };

  // Snap all players to their default positions (keeps routes/lines intact)
  // Uses customDefaultPositions if set, otherwise falls back to SKILL_POSITION_PLACEMENTS
  const snapToDefaultPositions = () => {
    const wizCenter = 475;
    const wizLos = 390;
    const olSpacing = 38;

    const newElements = elements.map(el => {
      if (el.type !== 'player') return el; // Keep lines/routes as-is

      // Get the position key (use positionKey if available, otherwise label)
      const posKey = el.positionKey || el.label;

      // Check for custom default position first
      if (customDefaultPositions[posKey]) {
        const customPos = customDefaultPositions[posKey];
        return { ...el, points: [{ x: customPos.x, y: customPos.y }] };
      }

      // OL positions (text-only shape)
      if (el.shape === 'text-only') {
        // Use positionKey if available (LG, RG, LT, RT, C), otherwise infer from position
        const olKey = el.positionKey || el.label;

        // Check custom defaults for OL
        if (customDefaultPositions[olKey]) {
          const customPos = customDefaultPositions[olKey];
          return { ...el, points: [{ x: customPos.x, y: customPos.y }] };
        }

        // Fall back to built-in defaults based on positionKey or inferred position
        let defaultPos = { x: wizCenter, y: wizLos };
        if (olKey === 'C') defaultPos = { x: wizCenter, y: wizLos };
        else if (olKey === 'LG') defaultPos = { x: wizCenter - olSpacing, y: wizLos };
        else if (olKey === 'RG') defaultPos = { x: wizCenter + olSpacing, y: wizLos };
        else if (olKey === 'LT') defaultPos = { x: wizCenter - (olSpacing * 2), y: wizLos };
        else if (olKey === 'RT') defaultPos = { x: wizCenter + (olSpacing * 2), y: wizLos };
        else if (el.label === 'G') {
          // Legacy: infer left/right from current position
          const isLeftG = el.points[0].x < wizCenter;
          defaultPos = { x: isLeftG ? wizCenter - olSpacing : wizCenter + olSpacing, y: wizLos };
        }
        else if (el.label === 'T') {
          const isLeftT = el.points[0].x < wizCenter;
          defaultPos = { x: isLeftT ? wizCenter - (olSpacing * 2) : wizCenter + (olSpacing * 2), y: wizLos };
        }

        return { ...el, points: [defaultPos] };
      }

      // Skill positions - fall back to SKILL_POSITION_PLACEMENTS
      const defaultPos = SKILL_POSITION_PLACEMENTS[posKey] || SKILL_POSITION_PLACEMENTS[el.label];
      if (defaultPos) {
        return { ...el, points: [{ x: defaultPos.x, y: defaultPos.y }] };
      }

      return el; // Keep position if no default found
    });

    setElements(newElements);
    updateHistory(newElements);
  };

  // Save current player positions as the new custom defaults
  const [defaultsSaved, setDefaultsSaved] = useState(false);
  const setAsDefaultPositions = () => {
    if (!onSaveDefaultPositions) return;

    const defaults = {};
    elements.forEach(el => {
      if (el.type !== 'player') return;
      const posKey = el.positionKey || el.label;
      const point = el.points[0];
      defaults[posKey] = { x: Math.round(point.x), y: Math.round(point.y) };
    });

    onSaveDefaultPositions(defaults);
    setDefaultsSaved(true);
    setTimeout(() => setDefaultsSaved(false), 2000);
  };

  // Toggle custom blocker (for wiz-oline)
  const toggleWizNode = (label) => {
    setElements(prev => {
      const exists = prev.find(e => e.label === label && e.type === 'player');
      if (exists) {
        return prev.filter(e => e.id !== exists.id);
      } else {
        const center = isWizSkill ? 377 : 450;
        const los = isWizSkill ? 300 : 340;
        const newPoint = { x: center, y: los + 150 };

        return [...prev, {
          id: Date.now(),
          type: 'player',
          points: [newPoint],
          color: isWizSkill ? (positionColors[label] || '#3b82f6') : '#000000',
          label: label,
          shape: isWizOline ? 'text-only' : 'circle',
          variant: 'filled',
          fontSize: isWizOline ? wizTextSize : undefined
        }];
      }
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // If a segment is selected, delete the whole line it belongs to
        if (selectedSegment) {
          updateElements(elements.filter(el => el.id !== selectedSegment.elementId));
          setSelectedSegment(null);
        } else if (selectedIds.size > 0) {
          updateElements(elements.filter(el => !selectedIds.has(el.id)));
          setSelectedIds(new Set());
        }
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setSelectedSegment(null);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedSegment, elements, history, historyIndex]);

  // Render element
  const renderElement = (el, isPreview = false) => {
    if (el.type === 'player') {
      const { x, y } = el.points[0];
      const isSelected = selectedIds.has(el.id);
      const isInteractionTool = selectedTool === 'select' || selectedTool === 'delete';
      const pointerEvents = isInteractionTool ? 'all' : 'none';

      // Always use latest color from positionColors, falling back to stored color or defaults
      const effectiveColor = positionColors[el.label] || el.color || DEFAULT_POSITION_COLORS[el.label] || '#3b82f6';

      if (el.shape === 'text-only') {
        const tSize = el.fontSize || (isWizOline ? 170 : 50);
        return (
          <g
            key={el.id}
            onMouseDown={(e) => !isPreview && handleElementMouseDown(e, el.id)}
            onClick={(e) => { e.stopPropagation(); !isPreview && handleClickElement(el.id); }}
            style={{
              cursor: selectedTool === 'delete' ? 'pointer' : (isPreview ? 'default' : 'move'),
              opacity: isPreview ? 0.8 : 1,
              pointerEvents
            }}
          >
            <rect
              x={x - (tSize * 0.6) / 2}
              y={y - (tSize * 0.8) / 2}
              width={tSize * 0.6}
              height={tSize * 0.8}
              fill="transparent"
              stroke="none"
            />
            {isSelected && !isPreview && (
              <rect
                x={x - (tSize * 0.6) / 2 - 4}
                y={y - (tSize * 0.8) / 2 - 4}
                width={(tSize * 0.6) + 8}
                height={(tSize * 0.8) + 8}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
            )}
            <text
              x={x}
              y={y}
              dy="0.35em"
              textAnchor="middle"
              fontSize={tSize}
              fontWeight="bold"
              fill={effectiveColor}
              style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Arial, sans-serif' }}
            >
              {positionNames[el.label] || el.label}
            </text>
          </g>
        );
      }

      // Circle/square shapes for skill players
      const size = 42;
      const isRect = el.shape === 'square';
      const isFilled = el.variant === 'filled';
      const fillColor = isFilled ? effectiveColor : 'white';
      const strokeColor = effectiveColor;
      const textColor = isFilled ? 'white' : effectiveColor;

      return (
        <g
          key={el.id}
          onMouseDown={(e) => !isPreview && handleElementMouseDown(e, el.id)}
          onClick={(e) => { e.stopPropagation(); !isPreview && handleClickElement(el.id); }}
          style={{
            cursor: selectedTool === 'delete' ? 'pointer' : (isPreview ? 'default' : 'move'),
            opacity: isPreview ? 0.8 : 1,
            pointerEvents
          }}
        >
          {isSelected && !isPreview && (
            isRect ? (
              <rect x={x - size / 2 - 4} y={y - size / 2 - 4} width={size + 8} height={size + 8} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4,2" />
            ) : (
              <circle cx={x} cy={y} r={size / 2 + 4} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4,2" />
            )
          )}
          {isRect ? (
            <rect x={x - size / 2} y={y - size / 2} width={size} height={size} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          ) : (
            <circle cx={x} cy={y} r={size / 2} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          )}
          <text
            x={x}
            y={y}
            dy="0.35em"
            textAnchor="middle"
            fontSize="22"
            fontWeight="bold"
            fill={textColor}
            style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Arial, sans-serif' }}
          >
            {positionNames[el.label] || el.label}
          </text>
        </g>
      );
    }

    // Polyline rendering
    if (el.points.length < 2) return null;

    let arrowHead = null;
    let tBlock = null;

    if (el.endType === 'arrow') {
      // Draw arrow as filled polygon (not marker) to avoid line showing through
      const end = el.points[el.points.length - 1];
      const prev = el.points[el.points.length - 2] || el.points[0];
      const dx = end.x - prev.x;
      const dy = end.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      // Arrow dimensions proportional to stroke width
      const sw = el.strokeWidth || 7;
      const arrowLen = sw * 6;
      const arrowWidth = sw * 3.5;

      const tip = end;
      const left = {
        x: end.x - ux * arrowLen + uy * arrowWidth / 2,
        y: end.y - uy * arrowLen - ux * arrowWidth / 2
      };
      const right = {
        x: end.x - ux * arrowLen - uy * arrowWidth / 2,
        y: end.y - uy * arrowLen + ux * arrowWidth / 2
      };

      arrowHead = (
        <polygon
          points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
          fill={el.color}
        />
      );
    } else if (el.endType === 't') {
      const end = el.points[el.points.length - 1];
      const prev = el.points[el.points.length - 2] || el.points[0];
      const dx = end.x - prev.x;
      const dy = end.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const sWidth = parseInt(el.strokeWidth || 2);
      const perpX = (-dy / len) * 15;
      const perpY = (dx / len) * 15;

      tBlock = (
        <line
          x1={end.x - perpX} y1={end.y - perpY}
          x2={end.x + perpX} y2={end.y + perpY}
          stroke={el.color}
          strokeWidth={sWidth}
          strokeLinecap="round"
        />
      );
    } else if (el.endType === 'dot') {
      const end = el.points[el.points.length - 1];
      tBlock = <circle cx={end.x} cy={end.y} r="6" fill={el.color} />;
    }

    const isSelected = selectedIds.has(el.id);
    const strokeWidth = el.strokeWidth || 7;
    const isInteractionTool = selectedTool === 'select' || selectedTool === 'delete';

    // Generate segments with per-segment styles
    const segments = [];
    const segStyles = el.segmentStyles || [];
    const defaultStyle = el.style || 'solid';

    for (let i = 0; i < el.points.length - 1; i++) {
      const p1 = el.points[i];
      let p2 = el.points[i + 1];
      const segStyle = segStyles[i] || defaultStyle;
      const isLastSegment = i === el.points.length - 2;
      const isSegmentSelected = selectedSegment?.elementId === el.id && selectedSegment?.segmentIndex === i;

      // Shorten the last segment if there's an arrow to prevent line showing through
      if (isLastSegment && el.endType === 'arrow') {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const sw = el.strokeWidth || 7;
        const arrowLen = sw * 6;
        if (len > arrowLen) {
          const shortenBy = arrowLen * 0.7; // Pull back line to meet arrow base
          p2 = {
            x: p2.x - (dx / len) * shortenBy,
            y: p2.y - (dy / len) * shortenBy
          };
        }
      }

      let segD = '';
      if (segStyle === 'zigzag') {
        segD = getZigZagPath([p1, p2]);
      } else {
        segD = `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
      }

      // Determine stroke color and width based on selection state
      const segStroke = isSegmentSelected ? '#f59e0b' : (isSelected ? '#2563eb' : el.color);
      const segStrokeWidth = (isSegmentSelected || isSelected) ? strokeWidth + 2 : strokeWidth;
      const segFilter = isSegmentSelected ? 'drop-shadow(0 0 3px #f59e0b)' : (isSelected ? 'drop-shadow(0 0 2px #2563eb)' : 'none');

      segments.push(
        <path
          key={i}
          d={segD}
          stroke={segStroke}
          strokeWidth={segStrokeWidth}
          fill="none"
          strokeDasharray={segStyle === 'dashed' ? '10,5' : 'none'}
          filter={segFilter}
          style={{ cursor: isInteractionTool ? 'pointer' : 'default', pointerEvents: isInteractionTool ? 'all' : 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            if (selectedTool === 'delete') {
              handleClickElement(el.id);
            } else if (selectedTool === 'select') {
              // Single click selects just this segment
              setSelectedSegment({ elementId: el.id, segmentIndex: i });
              setSelectedIds(new Set()); // Clear whole-element selection
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (selectedTool === 'select') {
              // Double click selects the whole line
              setSelectedSegment(null);
              setSelectedIds(new Set([el.id]));
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (selectedTool === 'select' && (isSelected || isSegmentSelected)) {
              // Allow dragging if selected
              setIsDraggingElements(true);
              setLastMousePos(getPoint(e));
              // Select the whole element for dragging
              if (!isSelected) {
                setSelectedIds(new Set([el.id]));
                setSelectedSegment(null);
              }
            }
          }}
        />
      );
    }

    return (
      <g
        key={el.id || 'current'}
        style={{
          opacity: isPreview ? 0.6 : 1
        }}
      >
        {segments}
        {arrowHead}
        {tBlock}
      </g>
    );
  };

  // Skill position buttons for adding players - use setup positions or defaults
  const skillPositionButtons = availableSkillPositions.length > 0
    ? availableSkillPositions
    : DEFAULT_SKILL_POSITIONS;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1.5 bg-slate-800 border-b border-slate-600">

          {/* Play Name Display */}
          {playName && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-medium">Play</span>
                <div className="px-2 py-0.5 text-xs bg-sky-600 border border-sky-500 rounded text-white font-bold shadow-sm truncate max-w-[140px]">
                  {playName}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-600" />
            </>
          )}

          {/* WIZ Skill: Personnel Grouping Selector */}
          {isWizSkill && personnelGroupings.length > 0 && (
            <>
              <div className="flex flex-col items-center">
                <label htmlFor="diagram-personnel-select" className="text-[9px] text-slate-400 font-medium">Personnel</label>
                <select
                  id="diagram-personnel-select"
                  value={selectedPersonnelId}
                  onChange={(e) => {
                    if (e.target.value) {
                      applyPersonnelGrouping(e.target.value);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-purple-600 border border-purple-500 rounded text-white font-medium"
                >
                  {personnelGroupings.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.code ? `${g.code} - ${g.name}` : g.name}{g.isBase ? ' (Base)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-px h-8 bg-slate-600" />
            </>
          )}

          {/* WIZ Skill: Formation Selector & Define */}
          {isWizSkill && (
            <>
              <div className="flex flex-col items-center">
                <label htmlFor="diagram-formation-select" className="text-[9px] text-slate-400 font-medium">Formation</label>
                <div className="flex items-center gap-1">
                  {formations.length > 0 && (
                    <select
                      id="diagram-formation-select"
                      value={selectedFormationId}
                      onChange={(e) => {
                        if (e.target.value) {
                          loadFormation(e.target.value);
                          setSelectedFormationId(e.target.value);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white"
                    >
                      <option value="">Load...</option>
                      {formations.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.personnelCode ? `${f.personnelCode} ` : ''}{f.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {onSaveFormation && (
                    <button
                      onClick={openDefineFormationModal}
                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500"
                      title="Save current positions as a formation template"
                    >
                      Define
                    </button>
                  )}
                  <button
                    onClick={snapToDefaultPositions}
                    className="px-2 py-1 text-xs bg-sky-600 text-white rounded hover:bg-sky-500"
                    title="Snap all players to their default starting positions (keeps routes)"
                  >
                    Snap Default
                  </button>
                  {onSaveDefaultPositions && (
                    <button
                      onClick={setAsDefaultPositions}
                      className={`px-2 py-1 text-xs text-white rounded transition-colors ${defaultsSaved ? 'bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                      title="Save current positions as YOUR default (will be used by Snap Default)"
                    >
                      {defaultsSaved ? 'Saved!' : 'Set Default'}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-600" />
            </>
          )}

          {/* WIZ Skill: Add/Remove Player */}
          {isWizSkill && (
            <>
              <div className="flex flex-col items-center relative">
                <span className="text-[9px] text-slate-400 font-medium">Add Player</span>
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500 flex items-center gap-1"
                >
                  <Plus size={14} /> Player
                </button>
                {showAddPlayer && (
                  <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg p-2 z-50 shadow-xl min-w-[180px]">
                    <div className="text-[10px] text-slate-300 font-medium mb-1 px-1">Click to add position</div>
                    <div className="grid grid-cols-3 gap-1">
                      {skillPositionButtons.map(pos => (
                        <button
                          key={pos}
                          onClick={() => addSinglePlayer(pos)}
                          className="px-3 py-1.5 text-xs rounded hover:opacity-80 text-white font-medium"
                          style={{ backgroundColor: positionColors[pos] || DEFAULT_POSITION_COLORS[pos] || '#3b82f6' }}
                        >
                          {positionNames[pos] || pos}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-medium">Remove</span>
                <button
                  onClick={() => setSelectedTool(selectedTool === 'delete' ? 'select' : 'delete')}
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                    selectedTool === 'delete'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-900/50 text-red-300 hover:bg-red-800/50'
                  }`}
                  title={selectedTool === 'delete' ? 'Click a player to remove, or click here to cancel' : 'Click to enable remove mode'}
                >
                  <Minus size={14} /> Player
                </button>
              </div>
              <div className="w-px h-8 bg-slate-600" />
            </>
          )}

          {/* WIZ OL: Add Custom Blocker + Text Size */}
          {isWizOline && (
            <>
              <div className="flex flex-col items-center">
                <label htmlFor="diagram-blocker-input" className="text-[9px] text-slate-400 font-medium">Add Blocker</label>
                <div className="flex items-center gap-1 bg-sky-900/50 px-2 py-1 rounded border border-sky-700">
                  <input
                    id="diagram-blocker-input"
                    type="text"
                    value={customLetterInput}
                    onChange={(e) => setCustomLetterInput(e.target.value.toUpperCase())}
                    placeholder="?"
                    maxLength={2}
                    className="w-6 px-1 text-center text-xs bg-slate-700 border border-slate-500 rounded text-white"
                  />
                  <button
                    onClick={() => { if (customLetterInput) { toggleWizNode(customLetterInput); setCustomLetterInput(''); } }}
                    disabled={!customLetterInput}
                    className="px-2 py-0.5 text-xs bg-sky-600 text-white rounded hover:bg-sky-500 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <div className="w-px h-4 bg-sky-700 mx-1" />
                  <button
                    onClick={() => { const s = Math.max(50, wizTextSize - 10); setWizTextSize(s); if (selectedIds.size > 0) updateElements(elements.map(el => (selectedIds.has(el.id) && el.shape === 'text-only') ? { ...el, fontSize: s } : el)); }}
                    className="px-1.5 py-0.5 text-xs bg-slate-600 text-white rounded hover:bg-slate-500"
                  >-</button>
                  <span className="text-xs text-slate-300 w-8 text-center">{wizTextSize}</span>
                  <button
                    onClick={() => { const s = Math.min(250, wizTextSize + 10); setWizTextSize(s); if (selectedIds.size > 0) updateElements(elements.map(el => (selectedIds.has(el.id) && el.shape === 'text-only') ? { ...el, fontSize: s } : el)); }}
                    className="px-1.5 py-0.5 text-xs bg-slate-600 text-white rounded hover:bg-slate-500"
                  >+</button>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-600" />
            </>
          )}

          {/* Select Button */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-medium">Tool</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedTool('select')}
                className={`px-2 py-1 rounded flex items-center gap-1 text-xs ${selectedTool === 'select' ? 'bg-sky-600 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}
                title="Select / Move"
              >
                <MousePointer size={14} /> Select
              </button>
              <button
                onClick={handleGroup}
                disabled={!canGroup}
                className={`p-1 rounded ${canGroup ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                title="Group selected elements"
              >
                <Group size={14} />
              </button>
              <button
                onClick={handleUngroup}
                disabled={!canUngroup}
                className={`p-1 rounded ${canUngroup ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                title="Ungroup selected elements"
              >
                <Ungroup size={14} />
              </button>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-600" />

          {/* Line Style + End Type */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-medium">Line Drawing</span>
            <div className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded border border-slate-500">
              <span className="text-xs text-amber-400 font-bold mr-1">STYLE</span>
              {[
                { id: 'solid', title: 'Solid Line', content: <span className="inline-block w-4 border-b-2 border-current" /> },
                { id: 'dashed', title: 'Dashed Line', content: <span className="inline-block w-4 border-b-2 border-dashed border-current" /> },
                { id: 'zigzag', title: 'Zigzag Line', content: <svg width="16" height="8" viewBox="0 0 16 8" className="inline-block"><path d="M0,4 L3,1 L6,7 L10,1 L13,7 L16,4" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg> }
              ].map(style => (
                <button
                  key={style.id}
                  onClick={() => {
                    setLineStyle(style.id);
                    // If a single segment is selected, update just that segment
                    if (selectedSegment) {
                      updateElements(elements.map(el => {
                        if (el.id === selectedSegment.elementId && el.type === 'poly') {
                          const newSegStyles = [...(el.segmentStyles || [])];
                          // Ensure array is long enough
                          while (newSegStyles.length <= selectedSegment.segmentIndex) {
                            newSegStyles.push(el.style || 'solid');
                          }
                          newSegStyles[selectedSegment.segmentIndex] = style.id;
                          return { ...el, segmentStyles: newSegStyles };
                        }
                        return el;
                      }));
                    } else if (selectedIds.size > 0) {
                      // If whole lines are selected, update all their segments
                      const hasSelectedLines = elements.some(el => selectedIds.has(el.id) && el.type === 'poly');
                      if (hasSelectedLines) {
                        updateElements(elements.map(el =>
                          selectedIds.has(el.id) && el.type === 'poly'
                            ? { ...el, style: style.id, segmentStyles: (el.segmentStyles || []).map(() => style.id) }
                            : el
                        ));
                      } else {
                        setSelectedTool('line');
                      }
                    } else {
                      setSelectedTool('line');
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${lineStyle === style.id ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                  title={style.title}
                >
                  {style.content}
                </button>
              ))}
              <div className="w-px h-4 bg-slate-500 mx-1" />
              <span className="text-xs text-amber-400 font-bold mr-1">END</span>
              {[
                { id: 'arrow', label: '→', title: 'Arrow End' },
                { id: 't', label: '—|', title: 'T-Block End' },
                { id: 'dot', label: '•', title: 'Dot End' },
                { id: 'none', label: '—', title: 'No End' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setEndType(opt.id);
                    // End type applies to whole line (segment selection or line selection)
                    if (selectedSegment) {
                      // Update the line that contains this segment
                      updateElements(elements.map(el =>
                        el.id === selectedSegment.elementId && el.type === 'poly'
                          ? { ...el, endType: opt.id }
                          : el
                      ));
                    } else if (selectedIds.size > 0) {
                      const hasSelectedLines = elements.some(el => selectedIds.has(el.id) && el.type === 'poly');
                      if (hasSelectedLines) {
                        updateElements(elements.map(el =>
                          selectedIds.has(el.id) && el.type === 'poly'
                            ? { ...el, endType: opt.id }
                            : el
                        ));
                      } else {
                        setSelectedTool('line');
                      }
                    } else {
                      setSelectedTool('line');
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${endType === opt.id ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                  title={opt.title}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-600" />

          {/* Colors - Dropdown */}
          <div className="flex flex-col items-center">
            <label htmlFor="diagram-color-select" className="text-[9px] text-slate-400 font-medium">Color</label>
            <div className="relative">
              <select
                id="diagram-color-select"
                value={color}
                onChange={(e) => { setColor(e.target.value); if (selectedIds.size > 0) updateElements(elements.map(el => selectedIds.has(el.id) ? { ...el, color: e.target.value } : el)); }}
                className="appearance-none pl-6 pr-4 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white cursor-pointer"
                style={{ minWidth: '70px' }}
              >
                {COLORS.map(c => (
                  <option key={c} value={c} style={{ backgroundColor: c }}>
                    {c === '#000000' ? 'Black' : c === '#ef4444' ? 'Red' : c === '#3b82f6' ? 'Blue' : c === '#22c55e' ? 'Green' : c === '#f97316' ? 'Orange' : c === '#facc15' ? 'Yellow' : c === '#8b5cf6' ? 'Purple' : c === '#ec4899' ? 'Pink' : c === '#06b6d4' ? 'Cyan' : c}
                  </option>
                ))}
              </select>
              <div
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          <div className="w-px h-8 bg-slate-600" />

          {/* Flip */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-medium">Mirror</span>
            <button
              onClick={flipFormation}
              className="px-2 py-1 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 flex items-center gap-1"
              title="Flip Left/Right"
            >
              <RefreshCw size={12} /> <span className="text-xs">Flip</span>
            </button>
          </div>

          {/* Undo/Redo/Delete */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-medium">History</span>
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className="p-2 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 disabled:opacity-30"
                title="Undo"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="p-2 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 disabled:opacity-30"
                title="Redo"
              >
                <RotateCw size={14} />
              </button>
              <button
                onClick={() => { if (selectedIds.size > 0) { updateElements(elements.filter(el => !selectedIds.has(el.id))); setSelectedIds(new Set()); } else { setSelectedTool('delete'); } }}
                className={`p-2 rounded ${selectedTool === 'delete' ? 'bg-red-600 text-white' : 'bg-slate-600 text-red-400 hover:bg-slate-500'}`}
                title="Delete Selected"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Cancel, Save As & Save */}
          <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onCancel}
                className="px-2 py-1 text-xs bg-slate-600 text-slate-200 rounded hover:bg-slate-500"
                title="Cancel and close"
              >
                Cancel
              </button>
              {onSaveAs && (
                <button
                  onClick={() => {
                    const name = prompt('Enter name for new protection/scheme:');
                    if (name && name.trim()) {
                      onSaveAs({ elements, name: name.trim().toUpperCase() });
                    }
                  }}
                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1"
                  title="Save as new protection/scheme"
                >
                  <Save size={14} /> Save As
                </button>
              )}
              <button
                onClick={() => onSave({ elements })}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 flex items-center gap-1 font-semibold"
                title="Save changes"
              >
                <Save size={14} /> Save
              </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-slate-700 text-slate-400 text-xs text-center py-1 border-b border-slate-600">
        {selectedTool === 'line'
          ? 'Click to start • Click to add corners • Double-click to finish'
          : 'Drag to move • Select + Delete to remove'}
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{
          background: isWizSkill ? '#0f172a' : '#e5e7eb',
          padding: isWizSkill ? '1.5rem 3rem' : '1rem'
        }}
      >
        <div
          className="shadow-xl"
          style={{
            aspectRatio,
            maxHeight: '100%',
            maxWidth: '100%',
            width: 'auto',
            height: '100%',
            boxShadow: isWizSkill ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: selectedTool === 'delete' ? 'not-allowed' : (selectedTool === 'line' ? 'crosshair' : 'default'),
              aspectRatio: isWizSkill ? '950 / 600' : undefined
            }}
          >
            <defs>
              {/* Create arrow markers for all colors: toolbar colors + element colors + position colors */}
              {[...new Set([
                ...COLORS,
                ...elements.map(el => el.color).filter(Boolean),
                ...Object.values(DEFAULT_POSITION_COLORS),
                ...Object.values(positionColors)
              ])].map(c => (
                <marker key={c} id={`arrowhead-${c}`} markerWidth="4.5" markerHeight="3" refX="3.75" refY="1.5" orient="auto">
                  <polygon points="0 0, 4.5 1.5, 0 3" fill={c} />
                </marker>
              ))}
            </defs>

            {/* Background */}
            {isWizSkill ? (
              <image
                href="/WIZ Background.jpg"
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
              />
            ) : (
              <rect width="100%" height="100%" fill="#ffffff" />
            )}

            {/* Render elements */}
            {elements.map(el => renderElement(el))}

            {/* Current drawing path */}
            {currentPath && renderElement(currentPath, true)}

            {/* Selection box */}
            {selectionBox && (
              <rect
                x={Math.min(selectionBox.start.x, selectionBox.current.x)}
                y={Math.min(selectionBox.start.y, selectionBox.current.y)}
                width={Math.abs(selectionBox.current.x - selectionBox.start.x)}
                height={Math.abs(selectionBox.current.y - selectionBox.start.y)}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Define Formation Modal */}
      {showDefineFormationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl w-80 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Define Formation</h3>
              <p className="text-xs text-slate-400 mt-1">Save current player positions as a reusable formation template</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="diagram-new-formation-name" className="block text-xs font-medium text-slate-300 mb-1">Formation Name</label>
                <input
                  id="diagram-new-formation-name"
                  type="text"
                  value={newFormationName}
                  onChange={(e) => setNewFormationName(e.target.value)}
                  placeholder="e.g., TRIPS RT, BUNCH LT..."
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="diagram-new-formation-personnel" className="block text-xs font-medium text-slate-300 mb-1">Personnel Grouping</label>
                <select
                  id="diagram-new-formation-personnel"
                  value={newFormationPersonnel}
                  onChange={(e) => setNewFormationPersonnel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-white"
                >
                  {personnelGroupings.length === 0 && (
                    <option value="">Default</option>
                  )}
                  {personnelGroupings.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.code ? `${g.code} - ${g.name}` : g.name}{g.isBase ? ' (Base)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Which personnel grouping uses this formation?</p>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowDefineFormationModal(false)}
                className="flex-1 px-3 py-2 text-sm bg-slate-600 text-slate-200 rounded hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={saveFormationTemplate}
                disabled={!newFormationName.trim()}
                className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Save Formation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
