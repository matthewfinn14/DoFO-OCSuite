import { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  LayoutTemplate,
  Calendar,
  Clipboard,
  Clock,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';

// Template card component
function TemplateCard({ template, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(template.name);

  const handleSave = () => {
    if (name.trim() && name !== template.name) {
      onRename(template.id, name.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-4 hover:border-slate-500 transition-colors">
      <div className="flex justify-between items-start mb-2">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setName(template.name);
                setIsEditing(false);
              }
            }}
            className="font-semibold text-white bg-slate-600 border border-slate-500 rounded px-2 py-1 flex-1 focus:outline-none focus:border-sky-500"
            autoFocus
          />
        ) : (
          <span
            className="font-semibold text-white cursor-pointer hover:text-sky-300"
            onClick={() => setIsEditing(true)}
          >
            {template.name}
          </span>
        )}
        <button
          onClick={() => onDelete(template.id)}
          className="text-red-400 hover:text-red-300 ml-2 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {template.folder && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <FolderOpen size={12} />
          {template.folder}
        </div>
      )}

      <p className="text-xs text-slate-400 mb-2">
        {template.segments?.length || template.schedule?.length || 0} {template.schedule ? 'items' : 'segments'}
        {template.dayOfWeek && ` • ${template.dayOfWeek}`}
        {template.gameTime && ` • Kickoff: ${template.gameTime}`}
      </p>

      <div className="text-xs text-slate-500">
        Created {new Date(template.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

// Template section with folder grouping
function TemplateSection({ title, description, icon: Icon, templates, onUpdate, accentColor = 'sky' }) {
  const [expandedFolders, setExpandedFolders] = useState({});

  // Group templates by folder
  const grouped = templates.reduce((acc, t) => {
    const folder = t.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(t);
    return acc;
  }, {});

  const folders = Object.keys(grouped).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this template?')) return;
    onUpdate(templates.filter(t => t.id !== id));
  };

  const handleRename = (id, newName) => {
    onUpdate(templates.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const colorClasses = {
    sky: 'bg-sky-500/20 border-sky-500/30 text-sky-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400'
  };

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-4 ${colorClasses[accentColor]}`}>
        <Icon size={24} />
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs opacity-80">{description}</p>
        </div>
        <span className="ml-auto text-sm font-medium">{templates.length} template{templates.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Templates */}
      {templates.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
          <Icon size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No templates yet</p>
          <p className="text-xs mt-1">Create templates from their respective tools</p>
        </div>
      ) : folders.length === 1 && folders[0] === 'Uncategorized' ? (
        // No folders, just show grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      ) : (
        // Show folders
        <div className="space-y-3">
          {folders.map(folder => {
            const isExpanded = expandedFolders[folder] !== false; // Default to expanded
            const folderTemplates = grouped[folder];

            return (
              <div key={folder} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFolder(folder)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <FolderOpen size={16} className="text-slate-400" />
                  <span className="font-medium text-white">{folder}</span>
                  <span className="text-xs text-slate-500 ml-auto">{folderTemplates.length}</span>
                </button>

                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folderTemplates.map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={handleDelete}
                        onRename={handleRename}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Templates() {
  const { setupConfig, updateSetupConfig } = useSchool();

  const practiceTemplates = setupConfig?.practiceTemplates || [];
  const gameplanTemplates = setupConfig?.gameplanTemplates || [];
  const pregameTemplates = setupConfig?.pregameTemplates || [];

  const updatePracticeTemplates = (templates) => {
    updateSetupConfig({ practiceTemplates: templates });
  };

  const updateGameplanTemplates = (templates) => {
    updateSetupConfig({ gameplanTemplates: templates });
  };

  const updatePregameTemplates = (templates) => {
    updateSetupConfig({ pregameTemplates: templates });
  };

  const totalTemplates = practiceTemplates.length + gameplanTemplates.length + pregameTemplates.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <LayoutTemplate size={32} className="text-sky-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-slate-400 text-sm">
            Manage your saved practice, game plan, and pregame templates
          </p>
        </div>
        <div className="ml-auto px-4 py-2 bg-slate-800 rounded-lg">
          <span className="text-2xl font-bold text-white">{totalTemplates}</span>
          <span className="text-slate-400 text-sm ml-2">total templates</span>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
        <p className="text-sm text-sky-300">
          <strong>How to create templates:</strong> Templates are saved from their respective tools.
          Use "Save as Template" in Practice Planner, Game Plan/Call Sheet, or Pregame to add templates here.
          Click a template name to rename it.
        </p>
      </div>

      {/* Practice Templates */}
      <TemplateSection
        title="Practice Templates"
        description="Saved practice plan structures"
        icon={Calendar}
        templates={practiceTemplates}
        onUpdate={updatePracticeTemplates}
        accentColor="sky"
      />

      {/* Game Plan Templates */}
      <TemplateSection
        title="Game Plan Templates"
        description="Saved game plan structures"
        icon={Clipboard}
        templates={gameplanTemplates}
        onUpdate={updateGameplanTemplates}
        accentColor="emerald"
      />

      {/* Pregame Templates */}
      <TemplateSection
        title="Pregame Templates"
        description="Saved pregame timeline structures"
        icon={Clock}
        templates={pregameTemplates}
        onUpdate={updatePregameTemplates}
        accentColor="amber"
      />
    </div>
  );
}
