import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { usePlayDetailsModal } from '../PlayDetailsModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Landmark,
  Settings,
  BookOpen,
  Plus,
  PlusCircle,
  Star
} from 'lucide-react';

export default function PlayBankSidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const { openPlayDetails } = usePlayDetailsModal();
  const {
    playsArray,
    settings,
    weeks,
    currentWeekId,
    gamePlans,
    scripts,
    addPlay,
    updateWeek,
    setupConfig
  } = useSchool();

  // Local state
  const [activeTab, setActiveTab] = useState('usage'); // usage, gameplan, install
  const [playBankPhase, setPlayBankPhase] = useState('OFFENSE');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [quickAddValue, setQuickAddValue] = useState('');

  // Get play categories and buckets from settings
  const playCategories = settings?.playCategories || [];
  const playBuckets = settings?.playBuckets || [];

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId) || null;

  // Toggle section expansion
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Handle drag start for plays
  const handleDragStart = useCallback((e, play) => {
    e.dataTransfer.setData('application/react-dnd', JSON.stringify({ playId: play.id, name: play.name }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Calculate play usage data organized by category and family
  const usageData = useMemo(() => {
    // Filter by phase first (plays without phase default to OFFENSE)
    const filteredPlays = (playsArray || []).filter(p =>
      !p.archived && (p.phase || 'OFFENSE') === playBankPhase
    );
    const query = searchTerm.toLowerCase();

    // Map of filtered plays for quick lookup
    const filteredMap = {};
    filteredPlays.forEach(p => {
      if (!searchTerm ||
          p.name?.toLowerCase().includes(query) ||
          p.formation?.toLowerCase().includes(query) ||
          p.concept?.toLowerCase().includes(query)) {
        filteredMap[p.id] = p;
      }
    });

    // Filter categories by phase (default to OFFENSE if no phase set)
    const phaseCategories = playCategories.filter(cat =>
      (cat.phase || 'OFFENSE') === playBankPhase
    );

    const categories = phaseCategories.map(cat => {
      const families = playBuckets
        .filter(b => b.categoryId === cat.id)
        .map(bucket => {
          // Find plays assigned to this category and family label
          const bucketPlays = Object.values(filteredMap).filter(p =>
            p.bucketId === cat.id && p.conceptFamily === bucket.label
          ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          return { ...bucket, plays: bucketPlays };
        })
        .filter(f => searchTerm ? f.plays.length > 0 : true);

      const totalPlays = families.reduce((sum, f) => sum + f.plays.length, 0);
      return { ...cat, families, totalPlays };
    }).filter(c => searchTerm ? c.totalPlays > 0 : true);

    // Find unassigned plays (those not matching a category/family combination)
    const unassignedPlays = Object.values(filteredMap).filter(p => {
      if (!p.bucketId || !p.conceptFamily) return true;
      // Also unassigned if its bucketId or conceptFamily doesn't exist in setup
      const catExists = playCategories.some(cat => cat.id === p.bucketId);
      const bucketExists = playBuckets.some(b => b.categoryId === p.bucketId && b.label === p.conceptFamily);
      return !catExists || !bucketExists;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (unassignedPlays.length > 0 || !searchTerm) {
      categories.push({
        id: 'unassigned',
        label: 'Unassigned',
        color: '#64748b',
        families: [{ id: 'unassigned-family', label: 'Other Plays', plays: unassignedPlays }],
        totalPlays: unassignedPlays.length
      });
    }

    return categories;
  }, [playsArray, playCategories, playBuckets, searchTerm, playBankPhase]);

  // Calculate install data (plays in current week's install list)
  const installData = useMemo(() => {
    const installList = currentWeek?.installList || [];
    const installedPlays = (playsArray || []).filter(p =>
      !p.archived && installList.includes(p.id) && (p.phase || 'OFFENSE') === playBankPhase
    );
    const query = searchTerm.toLowerCase();

    return installedPlays.filter(p =>
      !searchTerm ||
      p.name?.toLowerCase().includes(query) ||
      p.formation?.toLowerCase().includes(query)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [playsArray, currentWeek, searchTerm, playBankPhase]);

  // Week stats
  const weekStats = useMemo(() => {
    const installList = currentWeek?.installList || [];
    const newInstallIds = currentWeek?.newInstallIds || [];
    return {
      uniquePlaysCount: installList.length,
      newPlaysCount: newInstallIds.length,
      totalScriptSlots: 0 // TODO: calculate from scripts
    };
  }, [currentWeek]);

  // Get play call chain syntax for current phase
  const currentSyntax = setupConfig?.syntax?.[playBankPhase] || [];
  const currentTermLibrary = setupConfig?.termLibrary?.[playBankPhase] || {};

  // Parse input using play call chain syntax
  const parseWithSyntax = useCallback((input) => {
    if (!currentSyntax.length) return null;

    const words = input.trim().toUpperCase().split(/\s+/);
    const syntaxValues = {};
    let wordIndex = 0;

    // Try to match each syntax component in order
    for (const component of currentSyntax) {
      if (wordIndex >= words.length) break;

      const terms = currentTermLibrary[component.id] || [];
      const termLabels = terms.map(t => t.label?.toUpperCase());
      const termAbbrevs = terms.map(t => t.abbrev?.toUpperCase()).filter(Boolean);

      // Check for multi-word matches first (e.g., "TRIPS RIGHT")
      let matched = false;
      for (let len = Math.min(3, words.length - wordIndex); len > 0; len--) {
        const phrase = words.slice(wordIndex, wordIndex + len).join(' ');
        if (termLabels.includes(phrase) || termAbbrevs.includes(phrase)) {
          syntaxValues[component.id] = phrase;
          wordIndex += len;
          matched = true;
          break;
        }
      }

      // If no exact term match, take single word for this component
      if (!matched && wordIndex < words.length) {
        syntaxValues[component.id] = words[wordIndex];
        wordIndex++;
      }
    }

    // Any remaining words get appended to the last component
    if (wordIndex < words.length && currentSyntax.length > 0) {
      const lastCompId = currentSyntax[currentSyntax.length - 1].id;
      const remaining = words.slice(wordIndex).join(' ');
      syntaxValues[lastCompId] = syntaxValues[lastCompId]
        ? `${syntaxValues[lastCompId]} ${remaining}`
        : remaining;
    }

    // Build the play name and extract formation
    const nameParts = currentSyntax.map(comp => {
      const value = syntaxValues[comp.id];
      if (!value) return '';
      return `${comp.prefix || ''}${value}${comp.suffix || ''}`;
    }).filter(Boolean);

    const formationComp = currentSyntax.find(c => c.label?.toLowerCase().includes('formation'));
    const formation = formationComp ? syntaxValues[formationComp.id] || '' : '';

    return {
      name: nameParts.join(' '),
      formation,
      syntaxValues
    };
  }, [currentSyntax, currentTermLibrary]);

  // Quick add play handler
  const handleQuickAdd = useCallback(async () => {
    if (!quickAddValue.trim()) return;

    let name = quickAddValue.trim().toUpperCase();
    let formation = '';
    let syntaxValues = {};

    // Try to parse with syntax if available
    const parsed = parseWithSyntax(quickAddValue);
    if (parsed && parsed.name) {
      name = parsed.name;
      formation = parsed.formation;
      syntaxValues = parsed.syntaxValues;
    } else {
      // Fallback: simple "FORMATION PLAY_NAME" parsing
      const parts = quickAddValue.trim().split(/\s+/);
      if (parts.length > 1 && parts[0].length <= 12) {
        formation = parts[0].toUpperCase();
        name = parts.slice(1).join(' ').toUpperCase();
      }
    }

    // Create the new play
    const playData = {
      name,
      formation,
      phase: playBankPhase,
      syntaxValues, // Store parsed syntax values for future editing
      archived: false
    };

    const playId = await addPlay(playData);

    // Add to install list if we have a current week
    if (currentWeek && playId) {
      const installList = currentWeek.installList || [];
      const newInstallIds = currentWeek.newInstallIds || [];
      await updateWeek(currentWeekId, {
        installList: [...installList, playId],
        newInstallIds: [...newInstallIds, playId]
      });
    }

    // Clear the input
    setQuickAddValue('');
  }, [quickAddValue, playBankPhase, addPlay, currentWeek, currentWeekId, updateWeek, parseWithSyntax]);

  // Render a single play row
  const renderPlayRow = useCallback((play) => {
    return (
      <div
        key={play.id}
        className="flex items-center py-1.5 px-2 border-b border-slate-100 text-sm cursor-grab hover:bg-slate-50"
        draggable
        onDragStart={(e) => handleDragStart(e, play)}
        onDoubleClick={() => openPlayDetails(play.id)}
        title="Double-click to view details"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-800 truncate">
            {play.name}
          </div>
        </div>
        {play.priority && (
          <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0 ml-1" />
        )}
      </div>
    );
  }, [handleDragStart, openPlayDetails]);

  // Render category with families
  const renderCategory = useCallback((category) => {
    const isCatExpanded = expandedSections[`cat-${category.id}`];

    return (
      <div key={category.id} className="mb-2">
        {/* Category Header */}
        <div
          onClick={() => toggleSection(`cat-${category.id}`)}
          className="flex items-center justify-between px-2.5 py-2 rounded cursor-pointer"
          style={{ backgroundColor: category.color || '#3b82f6' }}
        >
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            {category.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80">{category.totalPlays}</span>
            {isCatExpanded ? (
              <ChevronDown size={14} className="text-white" />
            ) : (
              <ChevronRight size={14} className="text-white" />
            )}
          </div>
        </div>

        {/* Category Content */}
        {isCatExpanded && (
          <div
            className="ml-2 pl-1.5 pt-1 border-l-2"
            style={{ borderColor: category.color || '#3b82f6' }}
          >
            {category.families.map(family => {
              const isFamExpanded = expandedSections[`fam-${family.id}`];

              return (
                <div key={family.id} className="mb-1 border border-slate-200 rounded overflow-hidden">
                  {/* Family Header */}
                  <div
                    onClick={() => toggleSection(`fam-${family.id}`)}
                    className="flex items-center justify-between px-2 py-1.5 bg-slate-50 cursor-pointer hover:bg-slate-100"
                  >
                    <span className="text-xs font-semibold text-slate-700">
                      {family.label || family.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">{family.plays.length}</span>
                      {isFamExpanded ? (
                        <ChevronDown size={12} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={12} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Family Plays */}
                  {isFamExpanded && family.plays.length > 0 && (
                    <div className="bg-white border-t border-slate-200">
                      {family.plays.map(renderPlayRow)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }, [expandedSections, toggleSection, renderPlayRow]);

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-in-out"
      style={{
        width: isOpen ? '360px' : '40px',
        borderLeft: '1px solid #334155',
        background: isOpen ? '#ffffff' : '#1e293b'
      }}
    >
      {/* Collapsed State */}
      {!isOpen && (
        <div
          onClick={() => onToggle(true)}
          className="w-10 h-full flex flex-col items-center pt-2 gap-3 cursor-pointer hover:bg-slate-700"
          title="Expand Play Bank"
        >
          <ChevronLeft size={20} className="text-slate-400" />
          <span
            className="text-xs font-semibold text-slate-500 uppercase tracking-widest"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)'
            }}
          >
            Play Bank
          </span>
        </div>
      )}

      {/* Expanded Content */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: '360px', display: isOpen ? 'flex' : 'none' }}
      >
        {/* Quick Navigation Links */}
        <div className="flex gap-2 p-2 bg-slate-900 border-b border-slate-700">
          <button
            onClick={() => navigate('/setup')}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 text-xs font-semibold hover:bg-blue-500/30 transition-colors"
          >
            <Settings size={14} /> Setup
          </button>
          <button
            onClick={() => navigate('/playbook')}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
          >
            <BookOpen size={14} /> Master Playbook
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-800 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Landmark size={20} className="text-slate-300" />
            <h3 className="text-sm font-extrabold text-white tracking-wide">PLAY BANK</h3>
            <select
              value={playBankPhase}
              onChange={(e) => setPlayBankPhase(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-white text-xs font-semibold cursor-pointer"
            >
              <option value="OFFENSE">Offense</option>
              <option value="DEFENSE">Defense</option>
              <option value="SPECIAL_TEAMS">Special Teams</option>
            </select>
          </div>
          <button
            onClick={() => onToggle(false)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 transition-colors"
            title="Collapse Play Bank"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week Stats */}
        {currentWeek && (
          <div className="flex flex-col items-center gap-1.5 py-2.5 px-3 bg-slate-50 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {currentWeek.opponent ? `vs. ${currentWeek.opponent}` : (currentWeek.name || `Week ${currentWeek.weekNumber || ''}`)}
            </div>
            <div className="flex items-center gap-3 bg-indigo-100 rounded-full px-3 py-1 border border-indigo-200">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-indigo-600">{weekStats.uniquePlaysCount}</span>
                <span className="text-xs font-semibold text-indigo-500">Unique</span>
              </div>
              <div className="w-px h-4 bg-indigo-300" />
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-emerald-600">{weekStats.newPlaysCount}</span>
                <span className="text-xs font-semibold text-indigo-500">New</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { key: 'usage', label: 'Full Playbook' },
            { key: 'gameplan', label: 'Game Plan' },
            { key: 'install', label: 'Install' }
          ].map(tab => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-center py-2 px-1 text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === tab.key
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                  : 'text-slate-500 border-b-2 border-transparent bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="p-2 bg-white border-b border-slate-200">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search plays..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.toUpperCase())}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Quick Add */}
        <div className="p-2 bg-slate-50 border-b border-slate-200">
          <div className="flex gap-1.5">
            <input
              placeholder={
                currentSyntax.length > 0
                  ? `e.g. ${currentSyntax.map(c => c.label?.toUpperCase() || '').slice(0, 3).join(' ')}`
                  : 'Quick add: FORM PLAY NAME'
              }
              value={quickAddValue}
              onChange={e => setQuickAddValue(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter') handleQuickAdd();
              }}
              className="flex-1 px-2.5 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400"
            />
            <button
              onClick={handleQuickAdd}
              disabled={!quickAddValue.trim()}
              className="px-2.5 py-1.5 bg-emerald-500 text-white rounded text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Add play to playbook and install"
            >
              <PlusCircle size={14} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {currentSyntax.length > 0
              ? `Uses your Play Call Chain: ${currentSyntax.map(c => c.label).join(' → ')}`
              : 'Press Enter to add play'
            }
            {currentWeek ? ' • Auto-installs for this week' : ''}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 bg-white">
          {activeTab === 'usage' && (
            <>
              {usageData.length > 0 ? (
                usageData.map(renderCategory)
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {searchTerm ? `No plays found matching "${searchTerm}"` : 'No plays in playbook'}
                </div>
              )}
            </>
          )}

          {activeTab === 'gameplan' && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p>Game plan view coming soon</p>
              <p className="text-xs mt-1">Drag plays to call sheet sections</p>
            </div>
          )}

          {activeTab === 'install' && (
            <>
              {installData.length > 0 ? (
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="px-2 py-1.5 bg-emerald-500 text-white text-xs font-bold uppercase">
                    Week Install ({installData.length})
                  </div>
                  <div className="bg-white">
                    {installData.map(renderPlayRow)}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {currentWeek
                    ? 'No plays installed for this week'
                    : 'Select a week to view installed plays'
                  }
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
