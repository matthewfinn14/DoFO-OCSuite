import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Clock,
  CheckCircle,
  Circle,
  Plus,
  Trash2,
  Edit2,
  X,
  Timer,
  Users,
  Clipboard,
  Flag
} from 'lucide-react';

// Default pregame schedule template
const DEFAULT_SCHEDULE = [
  { id: 1, time: -120, name: 'Locker Room Opens', category: 'logistics', completed: false },
  { id: 2, time: -90, name: 'Team Arrives / Dress', category: 'logistics', completed: false },
  { id: 3, time: -75, name: 'Offensive Walk-through', category: 'warmup', completed: false },
  { id: 4, time: -60, name: 'Defensive Walk-through', category: 'warmup', completed: false },
  { id: 5, time: -50, name: 'Special Teams Review', category: 'warmup', completed: false },
  { id: 6, time: -45, name: 'Take Field for Warmups', category: 'warmup', completed: false },
  { id: 7, time: -40, name: 'Dynamic Stretch', category: 'warmup', completed: false },
  { id: 8, time: -30, name: 'Position Groups', category: 'warmup', completed: false },
  { id: 9, time: -20, name: 'Special Teams Warmup', category: 'warmup', completed: false },
  { id: 10, time: -15, name: 'Return to Locker Room', category: 'logistics', completed: false },
  { id: 11, time: -10, name: 'Final Meeting / Prayer', category: 'team', completed: false },
  { id: 12, time: -5, name: 'Captains for Coin Toss', category: 'team', completed: false },
  { id: 13, time: 0, name: 'KICKOFF', category: 'game', completed: false }
];

// Categories
const CATEGORIES = [
  { id: 'logistics', label: 'Logistics', color: '#6b7280' },
  { id: 'warmup', label: 'Warmup', color: '#f59e0b' },
  { id: 'team', label: 'Team', color: '#3b82f6' },
  { id: 'game', label: 'Game', color: '#22c55e' }
];

