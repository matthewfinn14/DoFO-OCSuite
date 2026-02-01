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
        clearBatchAddEvent
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
