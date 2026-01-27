import { useState, useMemo, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { PlayCard, PlayEditor } from '../components/playbook';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Book,
  Trash2,
  FilterX,
  Crosshair,
  Shield,
  Zap,
  FileText
} from 'lucide-react';

// Phase tabs configuration
const PHASE_TABS = [
  { id: 'OFFENSE', label: 'Offense', icon: Crosshair, color: '#3b82f6' },
  { id: 'DEFENSE', label: 'Defense', icon: Shield, color: '#ef4444', beta: true },
  { id: 'SPECIAL_TEAMS', label: 'Special Teams', icon: Zap, color: '#f59e0b', beta: true }
];

// Tag categories for filtering
const TAG_CATEGORIES = {
  "Situation": ["2-Min Offense", "4-Min Offense", "Must Score", "Clock Running", "Openers"],
  "Field Position": ["Backed Up", "Minus Territory", "Plus Territory", "Fringe", "Red Zone", "Gold Zone", "Goal Line"],
  "Down & Distance": ["1st Down", "2nd & Long", "2nd & Medium", "2nd & Short", "3rd & Long", "3rd & Medium", "3rd & Short", "4th Down"]
};

export default function Playbook() {
  const { playsArray, plays, updatePlays, addPlay, updatePlay, settings } = useSchool();

  // UI State
  const [activePhase, setActivePhase] = useState('OFFENSE');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlays, setSelectedPlays] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    formation: '',
    playCategory: '',
    bucketId: '',
    situation: '',
    tag: ''
  });

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState(null);

  // Get play buckets and concept families from settings
  const playBuckets = settings?.playBuckets || [];
  const conceptGroups = settings?.conceptGroups || [];

  // Get all unique tags from plays
  const allTags = useMemo(() => {
    const tagSet = new Set();
    playsArray.forEach(play => {
      if (play.tags) {
        play.tags.forEach(tag => tagSet.add(tag));
      }
      if (play.tag1) tagSet.add(play.tag1);
      if (play.tag2) tagSet.add(play.tag2);
    });
    return Array.from(tagSet).sort();
  }, [playsArray]);

  // Filter plays by phase
  const phasePlays = useMemo(() => {
    return playsArray.filter(play => {
      const playPhase = play.phase || 'OFFENSE';
      return playPhase === activePhase;
    });
  }, [playsArray, activePhase]);

  // Get unique formations for current phase
  const formations = useMemo(() => {
    const formationSet = new Set(phasePlays.map(p => p.formation).filter(Boolean));
    return Array.from(formationSet).sort();
  }, [phasePlays]);

  // Filter plays
  const filteredPlays = useMemo(() => {
    return phasePlays.filter(play => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const nameMatch = play.name?.toLowerCase().includes(search);
        const formationMatch = play.formation?.toLowerCase().includes(search);
        const conceptMatch = play.concept?.toLowerCase().includes(search);
        if (!nameMatch && !formationMatch && !conceptMatch) return false;
      }

      // Formation filter
      if (filters.formation && play.formation !== filters.formation) return false;

      // Category filter
      if (filters.playCategory && play.playCategory !== filters.playCategory) return false;

      // Bucket filter
      if (filters.bucketId && play.bucketId !== filters.bucketId) return false;

      // Situation/tag filter
      if (filters.situation) {
        const hasSituation = play.tags?.includes(filters.situation) ||
          play.tag1 === filters.situation ||
          play.tag2 === filters.situation;
        if (!hasSituation) return false;
      }

      // Tag filter
      if (filters.tag) {
        const hasTag = play.tags?.includes(filters.tag) ||
          play.tag1 === filters.tag ||
          play.tag2 === filters.tag;
        if (!hasTag) return false;
      }

      return true;
    });
  }, [phasePlays, searchTerm, filters]);

  // Phase counts
  const phaseCounts = useMemo(() => {
    const counts = {};
    PHASE_TABS.forEach(tab => {
      counts[tab.id] = playsArray.filter(p => (p.phase || 'OFFENSE') === tab.id).length;
    });
    return counts;
  }, [playsArray]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({ formation: '', playCategory: '', bucketId: '', situation: '', tag: '' });
    setSearchTerm('');
  };

  // Toggle play selection
  const togglePlaySelection = useCallback((playId, isShiftClick = false) => {
    setSelectedPlays(prev => {
      if (prev.includes(playId)) {
        return prev.filter(id => id !== playId);
      } else {
        return [...prev, playId];
      }
    });
  }, []);

  // Delete selected plays
  const handleDeleteSelected = async () => {
    if (selectedPlays.length === 0) return;

    if (window.confirm(`Delete ${selectedPlays.length} selected play(s)? This cannot be undone.`)) {
      const newPlays = { ...plays };
      selectedPlays.forEach(id => {
        delete newPlays[id];
      });
      await updatePlays(newPlays);
      setSelectedPlays([]);
    }
  };

  // Handle save play (new or edit)
  const handleSavePlay = async (playData) => {
    if (editingPlay) {
      // Update existing play
      await updatePlay(editingPlay.id, playData);
    } else {
      // Add new play
      await addPlay({ ...playData, phase: activePhase });
    }
  };

  // Handle delete play
  const handleDeletePlay = async (playId) => {
    const newPlays = { ...plays };
    delete newPlays[playId];
    await updatePlays(newPlays);
  };

  // Open editor for new play
  const openNewPlayEditor = () => {
    setEditingPlay(null);
    setEditorOpen(true);
  };

  // Quick add play from search bar
  const quickAddPlay = async (name) => {
    if (!name || !name.trim()) return;

    const newPlay = {
      name: name.trim(),
      phase: activePhase,
      formation: '',
      concept: '',
      tags: []
    };

    await addPlay(newPlay);
    setSearchTerm(''); // Clear search after adding
  };

  // Handle search bar key press for quick add
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      // If no exact match found, offer to quick add
      const exactMatch = filteredPlays.some(p =>
        p.name?.toLowerCase() === searchTerm.trim().toLowerCase()
      );
      if (!exactMatch) {
        quickAddPlay(searchTerm);
      }
    }
  };

  // Open editor for editing
  const openEditPlayEditor = (play) => {
    setEditingPlay(play);
    setEditorOpen(true);
  };

  // Get phase label based on active phase
  const getPhaseLabel = (type) => {
    if (activePhase === 'DEFENSE') {
      if (type === 'formation') return 'Front';
      if (type === 'play') return 'Call';
    } else if (activePhase === 'SPECIAL_TEAMS') {
      if (type === 'formation') return 'Package';
    }
    return type === 'formation' ? 'Formation' : 'Play';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Master Playbook</h1>
          {selectedPlays.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedPlays.length})
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={openNewPlayEditor}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium"
          >
            <Plus size={18} />
            New {getPhaseLabel('play')}
          </button>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mb-6">
        {PHASE_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activePhase === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePhase(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors"
              style={{
                background: isActive ? tab.color : 'transparent',
                color: isActive ? 'white' : '#94a3b8'
              }}
            >
              <Icon size={18} />
              <span className="font-semibold">{tab.label}</span>
              {tab.beta && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-purple-500 text-white rounded">
                  Beta
                </span>
              )}
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-800'}`}>
                {phaseCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <Filter size={14} className="text-sky-400" />
            Search & Filter
          </h4>
          <div className="flex gap-2">
            {selectedPlays.length > 0 && (
              <button
                onClick={() => setSelectedPlays([])}
                className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
              >
                Clear Selection ({selectedPlays.length})
              </button>
            )}
            <button
              onClick={clearFilters}
              className="text-xs px-2 py-1 bg-sky-500/10 text-sky-400 rounded hover:bg-sky-500/20 flex items-center gap-1"
            >
              <FilterX size={12} />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search with Quick Add */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
              Search / Quick Add
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type name, Enter to add..."
                className={`w-full pl-9 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 ${
                  searchTerm.trim() ? 'pr-20' : 'pr-3'
                }`}
              />
              {searchTerm.trim() && !filteredPlays.some(p => p.name?.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                <button
                  onClick={() => quickAddPlay(searchTerm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30 transition-colors"
                  title="Quick add this play (Enter)"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>
            {searchTerm.trim() && !filteredPlays.some(p => p.name?.toLowerCase() === searchTerm.trim().toLowerCase()) && (
              <p className="text-xs text-emerald-400/70 mt-1">
                Press Enter to quick-add "{searchTerm.trim()}"
              </p>
            )}
          </div>

          {/* Formation */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
              {getPhaseLabel('formation')}
            </label>
            <select
              value={filters.formation}
              onChange={e => setFilters(prev => ({ ...prev, formation: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All {getPhaseLabel('formation')}s</option>
              {formations.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
              Category
            </label>
            <select
              value={filters.playCategory}
              onChange={e => setFilters(prev => ({ ...prev, playCategory: e.target.value, bucketId: '' }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Categories</option>
              {playBuckets.filter(c => (c.phase || 'OFFENSE') === activePhase).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Play Family */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
              Family
            </label>
            <select
              value={filters.bucketId}
              onChange={e => setFilters(prev => ({ ...prev, bucketId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Families</option>
              {playBuckets
                .filter(b => !filters.playCategory || b.categoryId === filters.playCategory)
                .map(bucket => (
                  <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                ))}
            </select>
          </div>

          {/* Situation */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
              Situation
            </label>
            <select
              value={filters.situation}
              onChange={e => setFilters(prev => ({ ...prev, situation: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Situations</option>
              {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
                <optgroup key={category} label={category}>
                  {tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
              Tag
            </label>
            <select
              value={filters.tag}
              onChange={e => setFilters(prev => ({ ...prev, tag: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Showing {filteredPlays.length} of {phasePlays.length} plays
        </p>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-700' : ''}`}
          >
            <Grid size={18} className={viewMode === 'grid' ? 'text-white' : 'text-slate-500'} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-700' : ''}`}
          >
            <List size={18} className={viewMode === 'list' ? 'text-white' : 'text-slate-500'} />
          </button>
        </div>
      </div>

      {/* Plays Grid/List */}
      {filteredPlays.length === 0 ? (
        <div className="text-center py-12">
          <Book size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No plays found</h3>
          <p className="text-slate-500 mb-4">
            {phasePlays.length === 0
              ? `Start building your ${activePhase.toLowerCase().replace('_', ' ')} playbook by adding your first ${getPhaseLabel('play').toLowerCase()}.`
              : "Try adjusting your search or filters."}
          </p>
          {phasePlays.length === 0 && (
            <button
              onClick={openNewPlayEditor}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
            >
              Add Your First {getPhaseLabel('play')}
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlays.map(play => (
            <PlayCard
              key={play.id}
              play={play}
              isSelected={selectedPlays.includes(play.id)}
              onToggleSelect={togglePlaySelection}
              onEdit={() => openEditPlayEditor(play)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlays.map(play => (
            <PlayRow
              key={play.id}
              play={play}
              isSelected={selectedPlays.includes(play.id)}
              onToggleSelect={togglePlaySelection}
              onEdit={() => openEditPlayEditor(play)}
            />
          ))}
        </div>
      )}

      {/* Play Editor Modal */}
      <PlayEditor
        play={editingPlay}
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingPlay(null);
        }}
        onSave={handleSavePlay}
        onDelete={handleDeletePlay}
        formations={formations}
        playBuckets={playBuckets}
        conceptGroups={conceptGroups}
        phase={activePhase}
      />
    </div>
  );
}

// List view row component
function PlayRow({ play, isSelected, onToggleSelect, onEdit }) {
  return (
    <div
      className={`flex items-center gap-4 bg-slate-900 rounded-lg p-3 cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-sky-500' : 'border border-slate-800 hover:border-slate-700'
      }`}
      onClick={() => onEdit(play)}
    >
      {/* Checkbox */}
      <div onClick={e => { e.stopPropagation(); onToggleSelect(play.id); }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-4 h-4 cursor-pointer"
        />
      </div>

      {/* Mini diagram */}
      <div className="w-16 h-12 bg-slate-800 rounded flex items-center justify-center flex-shrink-0">
        <Book size={20} className="text-slate-600" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">
          {play.formation ? `${play.formation} ${play.name}` : play.name}
        </h3>
      </div>

      {play.concept && (
        <div className="text-sm text-slate-500 hidden md:block max-w-xs truncate">
          {play.concept}
        </div>
      )}

      {/* Wristband slot */}
      {play.wristbandSlot && (
        <span className="px-2 py-0.5 bg-sky-500 text-black text-xs font-bold rounded">
          #{play.wristbandSlot}
        </span>
      )}

      {/* Tags */}
      {play.tags && play.tags.length > 0 && (
        <div className="flex gap-1 hidden lg:flex">
          {play.tags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {play.tags.length > 2 && (
            <span className="text-slate-600 text-xs">+{play.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}