export default function Pregame() {
  const { weeks, currentWeekId, updateWeeks } = useSchool();

  const [gameTime, setGameTime] = useState('19:00'); // 7:00 PM default
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Get current week
  const currentWeek = weeks.find(w => w.id === currentWeekId);

  // Get pregame schedule
  const schedule = currentWeek?.pregameSchedule || DEFAULT_SCHEDULE;

  // Calculate actual times based on game time
  const scheduleWithTimes = useMemo(() => {
    const [hours, minutes] = gameTime.split(':').map(Number);
    const gameMinutes = hours * 60 + minutes;

    return schedule.map(item => {
      const itemMinutes = gameMinutes + item.time;
      const itemHours = Math.floor(itemMinutes / 60) % 24;
      const itemMins = ((itemMinutes % 60) + 60) % 60;
      const actualTime = `${itemHours.toString().padStart(2, '0')}:${itemMins.toString().padStart(2, '0')}`;

      return { ...item, actualTime };
    }).sort((a, b) => a.time - b.time);
  }, [schedule, gameTime]);

  // Save schedule to week
  const saveSchedule = (newSchedule) => {
    if (!currentWeekId) return;

    const newWeeks = weeks.map(w =>
      w.id === currentWeekId ? { ...w, pregameSchedule: newSchedule } : w
    );
    updateWeeks(newWeeks);
  };

  // Toggle item completion
  const toggleComplete = (itemId) => {
    const newSchedule = schedule.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    saveSchedule(newSchedule);
  };

  // Open editor
  const openEditor = (item = null) => {
    setEditingItem(item || {
      id: Date.now(),
      time: -30,
      name: '',
      category: 'warmup',
      completed: false
    });
    setShowEditor(true);
  };

  // Save item
  const saveItem = () => {
    if (!editingItem?.name) return;

    const exists = schedule.find(i => i.id === editingItem.id);
    let newSchedule;

    if (exists) {
      newSchedule = schedule.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      newSchedule = [...schedule, editingItem];
    }

    saveSchedule(newSchedule);
    setShowEditor(false);
    setEditingItem(null);
  };

  // Delete item
  const deleteItem = (itemId) => {
    if (!confirm('Delete this item?')) return;
    const newSchedule = schedule.filter(i => i.id !== itemId);
    saveSchedule(newSchedule);
  };

  // Reset schedule
  const resetSchedule = () => {
    if (!confirm('Reset to default schedule? This will remove any customizations.')) return;
    saveSchedule(DEFAULT_SCHEDULE);
  };

  // Format time relative to kickoff
  const formatRelativeTime = (minutes) => {
    if (minutes === 0) return 'Kickoff';
    if (minutes < 0) {
      const absMinutes = Math.abs(minutes);
      if (absMinutes >= 60) {
        const hrs = Math.floor(absMinutes / 60);
        const mins = absMinutes % 60;
        return `-${hrs}:${mins.toString().padStart(2, '0')}`;
      }
      return `-${absMinutes} min`;
    }
    return `+${minutes} min`;
  };

  // Get category config
  const getCategoryConfig = (categoryId) =>
    CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  // Progress calculation
  const completedCount = schedule.filter(i => i.completed).length;
  const progressPercent = schedule.length > 0 ? (completedCount / schedule.length) * 100 : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Pregame Schedule</h1>
          <p className="text-slate-400">
            {currentWeek ? `Week ${currentWeek.number} vs ${currentWeek.opponent || 'TBD'}` : 'No week selected'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Kickoff:</span>
            <input
              type="time"
              value={gameTime}
              onChange={e => setGameTime(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Pregame Progress</span>
          <span className="text-slate-400">{completedCount} of {schedule.length} complete</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Schedule</h3>
          <button
            onClick={resetSchedule}
            className="text-sm text-slate-400 hover:text-white"
          >
            Reset to Default
          </button>
        </div>

        <div className="space-y-2">
          {scheduleWithTimes.map((item, idx) => {
            const category = getCategoryConfig(item.category);
            const isKickoff = item.time === 0;

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  item.completed ? 'bg-green-500/10' : 'bg-slate-800'
                } ${isKickoff ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Completion Toggle */}
                <button
                  onClick={() => toggleComplete(item.id)}
                  className={`flex-shrink-0 ${item.completed ? 'text-green-400' : 'text-slate-500'}`}
                >
                  {item.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                </button>

                {/* Time */}
                <div className="w-20 text-center">
                  <div className="text-lg font-bold text-white">{item.actualTime}</div>
                  <div className="text-xs text-slate-500">{formatRelativeTime(item.time)}</div>
                </div>

                {/* Category indicator */}
                <div
                  className="w-1 h-10 rounded-full"
                  style={{ backgroundColor: category.color }}
                />

                {/* Content */}
                <div className="flex-1">
                  <div className={`font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {item.name}
                  </div>
                  <div className="text-xs" style={{ color: category.color }}>
                    {category.label}
                  </div>
                </div>

                {/* Actions */}
                {!isKickoff && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditor(item)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Legend */}
      <div className="mt-4 flex items-center gap-6">
        {CATEGORIES.map(category => (
          <div key={category.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm text-slate-400">{category.label}</span>
          </div>
        ))}
      </div>

      {/* Item Editor Modal */}
      {showEditor && editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {schedule.find(i => i.id === editingItem.id) ? 'Edit Item' : 'Add Item'}
              </h3>
              <button
                onClick={() => { setShowEditor(false); setEditingItem(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Team Stretch"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Time Before Kickoff (minutes)</label>
                <input
                  type="number"
                  value={Math.abs(editingItem.time)}
                  onChange={e => setEditingItem({ ...editingItem, time: -Math.abs(parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  min="0"
                  max="180"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter the number of minutes before kickoff (e.g., 30 for "-30 min")
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setEditingItem({ ...editingItem, category: category.id })}
                      className={`p-2 rounded-lg text-sm ${
                        editingItem.category === category.id
                          ? 'ring-2'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      style={{
                        backgroundColor: editingItem.category === category.id ? `${category.color}20` : undefined,
                        color: editingItem.category === category.id ? category.color : '#94a3b8',
                        ringColor: category.color
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowEditor(false); setEditingItem(null); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={!editingItem.name}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
