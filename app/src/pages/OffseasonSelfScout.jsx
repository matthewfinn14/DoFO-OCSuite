import { useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import * as XLSX from 'xlsx';
import {
  SearchCheck,
  Upload,
  FileSpreadsheet,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Plus,
  Minus,
  Loader2,
  Trash2
} from 'lucide-react';

// Column aliases for auto-detection
const COLUMN_ALIASES = {
  formation: ['OFF FORM', 'OFF FORMATION', 'FORMATION', 'FORM'],
  backfield: ['OFF BACKFIELD', 'BACKFIELD', 'BACK'],
  playName: ['OFF PLAY', 'PLAY NAME', 'PLAY CALL', 'CALL'],
  playType: ['PLAY TYPE', 'TYPE', 'RUN/PASS', 'R/P'],
  playDir: ['PLAY DIR', 'DIRECTION', 'DIR', 'R/L'],
  gainLoss: ['GN/LS', 'GAIN/LOSS', 'YARDS', 'YDS', 'GAIN LOSS'],
  odk: ['ODK', 'O/D/K', 'UNIT']
};

function autoDetectColumnMapping(headers) {
  const mapping = {};
  const upperHeaders = headers.map(h => h.toUpperCase().trim());
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = upperHeaders.indexOf(alias.toUpperCase());
      if (idx !== -1) {
        mapping[field] = headers[idx];
        break;
      }
    }
  }
  return mapping;
}

