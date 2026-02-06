import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Plus, GripVertical, Trash2, Settings, ChevronDown, ChevronUp, LayoutTemplate, MapPin, Target, Zap, List, Package } from 'lucide-react';
import { getPlayCall, abbreviatePlayCall } from '../../utils/playDisplay';

/**
 * FitText component - displays text that auto-shrinks to fit container
 * Applies abbreviations first, then reduces font size if needed
 */
function FitText({ text, abbreviations, baseFontSize = 0.6, minFontSize = 0.35, style = {} }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(baseFontSize);

  // Apply abbreviations to text
  const displayText = abbreviations ? abbreviatePlayCall(text, abbreviations) : text;

  useEffect(() => {
    if (!containerRef.current || !textRef.current || !displayText) {
      setFontSize(baseFontSize);
      return;
    }

    let currentSize = baseFontSize;

    const fitText = () => {
      if (!containerRef.current || !textRef.current) return;

      const container = containerRef.current;
      const textEl = textRef.current;
      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return;

      textEl.style.fontSize = `${baseFontSize}rem`;
      let textWidth = textEl.scrollWidth;

      currentSize = baseFontSize;
      while (textWidth > containerWidth && currentSize > minFontSize) {
        currentSize -= 0.025;
        textEl.style.fontSize = `${currentSize}rem`;
        textWidth = textEl.scrollWidth;
      }

      setFontSize(currentSize);
    };

    const frameId = requestAnimationFrame(fitText);
    return () => cancelAnimationFrame(frameId);
  }, [displayText, baseFontSize, minFontSize]);

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <span
        ref={textRef}
        style={{
          fontSize: `${fontSize}rem`,
          fontWeight: '500',
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        {displayText}
      </span>
    </div>
  );
}

/**
 * SpreadsheetView - Spreadsheet-style layout mode for call sheets
 *
 * Instead of independent boxes, this mode uses:
 * - A fixed grid of columns × rows per page
 * - Section headers that span columns and divide space
 * - Content flows down within section bounds
 */
export default function SpreadsheetView({
  layouts,
  gamePlan,
  plays,
  currentWeek,
  teamLogo,
  isLocked,
  isEditing,
  pageFormat = '2-page',
  pageOrientation = 'landscape',
  onUpdateLayouts,
  onHeaderClick,
  onAddPlayToSection,
  onRemovePlayFromSection,
  getPlayDisplayName,
  setupConfig,
  isTargetingMode = false,
  targetingPlayCount = 0
}) {
  const weekTitle = currentWeek?.name || `Week ${currentWeek?.weekNumber || ''}`;
  const opponentTitle = currentWeek?.opponent ? `vs. ${currentWeek.opponent}` : '';

  // Get wristband abbreviations for auto-shortening play names
  const abbreviations = setupConfig?.wristbandAbbreviations || {};

  // Zoom level for page view (50% to 150%)
  const [zoomLevel, setZoomLevel] = useState(100);

  // Calculate row height based on orientation
  const isLandscape = pageOrientation === 'landscape';
  const rowHeight = isLandscape ? 12 : 13;

  // Get spreadsheet layout data
  const spreadsheetData = layouts?.SPREADSHEET || {
    pages: [
      {
        pageNum: 1,
        columns: 8,
        rows: 40,
        headers: []
      }
    ]
  };

  // Track which header is being dragged (existing header repositioning)
  const [draggedHeader, setDraggedHeader] = useState(null);
  // Track new header being dragged from sidebar
  const [draggedNewHeader, setDraggedNewHeader] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);

  // Modal states
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false);
  const [addHeaderPageIdx, setAddHeaderPageIdx] = useState(null);
  const [editingHeader, setEditingHeader] = useState(null);
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);
  const [editingPageIdx, setEditingPageIdx] = useState(null);
  const [showAssignHeadersModal, setShowAssignHeadersModal] = useState(false);
  const [assignHeaderConfig, setAssignHeaderConfig] = useState({
    rowStart: 1,
    colStart: 1,
    colSpan: 2
  });

  // Pending header configuration (shown when clicking a header button)
  const [pendingHeaderConfig, setPendingHeaderConfig] = useState(null);
  // { item, categoryType, isScript, colSpan: 2, rowCount: 10 }

  // Local state for page settings inputs (allows clearing while typing)
  const [pageSettingsInput, setPageSettingsInput] = useState({ columns: '', rows: '' });

  // New header form state
  const [newHeader, setNewHeader] = useState({
    name: '',
    colSpan: 2,
    color: '#3b82f6',
    situationId: null
  });

  // Handle Escape key to cancel placement mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (draggedNewHeader) {
          setDraggedNewHeader(null);
        }
        if (pendingHeaderConfig) {
          setPendingHeaderConfig(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draggedNewHeader, pendingHeaderConfig]);

  // Calculate section bounds for each header on a page
  const calculateSectionBounds = useCallback((page) => {
    const { columns, rows, headers } = page;
    const bounds = {};

    // Sort headers by row, then by column
    const sortedHeaders = [...(headers || [])].sort((a, b) => {
      if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
      return a.colStart - b.colStart;
    });

    sortedHeaders.forEach(header => {
      const colStart = header.colStart;
      const colEnd = colStart + header.colSpan - 1;
      const rowStart = header.rowStart;

      // Find the next header below in overlapping columns
      let rowEnd = rows; // Default to page bottom

      for (const other of sortedHeaders) {
        if (other.id === header.id) continue;
        if (other.rowStart <= rowStart) continue;

        // Check if columns overlap
        const otherColStart = other.colStart;
        const otherColEnd = otherColStart + other.colSpan - 1;
        const hasOverlap = colStart <= otherColEnd && colEnd >= otherColStart;

        if (hasOverlap && other.rowStart < rowEnd) {
          rowEnd = other.rowStart - 1;
        }
      }

      bounds[header.id] = {
        colStart,
        colEnd,
        rowStart: rowStart + 1, // Content starts below header
        rowEnd,
        contentRows: rowEnd - rowStart // Number of rows for content
      };
    });

    return bounds;
  }, []);

  // Get plays for a section/header (returns array with plays at their row indices)
  const getPlaysForHeader = useCallback((headerId) => {
    const set = gamePlan?.sets?.find(s => s.id === `spreadsheet_${headerId}`);
    if (!set) return [];
    // assignedPlayIds array where index = row number, value = playId or null
    return (set.assignedPlayIds || []).map(playId => {
      if (!playId) return null;
      return plays.find(p => p.id === playId) || null;
    });
  }, [gamePlan?.sets, plays]);

  // Handle adding a new page
  const handleAddPage = useCallback(() => {
    const newLayouts = { ...layouts };
    const spreadsheet = { ...(newLayouts.SPREADSHEET || { pages: [] }) };
    const newPageNum = spreadsheet.pages.length + 1;

    spreadsheet.pages = [
      ...spreadsheet.pages,
      {
        pageNum: newPageNum,
        columns: 8,
        rows: 40,
        headers: []
      }
    ];

    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);
  }, [layouts, onUpdateLayouts]);

  // Handle updating page settings
  const handleUpdatePage = useCallback((pageIdx, updates) => {
    const newLayouts = { ...layouts };
    if (!newLayouts.SPREADSHEET) {
      newLayouts.SPREADSHEET = { pages: [{ pageNum: 1, columns: 8, rows: 40, headers: [] }] };
    }
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    const pages = [...(spreadsheet.pages || [])];
    if (!pages[pageIdx]) return;
    pages[pageIdx] = { ...pages[pageIdx], ...updates };
    spreadsheet.pages = pages;
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);
  }, [layouts, onUpdateLayouts]);

  // Handle deleting a page
  const handleDeletePage = useCallback((pageIdx) => {
    if (!confirm('Delete this page and all its headers?')) return;
    const newLayouts = { ...layouts };
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    spreadsheet.pages = spreadsheet.pages.filter((_, i) => i !== pageIdx);
    // Re-number pages
    spreadsheet.pages = spreadsheet.pages.map((p, i) => ({ ...p, pageNum: i + 1 }));
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);
  }, [layouts, onUpdateLayouts]);

  // Handle adding a new header
  const handleAddHeader = useCallback((pageIdx, headerConfig) => {
    const page = spreadsheetData.pages[pageIdx];
    if (!page) return;

    // Find next available position
    const existingHeaders = page.headers || [];
    let colStart = 1;
    let rowStart = 1;

    // Simple placement: find first row with space
    const usedCols = new Set();
    existingHeaders
      .filter(h => h.rowStart === 1)
      .forEach(h => {
        for (let c = h.colStart; c < h.colStart + h.colSpan; c++) {
          usedCols.add(c);
        }
      });

    for (let c = 1; c <= page.columns; c++) {
      if (!usedCols.has(c)) {
        // Check if we have enough space for the span
        let hasSpace = true;
        for (let i = 0; i < headerConfig.colSpan && c + i <= page.columns; i++) {
          if (usedCols.has(c + i)) {
            hasSpace = false;
            break;
          }
        }
        if (hasSpace) {
          colStart = c;
          break;
        }
      }
    }

    const newHeader = {
      id: `h_${Date.now()}`,
      name: headerConfig.name || 'New Section',
      colStart,
      colSpan: Math.min(headerConfig.colSpan || 2, page.columns - colStart + 1),
      rowStart,
      color: headerConfig.color || '#3b82f6',
      situationId: headerConfig.situationId || null
    };

    const newLayouts = { ...layouts };
    if (!newLayouts.SPREADSHEET) {
      newLayouts.SPREADSHEET = { pages: [{ pageNum: 1, columns: 8, rows: 40, headers: [] }] };
    }
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    const pages = [...(spreadsheet.pages || [])];
    pages[pageIdx] = {
      ...pages[pageIdx],
      headers: [...(pages[pageIdx]?.headers || []), newHeader]
    };
    spreadsheet.pages = pages;
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);

    setShowAddHeaderModal(false);
    setNewHeader({ name: '', colSpan: 2, color: '#3b82f6', situationId: null });
  }, [layouts, spreadsheetData, onUpdateLayouts]);

  // Handle updating a header
  const handleUpdateHeader = useCallback((pageIdx, headerId, updates) => {
    const newLayouts = { ...layouts };
    if (!newLayouts.SPREADSHEET?.pages?.[pageIdx]) return;
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    const pages = [...spreadsheet.pages];
    const page = { ...pages[pageIdx] };

    page.headers = (page.headers || []).map(h =>
      h.id === headerId ? { ...h, ...updates } : h
    );

    pages[pageIdx] = page;
    spreadsheet.pages = pages;
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);
  }, [layouts, onUpdateLayouts]);

  // Handle deleting a header
  const handleDeleteHeader = useCallback((pageIdx, headerId) => {
    const newLayouts = { ...layouts };
    if (!newLayouts.SPREADSHEET?.pages?.[pageIdx]) return;
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    const pages = [...spreadsheet.pages];
    const page = { ...pages[pageIdx] };

    page.headers = (page.headers || []).filter(h => h.id !== headerId);

    pages[pageIdx] = page;
    spreadsheet.pages = pages;
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);
  }, [layouts, onUpdateLayouts]);

  // Handle repositioning a header via drag
  const handleHeaderDrop = useCallback((pageIdx, headerId, newColStart, newRowStart) => {
    const page = spreadsheetData.pages[pageIdx];
    if (!page) return;

    const header = page.headers.find(h => h.id === headerId);
    if (!header) return;

    // Validate position
    const maxColStart = page.columns - header.colSpan + 1;
    const validColStart = Math.max(1, Math.min(newColStart, maxColStart));
    const validRowStart = Math.max(1, Math.min(newRowStart, page.rows - 1));

    // Check for overlap with other headers (excluding self)
    const existingHeaders = (page.headers || []).filter(h => h.id !== headerId);
    const newColEnd = validColStart + header.colSpan - 1;

    for (const other of existingHeaders) {
      const otherColEnd = other.colStart + other.colSpan - 1;
      const colsOverlap = validColStart <= otherColEnd && newColEnd >= other.colStart;
      const rowsOverlap = validRowStart === other.rowStart;

      if (colsOverlap && rowsOverlap) {
        // Can't drop here - overlap detected
        return;
      }
    }

    handleUpdateHeader(pageIdx, headerId, {
      colStart: validColStart,
      rowStart: validRowStart
    });
  }, [spreadsheetData, handleUpdateHeader]);

  // Check if a header placement would overlap with existing headers
  const checkHeaderOverlap = useCallback((page, newColStart, newColSpan, newRowStart, excludeHeaderId = null) => {
    const existingHeaders = (page.headers || []).filter(h => h.id !== excludeHeaderId);
    const newColEnd = newColStart + newColSpan - 1;

    for (const header of existingHeaders) {
      const headerColEnd = header.colStart + header.colSpan - 1;

      // Check if columns overlap
      const colsOverlap = newColStart <= headerColEnd && newColEnd >= header.colStart;

      // Check if rows overlap (headers on same row)
      const rowsOverlap = newRowStart === header.rowStart;

      if (colsOverlap && rowsOverlap) {
        return true; // Overlap detected
      }
    }
    return false;
  }, []);

  // Find next available position for a header
  const findNextAvailablePosition = useCallback((page, colSpan, startRow = 1, startCol = 1) => {
    const { columns, rows } = page;

    // Try starting from the requested position
    for (let row = startRow; row <= rows; row++) {
      const colStart = row === startRow ? startCol : 1;
      for (let col = colStart; col <= columns - colSpan + 1; col++) {
        if (!checkHeaderOverlap(page, col, colSpan, row)) {
          return { rowStart: row, colStart: col };
        }
      }
    }

    // No space found
    return null;
  }, [checkHeaderOverlap]);

  // Handle assigning a single header from a category
  const handleAssignSingleHeader = useCallback((item, categoryType, options = {}) => {
    const pageIdx = 0; // Always apply to first page for now
    const page = spreadsheetData.pages[pageIdx];
    if (!page) return;

    const { rowStart, colStart, colSpan } = assignHeaderConfig;
    const { isScript = false } = options;

    // Validate and clamp values
    const validColSpan = Math.min(Math.max(1, colSpan), page.columns);
    let validColStart = Math.max(1, Math.min(colStart, page.columns - validColSpan + 1));
    let validRowStart = Math.max(1, Math.min(rowStart, page.rows - 1));

    // Check for overlap and find next available position if needed
    if (checkHeaderOverlap(page, validColStart, validColSpan, validRowStart)) {
      const nextPos = findNextAvailablePosition(page, validColSpan, validRowStart, validColStart);
      if (!nextPos) {
        alert('No space available for this header. Try reducing the column span or adding a new page.');
        return;
      }
      validRowStart = nextPos.rowStart;
      validColStart = nextPos.colStart;
    }

    const newHeader = {
      id: `h_${categoryType}_${item.id}_${Date.now()}`,
      name: item.name,
      colStart: validColStart,
      colSpan: validColSpan,
      rowStart: validRowStart,
      color: item.color || '#3b82f6',
      situationId: item.id,
      categoryType,
      isScript
    };

    const newLayouts = { ...layouts };
    // Initialize SPREADSHEET if it doesn't exist
    if (!newLayouts.SPREADSHEET) {
      newLayouts.SPREADSHEET = { pages: [{ pageNum: 1, columns: 8, rows: 40, headers: [] }] };
    }
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    const pages = [...(spreadsheet.pages || [{ pageNum: 1, columns: 8, rows: 40, headers: [] }])];

    // Add to existing headers
    pages[pageIdx] = {
      ...pages[pageIdx],
      headers: [...(pages[pageIdx]?.headers || []), newHeader]
    };

    spreadsheet.pages = pages;
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);

    // Auto-advance to next available position
    const nextPos = findNextAvailablePosition(
      { ...page, headers: [...(page.headers || []), newHeader] },
      validColSpan,
      validRowStart,
      validColStart + validColSpan
    );

    if (nextPos) {
      setAssignHeaderConfig(prev => ({
        ...prev,
        colStart: nextPos.colStart,
        rowStart: nextPos.rowStart
      }));
    }
  }, [layouts, spreadsheetData, assignHeaderConfig, onUpdateLayouts, checkHeaderOverlap, findNextAvailablePosition]);

  // Handle dropping a new header from sidebar at a specific position
  const handleDropNewHeader = useCallback((pageIdx, rowStart, colStart, item, categoryType, options = {}) => {
    const page = spreadsheetData.pages[pageIdx];
    if (!page) return;

    const { isScript = false } = options;
    const colSpan = assignHeaderConfig.colSpan;

    // Validate position
    const validColSpan = Math.min(Math.max(1, colSpan), page.columns);
    const maxColStart = page.columns - validColSpan + 1;
    const validColStart = Math.max(1, Math.min(colStart, maxColStart));
    const validRowStart = Math.max(1, Math.min(rowStart, page.rows - 1));

    // Check for overlap
    if (checkHeaderOverlap(page, validColStart, validColSpan, validRowStart)) {
      return; // Can't drop here
    }

    const newHeader = {
      id: `h_${categoryType}_${item.id}_${Date.now()}`,
      name: item.name,
      colStart: validColStart,
      colSpan: validColSpan,
      rowStart: validRowStart,
      color: item.color || '#3b82f6',
      situationId: item.id,
      categoryType,
      isScript
    };

    const newLayouts = { ...layouts };
    // Initialize SPREADSHEET if it doesn't exist
    if (!newLayouts.SPREADSHEET) {
      newLayouts.SPREADSHEET = { pages: [{ pageNum: 1, columns: 8, rows: 40, headers: [] }] };
    }
    const spreadsheet = { ...newLayouts.SPREADSHEET };
    const pages = [...(spreadsheet.pages || [{ pageNum: 1, columns: 8, rows: 40, headers: [] }])];

    pages[pageIdx] = {
      ...pages[pageIdx],
      headers: [...(pages[pageIdx]?.headers || []), newHeader]
    };

    spreadsheet.pages = pages;
    newLayouts.SPREADSHEET = spreadsheet;
    onUpdateLayouts(newLayouts);
  }, [layouts, spreadsheetData, assignHeaderConfig.colSpan, onUpdateLayouts, checkHeaderOverlap]);

  // Predefined header templates
  const getHeaderTemplates = useCallback(() => {
    const templates = [];

    // Field Zones
    if (setupConfig?.fieldZones?.length > 0) {
      templates.push({
        id: 'fieldZones',
        name: 'Field Zones',
        description: 'Red Zone, Gold Zone, Backed Up, etc.',
        icon: MapPin,
        color: '#ef4444',
        items: setupConfig.fieldZones
      });
    }

    // Down & Distance
    if (setupConfig?.downDistanceCategories?.length > 0) {
      templates.push({
        id: 'downDistance',
        name: 'Down & Distance',
        description: '1st Down, 2nd & Long, 3rd & Short, etc.',
        icon: Target,
        color: '#f59e0b',
        items: setupConfig.downDistanceCategories
      });
    }

    // Play Types/Purposes
    if (setupConfig?.playPurposes?.length > 0) {
      templates.push({
        id: 'playPurpose',
        name: 'Play Purpose',
        description: 'Run Game, Quick Game, Dropback, etc.',
        icon: Package,
        color: '#3b82f6',
        items: setupConfig.playPurposes
      });
    }

    // Special Situations
    if (setupConfig?.specialSituations?.length > 0) {
      templates.push({
        id: 'specialSituation',
        name: 'Special Situations',
        description: '2-Min, 4-Min, Goal Line, etc.',
        icon: Zap,
        color: '#8b5cf6',
        items: setupConfig.specialSituations
      });
    }

    // Script template (custom)
    templates.push({
      id: 'script',
      name: 'Script Layout',
      description: 'Numbered plays in sequence',
      icon: List,
      color: '#06b6d4',
      isScript: true,
      items: [
        { id: 'script_1', name: '1ST SERIES', color: '#3b82f6' },
        { id: 'script_2', name: '2ND SERIES', color: '#22c55e' },
        { id: 'script_3', name: '3RD SERIES', color: '#f59e0b' },
        { id: 'script_4', name: '4TH SERIES', color: '#8b5cf6' }
      ]
    });

    return templates;
  }, [setupConfig]);

  // Render a single page
  const renderPage = (page, pageIdx) => {
    const { columns, rows, headers } = page;
    const bounds = calculateSectionBounds(page);

    // Calculate paper dimensions based on format
    // 2-page: Letter size (11" x 8.5" landscape, 8.5" x 11" portrait)
    // 4-page booklet: 17" x 11" (two portrait pages side-by-side, prints front/back)
    let paperAspectRatio, pageWidth;

    if (pageFormat === '4-page') {
      // 17x11 tabloid/ledger - two 8.5x11 portrait pages side by side
      paperAspectRatio = 17 / 11; // ~1.545
      pageWidth = 1400; // Wider to accommodate two portrait pages
    } else {
      // Standard letter size
      paperAspectRatio = isLandscape ? (11 / 8.5) : (8.5 / 11);
      pageWidth = isLandscape ? 1100 : 850;
    }
    const pageHeight = pageWidth / paperAspectRatio;

    // Track which cells are occupied by headers or their content areas
    const cellOccupancy = {};

    (headers || []).forEach(header => {
      const headerBounds = bounds[header.id];
      if (!headerBounds) return;

      // Mark header row cells
      for (let c = header.colStart; c <= header.colStart + header.colSpan - 1; c++) {
        cellOccupancy[`${header.rowStart}-${c}`] = { type: 'header', header, isFirst: c === header.colStart };
      }

      // Mark content area cells
      for (let r = headerBounds.rowStart; r <= headerBounds.rowEnd; r++) {
        for (let c = headerBounds.colStart; c <= headerBounds.colEnd; c++) {
          if (!cellOccupancy[`${r}-${c}`]) {
            cellOccupancy[`${r}-${c}`] = { type: 'content', header, bounds: headerBounds };
          }
        }
      }
    });

    // Get plays for each header and distribute to rows
    const headerPlays = {};
    const headerOverflow = {};
    (headers || []).forEach(header => {
      const sectionPlays = getPlaysForHeader(header.id);
      headerPlays[header.id] = sectionPlays;

      // Calculate overflow - check if plays exceed section bounds
      const headerBounds = bounds[header.id];
      if (headerBounds) {
        const contentRows = headerBounds.contentRows;
        const playCount = sectionPlays.filter(p => p).length;
        const lastPlayIdx = sectionPlays.findLastIndex(p => p);
        if (lastPlayIdx >= contentRows) {
          headerOverflow[header.id] = {
            visible: contentRows,
            total: lastPlayIdx + 1,
            hidden: lastPlayIdx + 1 - contentRows
          };
        }
      }
    });

    // Calculate cell dimensions based on page size
    const pageHeaderHeight = 50; // Page header height (title bar)
    const footerHeight = 0;
    const gridPadding = 8;
    const columnHeaderRowHeight = 20; // Height of column number header row
    const rowNumberColumnWidth = 24; // Width of row number column
    const availableHeight = pageHeight - pageHeaderHeight - footerHeight - gridPadding * 2 - columnHeaderRowHeight;
    const availableWidth = pageWidth - gridPadding * 2 - rowNumberColumnWidth;
    const cellHeight = Math.floor(availableHeight / rows);
    const cellWidth = Math.floor(availableWidth / columns);

    return (
      <div
        key={pageIdx}
        className="page-container spreadsheet-page"
        style={{
          background: 'white',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: `${pageWidth}px`,
          aspectRatio: `${paperAspectRatio}`
        }}
      >
        {/* Page Header */}
        <div
          className="print-compact-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '2px solid #1e293b',
            background: '#f8fafc',
            height: `${pageHeaderHeight}px`,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {teamLogo && (
              <img src={teamLogo} alt="Team" style={{ height: '32px', width: 'auto' }} />
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#0f172a' }}>
                {weekTitle} {opponentTitle}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Page {page.pageNum} • {columns} cols × {rows} rows {pageFormat === '4-page' && <span style={{ color: '#94a3b8' }}>• 17×11 booklet</span>}
              </div>
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setEditingPageIdx(pageIdx);
                  setPageSettingsInput({
                    columns: String(page.columns || 8),
                    rows: String(page.rows || 40)
                  });
                  setShowPageSettingsModal(true);
                }}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                title="Page settings"
              >
                <Settings size={16} />
              </button>
              {spreadsheetData.pages.length > 1 && (
                <button
                  onClick={() => handleDeletePage(pageIdx)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete page"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Grid Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${rowNumberColumnWidth}px repeat(${columns}, 1fr)`,
            gridTemplateRows: `${columnHeaderRowHeight}px repeat(${rows}, ${cellHeight}px)`,
            gap: 0,
            padding: `${gridPadding}px`,
            background: '#ffffff',
            flex: 1,
            border: '1px solid #94a3b8'
          }}
        >
          {/* Corner cell */}
          <div style={{
            gridColumn: 1,
            gridRow: 1,
            background: '#f1f5f9',
            borderBottom: '1px solid #94a3b8',
            borderRight: '1px solid #94a3b8'
          }} />

          {/* Column headers */}
          {Array.from({ length: columns }, (_, colIdx) => (
            <div
              key={`col-header-${colIdx}`}
              style={{
                gridColumn: colIdx + 2,
                gridRow: 1,
                background: '#f1f5f9',
                borderBottom: '1px solid #94a3b8',
                borderRight: colIdx < columns - 1 ? '1px solid #e2e8f0' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                color: '#64748b'
              }}
            >
              {colIdx + 1}
            </div>
          ))}

          {/* Render all rows and columns */}
          {Array.from({ length: rows }, (_, rowIdx) => {
            const rowNum = rowIdx + 1;

            return (
              <React.Fragment key={`row-${rowNum}`}>
                {/* Row number */}
                <div
                  style={{
                    gridColumn: 1,
                    gridRow: rowNum + 1,
                    background: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0',
                    borderRight: '1px solid #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    color: '#64748b'
                  }}
                >
                  {rowNum}
                </div>

                {Array.from({ length: columns }, (_, colIdx) => {
                  const colNum = colIdx + 1;
                  const cellKey = `${rowNum}-${colNum}`;
                  const occupancy = cellOccupancy[cellKey];

              // Header cell
              if (occupancy?.type === 'header' && occupancy.isFirst) {
                const header = occupancy.header;
                const overflow = headerOverflow[header.id];
                const playCount = (headerPlays[header.id] || []).filter(p => p).length;

                return (
                  <div
                    key={cellKey}
                    className="spreadsheet-header-cell"
                    style={{
                      gridColumn: `${header.colStart + 1} / span ${header.colSpan}`,
                      gridRow: rowNum + 1,
                      background: header.color || '#3b82f6',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: isEditing ? 'move' : 'pointer',
                      userSelect: 'none',
                      border: `3px solid ${header.color || '#3b82f6'}`,
                      borderBottom: 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    draggable={isEditing}
                    onDragStart={(e) => {
                      if (!isEditing) return;
                      setDraggedHeader({ pageIdx, header });
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedHeader(null)}
                    onClick={() => {
                      if (!isEditing && onHeaderClick) {
                        onHeaderClick({ pageIdx, header });
                      }
                    }}
                  >
                    <span style={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {header.name}
                      {playCount > 0 && (
                        <span style={{
                          fontSize: '0.55rem',
                          background: 'rgba(255,255,255,0.25)',
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}>
                          {playCount}
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {overflow && (
                        <span
                          style={{
                            fontSize: '0.5rem',
                            background: '#ef4444',
                            padding: '1px 4px',
                            borderRadius: '3px'
                          }}
                          title={`${overflow.hidden} plays overflow - expand section or remove plays`}
                        >
                          +{overflow.hidden} overflow
                        </span>
                      )}
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHeader(pageIdx, header.id);
                          }}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Skip cells that are part of a multi-column header
              if (occupancy?.type === 'header' && !occupancy.isFirst) {
                return null;
              }

              // Content cell (within a section)
              if (occupancy?.type === 'content') {
                const header = occupancy.header;
                const headerBounds = occupancy.bounds;
                const contentRowIdx = rowNum - headerBounds.rowStart;
                const sectionPlays = headerPlays[header.id] || [];
                const play = sectionPlays[contentRowIdx];

                // Check if this is the first column of a multi-column section
                const isFirstCol = colNum === headerBounds.colStart;
                const sectionColSpan = headerBounds.colEnd - headerBounds.colStart + 1;

                // For multi-column sections, only render on first column
                if (!isFirstCol) return null;

                // Calculate the display number (sequential count of plays up to this row)
                let displayNum = 0;
                for (let i = 0; i <= contentRowIdx; i++) {
                  if (sectionPlays[i]) displayNum++;
                }

                const isTargeting = isTargetingMode;
                const isDragOverPlay = dragOverCell?.pageIdx === pageIdx &&
                                  dragOverCell?.headerId === header.id &&
                                  dragOverCell?.rowIdx === contentRowIdx;
                const isDragOverNewHeader = dragOverCell?.pageIdx === pageIdx &&
                                  dragOverCell?.row === rowNum &&
                                  dragOverCell?.isNewHeader;

                // Create a light tint of the header color for the section background
                const headerColor = header.color || '#3b82f6';
                const sectionBgBase = contentRowIdx % 2 === 0 ? `${headerColor}08` : `${headerColor}12`;
                // Different visual for play drops vs new header drops
                let sectionBg = sectionBgBase;
                if (isDragOverNewHeader) {
                  sectionBg = '#bbf7d0'; // Green for new header drop
                } else if (isDragOverPlay) {
                  sectionBg = '#dbeafe'; // Blue for play drop
                } else if (play?.priority) {
                  sectionBg = '#fef08a';
                }

                // Section boundary indicators
                const isLastContentRow = rowNum === headerBounds.rowEnd;
                const isLastColumn = headerBounds.colEnd >= columns;

                return (
                  <div
                    key={cellKey}
                    className="spreadsheet-content-cell"
                    style={{
                      gridColumn: sectionColSpan > 1 ? `${headerBounds.colStart + 1} / span ${sectionColSpan}` : colNum + 1,
                      gridRow: rowNum + 1,
                      background: sectionBg,
                      borderTop: contentRowIdx === 0 ? 'none' : undefined,
                      borderBottom: isLastContentRow ? `3px solid ${headerColor}` : '1px solid #e2e8f0',
                      borderRight: isLastColumn ? `3px solid ${headerColor}` : `3px solid ${headerColor}`,
                      borderLeft: `3px solid ${headerColor}`,
                      padding: '1px 4px',
                      fontSize: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background 0.1s, border-top 0.1s',
                      cursor: isTargeting ? 'crosshair' : (draggedNewHeader ? 'copy' : 'default'),
                      // Show thick top border when new header would be placed here
                      borderTop: isDragOverNewHeader ? '3px solid #22c55e' : (contentRowIdx === 0 ? 'none' : undefined)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = draggedNewHeader ? 'copy' : 'move';
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      // Track drag over for both play drops and new header drops
                      if (draggedNewHeader) {
                        setDragOverCell({ pageIdx, row: rowNum, col: colNum, isNewHeader: true });
                      } else {
                        setDragOverCell({ pageIdx, headerId: header.id, rowIdx: contentRowIdx });
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverCell(null);
                      }
                    }}
                    onClick={() => {
                      // Click to place header when in placement mode (splits section)
                      if (draggedNewHeader) {
                        handleDropNewHeader(
                          pageIdx,
                          rowNum,
                          headerBounds.colStart, // Align with section's column start
                          draggedNewHeader.item,
                          draggedNewHeader.categoryType,
                          { isScript: draggedNewHeader.isScript }
                        );
                        setDraggedNewHeader(null);
                      }
                    }}
                    onMouseEnter={() => {
                      if (draggedNewHeader) {
                        setDragOverCell({ pageIdx, row: rowNum, col: colNum, isNewHeader: true });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedNewHeader && !e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverCell(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverCell(null);

                      // Check if dropping a new header from sidebar
                      if (draggedNewHeader) {
                        // Drop a new header at this row position (creates new section, splits existing)
                        handleDropNewHeader(
                          pageIdx,
                          rowNum,
                          headerBounds.colStart, // Align with section's column start
                          draggedNewHeader.item,
                          draggedNewHeader.categoryType,
                          { isScript: draggedNewHeader.isScript }
                        );
                        setDraggedNewHeader(null);
                        return;
                      }

                      // Handle play drops
                      const playData = e.dataTransfer.getData('application/react-dnd');
                      if (playData && onAddPlayToSection) {
                        try {
                          const { playId } = JSON.parse(playData);
                          if (playId) {
                            onAddPlayToSection(header.id, contentRowIdx, playId);
                          }
                        } catch (err) {
                          console.error('Error parsing drop data:', err);
                        }
                      }
                    }}
                  >
                    {play && (
                      <>
                        <span className="spreadsheet-play-number" style={{ color: '#94a3b8', fontWeight: 'bold', minWidth: '14px' }}>
                          {displayNum}.
                        </span>
                        <FitText
                          text={getPlayDisplayName(play)}
                          abbreviations={abbreviations}
                          baseFontSize={0.6}
                          minFontSize={0.35}
                        />
                      </>
                    )}
                  </div>
                );
              }

              // Empty cell (not in any section) - drop target for header repositioning or new headers
              const isDraggingExisting = !!draggedHeader;
              const isDraggingNew = !!draggedNewHeader;
              const isDragging = isDraggingExisting || isDraggingNew;

              let isHovering = isDragging && dragOverCell?.pageIdx === pageIdx &&
                              dragOverCell?.row === rowNum && dragOverCell?.col === colNum;

              // Check if this would be a valid drop location
              let isValidDrop = false;
              if (isHovering) {
                const colSpan = isDraggingExisting
                  ? draggedHeader.header.colSpan
                  : assignHeaderConfig.colSpan;
                const maxColStart = columns - colSpan + 1;
                const validColStart = Math.max(1, Math.min(colNum, maxColStart));

                // Check if this position would overlap
                const excludeId = isDraggingExisting ? draggedHeader.header.id : null;
                const existingHeaders = (headers || []).filter(h => h.id !== excludeId);
                const newColEnd = validColStart + colSpan - 1;
                let hasOverlap = false;

                for (const other of existingHeaders) {
                  const otherColEnd = other.colStart + other.colSpan - 1;
                  const colsOverlap = validColStart <= otherColEnd && newColEnd >= other.colStart;
                  const rowsOverlap = rowNum === other.rowStart;
                  if (colsOverlap && rowsOverlap) {
                    hasOverlap = true;
                    break;
                  }
                }
                isValidDrop = !hasOverlap;
              }

              // Check if in placement mode (header selected, waiting for click to place)
              const isPlacementMode = !!draggedNewHeader;

              // Calculate background color
              let cellBg = '#ffffff';
              if (isHovering) {
                cellBg = isValidDrop ? '#bbf7d0' : '#fecaca';
              } else if (isPlacementMode) {
                // Subtle highlight to show clickable cells in placement mode
                cellBg = '#f0fdf4';
              }

              return (
                <div
                  key={cellKey}
                  className="spreadsheet-empty-cell"
                  style={{
                    gridColumn: colNum + 1,
                    gridRow: rowNum + 1,
                    background: cellBg,
                    borderBottom: '1px solid #e2e8f0',
                    borderRight: colNum < columns ? '1px solid #e2e8f0' : 'none',
                    transition: 'background 0.1s',
                    cursor: isDragging ? (isValidDrop ? 'copy' : 'not-allowed') : (isPlacementMode ? 'crosshair' : 'default')
                  }}
                  onClick={() => {
                    // Click to place header when in placement mode
                    if (draggedNewHeader) {
                      handleDropNewHeader(
                        pageIdx,
                        rowNum,
                        colNum,
                        draggedNewHeader.item,
                        draggedNewHeader.categoryType,
                        { isScript: draggedNewHeader.isScript }
                      );
                      setDraggedNewHeader(null);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isPlacementMode) {
                      setDragOverCell({ pageIdx, row: rowNum, col: colNum });
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isPlacementMode && !e.currentTarget.contains(e.relatedTarget)) {
                      setDragOverCell(null);
                    }
                  }}
                  onDragOver={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                    }
                  }}
                  onDragEnter={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      setDragOverCell({ pageIdx, row: rowNum, col: colNum });
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setDragOverCell(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedHeader) {
                      // Dropping an existing header to reposition
                      handleHeaderDrop(pageIdx, draggedHeader.header.id, colNum, rowNum);
                      setDraggedHeader(null);
                    } else if (draggedNewHeader) {
                      // Dropping a new header from sidebar
                      handleDropNewHeader(
                        pageIdx,
                        rowNum,
                        colNum,
                        draggedNewHeader.item,
                        draggedNewHeader.categoryType,
                        { isScript: draggedNewHeader.isScript }
                      );
                      setDraggedNewHeader(null);
                    }
                    setDragOverCell(null);
                  }}
                />
              );
                })}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    );
  };

  // Calculate print page dimensions based on format and orientation
  // 4-page booklet uses 17x11 (tabloid/ledger), 2-page uses letter
  const printPageSize = pageFormat === '4-page'
    ? '17in 11in'  // Tabloid/Ledger landscape (two portrait pages side-by-side)
    : (isLandscape ? 'landscape' : 'portrait');

  return (
    <div className="h-full flex flex-col spreadsheet-view" style={{ background: '#1e293b' }}>
      {/* Dynamic print styles for page orientation */}
      <style>
        {`
          @media print {
            @page {
              size: ${printPageSize};
              margin: 0.25in;
            }

            .spreadsheet-view {
              background: white !important;
            }

            .spreadsheet-page {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 0 !important;
            }

            .spreadsheet-page + .spreadsheet-page {
              page-break-before: always;
              break-before: page;
            }

            .no-print,
            .spreadsheet-empty-cell {
              display: none !important;
            }

            .spreadsheet-header-cell {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .spreadsheet-content-cell {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      {/* Placement Mode Banner */}
      {draggedNewHeader && (
        <div
          className="no-print"
          style={{
            background: draggedNewHeader.item.color || '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <span>📍 Click on the grid to place "{draggedNewHeader.item.name}" ({assignHeaderConfig.colSpan} columns)</span>
          <button
            onClick={() => setDraggedNewHeader(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 no-print"
        style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Spreadsheet Mode • {spreadsheetData.pages.length} page(s)
          </span>

          {/* Assign Headers Button */}
          <button
            onClick={() => setShowAssignHeadersModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            <LayoutTemplate size={16} />
            Assign Headers
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
          >
            -
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.75rem', minWidth: '40px', textAlign: 'center' }}>
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Content Area - Sidebar + Spreadsheet */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Header Panel */}
        {showAssignHeadersModal && (
          <div
            className="w-80 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-white">Add Header</h3>
              <button
                onClick={() => setShowAssignHeadersModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <Plus size={16} className="rotate-45" />
              </button>
            </div>

            {/* Position Controls */}
            <div className="px-4 py-3 border-b border-slate-700 flex-shrink-0 bg-slate-900/50">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <label className="text-slate-500">R:</label>
                  <input
                    type="number"
                    min="1"
                    max={spreadsheetData.pages[0]?.rows || 40}
                    value={assignHeaderConfig.rowStart}
                    onChange={(e) => setAssignHeaderConfig({
                      ...assignHeaderConfig,
                      rowStart: parseInt(e.target.value) || 1
                    })}
                    className="w-12 px-1.5 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-slate-500">C:</label>
                  <input
                    type="number"
                    min="1"
                    max={spreadsheetData.pages[0]?.columns || 8}
                    value={assignHeaderConfig.colStart}
                    onChange={(e) => setAssignHeaderConfig({
                      ...assignHeaderConfig,
                      colStart: parseInt(e.target.value) || 1
                    })}
                    className="w-12 px-1.5 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-slate-500">Span:</label>
                  <input
                    type="number"
                    min="1"
                    max={spreadsheetData.pages[0]?.columns || 8}
                    value={assignHeaderConfig.colSpan}
                    onChange={(e) => setAssignHeaderConfig({
                      ...assignHeaderConfig,
                      colSpan: parseInt(e.target.value) || 1
                    })}
                    className="w-12 px-1.5 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Header Options - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {getHeaderTemplates().map(template => {
                const IconComponent = template.icon;
                return (
                  <div key={template.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <IconComponent size={12} style={{ color: template.color }} />
                      <span>{template.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {template.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            // Show config modal to set columns and rows before placing
                            setPendingHeaderConfig({
                              item,
                              categoryType: template.id,
                              isScript: template.isScript,
                              colSpan: 2,
                              rowCount: 10
                            });
                          }}
                          className="px-2 py-1 rounded text-xs font-medium transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                          style={{
                            backgroundColor: item.color || template.color,
                            color: 'white'
                          }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {getHeaderTemplates().length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  <LayoutTemplate size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No categories defined.</p>
                  <p className="text-xs mt-1">Set up in Offense Setup.</p>
                </div>
              )}
            </div>

            {/* Custom Header Link */}
            <div className="px-4 py-3 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAssignHeadersModal(false);
                  setAddHeaderPageIdx(0);
                  setShowAddHeaderModal(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add custom header
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Spreadsheet Content */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: '#334155' }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px',
              minHeight: '100%'
            }}
          >
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
            >
              {/* Render all pages */}
              {spreadsheetData.pages.map((page, idx) => renderPage(page, idx))}

              {/* Add Page Button (editing mode) */}
              {isEditing && (
                <button
                  onClick={handleAddPage}
                  style={{ width: isLandscape ? '1100px' : '850px' }}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-white border-2 border-dashed border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Add Page
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Header Modal */}
      {showAddHeaderModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowAddHeaderModal(false)}
        >
          <div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Add Section Header</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Section Name</label>
                <input
                  type="text"
                  value={newHeader.name}
                  onChange={(e) => setNewHeader({ ...newHeader, name: e.target.value })}
                  placeholder="e.g., RUN GAME"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Column Span */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Column Span</label>
                <select
                  value={newHeader.colSpan}
                  onChange={(e) => setNewHeader({ ...newHeader, colSpan: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} column{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Color</label>
                <input
                  type="color"
                  value={newHeader.color}
                  onChange={(e) => setNewHeader({ ...newHeader, color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Quick Situation Selection */}
              {setupConfig?.fieldZones?.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Or select a predefined situation:</label>
                  <div className="flex flex-wrap gap-2">
                    {(setupConfig?.fieldZones || []).slice(0, 6).map(zone => (
                      <button
                        key={zone.id}
                        onClick={() => setNewHeader({
                          name: zone.name,
                          colSpan: newHeader.colSpan,
                          color: zone.color || '#ef4444',
                          situationId: zone.id
                        })}
                        className="px-3 py-1 text-sm rounded-full border transition-colors"
                        style={{
                          borderColor: zone.color || '#ef4444',
                          color: zone.color || '#ef4444',
                          background: newHeader.situationId === zone.id ? `${zone.color}20` : 'transparent'
                        }}
                      >
                        {zone.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddHeaderModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddHeader(addHeaderPageIdx, newHeader)}
                disabled={!newHeader.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Header
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Settings Modal */}
      {showPageSettingsModal && editingPageIdx !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowPageSettingsModal(false)}
        >
          <div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Page {spreadsheetData.pages[editingPageIdx]?.pageNum} Settings</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Columns */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Columns (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={pageSettingsInput.columns}
                  onChange={(e) => setPageSettingsInput({ ...pageSettingsInput, columns: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Rows */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Rows (10-100)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={pageSettingsInput.rows}
                  onChange={(e) => setPageSettingsInput({ ...pageSettingsInput, rows: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  // Parse and validate inputs, use current values as fallback
                  const currentPage = spreadsheetData.pages[editingPageIdx];
                  let cols = parseInt(pageSettingsInput.columns);
                  let rows = parseInt(pageSettingsInput.rows);

                  // Clamp to valid ranges
                  if (!cols || cols < 1) cols = currentPage?.columns || 8;
                  if (cols > 12) cols = 12;
                  if (!rows || rows < 10) rows = currentPage?.rows || 40;
                  if (rows > 100) rows = 100;

                  handleUpdatePage(editingPageIdx, { columns: cols, rows: rows });
                  setShowPageSettingsModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Configuration Modal - shown when clicking a header button */}
      {pendingHeaderConfig && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setPendingHeaderConfig(null)}
        >
          <div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Configure Header</h3>
              <p className="text-sm text-slate-400 mt-1">{pendingHeaderConfig.item.name}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Column Span */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Column Span
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPendingHeaderConfig(prev => ({
                      ...prev,
                      colSpan: Math.max(1, prev.colSpan - 1)
                    }))}
                    disabled={pendingHeaderConfig.colSpan <= 1}
                    className="w-10 h-10 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-white w-12 text-center">
                    {pendingHeaderConfig.colSpan}
                  </span>
                  <button
                    onClick={() => setPendingHeaderConfig(prev => ({
                      ...prev,
                      colSpan: Math.min(8, prev.colSpan + 1)
                    }))}
                    disabled={pendingHeaderConfig.colSpan >= 8}
                    className="w-10 h-10 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="text-sm text-slate-400 ml-2">columns wide</span>
                </div>
              </div>

              {/* Row Count */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rows Needed
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPendingHeaderConfig(prev => ({
                      ...prev,
                      rowCount: Math.max(1, prev.rowCount - 5)
                    }))}
                    disabled={pendingHeaderConfig.rowCount <= 1}
                    className="w-10 h-10 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −5
                  </button>
                  <button
                    onClick={() => setPendingHeaderConfig(prev => ({
                      ...prev,
                      rowCount: Math.max(1, prev.rowCount - 1)
                    }))}
                    disabled={pendingHeaderConfig.rowCount <= 1}
                    className="w-8 h-10 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-white w-12 text-center">
                    {pendingHeaderConfig.rowCount}
                  </span>
                  <button
                    onClick={() => setPendingHeaderConfig(prev => ({
                      ...prev,
                      rowCount: Math.min(50, prev.rowCount + 1)
                    }))}
                    disabled={pendingHeaderConfig.rowCount >= 50}
                    className="w-8 h-10 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setPendingHeaderConfig(prev => ({
                      ...prev,
                      rowCount: Math.min(50, prev.rowCount + 5)
                    }))}
                    disabled={pendingHeaderConfig.rowCount >= 50}
                    className="w-10 h-10 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +5
                  </button>
                  <span className="text-sm text-slate-400 ml-2">rows</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setPendingHeaderConfig(null)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Set up for placement - user will click on grid to place
                  setAssignHeaderConfig(prev => ({
                    ...prev,
                    colSpan: pendingHeaderConfig.colSpan
                  }));
                  setDraggedNewHeader({
                    item: pendingHeaderConfig.item,
                    categoryType: pendingHeaderConfig.categoryType,
                    isScript: pendingHeaderConfig.isScript,
                    rowCount: pendingHeaderConfig.rowCount
                  });
                  setPendingHeaderConfig(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium"
                style={{ backgroundColor: pendingHeaderConfig.item.color }}
              >
                Place on Grid
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
