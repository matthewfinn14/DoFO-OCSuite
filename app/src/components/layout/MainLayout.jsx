import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PlayBankSidebar from './PlayBankSidebar';
import { useSchool } from '../../context/SchoolContext';
import { PlayDetailsModalProvider } from '../PlayDetailsModal';

export default function MainLayout() {
  const {
    loading,
    error,
    playsArray,
    updatePlay,
    setupConfig,
    updateSetupConfig,
    settings,
    currentWeek,
    updateWeek
  } = useSchool();
  const [playBankOpen, setPlayBankOpen] = useState(false);
  const navigate = useNavigate();

  // Navigate to Playbook to edit a play
  const handleEditPlay = (playId) => {
    navigate('/playbook', { state: { editPlayId: playId } });
  };

  // Get play buckets, concept families, and formations from setup
  const playBuckets = setupConfig?.playBuckets || settings?.playBuckets || [];
  const conceptGroups = setupConfig?.conceptGroups || settings?.conceptGroups || [];
  const formations = setupConfig?.formations || settings?.formations || [];

  return (
    <PlayDetailsModalProvider
      plays={playsArray}
      updatePlay={updatePlay}
      playBuckets={playBuckets}
      conceptGroups={conceptGroups}
      formations={formations}
      currentWeek={currentWeek}
      updateWeek={updateWeek}
      setupConfig={setupConfig}
      updateSetupConfig={updateSetupConfig}
      onEditPlay={handleEditPlay}
    >
      <div className="flex h-screen bg-slate-950 text-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main
          className="flex-1 overflow-auto transition-all duration-300"
          style={{ marginRight: playBankOpen ? '360px' : '40px' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400">Loading school data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="text-red-500 text-5xl mb-4">!</div>
                <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
                <p className="text-slate-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Play Bank Sidebar (Right) */}
        <PlayBankSidebar
          isOpen={playBankOpen}
          onToggle={setPlayBankOpen}
        />
      </div>
    </PlayDetailsModalProvider>
  );
}
