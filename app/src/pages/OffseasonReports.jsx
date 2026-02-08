import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Target,
  Play,
  CheckCircle,
  XCircle,
  BookOpen,
  ChevronRight,
  Check,
  Filter,
  Download,
  BarChart3,
  Percent,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function OffseasonReports() {
  const { weeks, playsArray, addPlay, settings, activeYear } = useSchool();
  const [selectedPlays, setSelectedPlays] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, run, pass

  const isLight = settings?.theme === 'light';

  // Aggregate all game reviews from all weeks
  const seasonData = useMemo(() => {
    const gamesWithData = weeks.filter(w => w.gameReview?.plays?.length > 0);

    if (gamesWithData.length === 0) {
      return null;
    }

    // Collect all plays across all games
    const allGamePlays = [];
    gamesWithData.forEach(week => {
      const offensivePlays = (week.gameReview?.plays || [])
        .filter(p => p.odk === 'O' || !p.odk)
        .map(p => ({
          ...p,
          weekId: week.id,
          weekName: week.name,
          opponent: week.opponent || week.gameReview?.opponent || 'Unknown'
        }));
      allGamePlays.push(...offensivePlays);
    });

    // Calculate aggregate stats
    const totalPlays = allGamePlays.length;
    const totalYards = allGamePlays.reduce((sum, p) => sum + (p.gainLoss || 0), 0);
    const runPlays = allGamePlays.filter(p =>
      p.playType?.toLowerCase().includes('run') ||
      (!p.playType?.toLowerCase().includes('pass') && p.gainLoss !== undefined && p.gainLoss < 15)
    );
    const passPlays = allGamePlays.filter(p =>
      p.playType?.toLowerCase().includes('pass')
    );

    // Build unique play call map
    const playCallMap = new Map();
    allGamePlays.forEach(play => {
      // Build play call string from components
      const parts = [];
      if (play.formation) parts.push(play.formation);
      if (play.backfield) parts.push(play.backfield);
      if (play.playName) parts.push(play.playName);
      if (play.playDir) parts.push(play.playDir);

      const callString = parts.join(' ').trim();
      if (!callString) return;

      if (!playCallMap.has(callString)) {
        playCallMap.set(callString, {
          callString,
          formation: play.formation,
          backfield: play.backfield,
          playName: play.playName,
          playDir: play.playDir,
          playType: play.playType,
          count: 0,
          totalYards: 0,
          games: new Set(),
          ratings: [],
          id: `season_play_${playCallMap.size}`
        });
      }

      const entry = playCallMap.get(callString);
      entry.count++;
      entry.totalYards += (play.gainLoss || 0);
      entry.games.add(play.opponent);
      if (play.review?.rating) {
        entry.ratings.push(play.review.rating);
      }
    });

    // Convert to array and calculate averages
    const uniquePlays = Array.from(playCallMap.values()).map(p => ({
      ...p,
      avgYards: p.count > 0 ? (p.totalYards / p.count).toFixed(1) : 0,
      avgRating: p.ratings.length > 0
        ? (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length).toFixed(1)
        : null,
      gamesUsed: p.games.size,
      games: Array.from(p.games)
    }));

    // Sort by usage count
    uniquePlays.sort((a, b) => b.count - a.count);

    // Check which plays already exist in playbook
    const existingNames = new Set(playsArray.map(p => p.name?.toLowerCase()));
    uniquePlays.forEach(p => {
      p.alreadyExists = existingNames.has(p.callString.toLowerCase());
    });

    return {
      games: gamesWithData,
      totalPlays,
      totalYards,
      avgYardsPerPlay: totalPlays > 0 ? (totalYards / totalPlays).toFixed(1) : 0,
      runPlays: runPlays.length,
      passPlays: passPlays.length,
      runYards: runPlays.reduce((sum, p) => sum + (p.gainLoss || 0), 0),
      passYards: passPlays.reduce((sum, p) => sum + (p.gainLoss || 0), 0),
      uniquePlays,
      allGamePlays
    };
  }, [weeks, playsArray]);

  // Filter plays by type
  const filteredPlays = useMemo(() => {
    if (!seasonData) return [];

    let filtered = seasonData.uniquePlays;
    if (filterType === 'run') {
      filtered = filtered.filter(p =>
        p.playType?.toLowerCase().includes('run') ||
        !p.playType?.toLowerCase().includes('pass')
      );
    } else if (filterType === 'pass') {
      filtered = filtered.filter(p => p.playType?.toLowerCase().includes('pass'));
    }
    return filtered;
  }, [seasonData, filterType]);

  // Toggle play selection
  const togglePlay = useCallback((playId) => {
    setSelectedPlays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playId)) {
        newSet.delete(playId);
      } else {
        newSet.add(playId);
      }
      return newSet;
    });
  }, []);

  // Select all non-existing plays
  const selectAllNew = useCallback(() => {
    const newPlays = filteredPlays.filter(p => !p.alreadyExists);
    if (selectedPlays.size === newPlays.length) {
      setSelectedPlays(new Set());
    } else {
      setSelectedPlays(new Set(newPlays.map(p => p.id)));
    }
  }, [filteredPlays, selectedPlays]);

  // Import selected plays to playbook
  const handleImportToPlaybook = useCallback(async () => {
    if (selectedPlays.size === 0) return;

    setImporting(true);
    setImportSuccess(null);

    try {
      const playsToImport = seasonData.uniquePlays.filter(p => selectedPlays.has(p.id));

      for (const play of playsToImport) {
        await addPlay({
          id: `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: play.callString,
          formation: play.formation,
          backfield: play.backfield,
          playDir: play.playDir,
          playType: play.playType?.toLowerCase().includes('run') ? 'run' :
                    play.playType?.toLowerCase().includes('pass') ? 'pass' : 'run',
          importedFromSeasonReport: true,
          importedAt: new Date().toISOString(),
          seasonStats: {
            timesRun: play.count,
            avgYards: parseFloat(play.avgYards),
            avgRating: play.avgRating ? parseFloat(play.avgRating) : null,
            gamesUsed: play.gamesUsed,
            season: activeYear
          }
        });
      }

      setImportSuccess(playsToImport.length);
      setSelectedPlays(new Set());
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  }, [selectedPlays, seasonData, addPlay, activeYear]);

  // Stats for selection
  const selectionStats = useMemo(() => ({
    total: filteredPlays.length,
    existing: filteredPlays.filter(p => p.alreadyExists).length,
    new: filteredPlays.filter(p => !p.alreadyExists).length,
    selected: selectedPlays.size
  }), [filteredPlays, selectedPlays]);

  // No data state
  if (!seasonData) {
    return (
      <div className={`flex-1 overflow-y-auto ${isLight ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-amber-100' : 'bg-amber-500/20'
            }`}>
              <FileBarChart size={20} className="text-amber-500" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Season Report
              </h1>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Aggregate analysis of your season's performance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle size={64} className={`mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
            <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              No Game Data Yet
            </h2>
            <p className={`mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              Import game data from Hudl in Postgame Review to see your season report and analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/offseason/self-scout"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                <Download size={18} />
                Import Hudl Data
              </Link>
              <Link
                to="/postgame"
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                  isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <Play size={18} />
                Go to Postgame Review
              </Link>
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
              isLight ? 'bg-amber-100' : 'bg-amber-500/20'
            }`}>
              <FileBarChart size={20} className="text-amber-500" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {activeYear} Season Report
              </h1>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {seasonData.games.length} games analyzed • {seasonData.totalPlays} total plays
              </p>
            </div>
          </div>
          {selectedPlays.size > 0 && (
            <button
              onClick={handleImportToPlaybook}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <BookOpen size={18} />
              {importing ? 'Importing...' : `Import ${selectedPlays.size} to Playbook`}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Success Message */}
        {importSuccess && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/20 border border-green-500/30'
          }`}>
            <CheckCircle size={20} className="text-green-500" />
            <span className={isLight ? 'text-green-800' : 'text-green-400'}>
              Successfully imported {importSuccess} plays to your playbook!
            </span>
            <Link to="/playbook" className="ml-auto text-sm text-green-500 hover:underline flex items-center gap-1">
              View Playbook <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Season Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-sky-500" />
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Games</span>
            </div>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {seasonData.games.length}
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Play size={16} className="text-amber-500" />
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Total Plays</span>
            </div>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {seasonData.totalPlays}
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-500" />
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Total Yards</span>
            </div>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {seasonData.totalYards.toLocaleString()}
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-purple-500" />
              <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Avg YPP</span>
            </div>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {seasonData.avgYardsPerPlay}
            </div>
          </div>
        </div>

        {/* Run/Pass Breakdown */}
        <div className={`p-6 rounded-xl mb-8 ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Run/Pass Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>Run Plays</span>
                <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {seasonData.runPlays} ({seasonData.totalPlays > 0 ? Math.round(seasonData.runPlays / seasonData.totalPlays * 100) : 0}%)
                </span>
              </div>
              <div className={`h-3 rounded-full ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                <div
                  className="h-3 rounded-full bg-emerald-500"
                  style={{ width: `${seasonData.totalPlays > 0 ? (seasonData.runPlays / seasonData.totalPlays * 100) : 0}%` }}
                />
              </div>
              <div className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {seasonData.runYards} yards ({seasonData.runPlays > 0 ? (seasonData.runYards / seasonData.runPlays).toFixed(1) : 0} YPC)
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>Pass Plays</span>
                <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {seasonData.passPlays} ({seasonData.totalPlays > 0 ? Math.round(seasonData.passPlays / seasonData.totalPlays * 100) : 0}%)
                </span>
              </div>
              <div className={`h-3 rounded-full ${isLight ? 'bg-gray-200' : 'bg-slate-700'}`}>
                <div
                  className="h-3 rounded-full bg-sky-500"
                  style={{ width: `${seasonData.totalPlays > 0 ? (seasonData.passPlays / seasonData.totalPlays * 100) : 0}%` }}
                />
              </div>
              <div className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {seasonData.passYards} yards ({seasonData.passPlays > 0 ? (seasonData.passYards / seasonData.passPlays).toFixed(1) : 0} YPA)
              </div>
            </div>
          </div>
        </div>

        {/* Play Calls Section */}
        <div className={`p-6 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Play Calls
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {seasonData.uniquePlays.length} unique plays • Select plays to import to your playbook
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center gap-1">
                <Filter size={14} className={isLight ? 'text-gray-400' : 'text-slate-500'} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`text-sm px-2 py-1 rounded border ${
                    isLight
                      ? 'bg-white border-gray-300 text-gray-700'
                      : 'bg-slate-800 border-slate-600 text-white'
                  }`}
                >
                  <option value="all">All Plays</option>
                  <option value="run">Run Only</option>
                  <option value="pass">Pass Only</option>
                </select>
              </div>
              {/* Select All */}
              <button
                onClick={selectAllNew}
                className={`text-sm px-3 py-1 rounded ${
                  isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {selectedPlays.size === selectionStats.new ? 'Deselect All' : `Select All New (${selectionStats.new})`}
              </button>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedPlays.size > 0 && (
            <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
              isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
            }`}>
              <span className={isLight ? 'text-green-800' : 'text-green-400'}>
                {selectedPlays.size} plays selected for import
              </span>
              <button
                onClick={handleImportToPlaybook}
                disabled={importing}
                className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
              >
                <BookOpen size={14} />
                {importing ? 'Importing...' : 'Import to Playbook'}
              </button>
            </div>
          )}

          {/* Play List */}
          <div className={`max-h-96 overflow-y-auto rounded-lg border ${
            isLight ? 'border-gray-200' : 'border-slate-700'
          }`}>
            <table className="w-full">
              <thead className={`sticky top-0 ${isLight ? 'bg-gray-50' : 'bg-slate-800'}`}>
                <tr className={`text-xs uppercase ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  <th className="w-10 p-3"></th>
                  <th className="text-left p-3">Play Call</th>
                  <th className="text-center p-3 w-20">Times Run</th>
                  <th className="text-center p-3 w-20">Avg Yards</th>
                  <th className="text-center p-3 w-20">Avg Rating</th>
                  <th className="text-center p-3 w-24">Games Used</th>
                  <th className="text-center p-3 w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlays.map(play => (
                  <tr
                    key={play.id}
                    className={`border-t cursor-pointer ${
                      play.alreadyExists
                        ? isLight ? 'bg-gray-50 opacity-60' : 'bg-slate-900/50 opacity-60'
                        : isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800/50'
                    } ${isLight ? 'border-gray-100' : 'border-slate-800'}`}
                    onClick={() => !play.alreadyExists && togglePlay(play.id)}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPlays.has(play.id)}
                        disabled={play.alreadyExists}
                        onChange={() => togglePlay(play.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {play.callString}
                      </div>
                      <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        {play.playType || 'Unknown type'}
                      </div>
                    </td>
                    <td className={`p-3 text-center font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {play.count}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-medium ${
                        parseFloat(play.avgYards) >= 5 ? 'text-green-500' :
                        parseFloat(play.avgYards) >= 3 ? isLight ? 'text-gray-900' : 'text-white' :
                        'text-red-500'
                      }`}>
                        {play.avgYards}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {play.avgRating ? (
                        <span className={`font-medium ${
                          parseFloat(play.avgRating) >= 4 ? 'text-green-500' :
                          parseFloat(play.avgRating) >= 3 ? 'text-amber-500' :
                          'text-red-500'
                        }`}>
                          {play.avgRating}
                        </span>
                      ) : (
                        <span className={isLight ? 'text-gray-400' : 'text-slate-600'}>-</span>
                      )}
                    </td>
                    <td className={`p-3 text-center ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                      {play.gamesUsed}
                    </td>
                    <td className="p-3 text-center">
                      {play.alreadyExists ? (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-400'
                        }`}>
                          In Playbook
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                        }`}>
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Games Analyzed */}
        <div className={`mt-6 p-6 rounded-xl ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Games Analyzed
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {seasonData.games.map(week => (
              <Link
                key={week.id}
                to={`/postgame?week=${week.id}`}
                className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  isLight
                    ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    : 'bg-slate-900/50 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                <Play size={16} className="text-sky-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {week.opponent || week.name}
                  </div>
                  <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    {week.gameReview?.plays?.length || 0} plays
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
