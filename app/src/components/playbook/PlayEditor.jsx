import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, Trash2, Upload, Image as ImageIcon, ChevronDown, ChevronRight, Edit3, Library, GripVertical, ArrowRight } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import PlayDiagramEditor from '../diagrams/PlayDiagramEditor';
import DiagramPreview from '../diagrams/DiagramPreview';

// Tag categories
const TAG_CATEGORIES = {
  "Down & Distance": ["1st Down", "2nd & Long", "2nd & Medium", "2nd & Short", "3rd & Long", "3rd & Medium", "3rd & Short", "4th Down"],
  "Field Position": ["Backed Up", "Minus Territory", "Plus Territory", "Fringe", "Red Zone", "Gold Zone", "Goal Line"],
  "Situation": ["2-Min Offense", "4-Min Offense", "Must Score", "Clock Running", "Openers"],
  "Motion": ["Jet", "Orbit", "Zoom", "Rocket", "Fly", "Shift"],
  "Play Type": ["Run", "Pass", "RPO", "Play Action", "Screen", "Gadget"],
};

// Hash preferences
const HASH_OPTIONS = ['Any', 'Left', 'Middle', 'Right'];

// Play types
const PLAY_TYPES = ['Fastball', 'Curveball', 'Change Up', 'Strikeout'];

// Action types
const ACTION_TYPES = ['Strong Run', 'Weak Run', 'Quick Game', 'Drop Back', 'Boot/Naked', 'Screen', 'RPO'];

// Field zones
const FIELD_ZONES = ['Fringe', 'Red Zone', 'Gold Zone', 'Goal Line'];