export default function OffseasonSelfScout() {
  const { weeks, updateWeekData, settings, activeYear } = useSchool();
  const [numWeeks, setNumWeeks] = useState(10);
  const [gameFiles, setGameFiles] = useState([]); // Array of { weekNum, file, opponent, status, plays }
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const fileInputRefs = useRef({});

  const isLight = settings?.theme === 'light';

  // Initialize game slots when numWeeks changes
  const initializeSlots = useCallback(() => {
    const slots = [];
    for (let i = 1; i <= numWeeks; i++) {
      const existing = gameFiles.find(g => g.weekNum === i);
      slots.push(existing || {
        weekNum: i,
        file: null,
        opponent: `Game ${i}`,
        status: 'empty', // empty, uploading, ready, error
        plays: [],
        error: null
      });
    }
    setGameFiles(slots);
  }, [numWeeks]);

  // Handle file upload for a specific week
  const handleFileUpload = useCallback(async (weekNum, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Update status to uploading
    setGameFiles(prev => prev.map(g =>
      g.weekNum === weekNum ? { ...g, file, status: 'uploading', error: null } : g
    ));

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('File appears to be empty');
      }

      const headers = jsonData[0].map(h => String(h || '').trim());
      const mapping = autoDetectColumnMapping(headers);

      // Parse plays
      const plays = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const getValue = (field) => {
          const colName = mapping[field];
          if (!colName) return null;
          const colIdx = headers.indexOf(colName);
          return colIdx !== -1 ? row[colIdx] : null;
        };

        const playName = getValue('playName');
        if (!playName) continue;

        const odk = getValue('odk');
        // Only include offensive plays
        if (odk && odk.toString().toUpperCase() !== 'O') continue;

        plays.push({
          formation: getValue('formation') || '',
          backfield: getValue('backfield') || '',
          playName: String(playName).trim(),
          playDir: getValue('playDir') || '',
          playType: getValue('playType') || '',
          gainLoss: parseInt(getValue('gainLoss')) || 0
        });
      }

      // Extract opponent from filename or default
      const opponent = file.name.replace(/\.(xlsx|xls)$/i, '').replace(/[_-]/g, ' ');

      setGameFiles(prev => prev.map(g =>
        g.weekNum === weekNum ? {
          ...g,
          file,
          opponent,
          status: 'ready',
          plays,
          playCount: plays.length
        } : g
      ));
    } catch (err) {
      console.error('Parse error:', err);
      setGameFiles(prev => prev.map(g =>
        g.weekNum === weekNum ? { ...g, status: 'error', error: err.message } : g
      ));
    }
  }, []);

  // Remove a file
  const removeFile = useCallback((weekNum) => {
    setGameFiles(prev => prev.map(g =>
      g.weekNum === weekNum ? { ...g, file: null, status: 'empty', plays: [], error: null } : g
    ));
  }, []);

  // Update opponent name
  const updateOpponent = useCallback((weekNum, opponent) => {
    setGameFiles(prev => prev.map(g =>
      g.weekNum === weekNum ? { ...g, opponent } : g
    ));
  }, []);

  // Import all games to weeks
  const handleImportAll = useCallback(async () => {
    const readyGames = gameFiles.filter(g => g.status === 'ready');
    if (readyGames.length === 0) return;

    setImporting(true);

    try {
      for (const game of readyGames) {
        // Find or create a week for this game
        const weekId = `season_week_${game.weekNum}`;
        const existingWeek = weeks.find(w => w.id === weekId);

        // Create game review data
        const gameReview = {
          importedAt: new Date().toISOString(),
          opponent: game.opponent,
          plays: game.plays.map((p, idx) => ({
            id: `game_play_${idx}`,
            ...p,
            odk: 'O',
            review: {}
          }))
        };

        // Update or create week
        if (existingWeek) {
          await updateWeekData(weekId, {
            ...existingWeek,
            opponent: game.opponent,
            gameReview
          });
        } else {
          // Create new week
          await updateWeekData(weekId, {
            id: weekId,
            name: `Week ${game.weekNum}`,
            phaseId: 'season',
            phaseName: 'Regular Season',
            phaseColor: 'emerald',
            weekNum: game.weekNum,
            opponent: game.opponent,
            gameReview
          });
        }
      }

      setImportComplete(true);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  }, [gameFiles, weeks, updateWeekData]);

  // Stats
  const stats = useMemo(() => {
    const ready = gameFiles.filter(g => g.status === 'ready');
    const totalPlays = ready.reduce((sum, g) => sum + (g.playCount || 0), 0);
    return {
      readyCount: ready.length,
      totalPlays
    };
  }, [gameFiles]);

  // Show success state
  if (importComplete) {
    return (
      <div className={`flex-1 overflow-y-auto ${isLight ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-500" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Import Complete!
            </h2>
            <p className={`mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              {stats.readyCount} games with {stats.totalPlays} plays have been imported.
              View the Season Report to analyze your data and import plays to your playbook.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/offseason/reports"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
              >
                View Season Report
                <ChevronRight size={18} />
              </Link>
              <button
                onClick={() => {
                  setImportComplete(false);
                  setGameFiles([]);
                  initializeSlots();
                }}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                  isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                Import More Games
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${isLight ? 'bg-gray-50' : 'bg-slate-950'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
        isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-purple-100' : 'bg-purple-500/20'
            }`}>
              <SearchCheck size={20} className="text-purple-500" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Import Last Season's Data
              </h1>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Upload Hudl exports for each game to build your self-scout report
              </p>
            </div>
          </div>
          {stats.readyCount > 0 && (
            <button
              onClick={handleImportAll}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Import {stats.readyCount} Games ({stats.totalPlays} plays)
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Week Count Selector */}
        {gameFiles.length === 0 && (
          <div className={`p-8 rounded-xl text-center ${
            isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'
          }`}>
            <FileSpreadsheet size={48} className={`mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
            <h2 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              How many games do you want to import?
            </h2>
            <p className={`mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              We'll create upload slots for each game from last season
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setNumWeeks(Math.max(1, numWeeks - 1))}
                className={`p-2 rounded-lg ${
                  isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <Minus size={20} className={isLight ? 'text-gray-600' : 'text-slate-300'} />
              </button>
              <div className={`text-4xl font-bold w-20 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {numWeeks}
              </div>
              <button
                onClick={() => setNumWeeks(Math.min(20, numWeeks + 1))}
                className={`p-2 rounded-lg ${
                  isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <Plus size={20} className={isLight ? 'text-gray-600' : 'text-slate-300'} />
              </button>
            </div>

            <button
              onClick={initializeSlots}
              className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
            >
              Continue
            </button>
          </div>
        )}

        {/* Upload Slots */}
        {gameFiles.length > 0 && (
          <>
            {/* Instructions */}
            <div className={`mb-6 p-4 rounded-lg ${
              isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              <h3 className={`font-medium mb-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                Upload your Hudl exports
              </h3>
              <p className={`text-sm ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                Export each game from Hudl as an Excel file (.xlsx). Make sure games are tagged with play call data (Formation, Backfield, Play Name, R/L).
              </p>
            </div>

            {/* Game Slots */}
            <div className="space-y-3">
              {gameFiles.map((game) => (
                <div
                  key={game.weekNum}
                  className={`p-4 rounded-xl border ${
                    game.status === 'ready'
                      ? isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/30'
                      : game.status === 'error'
                      ? isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30'
                      : isLight ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Week Number */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                      game.status === 'ready'
                        ? 'bg-green-500 text-white'
                        : game.status === 'error'
                        ? 'bg-red-500 text-white'
                        : isLight ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {game.status === 'ready' ? <Check size={20} /> : game.weekNum}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {game.status === 'empty' && (
                        <>
                          <input
                            ref={el => fileInputRefs.current[game.weekNum] = el}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => handleFileUpload(game.weekNum, e)}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRefs.current[game.weekNum]?.click()}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed ${
                              isLight
                                ? 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Upload size={18} />
                            Upload Week {game.weekNum} Game
                          </button>
                        </>
                      )}

                      {game.status === 'uploading' && (
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin text-amber-500" />
                          <span className={isLight ? 'text-gray-600' : 'text-slate-300'}>Processing...</span>
                        </div>
                      )}

                      {game.status === 'ready' && (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={game.opponent}
                            onChange={(e) => updateOpponent(game.weekNum, e.target.value)}
                            className={`flex-1 px-3 py-1 rounded border text-sm ${
                              isLight
                                ? 'bg-white border-green-300 text-gray-900'
                                : 'bg-slate-900 border-green-500/30 text-white'
                            }`}
                            placeholder="Opponent name"
                          />
                          <span className={`text-sm ${isLight ? 'text-green-700' : 'text-green-400'}`}>
                            {game.playCount} plays
                          </span>
                        </div>
                      )}

                      {game.status === 'error' && (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-500" />
                          <span className={isLight ? 'text-red-700' : 'text-red-400'}>{game.error}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {(game.status === 'ready' || game.status === 'error') && (
                      <button
                        onClick={() => removeFile(game.weekNum)}
                        className={`p-2 rounded-lg ${
                          isLight ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-slate-700 text-slate-500'
                        }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            <button
              onClick={() => {
                const maxWeek = Math.max(...gameFiles.map(g => g.weekNum));
                setGameFiles(prev => [...prev, {
                  weekNum: maxWeek + 1,
                  file: null,
                  opponent: `Game ${maxWeek + 1}`,
                  status: 'empty',
                  plays: [],
                  error: null
                }]);
              }}
              className={`mt-4 w-full p-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 ${
                isLight
                  ? 'border-gray-300 text-gray-500 hover:border-gray-400'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Plus size={18} />
              Add Another Game
            </button>

            {/* Import Button (bottom) */}
            {stats.readyCount > 0 && (
              <div className={`mt-6 p-4 rounded-xl ${
                isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${isLight ? 'text-green-800' : 'text-green-400'}`}>
                      Ready to import {stats.readyCount} games
                    </div>
                    <div className={`text-sm ${isLight ? 'text-green-600' : 'text-green-300'}`}>
                      {stats.totalPlays} total offensive plays
                    </div>
                  </div>
                  <button
                    onClick={handleImportAll}
                    disabled={importing}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Import All Games
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
