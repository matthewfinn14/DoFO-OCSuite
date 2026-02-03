import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Save, Trash2, Upload, ChevronDown, ChevronRight, Edit3, Library, GripVertical, Handshake, Link2, MapPin, Hash, AlertTriangle, Eye, Layers, History, Calendar, ClipboardList, Trophy, Star, Film } from 'lucide-react';
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
  const { setupConfig, updateSetupConfig, weeks, settings } = useSchool();
  const isLight = settings?.theme === 'light';
  const isEditing = !!play;

  // Get OL schemes from setup config for library selection
  const olSchemes = useMemo(() => {
    const protections = (setupConfig?.passProtections || []).filter(p => p.diagramData?.length > 0);
    const runBlocking = (setupConfig?.runBlocking || []).filter(r => r.diagramData?.length > 0);
    return { protections, runBlocking };
  }, [setupConfig]);

  // Get position colors and names from setup config for WIZ Skill editor
  const positionColors = useMemo(() => setupConfig?.positionColors || {}, [setupConfig?.positionColors]);
  const positionNames = useMemo(() => setupConfig?.positionNames || {}, [setupConfig?.positionNames]);
  const positionWizAbbreviations = useMemo(() => setupConfig?.positionWizAbbreviations || {}, [setupConfig?.positionWizAbbreviations]);
  const personnelGroupings = useMemo(() => setupConfig?.personnelGroupings || [], [setupConfig?.personnelGroupings]);
  const customDefaultPositions = useMemo(() => setupConfig?.defaultFormationPositions || {}, [setupConfig?.defaultFormationPositions]);

  // Handler to save a new formation template
  const handleSaveFormation = useCallback((newFormation) => {
    const existingFormations = setupConfig?.formations || [];
    const updatedFormations = [...existingFormations, newFormation];
    updateSetupConfig({ formations: updatedFormations });
  }, [setupConfig?.formations, updateSetupConfig]);

  // Handler to save custom default positions
  const handleSaveDefaultPositions = useCallback((positions) => {
    updateSetupConfig({ defaultFormationPositions: positions });
  }, [updateSetupConfig]);

  // Get offense positions (non-OL) from setup config for WIZ Skill editor
  // Core skill positions match Setup.jsx defaults: QB, RB, X, Y, Z, H
  // WR, FB, TE, F are NOT defaults - must be added as custom positions
  const offensePositions = useMemo(() => {
    const hidden = setupConfig?.hiddenPositions?.OFFENSE || [];
    const custom = setupConfig?.customPositions?.OFFENSE || [];
    const coreSkillPositions = ['QB', 'RB', 'X', 'Y', 'Z', 'H'];
    const visible = coreSkillPositions.filter(p => !hidden.includes(p));
    const customKeys = custom.map(p => p.key).filter(Boolean);
    return [...visible, ...customKeys];
  }, [setupConfig?.hiddenPositions?.OFFENSE, setupConfig?.customPositions?.OFFENSE]);

  // Calculate play history - finds all practice script instances, game calls, and film reviews for this play
  const playHistory = useMemo(() => {
    if (!play?.id || !weeks) return { practiceInstances: [], gameInstances: [], filmReviews: [] };

    const practiceInstances = [];
    const gameInstances = [];

    // Search through all weeks for practice script instances
    (weeks || []).forEach(week => {
      // Check practice plans - handle both array and object formats
      const plans = Array.isArray(week.practicePlans)
        ? week.practicePlans
        : Object.values(week.practicePlans || {});
      plans.forEach(plan => {
        const segments = Array.isArray(plan?.segments) ? plan.segments : [];
        segments.forEach(segment => {
          const script = Array.isArray(segment?.script) ? segment.script : [];
          script.forEach((row, rowIndex) => {
            if (row.playId === play.id) {
              practiceInstances.push({
                type: 'practice',
                weekId: week.id,
                weekName: week.name || `Week ${week.weekNumber || ''}`,
                opponent: week.opponent,
                date: plan.date,
                planName: plan.name || 'Practice',
                segmentName: segment.name || segment.title || 'Segment',
                rowIndex: rowIndex + 1,
                hash: row.hash,
                tempo: row.tempo,
                notes: row.notes
              });
            }
          });
        });
      });

      // Check game call log (if exists) - placeholder for future feature
      const gameLog = Array.isArray(week.gameCallLog) ? week.gameCallLog : [];
      gameLog.forEach(call => {
        if (call.playId === play.id) {
          gameInstances.push({
            type: 'game',
            weekId: week.id,
            weekName: week.name || `Week ${week.weekNumber || ''}`,
            opponent: week.opponent,
            date: week.gameDate,
            quarter: call.quarter,
            down: call.down,
            distance: call.distance,
            fieldPosition: call.fieldPosition,
            result: call.result,
            yards: call.yards,
            notes: call.notes
          });
        }
      });
    });

    // Get film reviews from the play itself
    const filmReviews = (play.filmReviews || []).sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    // Sort by date (most recent first)
    practiceInstances.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    gameInstances.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    return { practiceInstances, gameInstances, filmReviews };
  }, [play?.id, play?.filmReviews, weeks]);

  // Play type options for offense
  const PLAY_TYPES = [
    { id: 'quick', label: 'Quick', icon: '⚡' },
    { id: 'single', label: 'Single', icon: '1️⃣' },
    { id: 'pass', label: 'Pass', icon: '🏈' },
    { id: 'run', label: 'Run', icon: '🏃' },
  ];

  // Separate state for play type and bucket to avoid hook ordering issues
  const [selectedPlayType, setSelectedPlayType] = useState('quick');
  const [selectedBucketId, setSelectedBucketId] = useState('');

  // Check setup mode (basic, standard, advanced)
  const setupMode = setupConfig?.setupMode?.[phase] || 'standard';
  const isBasicMode = setupMode === 'basic';
  const isStandardMode = setupMode === 'standard';
  const isAdvancedMode = setupMode === 'advanced';

  // Get play call chain syntax for current phase based on bucket (advanced) or play type (standard)
  const playCallSyntax = useMemo(() => {
    const phaseKey = phase === 'SPECIAL_TEAMS' ? 'SPECIAL_TEAMS' : phase;
    const playType = selectedPlayType || 'quick';

    // In advanced mode, check for bucket-specific syntax first
    if (isAdvancedMode && selectedBucketId) {
      const buckets = setupConfig?.playBuckets || [];
      const selectedBucket = buckets.find(b => b.id === selectedBucketId);
      if (selectedBucket?.syntax?.length > 0) {
        return selectedBucket.syntax;
      }
    }

    // Standard mode: check syntaxTemplates for the specific play type
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
  }, [setupConfig, phase, selectedPlayType, isAdvancedMode, selectedBucketId]);

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

  // Template search state for WIZ SKILL
  const [skillTemplateSearch, setSkillTemplateSearch] = useState('');
  const [showSkillTemplateDropdown, setShowSkillTemplateDropdown] = useState(false);

  // OL Library search state
  const [olLibrarySearch, setOlLibrarySearch] = useState('');
  const [showOLLibraryDropdown, setShowOLLibraryDropdown] = useState(false);

  // Get plays with wizSkillData for template selection
  const playsWithSkillDiagrams = useMemo(() => {
    return availablePlays.filter(p => p.wizSkillData?.length > 0 && p.id !== play?.id);
  }, [availablePlays, play?.id]);

  // Filter skill templates based on search
  const filteredSkillTemplates = useMemo(() => {
    if (!skillTemplateSearch) return playsWithSkillDiagrams.slice(0, 10);
    const search = skillTemplateSearch.toLowerCase();
    return playsWithSkillDiagrams.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.formation?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [playsWithSkillDiagrams, skillTemplateSearch]);

  // Combine OL schemes for search
  const allOLSchemes = useMemo(() => {
    return [
      ...olSchemes.protections.map(p => ({ ...p, schemeType: 'protection' })),
      ...olSchemes.runBlocking.map(r => ({ ...r, schemeType: 'runBlocking' }))
    ];
  }, [olSchemes]);

  // Filter OL schemes based on search
  const filteredOLSchemes = useMemo(() => {
    if (!olLibrarySearch) return allOLSchemes.slice(0, 10);
    const search = olLibrarySearch.toLowerCase();
    return allOLSchemes.filter(s => s.name?.toLowerCase().includes(search)).slice(0, 10);
  }, [allOLSchemes, olLibrarySearch]);

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
    hashPreference: 'any',
    baseType: '',
    fieldZones: [],
    downDistance: [],
    situations: [],
    readType: '',
    seriesId: '',
    concept: '',
    incomplete: false,
    complementaryPlays: [],
    // New categorization fields
    playRating: '', // How do we like it? (love, like, situational, developing)
    playObjectives: [], // What are we trying to accomplish? (efficiency, convert, score, break-keys)
    setupPlayId: '', // Play that sets this one up
    premiumLooks: '', // Notes on fronts/coverages/blitzes this is good against
    targetProgressions: [], // Who are we targeting? Array of {position, isPrimary, order}
    // Sub-level playbook assignments
    levelPlaybooks: [],
    // Skill position assignments (route/responsibility for each position)
    skillAssignments: {},
  });

  // Extract skill positions from the WIZ Skill diagram (non-OL players in the diagram)
  // Uses the LABEL (what's displayed) not positionKey (the internal identifier)
  const diagramSkillPositions = useMemo(() => {
    const OL_POSITIONS = ['LT', 'LG', 'C', 'RG', 'RT', 'T', 'G'];
    const diagramData = formData.wizSkillData || [];
    const positions = new Set();

    diagramData.forEach(el => {
      // Only include player elements that aren't OL
      if (el.type === 'player' && el.label) {
        // Skip OL positions (by label)
        if (!OL_POSITIONS.includes(el.label)) {
          positions.add(el.label);
        }
      }
    });

    // Return as array, maintaining a reasonable order based on common position names
    const orderedPositions = ['QB', 'BB', 'RB', 'FB', 'WR', 'TE', 'X', 'Y', 'Z', 'H', 'F', 'A'];
    const result = orderedPositions.filter(p => positions.has(p));
    // Add any positions not in the standard order
    positions.forEach(p => {
      if (!result.includes(p)) result.push(p);
    });

    return result;
  }, [formData.wizSkillData]);

  const [loading, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    playCall: true,
    situations: false,
    gameplan: false,
    diagrams: true,
    assignments: false,
    complementary: false,
    levels: false,
    advanced: false,
    history: false
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
      setSelectedBucketId(play.playCategory || '');
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
        hashPreference: play.hashPreference || 'any',
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
        // New categorization fields
        playRating: play.playRating || '',
        playObjectives: play.playObjectives || [],
        setupPlayId: play.setupPlayId || '',
        premiumLooks: play.premiumLooks || '',
        targetProgressions: play.targetProgressions || [],
        // Sub-level playbook assignments
        levelPlaybooks: play.levelPlaybooks || [],
        // Skill position assignments
        skillAssignments: play.skillAssignments || {},
      });
    } else {
      // Reset form for new play
      setSelectedPlayType('quick');
      setSelectedBucketId('');
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
        hashPreference: 'any',
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
        // New categorization fields
        playRating: '',
        playObjectives: [],
        setupPlayId: '',
        premiumLooks: '',
        targetProgressions: [],
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

  // Add new bucket from dropdown
  const handleAddNewBucket = async () => {
    const name = prompt('New bucket name:');
    if (!name?.trim()) return;

    const newBucket = {
      id: `bucket-${Date.now()}`,
      label: name.trim(),
      phase: formData.phase || 'OFFENSE',
      color: '#3b82f6'
    };

    const existing = setupConfig?.playBuckets || [];
    await updateSetupConfig({ playBuckets: [...existing, newBucket] });

    // Auto-select the new bucket
    setFormData(prev => ({ ...prev, playCategory: newBucket.id, bucketId: '' }));
  };

  // Add new concept group from dropdown
  const handleAddNewConceptGroup = async () => {
    const currentBucketId = selectedBucketId || formData.playCategory;
    if (!currentBucketId) {
      alert('Please select a bucket first');
      return;
    }

    const name = prompt('New concept group name:');
    if (!name?.trim()) return;

    const newGroup = {
      id: `concept-${Date.now()}`,
      label: name.trim(),
      name: name.trim(),
      categoryId: currentBucketId,
      phase: formData.phase || 'OFFENSE'
    };

    const existing = setupConfig?.conceptGroups || [];
    await updateSetupConfig({ conceptGroups: [...existing, newGroup] });

    // Auto-select the new group
    setFormData(prev => ({ ...prev, bucketId: newGroup.id }));
  };

  // Add new read type from dropdown
  const handleAddNewReadType = async () => {
    const name = prompt('New read type name:');
    if (!name?.trim()) return;

    const newReadType = {
      id: `read-${Date.now()}`,
      label: name.trim(),
      name: name.trim()
    };

    const existing = setupConfig?.readTypes || [];
    await updateSetupConfig({ readTypes: [...existing, newReadType] });

    // Auto-select the new read type
    setFormData(prev => ({ ...prev, readType: newReadType.id }));
  };

  // Add new look-alike series from dropdown
  const handleAddNewSeries = async () => {
    const name = prompt('New look-alike series name:');
    if (!name?.trim()) return;

    const newSeries = {
      id: `series-${Date.now()}`,
      name: name.trim(),
      description: '',
      playIds: []
    };

    const existing = setupConfig?.lookAlikeSeries || [];
    await updateSetupConfig({ lookAlikeSeries: [...existing, newSeries] });

    // Auto-select the new series
    setFormData(prev => ({ ...prev, seriesId: newSeries.id }));
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

      // Auto-create formation if it doesn't exist in the library (offense only)
      if (formData.formation && phase === 'OFFENSE') {
        const existingFormations = setupConfig?.formations || [];
        const formationExists = existingFormations.some(
          f => f.name.toUpperCase() === formData.formation.toUpperCase() && f.phase === 'OFFENSE'
        );

        if (!formationExists) {
          // Create new formation entry without diagram (positions: null)
          const newFormation = {
            id: `form_${Date.now()}`,
            name: formData.formation.toUpperCase(),
            personnel: '',
            families: [],
            positions: null, // Will be set when diagram is created in Setup
            phase: 'OFFENSE',
            createdAt: new Date().toISOString(),
            source: 'play-editor' // Mark as auto-created
          };

          // Add to formations list
          await updateSetupConfig({ formations: [...existingFormations, newFormation] });
        }
      }

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800'}`}>
          <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {isEditing ? 'Edit Play' : 'New Play'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-md ${isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isLight ? 'bg-gray-100' : ''}`}>
          {/* Play Call Section */}
          <Section
            title="Play Call"
            isOpen={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
            isLight={isLight}
          >
            <div className="space-y-4">
              {/* BASIC MODE: Single text field for entire play call */}
              {isBasicMode && (
                <div>
                  <label htmlFor="play-editor-name-basic" className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-slate-400'}`}>
                    Play Call *
                  </label>
                  <input
                    id="play-editor-name-basic"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter entire play call (e.g., Trips Right Z Motion 94 Mesh)"
                    className={`w-full px-3 py-3 border rounded-md text-lg font-medium ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'}`}
                    autoFocus
                  />
                  <div className={`mt-2 px-3 py-2 rounded-md flex items-center justify-between ${isLight ? 'bg-sky-50 border border-sky-200' : 'bg-slate-700/30'}`}>
                    <div>
                      <span className={`text-xs uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Play: </span>
                      <span className={`font-semibold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        {formData.name || '...'}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${isLight ? 'text-gray-500 bg-gray-200' : 'text-slate-400/70 bg-slate-600/30'}`}>
                      Basic Mode
                    </span>
                  </div>
                  <p className={`mt-2 text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                    Type your play call exactly as you say it. No parsing - just simple entry for practice scripts and game plans.
                  </p>
                </div>
              )}

              {/* STANDARD MODE: Formation + Motion/Tag + Play Name */}
              {isStandardMode && (
                <div>
                  <label htmlFor="play-editor-formation-standard" className="block text-sm font-medium text-slate-400 mb-1">
                    Full Play Call *
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="play-editor-formation-standard"
                      type="text"
                      value={formData.formation}
                      onChange={e => setFormData(prev => ({ ...prev, formation: e.target.value }))}
                      list="formations-list"
                      placeholder="Formation"
                      className="w-1/4 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 text-lg font-medium"
                    />
                    <input
                      id="play-editor-motion-tag-standard"
                      type="text"
                      value={formData.formationTag || ''}
                      onChange={e => setFormData(prev => ({ ...prev, formationTag: e.target.value }))}
                      placeholder="Motion/Tag (optional)"
                      className="w-1/4 px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 text-base"
                    />
                    <input
                      id="play-editor-name-standard"
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
                  <div className="mt-2 px-3 py-2 bg-slate-700/30 rounded-md flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Full Call: </span>
                      <span className="text-emerald-400 font-semibold">
                        {formData.formation || formData.formationTag || formData.name
                          ? [formData.formation, formData.formationTag, formData.name].filter(Boolean).join(' ')
                          : '...'}
                      </span>
                    </div>
                    <span className="text-xs text-green-500/70 bg-green-500/10 px-2 py-0.5 rounded">
                      Standard Mode
                    </span>
                  </div>
                </div>
              )}

              {/* ADVANCED MODE: Full Call first, then Bucket/Concept, then Breakdown */}
              {isAdvancedMode && (
                <>
                  {/* Full Play Call - at the top */}
                  <div>
                    <label htmlFor="play-editor-formation-advanced" className="block text-sm font-medium text-slate-400 mb-1">
                      Full Play Call *
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="play-editor-formation-advanced"
                        type="text"
                        value={formData.formation}
                        onChange={e => setFormData(prev => ({ ...prev, formation: e.target.value }))}
                        list="formations-list"
                        placeholder="Formation"
                        className="w-1/3 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 text-lg font-medium"
                        autoFocus
                      />
                      <input
                        id="play-editor-name-advanced"
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
                    <div className="mt-2 px-3 py-2 bg-slate-700/30 rounded-md flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Full Call: </span>
                        <span className="text-emerald-400 font-semibold">
                          {formData.formation || formData.name
                            ? `${formData.formation}${formData.formation && formData.name ? ' ' : ''}${formData.name}`
                            : '...'}
                        </span>
                      </div>
                      <span className="text-xs text-purple-500/70 bg-purple-500/10 px-2 py-0.5 rounded">
                        Advanced Mode
                      </span>
                    </div>
                  </div>

                  {/* Bucket & Concept Group Selectors - below Full Play Call */}
                  {phase === 'OFFENSE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="play-editor-bucket-advanced" className="block text-sm font-medium text-slate-400 mb-2">
                          Play Bucket <span className="text-slate-500">(determines syntax)</span>
                        </label>
                        <select
                          id="play-editor-bucket-advanced"
                          value={selectedBucketId}
                          onChange={e => {
                            if (e.target.value === '__add_new__') {
                              handleAddNewBucket();
                            } else {
                              setSelectedBucketId(e.target.value);
                              setFormData(prev => ({ ...prev, playCategory: e.target.value, bucketId: '' }));
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-white"
                        >
                          <option value="">Select Bucket...</option>
                          {playBuckets.filter(b => (b.phase || 'OFFENSE') === formData.phase).map(bucket => (
                            <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                          ))}
                          <option value="__add_new__" className="text-sky-400">+ Add New Bucket...</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="play-editor-concept-group-advanced" className="block text-sm font-medium text-slate-400 mb-2">
                          Concept Group
                        </label>
                        <select
                          id="play-editor-concept-group-advanced"
                          value={formData.bucketId || ''}
                          onChange={e => {
                            if (e.target.value === '__add_new__') {
                              handleAddNewConceptGroup();
                            } else {
                              setFormData(prev => ({ ...prev, bucketId: e.target.value }));
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-white"
                          disabled={!selectedBucketId}
                        >
                          <option value="">{selectedBucketId ? 'Select Group...' : 'Select bucket first'}</option>
                          {conceptGroups
                            .filter(cg => cg.categoryId === selectedBucketId)
                            .map(group => (
                              <option key={group.id} value={group.id}>{group.label}</option>
                            ))}
                          {selectedBucketId && <option value="__add_new__" className="text-sky-400">+ Add New Concept Group...</option>}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Bucket & Concept Group */}
              {!isBasicMode && !(isAdvancedMode && phase === 'OFFENSE') && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label htmlFor="play-editor-bucket" className="block text-sm font-medium text-slate-400 mb-1">
                        Bucket
                      </label>
                      <select
                        id="play-editor-bucket"
                        value={formData.playCategory}
                        onChange={e => {
                          if (e.target.value === '__add_new__') {
                            handleAddNewBucket();
                          } else {
                            setFormData(prev => ({ ...prev, playCategory: e.target.value, bucketId: '' }));
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                      >
                        <option value="">Select Bucket</option>
                        {playBuckets.filter(b => (b.phase || 'OFFENSE') === formData.phase).map(bucket => (
                          <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                        ))}
                        <option value="__add_new__" className="text-sky-400">+ Add New Bucket...</option>
                      </select>
                    </div>

                    {/* Concept Group */}
                    <div>
                      <label htmlFor="play-editor-concept-group" className="block text-sm font-medium text-slate-400 mb-1">
                        Concept Group
                      </label>
                      <select
                        id="play-editor-concept-group"
                        value={formData.bucketId}
                        onChange={e => {
                          if (e.target.value === '__add_new__') {
                            handleAddNewConceptGroup();
                          } else {
                            setFormData(prev => ({ ...prev, bucketId: e.target.value }));
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                      >
                        <option value="">Select Group</option>
                        {filteredBuckets.map(bucket => (
                          <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
                        ))}
                        <option value="__add_new__" className="text-sky-400">+ Add New Concept Group...</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Read Type & Series - hidden in Basic mode */}
              {!isBasicMode && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Read Type */}
                    <div>
                      <label htmlFor="play-editor-read-type" className="block text-sm font-medium text-slate-400 mb-1">
                        <Eye size={14} className="inline mr-1" />
                        Read Type
                      </label>
                      <select
                        id="play-editor-read-type"
                        value={formData.readType || ''}
                        onChange={e => {
                          if (e.target.value === '__add_new__') {
                            handleAddNewReadType();
                          } else {
                            setFormData(prev => ({ ...prev, readType: e.target.value }));
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                      >
                        <option value="">No Read</option>
                        {(setupConfig?.readTypes || []).map(rt => (
                          <option key={rt.id} value={rt.id}>{rt.label || rt.name}</option>
                        ))}
                        <option value="__add_new__" className="text-sky-400">+ Add New Read Type...</option>
                      </select>
                    </div>

                    {/* Look-Alike Series */}
                    <div>
                      <label htmlFor="play-editor-series" className="block text-sm font-medium text-slate-400 mb-1">
                        <Layers size={14} className="inline mr-1" />
                        Look-Alike Series
                      </label>
                      <select
                        id="play-editor-series"
                        value={formData.seriesId || ''}
                        onChange={e => {
                          if (e.target.value === '__add_new__') {
                            handleAddNewSeries();
                          } else {
                            setFormData(prev => ({ ...prev, seriesId: e.target.value }));
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                      >
                        <option value="">None</option>
                        {(setupConfig?.lookAlikeSeries || []).map(series => (
                          <option key={series.id} value={series.id}>{series.name}</option>
                        ))}
                        <option value="__add_new__" className="text-sky-400">+ Add New Series...</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
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
              isLight={isLight}
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

                {/* Hash Preference */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    <Hash size={12} />
                    Hash Preference
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'left', label: 'Left Hash', icon: '◀' },
                      { id: 'middle', label: 'Middle', icon: '⬛' },
                      { id: 'right', label: 'Right Hash', icon: '▶' },
                      { id: 'any', label: 'Any Hash', icon: '↔' },
                    ].map(hash => {
                      const isSelected = formData.hashPreference === hash.id;
                      return (
                        <button
                          key={hash.id}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            hashPreference: isSelected ? '' : hash.id
                          }))}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-sky-600 text-white ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900'
                              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                          }`}
                        >
                          <span>{hash.icon}</span>
                          {hash.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Diagrams Section - Only for Offense */}
          {phase === 'OFFENSE' && (
            <Section
              title="Play Diagrams"
              isOpen={expandedSections.diagrams}
              onToggle={() => toggleSection('diagrams')}
              isLight={isLight}
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
                        mode="wiz-skill"
                        width="100%"
                        onClick={() => setShowSkillEditor(true)}
                        positionColors={positionColors}
                        positionNames={positionNames}
                        positionWizAbbreviations={positionWizAbbreviations}
                      />
                      {/* Start from Template Search - when diagram exists */}
                      {playsWithSkillDiagrams.length > 0 && (
                        <div className="relative">
                          <label className="block text-xs text-slate-500 mb-1">Start from Template</label>
                          <input
                            type="text"
                            placeholder="Search existing plays..."
                            value={skillTemplateSearch}
                            onChange={(e) => {
                              setSkillTemplateSearch(e.target.value);
                              setShowSkillTemplateDropdown(true);
                            }}
                            onFocus={() => setShowSkillTemplateDropdown(true)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                          {showSkillTemplateDropdown && filteredSkillTemplates.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                              {filteredSkillTemplates.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, wizSkillData: [...p.wizSkillData] }));
                                    setSkillTemplateSearch('');
                                    setShowSkillTemplateDropdown(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                                >
                                  <span>{p.formation ? `${p.formation} ` : ''}{p.name}</span>
                                  <span className="text-xs text-slate-500">Use as template</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {showSkillTemplateDropdown && (
                            <div className="fixed inset-0 z-40" onClick={() => setShowSkillTemplateDropdown(false)} />
                          )}
                        </div>
                      )}
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
                      {/* Start from Template Search */}
                      {playsWithSkillDiagrams.length > 0 && (
                        <div className="relative">
                          <label className="block text-xs text-slate-500 mb-1">Start from Template</label>
                          <input
                            type="text"
                            placeholder="Search existing plays..."
                            value={skillTemplateSearch}
                            onChange={(e) => {
                              setSkillTemplateSearch(e.target.value);
                              setShowSkillTemplateDropdown(true);
                            }}
                            onFocus={() => setShowSkillTemplateDropdown(true)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                          {showSkillTemplateDropdown && filteredSkillTemplates.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                              {filteredSkillTemplates.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, wizSkillData: [...p.wizSkillData] }));
                                    setSkillTemplateSearch('');
                                    setShowSkillTemplateDropdown(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                                >
                                  <span>{p.formation ? `${p.formation} ` : ''}{p.name}</span>
                                  <span className="text-xs text-slate-500">Use as template</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {showSkillTemplateDropdown && (
                            <div className="fixed inset-0 z-40" onClick={() => setShowSkillTemplateDropdown(false)} />
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSkillEditor(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors"
                      >
                        <Edit3 size={18} />
                        Draw Diagram
                      </button>
                      <label htmlFor="play-editor-wiz-skill-upload" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 cursor-pointer transition-colors text-sm">
                        <Upload size={14} />
                        Upload Image
                        <input
                          id="play-editor-wiz-skill-upload"
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
                              mode="wiz-oline"
                              width="100%"
                              positionColors={positionColors}
                              positionNames={positionNames}
                              positionWizAbbreviations={positionWizAbbreviations}
                            />
                          )}
                        </div>
                      ) : (
                        <DiagramPreview
                          elements={formData.wizOlineData}
                          mode="wiz-oline"
                          width="100%"
                          onClick={() => setShowOLEditor(true)}
                          positionColors={positionColors}
                          positionNames={positionNames}
                          positionWizAbbreviations={positionWizAbbreviations}
                        />
                      )}
                      {/* Search for Pre-existing OL Scheme - when diagram exists */}
                      {allOLSchemes.length > 0 && (
                        <div className="relative">
                          <label className="block text-xs text-slate-500 mb-1">Search for Pre-existing</label>
                          <input
                            type="text"
                            placeholder="Search OL library..."
                            value={olLibrarySearch}
                            onChange={(e) => {
                              setOlLibrarySearch(e.target.value);
                              setShowOLLibraryDropdown(true);
                            }}
                            onFocus={() => setShowOLLibraryDropdown(true)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                          {showOLLibraryDropdown && filteredOLSchemes.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                              {filteredOLSchemes.map(scheme => (
                                <button
                                  key={scheme.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      wizOlineRef: {
                                        id: scheme.id,
                                        name: scheme.name,
                                        type: scheme.schemeType,
                                        diagramData: scheme.diagramData
                                      },
                                      wizOlineData: null
                                    }));
                                    setOlLibrarySearch('');
                                    setShowOLLibraryDropdown(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                                >
                                  <span className="flex items-center gap-2">
                                    <Library size={12} className="text-amber-400" />
                                    {scheme.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {scheme.schemeType === 'protection' ? 'Protection' : 'Run'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {showOLLibraryDropdown && (
                            <div className="fixed inset-0 z-40" onClick={() => setShowOLLibraryDropdown(false)} />
                          )}
                        </div>
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
                      {/* Search for Pre-existing OL Scheme - between Draw Diagram and Upload Image */}
                      <div className="relative">
                        <label className="block text-xs text-slate-500 mb-1">Search for Pre-existing</label>
                        <input
                          type="text"
                          placeholder={allOLSchemes.length > 0 ? "Search OL library..." : "No schemes in library yet"}
                          value={olLibrarySearch}
                          onChange={(e) => {
                            setOlLibrarySearch(e.target.value);
                            setShowOLLibraryDropdown(true);
                          }}
                          onFocus={() => allOLSchemes.length > 0 && setShowOLLibraryDropdown(true)}
                          disabled={allOLSchemes.length === 0}
                          className={`w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${allOLSchemes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {showOLLibraryDropdown && filteredOLSchemes.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                            {filteredOLSchemes.map(scheme => (
                              <button
                                key={scheme.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    wizOlineRef: {
                                      id: scheme.id,
                                      name: scheme.name,
                                      type: scheme.schemeType,
                                      diagramData: scheme.diagramData
                                    },
                                    wizOlineData: null
                                  }));
                                  setOlLibrarySearch('');
                                  setShowOLLibraryDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                              >
                                <span className="flex items-center gap-2">
                                  <Library size={12} className="text-amber-400" />
                                  {scheme.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {scheme.schemeType === 'protection' ? 'Protection' : 'Run'}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {showOLLibraryDropdown && (
                          <div className="fixed inset-0 z-40" onClick={() => setShowOLLibraryDropdown(false)} />
                        )}
                      </div>
                      <label htmlFor="play-editor-wiz-oline-upload" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 cursor-pointer transition-colors text-sm">
                        <Upload size={14} />
                        Upload Image
                        <input
                          id="play-editor-wiz-oline-upload"
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
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Skill Position Assignments Section - Only for Offense */}
          {phase === 'OFFENSE' && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-sky-400" />
                  Skill Position Assignments
                  {Object.values(formData.skillAssignments || {}).filter(v => v).length > 0 && (
                    <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded">
                      {Object.values(formData.skillAssignments || {}).filter(v => v).length}
                    </span>
                  )}
                </span>
              }
              isOpen={expandedSections.assignments}
              onToggle={() => toggleSection('assignments')}
              isLight={isLight}
            >
              <p className="text-xs text-slate-500 mb-4">
                Define route/responsibility for each skill position. These auto-populate to Skills & Drills.
              </p>
              {diagramSkillPositions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {diagramSkillPositions.map(pos => (
                    <div key={pos}>
                      <label className="text-xs text-slate-400 font-medium block mb-1">{pos}</label>
                      <input
                        type="text"
                        value={formData.skillAssignments?.[pos] || ''}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          skillAssignments: {
                            ...(prev.skillAssignments || {}),
                            [pos]: e.target.value
                          }
                        }))}
                        placeholder="Route/Assignment"
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Add a WIZ Skill diagram to define position assignments
                </p>
              )}
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
            isLight={isLight}
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
                  id="play-editor-complement-type"
                  className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Type...</option>
                  {COMPLEMENT_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <select
                  id="play-editor-complement-play"
                  className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-md text-white"
                  defaultValue=""
                  onChange={(e) => {
                    const typeSelect = document.getElementById('play-editor-complement-type');
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

          {/* Sub-Level Playbooks Section - Show if program levels exist */}
          {(setupConfig?.programLevels?.length > 0) && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <Layers size={16} className="text-purple-400" />
                  Sub-Level Playbooks
                  {formData.levelPlaybooks?.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                      {formData.levelPlaybooks.length}
                    </span>
                  )}
                </span>
              }
              isOpen={expandedSections.levels}
              onToggle={() => toggleSection('levels')}
              isLight={isLight}
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Assign this play to lower-level playbooks (JV, Freshman, etc.) to share it across your program.
                </p>

                {/* Level checkboxes */}
                <div className="space-y-2">
                  {setupConfig.programLevels.map(level => {
                    const isAssigned = (formData.levelPlaybooks || []).includes(level.id);
                    return (
                      <label
                        key={level.id}
                        htmlFor={`play-editor-level-${level.id}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isAssigned
                            ? 'bg-purple-500/10 border-purple-500/50'
                            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <input
                          id={`play-editor-level-${level.id}`}
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {
                            const current = formData.levelPlaybooks || [];
                            const updated = isAssigned
                              ? current.filter(id => id !== level.id)
                              : [...current, level.id];
                            setFormData(prev => ({ ...prev, levelPlaybooks: updated }));
                          }}
                          className="w-4 h-4 rounded text-purple-500 bg-slate-700 border-slate-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{level.name}</span>
                            {level.abbreviation && (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                                {level.abbreviation}
                              </span>
                            )}
                          </div>
                          {level.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{level.description}</p>
                          )}
                        </div>
                        {isAssigned && (
                          <span className="text-purple-400 text-xs font-medium">Assigned</span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {formData.levelPlaybooks?.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <Layers size={14} className="text-purple-400" />
                    <span className="text-xs text-slate-400">
                      This play is shared with {formData.levelPlaybooks.length} sub-level playbook{formData.levelPlaybooks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Play History Section - Only show when editing existing play */}
          {isEditing && (
            <Section
              title={
                <span className="flex items-center gap-2">
                  <History size={16} className="text-sky-400" />
                  Play History
                  {(playHistory.practiceInstances.length + playHistory.gameInstances.length + playHistory.filmReviews.length) > 0 && (
                    <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded">
                      {playHistory.practiceInstances.length + playHistory.gameInstances.length + playHistory.filmReviews.length}
                    </span>
                  )}
                  {playHistory.filmReviews.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-amber-400">
                        {(playHistory.filmReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / playHistory.filmReviews.length).toFixed(1)}
                      </span>
                    </span>
                  )}
                </span>
              }
              isOpen={expandedSections.history}
              onToggle={() => toggleSection('history')}
              isLight={isLight}
            >
              <div className="space-y-4">
                {/* Practice Instances */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList size={14} className="text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">Practice Scripts</span>
                    <span className="text-xs text-slate-500">({playHistory.practiceInstances.length})</span>
                  </div>
                  {playHistory.practiceInstances.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {playHistory.practiceInstances.map((instance, idx) => (
                        <div
                          key={`practice-${idx}`}
                          className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded border border-slate-700/50 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar size={12} className="text-slate-500" />
                            <span className="text-slate-300">{instance.date || 'No date'}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{instance.weekName}</span>
                            {instance.opponent && (
                              <>
                                <span className="text-slate-500">vs</span>
                                <span className="text-amber-400">{instance.opponent}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{instance.segmentName}</span>
                            {instance.hash && (
                              <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                                {instance.hash}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No practice script instances found</p>
                  )}
                </div>

                {/* Game Instances */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={14} className="text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">Game Calls</span>
                    <span className="text-xs text-slate-500">({playHistory.gameInstances.length})</span>
                  </div>
                  {playHistory.gameInstances.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {playHistory.gameInstances.map((instance, idx) => (
                        <div
                          key={`game-${idx}`}
                          className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded border border-slate-700/50 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar size={12} className="text-slate-500" />
                            <span className="text-slate-300">{instance.date || 'No date'}</span>
                            {instance.opponent && (
                              <>
                                <span className="text-slate-500">vs</span>
                                <span className="text-amber-400">{instance.opponent}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            {instance.quarter && <span>Q{instance.quarter}</span>}
                            {instance.down && instance.distance && (
                              <span>{instance.down}&{instance.distance}</span>
                            )}
                            {instance.result && (
                              <span className={`px-1.5 py-0.5 rounded ${
                                instance.result === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                                instance.result === 'negative' ? 'bg-red-500/20 text-red-400' :
                                'bg-slate-700 text-slate-400'
                              }`}>
                                {instance.yards !== undefined ? `${instance.yards > 0 ? '+' : ''}${instance.yards} yds` : instance.result}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No game call data yet - Post-game summaries will appear here</p>
                  )}
                </div>

                {/* Film Reviews */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Film size={14} className="text-violet-400" />
                    <span className="text-sm font-medium text-slate-300">Film Reviews</span>
                    <span className="text-xs text-slate-500">({playHistory.filmReviews.length})</span>
                    {playHistory.filmReviews.length > 0 && (
                      <span className="flex items-center gap-1 ml-2">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-400">
                          {(playHistory.filmReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / playHistory.filmReviews.length).toFixed(1)}
                        </span>
                      </span>
                    )}
                  </div>
                  {playHistory.filmReviews.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {playHistory.filmReviews.map((review, idx) => (
                        <div
                          key={`film-${idx}`}
                          className="px-3 py-2 bg-slate-800/50 rounded border border-slate-700/50 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-300">{review.weekName}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{review.day}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={12}
                                  className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                                />
                              ))}
                            </div>
                          </div>
                          {(review.workedTags?.length > 0 || review.didntWorkTags?.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {review.workedTags?.map(tagId => (
                                <span key={tagId} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">
                                  {tagId}
                                </span>
                              ))}
                              {review.didntWorkTags?.map(tagId => (
                                <span key={tagId} className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px]">
                                  {tagId}
                                </span>
                              ))}
                            </div>
                          )}
                          {review.notes && (
                            <p className="text-slate-500 mt-1 truncate">{review.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No film reviews yet - Review plays in Practice Review</p>
                  )}
                </div>

                {/* Summary stats */}
                {(playHistory.practiceInstances.length + playHistory.gameInstances.length + playHistory.filmReviews.length) > 0 && (
                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>
                        <strong className="text-emerald-400">{playHistory.practiceInstances.length}</strong> practice reps
                      </span>
                      <span>
                        <strong className="text-amber-400">{playHistory.gameInstances.length}</strong> game calls
                      </span>
                      <span>
                        <strong className="text-violet-400">{playHistory.filmReviews.length}</strong> film reviews
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Mark as incomplete checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="play-editor-incomplete"
              checked={formData.incomplete}
              onChange={e => setFormData(prev => ({ ...prev, incomplete: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="play-editor-incomplete" className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Mark as incomplete (needs diagram or more info)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800'}`}>
          <div>
            {isEditing && onDelete && (
              <button
                onClick={handleDelete}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
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
              formations={formations}
              personnelGroupings={personnelGroupings}
              playBuckets={playBuckets}
              availablePlays={availablePlays}
              offensePositions={offensePositions}
              positionColors={positionColors}
              positionNames={positionNames}
              positionWizAbbreviations={positionWizAbbreviations}
              customDefaultPositions={customDefaultPositions}
              onSaveDefaultPositions={handleSaveDefaultPositions}
              playName={formData.formation ? `${formData.formation} ${formData.name}` : formData.name}
              onSaveFormation={handleSaveFormation}
              onSave={(data) => {
                setFormData(prev => ({ ...prev, wizSkillData: data.elements }));
                setShowSkillEditor(false);
              }}
              onOverwritePlay={async ({ playId, wizSkillData }) => {
                // Find and update the existing play
                const existingPlay = availablePlays.find(p => p.id === playId);
                if (existingPlay && onSave) {
                  try {
                    await onSave({ ...existingPlay, wizSkillData });
                    setShowSkillEditor(false);
                    alert(`Play "${existingPlay.formation ? `${existingPlay.formation} ${existingPlay.name}` : existingPlay.name}" updated!`);
                  } catch (err) {
                    console.error('Error overwriting play:', err);
                    alert('Failed to overwrite play: ' + err.message);
                  }
                }
              }}
              onSaveAsNewPlay={async (newPlayData) => {
                // Save current diagram to form, then create a new play
                setFormData(prev => ({ ...prev, wizSkillData: newPlayData.wizSkillData }));
                setShowSkillEditor(false);

                // Create a new play with the provided data
                const newPlay = {
                  id: `play-${Date.now()}`,
                  name: newPlayData.name,
                  phase: phase,
                  bucketId: newPlayData.bucketId,
                  wizSkillData: newPlayData.wizSkillData,
                  formation: formData.formation || '',
                  createdAt: new Date().toISOString()
                };

                try {
                  await onSave(newPlay);
                  alert(`Play "${newPlayData.name}" saved to library!`);
                } catch (err) {
                  console.error('Error saving new play:', err);
                  alert('Failed to save play: ' + err.message);
                }
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
              initialData={formData.wizOlineData ? { elements: formData.wizOlineData } : (formData.wizOlineRef?.diagramData ? { elements: formData.wizOlineRef.diagramData } : null)}
              playName={formData.formation ? `${formData.formation} ${formData.name}` : formData.name}
              olCallText={formData.wizOlineRef?.name || ''}
              olSchemes={olSchemes}
              onSaveToOLLibrary={({ elements: diagramElements, name, type, overwrite }) => {
                // Save to the OL library in setupConfig
                const currentProtections = setupConfig?.passProtections || [];
                const currentRunBlocking = setupConfig?.runBlocking || [];

                if (type === 'protection') {
                  const existingIndex = currentProtections.findIndex(p => p.name?.toUpperCase() === name.toUpperCase());
                  const newProt = {
                    id: overwrite && existingIndex >= 0 ? currentProtections[existingIndex].id : Date.now().toString(),
                    name: name.toUpperCase(),
                    slideDirection: 'right',
                    manSide: 'left',
                    callText: '',
                    notes: '',
                    diagramData: diagramElements
                  };

                  let updatedList;
                  if (overwrite && existingIndex >= 0) {
                    updatedList = [...currentProtections];
                    updatedList[existingIndex] = newProt;
                  } else {
                    updatedList = [...currentProtections, newProt];
                  }
                  updateSetupConfig({ passProtections: updatedList });
                } else {
                  const existingIndex = currentRunBlocking.findIndex(s => s.name?.toUpperCase() === name.toUpperCase());
                  const newScheme = {
                    id: overwrite && existingIndex >= 0 ? currentRunBlocking[existingIndex].id : Date.now().toString(),
                    name: name.toUpperCase(),
                    type: 'zone',
                    callText: '',
                    notes: '',
                    diagramData: diagramElements
                  };

                  let updatedList;
                  if (overwrite && existingIndex >= 0) {
                    updatedList = [...currentRunBlocking];
                    updatedList[existingIndex] = newScheme;
                  } else {
                    updatedList = [...currentRunBlocking, newScheme];
                  }
                  updateSetupConfig({ runBlocking: updatedList });
                }
              }}
              onSave={(data) => {
                if (data.wizOlineRef) {
                  // Saving to library - link play to the scheme
                  setFormData(prev => ({
                    ...prev,
                    wizOlineRef: data.wizOlineRef,
                    wizOlineData: null,
                    olCall: data.wizOlineRef.name
                  }));
                } else if (data.elements) {
                  // Legacy: direct save
                  setFormData(prev => ({ ...prev, wizOlineData: data.elements, wizOlineRef: null }));
                }
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
                          positionColors={positionColors}
                          positionNames={positionNames}
                          positionWizAbbreviations={positionWizAbbreviations}
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
                          positionColors={positionColors}
                          positionNames={positionNames}
                          positionWizAbbreviations={positionWizAbbreviations}
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
                <label htmlFor="play-editor-series-name" className="block text-sm font-medium text-slate-400 mb-1">
                  Series Name
                </label>
                <input
                  id="play-editor-series-name"
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
function Section({ title, isOpen, onToggle, children, isLight = false }) {
  return (
    <div className={`border rounded-lg overflow-hidden ${isLight ? 'border-gray-200 bg-white' : 'border-slate-800'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 text-left ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-800/50'}`}
      >
        <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</span>
        {isOpen ? <ChevronDown size={18} className={isLight ? 'text-gray-500' : 'text-slate-400'} /> : <ChevronRight size={18} className={isLight ? 'text-gray-500' : 'text-slate-400'} />}
      </button>
      {isOpen && (
        <div className={`p-4 ${isLight ? 'bg-white' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}
