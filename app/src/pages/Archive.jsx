import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Archive as ArchiveIcon,
  Users,
  Play,
  Search,
  RotateCcw,
  Trash2,
  Filter
} from 'lucide-react';

// Archive tabs
const TABS = [
  { id: 'players', label: 'Players', icon: Users },
  { id: 'plays', label: 'Plays', icon: Play }
];

export default function Archive() {
  const { roster, plays, updateRoster, updatePlays } = useSchool();

  const [activeTab, setActiveTab] = useState('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Get archived items
  const archivedPlayers = useMemo(() => {
    return roster.filter(p => p.archived);
  }, [roster]);

  const archivedPlays = useMemo(() => {
    return plays.filter(p => p.archived);
  }, [plays]);

  // Filter items
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return archivedPlayers;
    const search = searchTerm.toLowerCase();
    return archivedPlayers.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.number?.toString().includes(search) ||
      p.position?.toLowerCase().includes(search)
    );
  }, [archivedPlayers, searchTerm]);

  const filteredPlays = useMemo(() => {
    if (!searchTerm) return archivedPlays;
    const search = searchTerm.toLowerCase();
    return archivedPlays.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.formation?.toLowerCase().includes(search)
    );
  }, [archivedPlays, searchTerm]);

  // Toggle selection
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Restore player
  const restorePlayer = (playerId) => {
    const newRoster = roster.map(p =>
      p.id === playerId ? { ...p, archived: false } : p
    );
    updateRoster(newRoster);
  };

  // Restore play
  const restorePlay = (playId) => {
    const newPlays = plays.map(p =>
      p.id === playId ? { ...p, archived: false } : p
    );
    updatePlays(newPlays);
  };

  // Delete player permanently
  const deletePlayer = (playerId) => {
    if (!confirm('Permanently delete this player? This cannot be undone.')) return;
    const newRoster = roster.filter(p => p.id !== playerId);
    updateRoster(newRoster);
  };

  // Delete play permanently
  const deletePlay = (playId) => {
    if (!confirm('Permanently delete this play? This cannot be undone.')) return;
    const newPlays = plays.filter(p => p.id !== playId);
    updatePlays(newPlays);
  };

  // Bulk restore
  const bulkRestore = () => {
    if (selectedItems.size === 0) return;

    if (activeTab === 'players') {
      const newRoster = roster.map(p =>
        selectedItems.has(p.id) ? { ...p, archived: false } : p
      );
      updateRoster(newRoster);
    } else {
      const newPlays = plays.map(p =>
        selectedItems.has(p.id) ? { ...p, archived: false } : p
      );
      updatePlays(newPlays);
    }

    setSelectedItems(new Set());
  };

  // Bulk delete
  const bulkDelete = () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Permanently delete ${selectedItems.size} item(s)? This cannot be undone.`)) return;

    if (activeTab === 'players') {
      const newRoster = roster.filter(p => !selectedItems.has(p.id));
      updateRoster(newRoster);
    } else {
      const newPlays = plays.filter(p => !selectedItems.has(p.id));
      updatePlays(newPlays);
    }

    setSelectedItems(new Set());
  };

  const currentItems = activeTab === 'players' ? filteredPlayers : filteredPlays;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Archive</h1>
          <p className="text-slate-400">
            {archivedPlayers.length} players • {archivedPlays.length} plays archived
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItems(new Set()); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
              {tab.id === 'players' ? archivedPlayers.length : archivedPlays.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Search archived ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-slate-400">{selectedItems.size} selected</span>
              <button
                onClick={bulkRestore}
                className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
              >
                <RotateCcw size={16} />
                Restore
              </button>
              <button
                onClick={bulkDelete}
                className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <ArchiveIcon size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Archived {activeTab === 'players' ? 'Players' : 'Plays'}</h3>
          <p className="text-slate-400">
            {activeTab === 'players'
              ? 'Archived players will appear here'
              : 'Archived plays will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800">
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === currentItems.length && currentItems.length > 0}
                    onChange={() => {
                      if (selectedItems.size === currentItems.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(new Set(currentItems.map(i => i.id)));
                      }
                    }}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                  />
                </th>
                {activeTab === 'players' ? (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Year</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Play Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Formation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Category</th>
                  </>
                )}
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                    />
                  </td>
                  {activeTab === 'players' ? (
                    <>
                      <td className="px-4 py-3 text-sky-400 font-bold">{item.number || '-'}</td>
                      <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.position || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.year || '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.formation || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.phase === 'offense' ? 'bg-blue-500/20 text-blue-400' :
                          item.phase === 'defense' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {item.phase || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.bucket || '-'}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => activeTab === 'players' ? restorePlayer(item.id) : restorePlay(item.id)}
                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                        title="Restore"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => activeTab === 'players' ? deletePlayer(item.id) : deletePlay(item.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        title="Delete permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
