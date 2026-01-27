import { useState, useRef, useEffect } from 'react';
import { MousePointer, Minus, Trash, RotateCcw, RotateCw, Save, X, RefreshCw, Users, Plus } from 'lucide-react';

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

// Default position colors
const DEFAULT_POSITION_COLORS = {
  'C': '#64748b', 'G': '#64748b', 'T': '#64748b',
  'LT': '#64748b', 'LG': '#64748b', 'RG': '#64748b', 'RT': '#64748b',
  'QB': '#1e3a5f', 'Q': '#1e3a5f',
  'RB': '#3b82f6', 'B': '#3b82f6',
  'X': '#a855f7', 'Z': '#22c55e', 'Y': '#eab308',
  'A': '#ef4444', 'F': '#f97316', 'H': '#06b6d4'
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

// Default position placements on the canvas (wiz-card viewBox 754x445)
const SKILL_POSITION_PLACEMENTS = {
  'QB': { x: 377, y: 360 },     // Center behind OL
  'RB': { x: 317, y: 360 },     // Left of QB
  'FB': { x: 377, y: 355 },     // Behind QB (fullback)
  'X': { x: 80, y: 310 },       // Wide left
  'Z': { x: 674, y: 310 },      // Wide right
  'Y': { x: 497, y: 310 },      // Slot right (near TE)
  'A': { x: 170, y: 325 },      // Slot left
  'H': { x: 584, y: 315 },      // H-back (wing right)
  'F': { x: 437, y: 355 },      // F-back (right of QB)
  'B': { x: 257, y: 360 },      // Extra back
  'TE': { x: 457, y: 315 },     // Tight end
  'WR': { x: 80, y: 310 },      // Wide receiver (default to X spot)
};

// Generate WIZ Skill Formation based on personnel grouping
const getWizSkillFormation = (positionColors = {}, positionNames = {}, skillPositions = DEFAULT_SKILL_POSITIONS) => {
  const getColor = (pos, fallback) => positionColors[pos] || DEFAULT_POSITION_COLORS[pos] || fallback;

  const wizCenter = 377; // 754/2 for wiz-card viewBox
  const wizLos = 300;
  const initialSize = 24; // Smaller for skill OL
  const spacing = 40;
  const olY = wizLos + 15;

  const cOL = '#64748b';
  const baseTime = Date.now();

  // Always include 5 OL
  const elements = [
    { id: baseTime + 1, type: 'player', points: [{ x: wizCenter, y: olY }], color: getColor('C', cOL), label: 'C', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: baseTime + 2, type: 'player', points: [{ x: wizCenter - spacing, y: olY }], color: getColor('LG', cOL), label: 'G', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: baseTime + 3, type: 'player', points: [{ x: wizCenter + spacing, y: olY }], color: getColor('RG', cOL), label: 'G', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: baseTime + 4, type: 'player', points: [{ x: wizCenter - (spacing * 2), y: olY }], color: getColor('LT', cOL), label: 'T', shape: 'text-only', variant: 'filled', fontSize: initialSize },
    { id: baseTime + 5, type: 'player', points: [{ x: wizCenter + (spacing * 2), y: olY }], color: getColor('RT', cOL), label: 'T', shape: 'text-only', variant: 'filled', fontSize: initialSize },
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
  mode = 'wiz-oline',
  readOnly = false,
  formations = [],
  personnelGroupings = [],
  offensePositions = [], // Available offense positions from setup
  positionColors = {},
  positionNames = {},
  playName = '' // Optional play name to display in toolbar
}) {
  const isWizSkill = mode === 'wiz-skill';
  const isWizOline = mode === 'wiz-oline';

  // ViewBox settings based on mode
  const viewBox = isWizSkill ? '0 0 754 445' : '0 0 900 600';
  const aspectRatio = isWizSkill ? '754 / 445' : '900 / 600';

  // Get available skill positions from positionNames (non-OL positions)
  const OL_POSITIONS = ['LT', 'LG', 'C', 'RG', 'RT'];

  // Derive skill positions from positionNames keys (user's defined positions)
  const positionNameKeys = Object.keys(positionNames || {});
  const availableSkillPositions = positionNameKeys.length > 0
    ? positionNameKeys.filter(p => !OL_POSITIONS.includes(p))
    : DEFAULT_SKILL_POSITIONS;

  // Track selected personnel grouping
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');

  // Initialize with data or default formation
  const [elements, setElements] = useState(() => {
    if (initialData && initialData.elements && initialData.elements.length > 0) {
      return initialData.elements;
    }
    if (isWizSkill) {
      // Use positions from positionNames if available, otherwise default
      const posKeys = Object.keys(positionNames || {});
      const defaultSkillPos = posKeys.length > 0
        ? posKeys.filter(p => !['LT', 'LG', 'C', 'RG', 'RT'].includes(p))
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
  const [lineWidth, setLineWidth] = useState(4);
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

  // Load Formation from Library (for wiz-skill mode)
  const loadFormation = (formationId) => {
    const formation = formations.find(f => f.id === formationId);
    if (!formation || !formation.positions) return;

    const newElements = [];
    const getColor = (label) => positionColors[label] || DEFAULT_POSITION_COLORS[label] || '#3b82f6';

    const positionConfig = {
      'C': { shape: 'text-only', fontSize: 24 },
      'G': { shape: 'text-only', fontSize: 24 },
      'T': { shape: 'text-only', fontSize: 24 },
      'LT': { shape: 'text-only', fontSize: 24 },
      'LG': { shape: 'text-only', fontSize: 24 },
      'RG': { shape: 'text-only', fontSize: 24 },
      'RT': { shape: 'text-only', fontSize: 24 },
      'QB': { shape: 'circle', variant: 'filled', label: 'Q' },
      'Q': { shape: 'circle', variant: 'filled' },
      'RB': { shape: 'circle', variant: 'filled', label: 'B' },
      'B': { shape: 'circle', variant: 'filled' },
      'X': { shape: 'circle', variant: 'filled' },
      'Z': { shape: 'circle', variant: 'filled' },
      'Y': { shape: 'circle', variant: 'filled' },
      'A': { shape: 'circle', variant: 'filled' },
      'F': { shape: 'circle', variant: 'filled' },
      'H': { shape: 'circle', variant: 'filled' }
    };

    formation.positions.forEach((pos, idx) => {
      // Convert percentage (0-100) to pixel coordinates for wiz-card viewBox (754x445)
      const x = (pos.x / 100) * 754;
      const y = (pos.y / 100) * 445;

      const config = positionConfig[pos.label] || { shape: 'circle', variant: 'filled' };

      newElements.push({
        id: Date.now() + idx,
        type: 'player',
        points: [{ x, y }],
        color: getColor(pos.label),
        label: positionNames[pos.label] || config.label || pos.label,
        shape: config.shape || 'circle',
        variant: config.variant || 'filled',
        fontSize: config.fontSize
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
  const addSinglePlayer = (positionKey) => {
    const wizCenter = 377;
    const wizLos = 300;
    const getColor = (label) => positionColors[label] || DEFAULT_POSITION_COLORS[label] || '#3b82f6';

    const isOL = ['C', 'LT', 'LG', 'RG', 'RT'].includes(positionKey);
    const newPlayer = {
      id: Date.now(),
      type: 'player',
      points: [{ x: wizCenter, y: wizLos + (isOL ? 15 : 60) }],
      color: getColor(positionKey),
      label: positionNames[positionKey] || positionKey,
      shape: isOL ? 'text-only' : 'circle',
      variant: 'filled',
      fontSize: isOL ? 24 : undefined
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

  const handleMouseDown = (e) => {
    if (readOnly) return;
    if (isDraggingElements) return;
    if (selectedTool === 'delete') return;

    const point = getPoint(e);

    // Selection Box Logic
    if (selectedTool === 'select') {
      if (!e.shiftKey) setSelectedIds(new Set());
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

    const newSelected = new Set(selectedIds);
    if (e.shiftKey) {
      if (newSelected.has(elId)) newSelected.delete(elId);
      else newSelected.add(elId);
    } else {
      if (!newSelected.has(elId)) {
        newSelected.clear();
        newSelected.add(elId);
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
    const canvasWidth = isWizSkill ? 754 : 900;
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

  // Reset to default formation
  const resetFormation = () => {
    if (!confirm('Reset to default formation? This will clear your current diagram.')) return;
    const defaultFormation = isWizSkill
      ? getWizSkillFormation(positionColors, positionNames, availableSkillPositions)
      : getDefaultWizOLFormation();
    setElements(defaultFormation);
    updateHistory(defaultFormation);
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
        if (selectedIds.size > 0) {
          updateElements(elements.filter(el => !selectedIds.has(el.id)));
          setSelectedIds(new Set());
        }
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
  }, [selectedIds, elements, history, historyIndex]);

  // Render element
  const renderElement = (el, isPreview = false) => {
    if (el.type === 'player') {
      const { x, y } = el.points[0];
      const isSelected = selectedIds.has(el.id);
      const isInteractionTool = selectedTool === 'select' || selectedTool === 'delete';
      const pointerEvents = isInteractionTool ? 'all' : 'none';

      if (el.shape === 'text-only') {
        const tSize = el.fontSize || (isWizOline ? 170 : 24);
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
              fill={el.color || 'black'}
              style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Arial, sans-serif' }}
            >
              {positionNames[el.label] || el.label}
            </text>
          </g>
        );
      }

      // Circle/square shapes for skill players
      const size = 30;
      const isRect = el.shape === 'square';
      const isFilled = el.variant === 'filled';
      const fillColor = isFilled ? el.color : 'white';
      const strokeColor = el.color;
      const textColor = isFilled ? 'white' : el.color;

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
            fontSize="16"
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

    let markerEnd = undefined;
    let tBlock = null;

    if (el.endType === 'arrow') {
      markerEnd = `url(#arrowhead-${el.color})`;
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
    const strokeWidth = el.strokeWidth || 4;
    const isInteractionTool = selectedTool === 'select' || selectedTool === 'delete';

    // Generate segments with per-segment styles
    const segments = [];
    const segStyles = el.segmentStyles || [];
    const defaultStyle = el.style || 'solid';

    for (let i = 0; i < el.points.length - 1; i++) {
      const p1 = el.points[i];
      const p2 = el.points[i + 1];
      const segStyle = segStyles[i] || defaultStyle;
      const isLastSegment = i === el.points.length - 2;

      let segD = '';
      if (segStyle === 'zigzag') {
        segD = getZigZagPath([p1, p2]);
      } else {
        segD = `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
      }

      segments.push(
        <path
          key={i}
          d={segD}
          stroke={isSelected ? '#2563eb' : el.color}
          strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
          fill="none"
          strokeDasharray={segStyle === 'dashed' ? '10,5' : 'none'}
          markerEnd={isLastSegment ? markerEnd : undefined}
          filter={isSelected ? 'drop-shadow(0 0 2px #2563eb)' : 'none'}
        />
      );
    }

    return (
      <g
        key={el.id || 'current'}
        onMouseDown={(e) => handleElementMouseDown(e, el.id)}
        onClick={(e) => { e.stopPropagation(); handleClickElement(el.id); }}
        style={{
          cursor: selectedTool === 'delete' ? 'pointer' : 'default',
          opacity: isPreview ? 0.6 : 1,
          pointerEvents: isInteractionTool ? 'all' : 'none'
        }}
      >
        {segments}
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
        <div className="flex items-center gap-3 p-3 bg-slate-800 border-b border-slate-600 flex-wrap">

          {/* Play Name Display */}
          {playName && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-300 font-medium mb-1">Play</span>
                <div className="px-3 py-1.5 text-sm bg-sky-600 border border-sky-500 rounded text-white font-bold shadow-sm">
                  {playName}
                </div>
              </div>
              <div className="w-px h-10 bg-slate-600" />
            </>
          )}

          {/* WIZ Skill: Personnel Grouping Selector */}
          {isWizSkill && personnelGroupings.length > 0 && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-300 font-medium mb-1">Personnel</span>
                <select
                  value={selectedPersonnelId}
                  onChange={(e) => {
                    if (e.target.value) {
                      applyPersonnelGrouping(e.target.value);
                    } else {
                      // Reset to default personnel (from positionNames)
                      setSelectedPersonnelId('');
                      const newElements = getWizSkillFormation(positionColors, positionNames, availableSkillPositions);
                      setElements(newElements);
                      updateHistory(newElements);
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-600 border border-purple-500 rounded text-white font-medium"
                >
                  <option value="">Default (11)</option>
                  {personnelGroupings.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.code ? `${g.code} - ${g.name}` : g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-px h-10 bg-slate-600" />
            </>
          )}

          {/* WIZ Skill: Formation Selector */}
          {isWizSkill && formations.length > 0 && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-300 font-medium mb-1">Formation</span>
                <div className="flex items-center gap-1">
                  <select
                    value={selectedFormationId}
                    onChange={(e) => {
                      if (e.target.value) {
                        loadFormation(e.target.value);
                        setSelectedFormationId(e.target.value);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white"
                  >
                    <option value="">Load Formation...</option>
                    {formations.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={resetFormation}
                    className="px-2 py-1 text-xs bg-slate-600 text-slate-200 rounded hover:bg-slate-500"
                    title="Reset to default formation"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-600" />
            </>
          )}

          {/* WIZ Skill: Add Player */}
          {isWizSkill && (
            <>
              <div className="flex flex-col items-center relative">
                <span className="text-[10px] text-slate-300 font-medium mb-1">Add Player</span>
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-500 flex items-center gap-1"
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
              <div className="w-px h-10 bg-slate-600" />
            </>
          )}

          {/* WIZ OL: Add Custom Blocker + Text Size */}
          {isWizOline && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-300 font-medium mb-1">Add Blocker</span>
                <div className="flex items-center gap-1 bg-sky-900/50 px-2 py-1 rounded border border-sky-700">
                  <input
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
              <div className="w-px h-10 bg-slate-600" />
            </>
          )}

          {/* Select Button */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-300 font-medium mb-1">Tool</span>
            <button
              onClick={() => setSelectedTool('select')}
              className={`px-3 py-1.5 rounded flex items-center gap-1 ${selectedTool === 'select' ? 'bg-sky-600 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}
              title="Select / Move"
            >
              <MousePointer size={16} /> <span className="text-sm">Select</span>
            </button>
          </div>

          <div className="w-px h-10 bg-slate-600" />

          {/* Line Style + End Type */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-300 font-medium mb-1">Line Drawing</span>
            <div className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded border border-slate-500">
              <span className="text-xs text-amber-400 font-bold mr-1">STYLE</span>
              <button
                onClick={() => { setSelectedTool('line'); setLineStyle('solid'); }}
                className={`px-2 py-1 text-xs rounded ${selectedTool === 'line' && lineStyle === 'solid' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                title="Solid Line"
              >
                <span className="inline-block w-4 border-b-2 border-current" />
              </button>
              <button
                onClick={() => { setSelectedTool('line'); setLineStyle('dashed'); }}
                className={`px-2 py-1 text-xs rounded ${selectedTool === 'line' && lineStyle === 'dashed' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                title="Dashed Line"
              >
                <span className="inline-block w-4 border-b-2 border-dashed border-current" />
              </button>
              <button
                onClick={() => { setSelectedTool('line'); setLineStyle('zigzag'); }}
                className={`px-2 py-1 text-xs rounded ${selectedTool === 'line' && lineStyle === 'zigzag' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                title="Zigzag Line"
              >
                <svg width="16" height="8" viewBox="0 0 16 8" className="inline-block">
                  <path d="M0,4 L3,1 L6,7 L10,1 L13,7 L16,4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
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
                  onClick={() => { setSelectedTool('line'); setEndType(opt.id); }}
                  className={`px-2 py-1 text-xs rounded ${selectedTool === 'line' && endType === opt.id ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                  title={opt.title}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-slate-600" />

          {/* Colors */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-300 font-medium mb-1">Line Color</span>
            <div className="flex items-center gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); if (selectedIds.size > 0) updateElements(elements.map(el => selectedIds.has(el.id) ? { ...el, color: c } : el)); }}
                  className="w-5 h-5 rounded-full border-2"
                  title={c}
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#fff' : 'transparent',
                    boxShadow: color === c ? '0 0 0 2px #3b82f6' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-slate-600" />

          {/* Flip */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-300 font-medium mb-1">Mirror</span>
            <button
              onClick={flipFormation}
              className="px-3 py-1.5 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 flex items-center gap-1"
              title="Flip Left/Right"
            >
              <RefreshCw size={14} /> <span className="text-sm">Flip</span>
            </button>
          </div>

          {/* Undo/Redo/Delete */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-300 font-medium mb-1">History</span>
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
          <div className="flex flex-col items-end ml-auto">
            <span className="text-[10px] text-slate-300 font-medium mb-1">Actions</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm bg-slate-600 text-slate-200 rounded hover:bg-slate-500"
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
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1"
                  title="Save as new protection/scheme"
                >
                  <Save size={14} /> Save As
                </button>
              )}
              <button
                onClick={() => onSave({ elements })}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-500 flex items-center gap-1 font-semibold"
                title="Save changes"
              >
                <Save size={14} /> Save
              </button>
            </div>
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
          className="shadow-xl h-full"
          style={{
            aspectRatio,
            maxHeight: '100%',
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
              aspectRatio: isWizSkill ? '15.07 / 8.89' : undefined
            }}
          >
            <defs>
              {COLORS.map(c => (
                <marker key={c} id={`arrowhead-${c}`} markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill={c} />
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
    </div>
  );
}
