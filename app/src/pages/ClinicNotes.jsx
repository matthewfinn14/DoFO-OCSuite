import { useState, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  NotebookPen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Save,
  X,
  Heart,
  Dumbbell,
  Sun,
  Swords,
  Shield,
  Zap,
  ClipboardList,
  Calendar
} from 'lucide-react';

const CATEGORIES = [
  { id: 'culture', name: 'Culture', icon: Heart, color: 'rose' },
  { id: 'practice', name: 'Practice', icon: ClipboardList, color: 'sky' },
  { id: 'weight-room', name: 'Weight Room', icon: Dumbbell, color: 'amber' },
  { id: 'summer', name: 'Summer Program', icon: Sun, color: 'yellow' },
  { id: 'offense', name: 'Offense', icon: Swords, color: 'emerald' },
  { id: 'defense', name: 'Defense', icon: Shield, color: 'purple' },
  { id: 'special-teams', name: 'Special Teams', icon: Zap, color: 'orange' }
];

function NoteCard({ note, onEdit, onDelete, isLight }) {
  return (
    <div className={`p-4 rounded-lg ${
      isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {note.title}
          </h4>
          <p className={`text-sm whitespace-pre-wrap ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            {note.content}
          </p>
          {note.source && (
            <p className={`text-xs mt-2 ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
              Source: {note.source}
            </p>
          )}
          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded ${
                    isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(note)}
            className={`p-1.5 rounded ${isLight ? 'hover:bg-gray-200' : 'hover:bg-slate-700'}`}
          >
            <Edit2 size={14} className={isLight ? 'text-gray-400' : 'text-slate-500'} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className={`p-1.5 rounded ${isLight ? 'hover:bg-red-100' : 'hover:bg-red-500/20'}`}
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, category, onSave, onCancel, isLight }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [source, setSource] = useState(note?.source || '');
  const [tagsInput, setTagsInput] = useState(note?.tags?.join(', ') || '');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    onSave({
      id: note?.id || `note_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      source: source.trim(),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      category,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${
      isLight ? 'bg-white border-sky-300' : 'bg-slate-800 border-sky-500/50'
    }`}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className={`w-full px-3 py-2 rounded border mb-3 ${
          isLight
            ? 'bg-gray-50 border-gray-300 text-gray-900'
            : 'bg-slate-900 border-slate-600 text-white'
        }`}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you learn? (terminology, scheme, drills, approach...)"
        rows={4}
        className={`w-full px-3 py-2 rounded border mb-3 resize-none ${
          isLight
            ? 'bg-gray-50 border-gray-300 text-gray-900'
            : 'bg-slate-900 border-slate-600 text-white'
        }`}
      />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source (clinic, coach, book...)"
          className={`w-full px-3 py-2 rounded border text-sm ${
            isLight
              ? 'bg-gray-50 border-gray-300 text-gray-900'
              : 'bg-slate-900 border-slate-600 text-white'
          }`}
        />
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (comma separated)"
          className={`w-full px-3 py-2 rounded border text-sm ${
            isLight
              ? 'bg-gray-50 border-gray-300 text-gray-900'
              : 'bg-slate-900 border-slate-600 text-white'
          }`}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className={`px-3 py-1.5 rounded text-sm ${
            isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-400 hover:bg-slate-700'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || !content.trim()}
          className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-white rounded text-sm hover:bg-sky-600 disabled:opacity-50"
        >
          <Save size={14} />
          Save
        </button>
      </div>
    </div>
  );
}

function CategorySection({ category, notes, onAddNote, onEditNote, onDeleteNote, isLight }) {
  const [expanded, setExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const Icon = category.icon;
  const categoryNotes = notes.filter(n => n.category === category.id);

  const colorClasses = {
    rose: isLight ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/20 text-rose-400',
    sky: isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400',
    amber: isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400',
    yellow: isLight ? 'bg-yellow-100 text-yellow-600' : 'bg-yellow-500/20 text-yellow-400',
    emerald: isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400',
    purple: isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400',
    orange: isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'
  };

  const handleSaveNote = (note) => {
    if (editingNote) {
      onEditNote(note);
      setEditingNote(null);
    } else {
      onAddNote(note);
      setIsAdding(false);
    }
  };

  return (
    <div className={`rounded-xl border ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 ${
          isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[category.color]}`}>
            <Icon size={20} />
          </div>
          <div className="text-left">
            <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {category.name}
            </h3>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              {categoryNotes.length} note{categoryNotes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className={`px-4 pb-4 border-t ${isLight ? 'border-gray-100' : 'border-slate-800'}`}>
          <div className="space-y-3 pt-4">
            {categoryNotes.map(note => (
              editingNote?.id === note.id ? (
                <NoteEditor
                  key={note.id}
                  note={note}
                  category={category.id}
                  onSave={handleSaveNote}
                  onCancel={() => setEditingNote(null)}
                  isLight={isLight}
                />
              ) : (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onDelete={onDeleteNote}
                  isLight={isLight}
                />
              )
            ))}

            {isAdding ? (
              <NoteEditor
                category={category.id}
                onSave={handleSaveNote}
                onCancel={() => setIsAdding(false)}
                isLight={isLight}
              />
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className={`w-full p-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 ${
                  isLight
                    ? 'border-gray-300 text-gray-500 hover:border-gray-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Plus size={18} />
                Add Note
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClinicNotes() {
  const { school, updateSchool, settings } = useSchool();
  const isLight = settings?.theme === 'light';

  // Get notes from school data
  const notes = school?.clinicNotes || [];

  const handleAddNote = useCallback((note) => {
    const updatedNotes = [...notes, note];
    updateSchool({ clinicNotes: updatedNotes });
  }, [notes, updateSchool]);

  const handleEditNote = useCallback((updatedNote) => {
    const updatedNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    updateSchool({ clinicNotes: updatedNotes });
  }, [notes, updateSchool]);

  const handleDeleteNote = useCallback((noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    updateSchool({ clinicNotes: updatedNotes });
  }, [notes, updateSchool]);

  return (
    <div className={`flex-1 overflow-y-auto ${isLight ? 'bg-gray-50' : 'bg-slate-950'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
        isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'
          }`}>
            <NotebookPen size={20} className="text-indigo-500" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Clinic Notes
            </h1>
            <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
              Capture learnings from clinics, research, and conversations
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Info Box */}
        <div className={`mb-6 p-4 rounded-lg ${
          isLight ? 'bg-indigo-50 border border-indigo-200' : 'bg-indigo-500/10 border border-indigo-500/20'
        }`}>
          <p className={`text-sm ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
            Organize notes from clinics, books, podcasts, and conversations with other coaches.
            Capture terminology, scheme ideas, drills, and approach notes by category.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {CATEGORIES.map(category => (
            <CategorySection
              key={category.id}
              category={category}
              notes={notes}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              isLight={isLight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
