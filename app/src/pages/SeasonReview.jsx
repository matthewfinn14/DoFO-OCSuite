import { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Upload, Trash2, Calendar, ChevronDown,
  BarChart3, Home, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useSeasonAnalytics } from '../hooks/useSeasonAnalytics';
import { SeasonImportWizard, SeasonReviewPanel } from '../components/season';

/**
 * Season Review Page
 * Main page for season-wide offensive analytics with Hudl import
 */
export default function SeasonReview() {
  const { activeYear, availableSeasons, removeImportedGame } = useSchool();

  // Year selection
  const [selectedYear, setSelectedYear] = useState(activeYear);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Import wizard
  const [showImportWizard, setShowImportWizard] = useState(false);

  // Get analytics for selected year
  const analytics = useSeasonAnalytics(selectedYear);

  // Handle import completion
  const handleImportComplete = (result) => {
    setShowImportWizard(false);
    // Analytics will auto-refresh via useSeasonAnalytics
  };

  // Handle game deletion
  const handleDeleteGame = async (gameId) => {
    if (confirm('Remove this game from analysis?')) {
      await removeImportedGame(selectedYear, gameId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-sky-400" />
            <h1 className="text-xl font-semibold text-white">Season Review</h1>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
            >
              <Calendar size={16} className="text-slate-400" />
              {selectedYear}
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showYearDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowYearDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 py-1">
                  {availableSeasons.map(season => (
                    <button
                      key={season.year}
                      onClick={() => {
                        setSelectedYear(season.year);
                        setShowYearDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                        season.year === selectedYear ? 'text-sky-400' : 'text-white'
                      }`}
                    >
                      {season.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowImportWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
        >
          <Upload size={16} />
          Import Games
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Games Sidebar */}
        <aside className="w-80 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-medium text-slate-300">Imported Games</h2>
            <p className="text-xs text-slate-500 mt-1">
              {analytics.games.length} game{analytics.games.length !== 1 ? 's' : ''} imported
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {analytics.games.length === 0 ? (
              <EmptyGamesState onImport={() => setShowImportWizard(true)} />
            ) : (
              <div className="space-y-2">
                {analytics.games.map(game => (
                  <GameCard
                    key={game.gameId}
                    game={game}
                    onDelete={() => handleDeleteGame(game.gameId)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Analytics Panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <SeasonReviewPanel report={analytics.report} insights={analytics.insights} />
        </main>
      </div>

      {/* Import Wizard Modal */}
      {showImportWizard && (
        <SeasonImportWizard
          year={selectedYear}
          onComplete={handleImportComplete}
          onCancel={() => setShowImportWizard(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EmptyGamesState({ onImport }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <FileSpreadsheet size={48} className="text-slate-600 mb-4" />
      <h3 className="text-white font-medium mb-2">No Games Imported</h3>
      <p className="text-slate-400 text-sm mb-4">
        Import your Hudl export to start analyzing your season.
      </p>
      <button
        onClick={onImport}
        className="flex items-center gap-2 px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors"
      >
        <Upload size={16} />
        Import Games
      </button>
    </div>
  );
}

function GameCard({ game, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const snapCount = game.snaps?.length || game.offensiveSnaps || 0;

  return (
    <div className="bg-slate-800 rounded-lg p-3 group relative">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {game.isHome ? (
              <Home size={14} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <MapPin size={14} className="text-amber-400 flex-shrink-0" />
            )}
            <span className="text-white font-medium truncate">
              {game.isHome ? 'vs' : '@'} {game.opponent || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>{snapCount} snaps</span>
            {game.date && <span>{new Date(game.date).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* Validity indicator */}
        <div className="flex items-center gap-2">
          {game.isValid ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <AlertCircle size={14} className="text-amber-400" />
          )}

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Completeness bars */}
      <div className="mt-2 flex gap-2">
        <div className="flex-1">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${game.coreCompleteness || 0}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500"
              style={{ width: `${game.contextCompleteness || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