export default function PlayEditor({
  play = null,
  isOpen,
  onClose,
  onSave,
  onDelete,
  formations = [],
  playBuckets = [],
  conceptGroups = [],
  phase = 'OFFENSE'
}) {
  const { setupConfig } = useSchool();
  const isEditing = !!play;

  // Get OL schemes from setup config for library selection
  const olSchemes = useMemo(() => {
    const protections = (setupConfig?.passProtections || []).filter(p => p.diagramData?.length > 0);
    const runBlocking = (setupConfig?.runBlocking || []).filter(r => r.diagramData?.length > 0);
    return { protections, runBlocking };
  }, [setupConfig]);

  // Get play call chain syntax for current phase
  const playCallSyntax = useMemo(() => {
    const phaseKey = phase === 'SPECIAL_TEAMS' ? 'SPECIAL_TEAMS' : phase;
    return setupConfig?.syntax?.[phaseKey] || [];
  }, [setupConfig, phase]);

  // Get term library for current phase
  const termLibrary = useMemo(() => {
    const phaseKey = phase === 'SPECIAL_TEAMS' ? 'SPECIAL_TEAMS' : phase;
    return setupConfig?.termLibrary?.[phaseKey] || {};
  }, [setupConfig, phase]);

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
    playType: '',
    actionTypes: [],
    hashPreference: 'Any',
    baseType: '',
    fieldZones: [],
    downDistance: [],
    concept: '',
    incomplete: false,
  });

  const [loading, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    playCall: true,
    diagrams: true,
    tags: false,
    callSheet: false,
    advanced: false
  });

  // Initialize form with play data when editing
  useEffect(() => {
    if (play) {
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
        playType: play.playType || '',
        actionTypes: play.actionTypes || [],
        hashPreference: play.hashPreference || 'Any',
        baseType: play.baseType || '',
        fieldZones: play.fieldZones || [],
        downDistance: play.downDistance || [],
        concept: play.concept || '',
        incomplete: play.incomplete || false,
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
        playType: '',
        actionTypes: [],
        hashPreference: 'Any',
        baseType: '',
        fieldZones: [],
        downDistance: [],
        concept: '',
        incomplete: false,
        // Diagram fields
        wizSkillData: null,
        wizOlineData: null,
        wizOlineRef: null,
        // Play call chain parts
        playCallParts: {},
      });
    }
  }, [play, phase]);

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleActionType = (type) => {
    setFormData(prev => ({
      ...prev,
      actionTypes: prev.actionTypes.includes(type)
        ? prev.actionTypes.filter(t => t !== type)
        : [...prev.actionTypes, type]
    }));
  };

  const toggleFieldZone = (zone) => {
    setFormData(prev => ({
      ...prev,
      fieldZones: prev.fieldZones.includes(zone)
        ? prev.fieldZones.filter(z => z !== zone)
        : [...prev.fieldZones, zone]
    }));
  };

  const toggleDownDistance = (dd) => {
    setFormData(prev => ({
      ...prev,
      downDistance: prev.downDistance.includes(dd)
        ? prev.downDistance.filter(d => d !== dd)
        : [...prev.downDistance, dd]
    }));
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
                    {/* Show tokens from play name */}
                    {formData.name ? (
                      formData.name.split(/\s+/).filter(w => w.trim()).map((word, idx) => {
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
                      <span className="text-slate-500 text-sm italic">Enter play name above to see tokens</span>
                    )}
                  </div>

                  {/* Syntax slots */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {playCallSyntax.map((slot) => {
                      const slotValue = formData.playCallParts?.[slot.id] || '';
                      const slotTerms = termLibrary[slot.id] || [];

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
                              setFormData(prev => ({
                                ...prev,
                                playCallParts: { ...prev.playCallParts, [slot.id]: word }
                              }));
                            }
                          }}
                          className="p-2 bg-slate-800 border border-dashed border-slate-600 rounded-lg transition-colors"
                        >
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                            {slot.label}
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
                          ) : slotTerms.length > 0 ? (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  setFormData(prev => ({
                                    ...prev,
                                    playCallParts: { ...prev.playCallParts, [slot.id]: e.target.value }
                                  }));
                                }
                              }}
                              className="w-full px-1 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-400"
                              value=""
                            >
                              <option value="">Select or drop...</option>
                              {slotTerms.map(term => (
                                <option key={term.id} value={term.label}>{term.label}</option>
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
            </div>
          </Section>

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

          {/* Tags Section */}
          <Section
            title="Tags & Situations"
            isOpen={expandedSections.tags}
            onToggle={() => toggleSection('tags')}
          >
            <div className="space-y-4">
              {/* Quick tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Tag 1</label>
                  <input
                    type="text"
                    value={formData.tag1}
                    onChange={e => setFormData(prev => ({ ...prev, tag1: e.target.value }))}
                    placeholder="e.g., Motion"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Tag 2</label>
                  <input
                    type="text"
                    value={formData.tag2}
                    onChange={e => setFormData(prev => ({ ...prev, tag2: e.target.value }))}
                    placeholder="e.g., Check"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Tag categories */}
              {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category}>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-2">
                    {category}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Call Sheet Section */}
          <Section
            title="Call Sheet Settings"
            isOpen={expandedSections.callSheet}
            onToggle={() => toggleSection('callSheet')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wristband Slot */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Wristband Slot
                </label>
                <input
                  type="text"
                  value={formData.wristbandSlot}
                  onChange={e => setFormData(prev => ({ ...prev, wristbandSlot: e.target.value }))}
                  placeholder="e.g., 101"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500"
                />
              </div>

              {/* Staples Slot */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Staples Slot
                </label>
                <input
                  type="text"
                  value={formData.staplesSlot}
                  onChange={e => setFormData(prev => ({ ...prev, staplesSlot: e.target.value }))}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500"
                />
              </div>

              {/* Hash Preference */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Hash Preference
                </label>
                <select
                  value={formData.hashPreference}
                  onChange={e => setFormData(prev => ({ ...prev, hashPreference: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                >
                  {HASH_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Play Type */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Play Type
                </label>
                <select
                  value={formData.playType}
                  onChange={e => setFormData(prev => ({ ...prev, playType: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                >
                  <option value="">Select Type</option>
                  {PLAY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Action Types */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Action Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACTION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleActionType(type)}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        formData.actionTypes.includes(type)
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Zones */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Field Zones
                </label>
                <div className="flex flex-wrap gap-2">
                  {FIELD_ZONES.map(zone => (
                    <button
                      key={zone}
                      onClick={() => toggleFieldZone(zone)}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        formData.fieldZones.includes(zone)
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
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
