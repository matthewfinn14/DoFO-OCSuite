import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const PlayBankContext = createContext(null);

export function PlayBankProvider({ children }) {
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [batchSelectCallback, setBatchSelectCallback] = useState(null);
  const [batchSelectLabel, setBatchSelectLabel] = useState('Add Selected');

  // Single select mode for wristband assignment
  const [singleSelectMode, setSingleSelectMode] = useState(false);
  const [selectedPlayId, setSelectedPlayId] = useState(null);

  // Focus highlights for Script mode - plays matching these focuses are highlighted
  const [highlightFocuses, setHighlightFocuses] = useState([]);

  // Quick Add Event (Event-based communication)
  const [quickAddRequest, setQuickAddRequest] = useState(null);

  // Batch Add Destination Event
  const [batchAddEvent, setBatchAddEvent] = useState(null);

  // Targeting mode - allows clicking on wristband slots, practice segments, or game plan boxes
  const [targetingMode, setTargetingMode] = useState(false);
  const [targetingPlays, setTargetingPlays] = useState([]);

  // Headers mode - for spreadsheet layout header assignment
  const [headersMode, setHeadersMode] = useState(false);
  const [headerTemplates, setHeaderTemplates] = useState([]);
  const [pendingHeaderConfig, setPendingHeaderConfig] = useState(null);
  const [assignHeaderConfig, setAssignHeaderConfig] = useState({ rowStart: 1, colStart: 1, colSpan: 2 });
  const [draggedNewHeader, setDraggedNewHeader] = useState(null);
  const [playBankOpen, setPlayBankOpen] = useState(false);

  // Listen for batch add events from PlayBankSidebar
  useEffect(() => {
    const handleBatchAdd = (e) => {
      const detail = e.detail || {};
      setBatchAddEvent({
        playIds: detail.playIds,
        destination: detail.destination,
        setId: detail.setId,
        header: detail.header,
        timestamp: Date.now()
      });
    };
    window.addEventListener('playbank-batch-add', handleBatchAdd);
    return () => window.removeEventListener('playbank-batch-add', handleBatchAdd);
  }, []);

  // Clear batch add event after it's been processed
  const clearBatchAddEvent = useCallback(() => {
    setBatchAddEvent(null);
  }, []);

  const triggerQuickAdd = useCallback((playId) => {
    setQuickAddRequest({
      playId,
      timestamp: Date.now()
    });
  }, []);

  // Start batch selection mode
  const startBatchSelect = useCallback((callback, label = 'Add Selected') => {
    setBatchSelectCallback(() => callback);
    setBatchSelectLabel(label);
    setBatchSelectMode(true);
  }, []);

  // Handle batch select completion
  const handleBatchSelect = useCallback((playIds) => {
    if (batchSelectCallback) {
      batchSelectCallback(playIds);
    }
    setBatchSelectMode(false);
    setBatchSelectCallback(null);
    setBatchSelectLabel('Add Selected');
  }, [batchSelectCallback]);

  // Cancel batch select
  const cancelBatchSelect = useCallback(() => {
    setBatchSelectMode(false);
    setBatchSelectCallback(null);
    setBatchSelectLabel('Add Selected');
  }, []);

  // Start single select mode (for wristband assignment)
  const startSingleSelect = useCallback(() => {
    setSingleSelectMode(true);
    setSelectedPlayId(null);
  }, []);

  // Select a play for assignment
  const selectPlayForAssign = useCallback((playId) => {
    setSelectedPlayId(prev => prev === playId ? null : playId); // Toggle if same play clicked
  }, []);

  // Clear selected play
  const clearSelectedPlay = useCallback(() => {
    setSelectedPlayId(null);
  }, []);

  // Stop single select mode
  const stopSingleSelect = useCallback(() => {
    setSingleSelectMode(false);
    setSelectedPlayId(null);
  }, []);

  // Start targeting mode with plays to add
  const startTargetingMode = useCallback((playIds) => {
    setTargetingPlays(playIds);
    setTargetingMode(true);
  }, []);

  // Cancel targeting mode
  const cancelTargetingMode = useCallback(() => {
    setTargetingMode(false);
    setTargetingPlays([]);
  }, []);

  // Complete targeting mode (called when destination is clicked)
  const completeTargeting = useCallback(() => {
    const plays = targetingPlays;
    setTargetingMode(false);
    setTargetingPlays([]);
    return plays;
  }, [targetingPlays]);

  // Enable headers mode with templates
  const enableHeadersMode = useCallback((templates) => {
    setHeaderTemplates(templates);
    setHeadersMode(true);
    setPlayBankOpen(true);
  }, []);

  // Disable headers mode
  const disableHeadersMode = useCallback(() => {
    setHeadersMode(false);
    setPendingHeaderConfig(null);
    setDraggedNewHeader(null);
  }, []);

  return (
    <PlayBankContext.Provider
      value={{
        batchSelectMode,
        batchSelectLabel,
        startBatchSelect,
        handleBatchSelect,
        cancelBatchSelect,
        // One-click Add Event
        quickAddRequest,
        triggerQuickAdd,

        singleSelectMode,
        selectedPlayId,
        startSingleSelect,
        selectPlayForAssign,
        clearSelectedPlay,
        stopSingleSelect,

        // Focus highlights for Script mode
        highlightFocuses,
        setHighlightFocuses,

        // Batch add destination event
        batchAddEvent,
        clearBatchAddEvent,

        // Targeting mode - click to place plays
        targetingMode,
        targetingPlays,
        startTargetingMode,
        cancelTargetingMode,
        completeTargeting,

        // Headers mode - for spreadsheet layout
        headersMode,
        headerTemplates,
        enableHeadersMode,
        disableHeadersMode,
        pendingHeaderConfig,
        setPendingHeaderConfig,
        assignHeaderConfig,
        setAssignHeaderConfig,
        draggedNewHeader,
        setDraggedNewHeader,
        playBankOpen,
        setPlayBankOpen
      }}
    >
      {children}
    </PlayBankContext.Provider>
  );
}

export function usePlayBank() {
  const context = useContext(PlayBankContext);
  if (!context) {
    throw new Error('usePlayBank must be used within a PlayBankProvider');
  }
  return context;
}
