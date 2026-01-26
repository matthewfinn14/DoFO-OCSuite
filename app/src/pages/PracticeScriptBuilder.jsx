import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Calendar,
  Plus,
  Printer,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Search,
  Play,
  Copy,
  Settings,
  Save
} from 'lucide-react';

// Practice segment types
const SEGMENT_TYPES = [
  { id: 'warmup', label: 'Warm Up', color: '#22c55e' },
  { id: 'individual', label: 'Individual', color: '#3b82f6' },
  { id: 'group', label: 'Group Work', color: '#a855f7' },
  { id: 'team', label: 'Team', color: '#ef4444' },
  { id: 'special_teams', label: 'Special Teams', color: '#f97316' },
  { id: 'conditioning', label: 'Conditioning', color: '#eab308' },
  { id: 'film', label: 'Film/Meeting', color: '#6b7280' },
  { id: 'break', label: 'Break', color: '#374151' }
];

// Default practice template
const DEFAULT_SEGMENTS = [
  { id: 1, type: 'warmup', name: 'Dynamic Warm Up', duration: 10, plays: [] },
  { id: 2, type: 'individual', name: 'Individual Period', duration: 15, plays: [] },
  { id: 3, type: 'group', name: 'Inside Run', duration: 10, plays: [] },
  { id: 4, type: 'group', name: 'Pass Skelly', duration: 15, plays: [] },
  { id: 5, type: 'team', name: 'Team Period', duration: 20, plays: [] },
  { id: 6, type: 'special_teams', name: 'Special Teams', duration: 10, plays: [] },
  { id: 7, type: 'conditioning', name: 'Conditioning', duration: 10, plays: [] }
];

