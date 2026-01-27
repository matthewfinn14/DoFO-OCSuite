import { createContext, useContext, useState, useCallback } from 'react';

const PlayBankContext = createContext(null);

export function PlayBankProvider({ children }) {
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [batchSelectCallback, setBatchSelectCallback] = useState(null);
  const [batchSelectLabel, setBatchSelectLabel] = useState('Add Selected');

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

  return (
    <PlayBankContext.Provider
      value={{
        batchSelectMode,
        batchSelectLabel,
        startBatchSelect,
        handleBatchSelect,
        cancelBatchSelect
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
