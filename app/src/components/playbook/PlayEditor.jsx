import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, Trash2, Upload, ChevronDown, ChevronRight, Edit3, Library, GripVertical, Handshake, Link2, MapPin, Hash, AlertTriangle, Eye, Layers } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import PlayDiagramEditor from '../diagrams/PlayDiagramEditor';
import DiagramPreview from '../diagrams/DiagramPreview';

// Complement types with labels and colors
const COMPLEMENT_TYPES = [
  { id: 'audible', label: 'Audible', color: '#f59e0b', description: 'Can audible to this play' },
  { id: 'if-then', label: 'If/Then', color: '#8b5cf6', description: 'Part of if/then sequence' },
  { id: 'look-alike', label: 'Look-Alike', color: '#06b6d4', description: 'Looks similar to defense' }
];

export default function PlayEditor({
  play = null,
  isOpen,
  onClose,
  onSave,
  onDelete,
  formations = [],
  playBuckets = [],
  conceptGroups = [],
  phase = 'OFFENSE',
  availablePlays = []
}) {
  const { setupConfig, updateSetupConfig } = useSchool();
  const isEditing = !!play;

  // Get OL schemes from setup config for library selection
  const olSchemes = useMemo(() => {
    const protections = (setupConfig?.passProtections || []).filter(p => p.diagramData?.length > 0);
    const runBlocking = (setupConfig?.runBlocking || []).filter(r => r.diagramData?.length > 0);
    return { protections, runBlocking };
  }, [setupConfig]);

  // Play type options for offense
  const PLAY_TYPES = [
    { id: 'pass', label: 'Pass', icon: '🏈' },
    { id: 'run', label: 'Run', icon: '🏃' },
    { id: 'quick', label: 'Quick', icon: '⚡' },
    { id: 'single', label: 'Single', icon: '1️⃣' },
  ];

  // Separate state for play type to avoid hook ordering issues
  const [selectedPlayType, setSelectedPlayType] = useState('quick');

  // Get play call chain syntax for current phase based on play type
  const playCallSyntax = useMemo(() => {
    const phaseKey = phase === 'SPECIAL_TEAMS' ? 'SPECIAL_TEAMS' : phase;
    const playType = selectedPlayType || 'quick';

    // First check syntaxTemplates for the specific play type
    const templates = setupConfig?.syntaxTemplates?.[phaseKey];
    if (templates && templates[playType]?.length > 0) {
      return templates[playType];
    }

    // Fall back to legacy syntax (custom template)
    const customSyntax = setupConfig?.syntax?.[phaseKey];
    if (customSyntax && customSyntax.length > 0) {
      return customSyntax;
    }

    // Default syntax based on play type
    if (playType === 'single') {
      return [
        { id: 'play', label: 'Play/Concept', order: 1 }
      ];
    }
    // Default: Formation + Play
    return [
      { id: 'formation', label: 'Formation', order: 1 },
      { id: 'play', label: 'Play', order: 2 }
    ];
  }, [setupConfig, phase, selectedPlayType]);

  // Get term library for current phase
  const termLibrary = useMemo(() => {
    const phaseKey = phase === 'SPECIAL_TEAMS' ? 'SPECIAL_TEAMS' : phase;
    return setupConfig?.termLibrary?.[phaseKey] || {};
  }, [setupConfig, phase]);

  // Get items from a source category for play call chain
  const getSourceItems = useCallback((sourceId) => {
    if (sourceId === 'custom' || !sourceId) return [];
    const config = setupConfig || {};
    switch (sourceId) {
      case 'formations': return (config.formations || []).map(f => f.name || f);
      case 'formationFamilies': return (config.formationFamilies || []).map(f => f.name);
      case 'shiftMotions': return (config.shiftMotions || []).map(f => f.name);
      case 'personnelGroupings': return (config.personnelGroupings || []).map(f => f.name || f);
      case 'playBuckets': return (config.playBuckets || []).map(f => f.name);
      case 'conceptGroups': return (config.conceptGroups || []).map(f => f.name);
      case 'readTypes': return (config.readTypes || []).map(f => f.name || f);
      case 'lookAlikeSeries': return (config.lookAlikeSeries || []).map(f => f.name);
      case 'passProtections': return (config.passProtections || []).map(f => f.name || f);
      case 'runBlocking': return (config.runBlocking || []).map(f => f.name || f);
      case 'fieldZones': return (config.fieldZones || []).map(f => f.name || f);
      case 'downDistanceCategories': return (config.downDistanceCategories || []).map(f => f.name || f);
      default: return [];
    }
  }, [setupConfig]);

  // Diagram editor state
  const [showSkillEditor, setShowSkillEditor] = useState(false);
  const [showOLEditor, setShowOLEditor] = useState(false);
  const [showOLLibrary, setShowOLLibrary] = useState(false);

  // Drag and drop state for play call builder
  const [draggedWord, setDraggedWord] = useState(null);

  const [formData, setFormData] = useState({
    phase: phase,
    name: '',
    formation: '',
    formationTag: '',
    playCategory: '',
    bucketId: '',
    tag1: '',
    tag2: '',
    tags: [],
    image: null,
    wristbandSlot: '',
    staplesSlot: '',
    playType: 'quick', // Default to quick (simple Formation + Play)
    actionTypes: [],
    hashPreference: 'Any',
    baseType: '',
    fieldZones: [],
    downDistance: [],
    situations: [],
    readType: '',
    seriesId: '',
    concept: '',
    incomplete: false,
    complementaryPlays: [],
  });

  const [loading, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    playCall: true,
    situations: false,
    diagrams: true,
    complementary: false,
    advanced: false
  });

  // Series creation prompt state
  const [showSeriesPrompt, setShowSeriesPrompt] = useState(false);
  const [pendingSeriesPlays, setPendingSeriesPlays] = useState([]);
  const [seriesName, setSeriesName] = useState('');

  // Check if using default syntax (Formation + Play)
  const isDefaultSyntax = useMemo(() => {
    const phaseKey = phase === 'SPECIAL_TEAMS' ? 'SPECIAL_TEAMS' : phase;
    const customSyntax = setupConfig?.syntax?.[phaseKey];
    return !customSyntax || customSyntax.length === 0;
  }, [setupConfig, phase]);

  // Initialize form with play data when editing
  useEffect(() => {
    if (play) {
      const playType = play.playType || 'quick';
      setSelectedPlayType(playType);
      setFormData({
        phase: play.phase || phase,
        name: play.name || '',
        formation: play.formation || '',
        formationTag: play.formationTag || '',
        playCategory: play.playCategory || '',
        bucketId: play.bucketId || '',
        tag1: play.tag1 || '',
        tag2: play.tag2 || '',
        tags: play.tags || [],
        image: play.image || null,
        wristbandSlot: play.wristbandSlot || '',
        staplesSlot: play.staplesSlot || '',
        playType: playType,
        actionTypes: play.actionTypes || [],
        hashPreference: play.hashPreference || 'Any',
        baseType: play.baseType || '',
        fieldZones: play.fieldZones || [],
        downDistance: play.downDistance || [],
        situations: play.situations || [],
        readType: play.readType || '',
        seriesId: play.seriesId || '',
        concept: play.concept || '',
        incomplete: play.incomplete || false,
        complementaryPlays: play.complementaryPlays || [],
        // Preserve diagram data
        diagramData: play.diagramData || null,
        wizSkillData: play.wizSkillData || null,
        wizOlineData: play.wizOlineData || null,
        wizOlineRef: play.wizOlineRef || null,
        // Play call chain parts
        playCallParts: play.playCallParts || {},
      });
    } else {
      // Reset form for new play
      setSelectedPlayType('quick');
      setFormData({
        phase: phase,
        name: '',
        formation: '',
        formationTag: '',
        playCategory: '',
        bucketId: '',
        tag1: '',
        tag2: '',
        tags: [],
        image: null,
        wristbandSlot: '',
        staplesSlot: '',
        playType: 'quick',
        actionTypes: [],
        hashPreference: 'Any',
        baseType: '',
        fieldZones: [],
        downDistance: [],
        situations: [],
        readType: '',
        seriesId: '',
        concept: '',
        incomplete: false,
        complementaryPlays: [],
        // Diagram fields
        wizSkillData: null,
        wizOlineData: null,
        wizOlineRef: null,
        // Play call chain parts
        playCallParts: {},
      });
    }
  }, [play, phase]);

  // Auto-populate playCallParts with formation and name when using default syntax
  useEffect(() => {
    if (isDefaultSyntax) {
      const newFormationPart = formData.formation || '';
      const newPlayPart = formData.name || '';

      // Only update if values have changed to avoid infinite loop
      if (formData.playCallParts?.formation !== newFormationPart ||
          formData.playCallParts?.play !== newPlayPart) {
        setFormData(prev => ({
          ...prev,
          playCallParts: {
            ...prev.playCallParts,
            formation: newFormationPart,
            play: newPlayPart
          }
        }));
      }
    }
  }, [formData.formation, formData.name, isDefaultSyntax]);

  // Get unique formations from props
  const availableFormations = useMemo(() => {
    const formSet = new Set(formations);
    return Array.from(formSet).sort();
  }, [formations]);

  // Filter buckets by selected category
  const filteredBuckets = useMemo(() => {
    if (!formData.playCategory) return playBuckets;
    return playBuckets.filter(b => b.categoryId === formData.playCategory);
  }, [playBuckets, formData.playCategory]);

  // Filter available plays for complementary selection (same phase, exclude current play)
  const complementaryPlayOptions = useMemo(() => {
    return availablePlays.filter(p =>
      p.id !== play?.id && (p.phase || 'OFFENSE') === (formData.phase || phase)
    );
  }, [availablePlays, play?.id, formData.phase, phase]);

  // Get play info by ID for display
  const getPlayById = (id) => availablePlays.find(p => p.id === id);

  // Add a complementary play
  const handleAddComplementary = (targetPlayId, type) => {
    if (!targetPlayId || !type) return;
    const existing = formData.complementaryPlays || [];
    // Check if already exists with this type
    const exists = existing.some(c => c.playId === targetPlayId && c.type === type);
    if (exists) return;

    const newComplementaryPlays = [...existing, { playId: targetPlayId, type }];
    setFormData(prev => ({
      ...prev,
      complementaryPlays: newComplementaryPlays
    }));

    // If we now have 3+ unique linked plays, prompt to create a series
    const uniquePlayIds = new Set(newComplementaryPlays.map(c => c.playId));
    if (play?.id) uniquePlayIds.add(play.id); // Include current play

    if (uniquePlayIds.size >= 3) {
      // Check if these plays are already in an existing series
      const existingSeries = setupConfig?.lookAlikeSeries || [];
      const alreadyInSeries = existingSeries.some(series => {
        const seriesSet = new Set(series.playIds);
        return [...uniquePlayIds].every(id => seriesSet.has(id));
      });

      if (!alreadyInSeries) {
        setPendingSeriesPlays([...uniquePlayIds]);
        setSeriesName('');
        setShowSeriesPrompt(true);
      }
    }
  };

  // Remove a complementary play
  const handleRemoveComplementary = (targetPlayId, type) => {
    setFormData(prev => ({
      ...prev,
      complementaryPlays: (prev.complementaryPlays || []).filter(
        c => !(c.playId === targetPlayId && c.type === type)
      )
    }));
  };

  // Create a new series from linked plays
  const handleCreateSeries = async () => {
    if (!seriesName.trim() || pendingSeriesPlays.length < 3) return;

    const newSeries = {
      id: `series-${Date.now()}`,
      name: seriesName.trim(),
      bucketId: formData.bucketId || null,
      description: '',
      commonElements: [],
      playIds: pendingSeriesPlays
    };

    const existingSeries = setupConfig?.lookAlikeSeries || [];
    await updateSetupConfig('lookAlikeSeries', [...existingSeries, newSeries]);

    setShowSeriesPrompt(false);
    setPendingSeriesPlays([]);
    setSeriesName('');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a play name');
      return;
    }

    setSaving(true);
    try {
      const playData = {
        ...formData,
        name: formData.name.trim(),
      };

      if (isEditing && play) {
        await onSave({ ...play, ...playData });
      } else {
        await onSave(playData);
      }
      onClose();
    } catch (err) {
      console.error('Error saving play:', err);
      alert('Failed to save play: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!play || !onDelete) return;

    if (window.confirm(`Are you sure you want to delete "${play.name}"?`)) {
      try {
        await onDelete(play.id);
        onClose();
      } catch (err) {
        console.error('Error deleting play:', err);
        alert('Failed to delete play');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Edit Play' : 'New Play'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Play Call Section */}
          <Section
            title="Play Call"
            isOpen={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-4">
              {/* Play Type Selector - Only for Offense */}
              {phase === 'OFFENSE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Play Type
                  </label>
                  <div className="flex gap-2">
                    {PLAY_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlayType(type.id);
                          setFormData(prev => ({ ...prev, playType: type.id }));
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-center ${
                          selectedPlayType === type.id
                            ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                            : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-lg mr-1">{type.icon}</span>
                        <span className="font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Play Call - Formation + Name combined */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Full Play Call *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.formation}
                    onChange={e => setFormData(prev => ({ ...prev, formation: e.target.value }))}
                    list="formations-list"
                    placeholder="Formation"
                    className="w-1/3 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 text-lg font-medium"
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Play Name"
                    className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 text-lg font-medium"
                  />
                  <datalist id="formations-list">
                    {availableFormations.map(f => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
                {/* Preview of full call */}
                <div className="mt-2 px-3 py-2 bg-slate-700/30 rounded-md">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Full Call: </span>
                  <span className="text-emerald-400 font-semibold">
                    {formData.formation || formData.name
                      ? `${formData.formation}${formData.formation && formData.name ? ' ' : ''}${formData.name}`
                      : '...'}
                  </span>
                </div>
              </div>

              {/* Play Call Chain Parsing - if syntax is defined */}
              {playCallSyntax.length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                    Play Call Breakdown
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Show tokens from formation + play name */}
                    {(formData.formation || formData.name) ? (
                      `${formData.formation || ''} ${formData.name || ''}`.trim().split(/\s+/).filter(w => w.trim()).map((word, idx) => {
                        const isUsed = Object.values(formData.playCallParts || {}).includes(word);
                        return (
                          <div
                            key={`${word}-${idx}`}
                            draggable={!isUsed}
                            onDragStart={(e) => {
                              setDraggedWord(word);
                              e.dataTransfer.setData('text/plain', word);
                            }}
                            onDragEnd={() => setDraggedWord(null)}
                            className={`px-2.5 py-1 rounded text-sm font-medium cursor-grab active:cursor-grabbing flex items-center gap-1 ${
                              isUsed
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30'
                            }`}
                          >
                            {!isUsed && <GripVertical size={10} />}
                            {word}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-slate-500 text-sm italic">Enter formation or play name above to see tokens</span>
                    )}
                  </div>

                  {/* Syntax slots */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {playCallSyntax.map((slot) => {
                      const slotValue = formData.playCallParts?.[slot.id] || '';
                      // Use source category items if defined, otherwise fall back to term library
                      const sourceItems = slot.sourceCategory && slot.sourceCategory !== 'custom'
                        ? getSourceItems(slot.sourceCategory)
                        : [];
                      const slotTerms = termLibrary[slot.id] || [];
                      const dropdownItems = sourceItems.length > 0 ? sourceItems : slotTerms.map(t => t.label);

                      // Check if selected term has signals and apply them
                      const handleTermSelection = (selectedValue, slotId) => {
                        if (!selectedValue) return;

                        // Find the term in the term library to check for signals
                        const slotTermsForSignals = termLibrary[slotId] || [];
                        const selectedTerm = slotTermsForSignals.find(t => t.label === selectedValue);

                        const updates = {
                          playCallParts: { ...formData.playCallParts, [slotId]: selectedValue }
                        };

                        // Apply any signals from the selected term
                        if (selectedTerm?.signals) {
                          const signals = selectedTerm.signals;
                          // Auto-fill signaled fields
                          if (signals.playType) {
                            updates.playType = signals.playType;
                          }
                          // Add signaled values to playCallParts for other fields
                          Object.entries(signals).forEach(([key, value]) => {
                            if (key !== 'playType' && value) {
                              // Auto-fill other playCallParts if they're empty
                              if (!formData.playCallParts?.[key]) {
                                updates.playCallParts[key] = value;
                              }
                            }
                          });
                        }

                        setFormData(prev => ({ ...prev, ...updates }));
                      };

                      // Check if this slot's value was auto-filled by a signal
                      const wasAutoFilled = (() => {
                        // Check all terms in the library for signals that match this slot
                        const allTerms = Object.values(termLibrary).flat();
                        return allTerms.some(termGroup => {
                          if (Array.isArray(termGroup)) {
                            return termGroup.some(t =>
                              t.signals?.[slot.id] === slotValue &&
                              Object.values(formData.playCallParts || {}).includes(t.label)
                            );
                          }
                          return false;
                        });
                      })();

                      return (
                        <div
                          key={slot.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-sky-500', 'bg-sky-500/10');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-sky-500', 'bg-sky-500/10');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-sky-500', 'bg-sky-500/10');
                            const word = e.dataTransfer.getData('text/plain');
                            if (word) {
                              handleTermSelection(word, slot.id);
                            }
                          }}
                          className={`p-2 bg-slate-800 border border-dashed rounded-lg transition-colors ${
                            wasAutoFilled ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                              {slot.label}
                            </span>
                            {wasAutoFilled && (
                              <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">auto</span>
                            )}
                          </div>
                          {slotValue ? (
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium text-sm">{slotValue}</span>
                              <button
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  playCallParts: { ...prev.playCallParts, [slot.id]: '' }
                                }))}
                                className="p-0.5 text-slate-400 hover:text-red-400"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : dropdownItems.length > 0 ? (
                            <select
                              onChange={(e) => handleTermSelection(e.target.value, slot.id)}
                              className="w-full px-1 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-400"
                              value=""
                            >
                              <option value="">Select or drop...</option>
                              {dropdownItems.map((item, i) => (
                                <option key={i} value={item}>{item}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-slate-500 text-xs">Drop here</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bucket & Concept Group */}
              <div className="pt-3 border-t border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Bucket
                    </label>
                    <select
                      value={formData.playCategory}
                      onChange={e => setFormData(prev => ({ ...prev, playCategory: e.target.value, bucketId: '' }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">Select Bucket</option>
                      {playBuckets.filter(b => (b.phase || 'OFFENSE') === formData.phase).map(bucket => (
                        <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Concept Group */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Concept Group
                    </label>
                    <select
                      value={formData.bucketId}
                      onChange={e => setFormData(prev => ({ ...prev, bucketId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">Select Group</option>
                      {filteredBuckets.map(bucket => (
                        <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Read Type & Series */}
              <div className="pt-3 border-t border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Read Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      <Eye size={14} className="inline mr-1" />
                      Read Type
                    </label>
                    <select
                      value={formData.readType || ''}
                      onChange={e => setFormData(prev => ({ ...prev, readType: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">No Read</option>
                      {(setupConfig?.readTypes || []).map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.label || rt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Look-Alike Series */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      <Layers size={14} className="inline mr-1" />
                      Look-Alike Series
                    </label>
                    <select
                      value={formData.seriesId || ''}
                      onChange={e => setFormData(prev => ({ ...prev, seriesId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                    >
                      <option value="">None</option>
                      {(setupConfig?.lookAlikeSeries || []).map(series => (
                        <option key={series.id} value={series.id}>{series.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Situations Section - only show if user has defined situations */}
          {(setupConfig?.fieldZones?.length > 0 || setupConfig?.downDistanceCategories?.length > 0 || setupConfig?.specialSituations?.length > 0) && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-400" />
                  Situations
                  {(formData.fieldZones?.length > 0 || formData.downDistance?.length > 0 || formData.situations?.length > 0) && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                      {(formData.fieldZones?.length || 0) + (formData.downDistance?.length || 0) + (formData.situations?.length || 0)}
                    </span>
                  )}
                </span>
              }
              isOpen={expandedSections.situations}
              onToggle={() => toggleSection('situations')}
            >
              <div className="space-y-4">
                {/* Field Zones */}
                {setupConfig?.fieldZones?.length > 0 && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      <MapPin size={12} />
                      Field Zone
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {setupConfig.fieldZones.map(zone => {
                        const isSelected = (formData.fieldZones || []).includes(zone.id);
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => {
                              const current = formData.fieldZones || [];
                              const updated = isSelected
                                ? current.filter(z => z !== zone.id)
                                : [...current, zone.id];
                              setFormData(prev => ({ ...prev, fieldZones: updated }));
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              isSelected
                                ? 'ring-2 ring-offset-1 ring-offset-slate-900'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{
                              backgroundColor: isSelected ? zone.color : 'rgba(100,116,139,0.3)',
                              color: isSelected ? '#fff' : '#94a3b8',
                              ringColor: zone.color
                            }}
                          >
                            {zone.label || zone.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Down & Distance */}
                {setupConfig?.downDistanceCategories?.length > 0 && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      <Hash size={12} />
                      Down & Distance
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {setupConfig.downDistanceCategories.map(dd => {
                        const isSelected = (formData.downDistance || []).includes(dd.id);
                        return (
                          <button
                            key={dd.id}
                            type="button"
                            onClick={() => {
                              const current = formData.downDistance || [];
                              const updated = isSelected
                                ? current.filter(d => d !== dd.id)
                                : [...current, dd.id];
                              setFormData(prev => ({ ...prev, downDistance: updated }));
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              isSelected
                                ? 'ring-2 ring-offset-1 ring-offset-slate-900'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{
                              backgroundColor: isSelected ? dd.color : 'rgba(100,116,139,0.3)',
                              color: isSelected ? '#fff' : '#94a3b8',
                              ringColor: dd.color
                            }}
                          >
                            {dd.label || dd.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Special Situations */}
                {setupConfig?.specialSituations?.length > 0 && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      <AlertTriangle size={12} />
                      Special Situations
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {setupConfig.specialSituations.map(sit => {
                        const isSelected = (formData.situations || []).includes(sit.id);
                        return (
                          <button
                            key={sit.id}
                            type="button"
                            onClick={() => {
                              const current = formData.situations || [];
                              const updated = isSelected
                                ? current.filter(s => s !== sit.id)
                                : [...current, sit.id];
                              setFormData(prev => ({ ...prev, situations: updated }));
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              isSelected
                                ? 'ring-2 ring-offset-1 ring-offset-slate-900'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{
                              backgroundColor: isSelected ? sit.color : 'rgba(100,116,139,0.3)',
                              color: isSelected ? '#fff' : '#94a3b8',
                              ringColor: sit.color
                            }}
                          >
                            {sit.label || sit.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Diagrams Section - Only for Offense */}
          {phase === 'OFFENSE' && (
            <Section
              title="Play Diagrams"
              isOpen={expandedSections.diagrams}
              onToggle={() => toggleSection('diagrams')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WIZ Skill Diagram */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    WIZ Skill Diagram
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Routes, motion paths, and skill player assignments
                  </p>
                  {formData.wizSkillImage ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={formData.wizSkillImage}
                          alt="Skill Diagram"
                          className="w-full max-w-[200px] rounded border border-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, wizSkillImage: null }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : formData.wizSkillData?.length > 0 ? (
                    <div className="space-y-2">
                      <DiagramPreview
                        elements={formData.wizSkillData}
                        width={200}
                        height={133}
                        onClick={() => setShowSkillEditor(true)}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSkillEditor(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-600"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, wizSkillData: null }))}
                          className="px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 flex flex-col">
                      <button
                        type="button"
                        onClick={() => setShowSkillEditor(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors"
                      >
                        <Edit3 size={18} />
                        Draw Diagram
                      </button>
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 cursor-pointer transition-colors text-sm">
                        <Upload size={14} />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({ ...prev, wizSkillImage: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* WIZ OL Diagram */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    WIZ OL Diagram
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Blocking assignments for the offensive line
                  </p>
                  {formData.wizOlineImage ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={formData.wizOlineImage}
                          alt="OL Diagram"
                          className="w-full max-w-[200px] rounded border border-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, wizOlineImage: null }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : formData.wizOlineData?.length > 0 || formData.wizOlineRef ? (
                    <div className="space-y-2">
                      {formData.wizOlineRef ? (
                        // Show referenced library scheme
                        <div className="p-3 bg-slate-800 border border-slate-600 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Library size={14} className="text-amber-400" />
                            <span className="text-xs text-amber-400 uppercase">From Library</span>
                          </div>
                          <p className="text-white font-medium">{formData.wizOlineRef.name}</p>
                          {formData.wizOlineRef.diagramData && (
                            <DiagramPreview
                              elements={formData.wizOlineRef.diagramData}
                              width={180}
                              height={120}
                            />
                          )}
                        </div>
                      ) : (
                        <DiagramPreview
                          elements={formData.wizOlineData}
                          width={200}
                          height={133}
                          onClick={() => setShowOLEditor(true)}
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowOLEditor(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-600"
                        >
                          <Edit3 size={14} />
                          {formData.wizOlineRef ? 'Draw Custom' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, wizOlineData: null, wizOlineRef: null }))}
                          className="px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 flex flex-col">
                      <button
                        type="button"
                        onClick={() => setShowOLEditor(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors"
                      >
                        <Edit3 size={18} />
                        Draw Diagram
                      </button>
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 cursor-pointer transition-colors text-sm">
                        <Upload size={14} />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({ ...prev, wizOlineImage: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {(olSchemes.protections.length > 0 || olSchemes.runBlocking.length > 0) && (
                        <button
                          type="button"
                          onClick={() => setShowOLLibrary(true)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Library size={12} />
                          or select from WIZ Library
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Complementary Plays Section */}
          <Section
            title={
              <span className="flex items-center gap-2">
                <Handshake size={16} className="text-emerald-400" />
                Complementary Plays
                {formData.complementaryPlays?.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                    {formData.complementaryPlays.length}
                  </span>
                )}
              </span>
            }
            isOpen={expandedSections.complementary}
            onToggle={() => toggleSection('complementary')}
          >
            <div className="space-y-4">
              {/* Existing Complements */}
              {formData.complementaryPlays?.length > 0 && (
                <div className="space-y-2">
                  {formData.complementaryPlays.map((comp, idx) => {
                    const compPlay = getPlayById(comp.playId);
                    const typeInfo = COMPLEMENT_TYPES.find(t => t.id === comp.type);
                    if (!compPlay) return null;
                    return (
                      <div
                        key={`${comp.playId}-${comp.type}-${idx}`}
                        className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: typeInfo?.color || '#64748b', color: '#fff' }}
                          >
                            {typeInfo?.label || comp.type}
                          </span>
                          <span className="text-sm text-white">
                            {compPlay.formation ? `${compPlay.formation} ` : ''}{compPlay.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveComplementary(comp.playId, comp.type)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Complement */}
              <div className="flex gap-2">
                <select
                  id="editor-complement-type-select"
                  className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Type...</option>
                  {COMPLEMENT_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <select
                  id="editor-complement-play-select"
                  className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white"
                  defaultValue=""
                  onChange={(e) => {
                    const typeSelect = document.getElementById('editor-complement-type-select');
                    if (e.target.value && typeSelect.value) {
                      handleAddComplementary(e.target.value, typeSelect.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Select play to link...</option>
                  {complementaryPlayOptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.formation ? `${p.formation} ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>

              {complementaryPlayOptions.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  No other plays available in this phase to link.
                </p>
              )}

              <p className="text-xs text-slate-500">
                Link plays as audibles, if/then sequences, or look-alikes.
              </p>
            </div>
          </Section>

          {/* Mark as incomplete checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="incomplete"
              checked={formData.incomplete}
              onChange={e => setFormData(prev => ({ ...prev, incomplete: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="incomplete" className="text-sm text-slate-400">
              Mark as incomplete (needs diagram or more info)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800">
          <div>
            {isEditing && onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Play'}
            </button>
          </div>
        </div>
      </div>

      {/* WIZ Skill Diagram Editor Modal */}
      {showSkillEditor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden">
            <PlayDiagramEditor
              mode="wiz-skill"
              initialData={formData.wizSkillData ? { elements: formData.wizSkillData } : null}
              onSave={(data) => {
                setFormData(prev => ({ ...prev, wizSkillData: data.elements }));
                setShowSkillEditor(false);
              }}
              onCancel={() => setShowSkillEditor(false)}
            />
          </div>
        </div>
      )}

      {/* WIZ OL Diagram Editor Modal */}
      {showOLEditor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 rounded-lg w-[95vw] h-[95vh] overflow-hidden">
            <PlayDiagramEditor
              mode="wiz-oline"
              initialData={formData.wizOlineData ? { elements: formData.wizOlineData } : null}
              onSave={(data) => {
                setFormData(prev => ({ ...prev, wizOlineData: data.elements, wizOlineRef: null }));
                setShowOLEditor(false);
              }}
              onCancel={() => setShowOLEditor(false)}
            />
          </div>
        </div>
      )}

      {/* WIZ OL Library Selection Modal */}
      {showOLLibrary && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Select from WIZ Library</h3>
              <button
                onClick={() => setShowOLLibrary(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Pass Protections */}
              {olSchemes.protections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Pass Protections
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {olSchemes.protections.map(prot => (
                      <button
                        key={prot.id}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            wizOlineRef: { id: prot.id, name: prot.name, type: 'protection', diagramData: prot.diagramData },
                            wizOlineData: null
                          }));
                          setShowOLLibrary(false);
                        }}
                        className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-sky-500 transition-colors text-left"
                      >
                        <p className="font-medium text-white mb-2">{prot.name}</p>
                        <DiagramPreview
                          elements={prot.diagramData}
                          width={150}
                          height={100}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Run Blocking */}
              {olSchemes.runBlocking.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Run Blocking Schemes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {olSchemes.runBlocking.map(scheme => (
                      <button
                        key={scheme.id}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            wizOlineRef: { id: scheme.id, name: scheme.name, type: 'runBlocking', diagramData: scheme.diagramData },
                            wizOlineData: null
                          }));
                          setShowOLLibrary(false);
                        }}
                        className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-sky-500 transition-colors text-left"
                      >
                        <p className="font-medium text-white mb-2">{scheme.name}</p>
                        <DiagramPreview
                          elements={scheme.diagramData}
                          width={150}
                          height={100}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {olSchemes.protections.length === 0 && olSchemes.runBlocking.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Library size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No OL schemes with diagrams in your library yet.</p>
                  <p className="text-sm mt-2">
                    Add diagrams in System Setup → WIZ Library for OL
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Series Prompt Modal */}
      {showSeriesPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-slate-700">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Link2 size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Create a Series?</h3>
                <p className="text-sm text-slate-400">
                  You've linked {pendingSeriesPlays.length} plays together
                </p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-300">
                Would you like to create a Look-Alike Series from these linked plays?
                Series make it easy to filter and view related plays together.
              </p>

              {/* Show linked plays */}
              <div className="bg-slate-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Plays in series:</p>
                <div className="space-y-1">
                  {pendingSeriesPlays.map(playId => {
                    const p = getPlayById(playId);
                    if (!p) return null;
                    return (
                      <div key={playId} className="text-sm text-white">
                        {p.formation ? `${p.formation} ` : ''}{p.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Series name input */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Series Name
                </label>
                <input
                  type="text"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  placeholder="e.g., Inside Zone Series, Mesh Series..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowSeriesPrompt(false);
                  setPendingSeriesPlays([]);
                  setSeriesName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600"
              >
                No Thanks
              </button>
              <button
                onClick={handleCreateSeries}
                disabled={!seriesName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Link2 size={16} />
                Create Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible section component
function Section({ title, isOpen, onToggle, children }) {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 text-left"
      >
        <span className="font-medium text-white">{title}</span>
        {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