export default function PracticeScriptBuilder() {
  const { plays, weeks, currentWeekId, setCurrentWeekId, updateWeeks } = useSchool();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSegments, setExpandedSegments] = useState({});
  const [showPlaySelector, setShowPlaySelector] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState('offense');
  const [showSettings, setShowSettings] = useState(false);

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId);

  // Get practice plan for selected date
  const practiceData = useMemo(() => {
    if (!currentWeek?.practices) return null;
    return currentWeek.practices[selectedDate];
  }, [currentWeek, selectedDate]);

  // Get segments for current practice (or use default)
  const segments = practiceData?.segments || DEFAULT_SEGMENTS;

  // Calculate total practice time
  const totalTime = segments.reduce((sum, seg) => sum + (seg.duration || 0), 0);

  // Calculate start times for each segment
  const segmentStartTimes = useMemo(() => {
    const times = {};
    let elapsed = 0;
    const startTime = practiceData?.startTime || '15:00'; // Default 3:00 PM
    const [startHour, startMin] = startTime.split(':').map(Number);

    segments.forEach(seg => {
      const totalMinutes = startHour * 60 + startMin + elapsed;
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      times[seg.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      elapsed += seg.duration || 0;
    });

    return times;
  }, [segments, practiceData?.startTime]);

  // Filter plays for selector
  const filteredPlays = useMemo(() => {
    const phasePlays = plays.filter(p => p.phase === filterPhase);
    if (!searchTerm) return phasePlays;
    return phasePlays.filter(play =>
      play.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      play.formation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plays, searchTerm, filterPhase]);

  // Toggle segment expansion
  const toggleSegment = (segmentId) => {
    setExpandedSegments(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  // Update practice data
  const updatePractice = (updates) => {
    if (!currentWeekId) return;

    const newWeeks = weeks.map(w => {
      if (w.id !== currentWeekId) return w;
      return {
        ...w,
        practices: {
          ...w.practices,
          [selectedDate]: {
            ...practiceData,
            ...updates
          }
        }
      };
    });

    updateWeeks(newWeeks);
  };

  // Update a segment
  const updateSegment = (segmentId, updates) => {
    const newSegments = segments.map(seg =>
      seg.id === segmentId ? { ...seg, ...updates } : seg
    );
    updatePractice({ segments: newSegments });
  };

  // Add a segment
  const addSegment = () => {
    const newId = Math.max(...segments.map(s => s.id), 0) + 1;
    const newSegments = [
      ...segments,
      { id: newId, type: 'team', name: 'New Segment', duration: 10, plays: [] }
    ];
    updatePractice({ segments: newSegments });
    setExpandedSegments(prev => ({ ...prev, [newId]: true }));
  };

  // Remove a segment
  const removeSegment = (segmentId) => {
    const newSegments = segments.filter(seg => seg.id !== segmentId);
    updatePractice({ segments: newSegments });
  };

  // Open play selector for a segment
  const openPlaySelector = (segmentId) => {
    setActiveSegmentId(segmentId);
    setShowPlaySelector(true);
    setSearchTerm('');
  };

  // Add play to segment
  const addPlayToSegment = (playId) => {
    const segment = segments.find(s => s.id === activeSegmentId);
    if (!segment) return;

    const newPlays = [...(segment.plays || []), { playId, reps: 1, notes: '' }];
    updateSegment(activeSegmentId, { plays: newPlays });
  };

  // Remove play from segment
  const removePlayFromSegment = (segmentId, playIndex) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    const newPlays = segment.plays.filter((_, idx) => idx !== playIndex);
    updateSegment(segmentId, { plays: newPlays });
  };

  // Get play by ID
  const getPlay = (playId) => plays.find(p => p.id === playId);

  // Get segment type config
  const getSegmentType = (typeId) =>
    SEGMENT_TYPES.find(t => t.id === typeId) || SEGMENT_TYPES[0];

  // Format time display
  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} min`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Practice Script Builder</h1>
          <p className="text-slate-400">
            {currentWeek ? `Week ${currentWeek.number || '?'}` : 'No week selected'} •
            Total Time: {formatTime(totalTime)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              showSettings ? 'bg-sky-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <Settings size={18} />
            Settings
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Date and Week Selector */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Week:</span>
            <select
              value={currentWeekId || ''}
              onChange={(e) => setCurrentWeekId(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="">Select Week</option>
              {weeks.map(w => (
                <option key={w.id} value={w.id}>
                  Week {w.number || '?'} - {w.opponent || 'TBD'}
                </option>
              ))}
            </select>
          </div>

          {showSettings && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-400">Start Time:</span>
              <input
                type="time"
                value={practiceData?.startTime || '15:00'}
                onChange={(e) => updatePractice({ startTime: e.target.value })}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {segments.map((segment, idx) => {
          const segmentType = getSegmentType(segment.type);
          const isExpanded = expandedSegments[segment.id];
          const startTime = segmentStartTimes[segment.id];

          return (
            <div
              key={segment.id}
              className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
            >
              {/* Segment Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/50"
                onClick={() => toggleSegment(segment.id)}
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: segmentType.color }}
                />

                <button className="text-slate-500 hover:text-white">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateSegment(segment.id, { name: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent font-semibold text-white border-none outline-none focus:bg-slate-800 focus:px-2 focus:rounded"
                    />
                    <span
                      className="px-2 py-0.5 text-xs rounded-full text-white"
                      style={{ backgroundColor: segmentType.color }}
                    >
                      {segmentType.label}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {startTime} • {segment.plays?.length || 0} plays
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-slate-500" />
                    <input
                      type="number"
                      value={segment.duration}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateSegment(segment.id, { duration: parseInt(e.target.value) || 0 });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm text-center"
                      min="0"
                    />
                    <span className="text-slate-500 text-sm">min</span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeSegment(segment.id); }}
                    className="p-2 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Segment Content */}
              {isExpanded && (
                <div className="border-t border-slate-800 p-4">
                  {/* Type Selector */}
                  <div className="mb-4">
                    <label className="text-sm text-slate-400 block mb-2">Segment Type</label>
                    <div className="flex flex-wrap gap-2">
                      {SEGMENT_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => updateSegment(segment.id, { type: type.id })}
                          className={`px-3 py-1 rounded-full text-sm ${
                            segment.type === type.id
                              ? 'text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                          style={{
                            backgroundColor: segment.type === type.id ? type.color : undefined
                          }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plays List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-400">Plays / Cards</label>
                      <button
                        onClick={() => openPlaySelector(segment.id)}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-sky-400 hover:text-sky-300"
                      >
                        <Plus size={14} />
                        Add Play
                      </button>
                    </div>

                    {(!segment.plays || segment.plays.length === 0) ? (
                      <div className="text-center py-6 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                        <Play size={24} className="mx-auto mb-2 text-slate-600" />
                        <p className="text-slate-500 text-sm">No plays added</p>
                        <button
                          onClick={() => openPlaySelector(segment.id)}
                          className="mt-2 text-sky-400 text-sm hover:text-sky-300"
                        >
                          Add plays to this segment
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {segment.plays.map((playEntry, playIdx) => {
                          const play = getPlay(playEntry.playId);
                          if (!play) return null;

                          return (
                            <div
                              key={playIdx}
                              className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg"
                            >
                              <GripVertical size={14} className="text-slate-600" />

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white">{play.name}</div>
                                <div className="text-sm text-slate-500">
                                  {play.formation}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-sm">Reps:</span>
                                <input
                                  type="number"
                                  value={playEntry.reps || 1}
                                  onChange={(e) => {
                                    const newPlays = [...segment.plays];
                                    newPlays[playIdx] = {
                                      ...newPlays[playIdx],
                                      reps: parseInt(e.target.value) || 1
                                    };
                                    updateSegment(segment.id, { plays: newPlays });
                                  }}
                                  className="w-12 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                                  min="1"
                                />
                              </div>

                              <button
                                onClick={() => removePlayFromSegment(segment.id, playIdx)}
                                className="p-1 text-slate-500 hover:text-red-400"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="text-sm text-slate-400 block mb-2">Notes</label>
                    <textarea
                      value={segment.notes || ''}
                      onChange={(e) => updateSegment(segment.id, { notes: e.target.value })}
                      placeholder="Add notes for this segment..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Segment Button */}
        <button
          onClick={addSegment}
          className="w-full py-4 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-slate-400 hover:border-slate-600 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Segment
        </button>
      </div>

      {/* Play Selector Modal */}
      {showPlaySelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Add Play to Segment</h3>
              <button
                onClick={() => { setShowPlaySelector(false); setActiveSegmentId(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search plays..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    autoFocus
                  />
                </div>
                <select
                  value={filterPhase}
                  onChange={e => setFilterPhase(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="offense">Offense</option>
                  <option value="defense">Defense</option>
                  <option value="special_teams">Special Teams</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredPlays.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No plays found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredPlays.map(play => (
                    <button
                      key={play.id}
                      onClick={() => {
                        addPlayToSegment(play.id);
                        setShowPlaySelector(false);
                        setActiveSegmentId(null);
                      }}
                      className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-left"
                    >
                      <div className="font-medium text-white">{play.name}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {play.formation && <span>{play.formation}</span>}
                        {play.bucket && <span> • {play.bucket}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
