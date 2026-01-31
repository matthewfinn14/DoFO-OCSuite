import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  Archive,
  UserCheck,
  GraduationCap
} from 'lucide-react';

// Position groups
const POSITION_GROUPS = {
  offense: ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C'],
  defense: ['DL', 'DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS'],
  special: ['K', 'P', 'LS']
};

// Year/class options
const YEARS = ['FR', 'SO', 'JR', 'SR', 'RS-FR', 'RS-SO', 'RS-JR', 'RS-SR'];

export default function Roster() {
  const { roster, updateRoster } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('number');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Get all unique positions from roster
  const allPositions = useMemo(() => {
    const positions = new Set();
    roster.forEach(p => p.position && positions.add(p.position));
    return ['all', ...Array.from(positions).sort()];
  }, [roster]);

  // Filter and sort roster
  const filteredRoster = useMemo(() => {
    let filtered = roster.filter(p => {
      // Archive filter
      if (!showArchived && p.archived) return false;
      if (showArchived && !p.archived) return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches =
          p.name?.toLowerCase().includes(search) ||
          p.number?.toString().includes(search) ||
          p.position?.toLowerCase().includes(search);
        if (!matches) return false;
      }

      // Position filter
      if (filterPosition !== 'all' && p.position !== filterPosition) return false;

      // Year filter
      if (filterYear !== 'all' && p.year !== filterYear) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';

      if (sortBy === 'number') {
        aVal = parseInt(aVal) || 999;
        bVal = parseInt(bVal) || 999;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [roster, searchTerm, filterPosition, filterYear, showArchived, sortBy, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const active = roster.filter(p => !p.archived);
    const archived = roster.filter(p => p.archived);
    return { active: active.length, archived: archived.length, total: roster.length };
  }, [roster]);

  // Toggle sort
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // Toggle player selection
  const togglePlayerSelection = (playerId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedPlayers.size === filteredRoster.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(filteredRoster.map(p => p.id)));
    }
  };

  // Open editor for new or existing player
  const openEditor = (player = null) => {
    setEditingPlayer(player || {
      id: `player_${Date.now()}`,
      name: '',
      number: '',
      position: '',
      year: '',
      height: '',
      weight: '',
      email: '',
      phone: '',
      notes: ''
    });
    setShowEditor(true);
  };

  // Save player
  const savePlayer = () => {
    if (!editingPlayer.name) return;

    const exists = roster.find(p => p.id === editingPlayer.id);
    let newRoster;

    if (exists) {
      newRoster = roster.map(p => p.id === editingPlayer.id ? editingPlayer : p);
    } else {
      newRoster = [...roster, editingPlayer];
    }

    updateRoster(newRoster);
    setShowEditor(false);
    setEditingPlayer(null);
  };

  // Delete selected players
  const deleteSelected = () => {
    if (selectedPlayers.size === 0) return;
    if (!confirm(`Delete ${selectedPlayers.size} player(s)?`)) return;

    const newRoster = roster.filter(p => !selectedPlayers.has(p.id));
    updateRoster(newRoster);
    setSelectedPlayers(new Set());
  };

  // Archive selected players
  const archiveSelected = () => {
    if (selectedPlayers.size === 0) return;

    const newRoster = roster.map(p => {
      if (selectedPlayers.has(p.id)) {
        return { ...p, archived: !p.archived };
      }
      return p;
    });

    updateRoster(newRoster);
    setSelectedPlayers(new Set());
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Roster</h1>
          <p className="text-slate-400">
            {stats.active} active players • {stats.archived} archived
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Player
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="roster-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, number, position..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          {/* Position filter */}
          <select
            id="roster-filter-position"
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            {allPositions.map(pos => (
              <option key={pos} value={pos}>
                {pos === 'all' ? 'All Positions' : pos}
              </option>
            ))}
          </select>

          {/* Year filter */}
          <select
            id="roster-filter-year"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Years</option>
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              showArchived
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Archive size={16} />
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
        </div>

        {/* Bulk actions */}
        {selectedPlayers.size > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
            <span className="text-slate-400">{selectedPlayers.size} selected</span>
            <button
              onClick={archiveSelected}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30"
            >
              <Archive size={14} />
              {showArchived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => setSelectedPlayers(new Set())}
              className="text-slate-500 hover:text-white ml-auto"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800">
              <th className="px-4 py-3 text-left">
                <input
                  id="roster-select-all"
                  type="checkbox"
                  checked={selectedPlayers.size === filteredRoster.length && filteredRoster.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('number')}
              >
                # {sortBy === 'number' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('name')}
              >
                Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('position')}
              >
                Position {sortBy === 'position' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('year')}
              >
                Year {sortBy === 'year' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Height</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Weight</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoster.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-500">
                    {showArchived ? 'No archived players' : 'No players found'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredRoster.map((player, idx) => (
                <tr
                  key={player.id}
                  className={`${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} hover:bg-slate-800/50`}
                >
                  <td className="px-4 py-3">
                    <input
                      id={`roster-select-player-${player.id}`}
                      type="checkbox"
                      checked={selectedPlayers.has(player.id)}
                      onChange={() => togglePlayerSelection(player.id)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sky-400 font-bold">
                      {player.number || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{player.name}</span>
                    {player.archived && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{player.position || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{player.year || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{player.height || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{player.weight || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditor(player)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Player Editor Modal */}
      {showEditor && editingPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {roster.find(p => p.id === editingPlayer.id) ? 'Edit Player' : 'Add Player'}
              </h3>
              <button
                onClick={() => { setShowEditor(false); setEditingPlayer(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-name" className="text-sm text-slate-400 block mb-1">Name *</label>
                  <input
                    id="player-name"
                    type="text"
                    value={editingPlayer.name}
                    onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <label htmlFor="player-number" className="text-sm text-slate-400 block mb-1">Number</label>
                  <input
                    id="player-number"
                    type="text"
                    value={editingPlayer.number}
                    onChange={e => setEditingPlayer({ ...editingPlayer, number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Jersey #"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-position" className="text-sm text-slate-400 block mb-1">Position</label>
                  <input
                    id="player-position"
                    type="text"
                    value={editingPlayer.position}
                    onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="QB, WR, etc."
                  />
                </div>
                <div>
                  <label htmlFor="player-year" className="text-sm text-slate-400 block mb-1">Year</label>
                  <select
                    id="player-year"
                    value={editingPlayer.year}
                    onChange={e => setEditingPlayer({ ...editingPlayer, year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-height" className="text-sm text-slate-400 block mb-1">Height</label>
                  <input
                    id="player-height"
                    type="text"
                    value={editingPlayer.height}
                    onChange={e => setEditingPlayer({ ...editingPlayer, height: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="6'2&quot;"
                  />
                </div>
                <div>
                  <label htmlFor="player-weight" className="text-sm text-slate-400 block mb-1">Weight</label>
                  <input
                    id="player-weight"
                    type="text"
                    value={editingPlayer.weight}
                    onChange={e => setEditingPlayer({ ...editingPlayer, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="185 lbs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="player-email" className="text-sm text-slate-400 block mb-1">Email</label>
                <input
                  id="player-email"
                  type="email"
                  value={editingPlayer.email || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="player@school.edu"
                />
              </div>

              <div>
                <label htmlFor="player-notes" className="text-sm text-slate-400 block mb-1">Notes</label>
                <textarea
                  id="player-notes"
                  value={editingPlayer.notes || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowEditor(false); setEditingPlayer(null); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={savePlayer}
                disabled={!editingPlayer.name}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
