import { Edit2, Check, Handshake } from 'lucide-react';
import DiagramPreview from '../diagrams/DiagramPreview';

// Tag categories for formatting
const MOTION_TAGS = ['Jet', 'Orbit', 'Zoom', 'Rocket', 'Fly', 'Shift'];

export default function PlayCard({
  play,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onQuickEdit,
  onOpenDetails
}) {
  const handleClick = (e) => {
    if (onQuickEdit) {
      onQuickEdit(play, e.clientX, e.clientY);
    } else if (onEdit) {
      onEdit(play);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(play);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onToggleSelect) onToggleSelect(play.id, e.shiftKey);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(play);
  };

  const handleOpenDetailsClick = (e) => {
    e.stopPropagation();
    if (onOpenDetails) onOpenDetails(play.id);
  };

  // Get diagram elements from any available source and track the mode
  const getDiagramInfo = () => {
    if (play.wizSkillData?.length > 0) return { elements: play.wizSkillData, mode: 'wiz-skill' };
    if (play.rooskiSkillData?.length > 0) return { elements: play.rooskiSkillData, mode: 'wiz-skill' };
    if (play.wizOlineData?.length > 0) return { elements: play.wizOlineData, mode: 'wiz-oline' };
    if (play.diagramData) {
      if (Array.isArray(play.diagramData) && play.diagramData.length > 0) {
        return { elements: play.diagramData, mode: 'standard' };
      }
      if (play.diagramData.elements?.length > 0) {
        return { elements: play.diagramData.elements, mode: 'standard' };
      }
    }
    return null;
  };

  const diagramInfo = getDiagramInfo();
  const elements = diagramInfo?.elements;
  const diagramMode = diagramInfo?.mode || 'standard';

  // Get display name (formation first, then play name)
  const getDisplayName = () => {
    const name = play.name || 'Unnamed Play';
    if (play.formation) {
      return `${play.formation} ${name}`;
    }
    return name;
  };

  // Format meta info (formation is now in main display name, so only show formationTag here)
  const getMetaInfo = () => {
    const parts = [];
    const nameLower = (play.name || '').toLowerCase();

    // Show formationTag if not already in name
    if (play.formationTag && !nameLower.includes(play.formationTag.toLowerCase())) {
      parts.push(`(${play.formationTag})`);
    }

    return parts.join(' • ');
  };

  // Get visible tags
  const getVisibleTags = () => {
    const nameLower = (play.name || '').toLowerCase();
    const tags = [];

    if (play.tag1 && !nameLower.includes(play.tag1.toLowerCase())) {
      const isMotion = MOTION_TAGS.some(m => play.tag1.toLowerCase().includes(m.toLowerCase()));
      tags.push({ text: isMotion ? `"${play.tag1}"` : play.tag1, key: 'tag1' });
    }

    if (play.tag2 && !nameLower.includes(play.tag2.toLowerCase())) {
      tags.push({ text: `(${play.tag2})`, key: 'tag2' });
    }

    if (play.tags) {
      play.tags.forEach((tag, i) => {
        if (tag === play.tag1 || tag === play.tag2) return;
        if (nameLower.includes(tag.toLowerCase())) return;
        const isMotion = MOTION_TAGS.some(m => tag.toLowerCase().includes(m.toLowerCase()));
        tags.push({ text: isMotion ? `"${tag}"` : tag, key: `tag-${i}` });
      });
    }

    return tags;
  };

  return (
    <div
      data-play-id={play.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`relative bg-slate-900 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-slate-600 ${
        isSelected ? 'ring-2 ring-sky-500' : 'border border-slate-800'
      }`}
    >
      {/* Action buttons */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className="w-6 h-6 flex items-center justify-center bg-white/80 rounded"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 cursor-pointer"
          />
        </button>

        {/* Complementary Plays button */}
        {onOpenDetails && (
          <button
            onClick={handleOpenDetailsClick}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              play.complementaryPlays?.length > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-white/80 text-slate-600 hover:text-emerald-600'
            }`}
            title={play.complementaryPlays?.length > 0
              ? `${play.complementaryPlays.length} complementary play(s) - Click to manage`
              : 'Link complementary plays'}
          >
            <Handshake size={14} />
          </button>
        )}

        {/* Edit button */}
        <button
          onClick={handleEditClick}
          className="w-6 h-6 flex items-center justify-center bg-white/80 rounded text-slate-600 hover:text-slate-900"
          title="Edit Play Details"
        >
          <Edit2 size={14} />
        </button>
      </div>

      {/* Diagram */}
      <div className="relative">
        {play.image ? (
          <img
            src={play.image}
            alt={play.name}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className={`h-32 flex items-center justify-center ${elements ? (diagramMode === 'wiz-skill' ? 'bg-slate-900' : 'bg-white') : 'bg-slate-800'}`}>
            {elements ? (
              <DiagramPreview elements={elements} mode={diagramMode} width="100%" height="100%" />
            ) : (
              <div className="text-slate-600 text-center">
                <span className="text-3xl">📷</span>
                <div className="text-xs font-medium mt-1">No Diagram</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{getDisplayName()}</h3>
            {play.complementaryPlays?.length > 0 && (
              <Handshake size={14} className="flex-shrink-0 text-emerald-400" title="Has complementary plays" />
            )}
            {play.incomplete && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1">
                ⚠️ INCOMPLETE
              </span>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {play.wristbandSlot && (
              <span className="px-1.5 py-0.5 bg-sky-500 text-black text-xs font-bold rounded">
                #{play.wristbandSlot}
              </span>
            )}
            {play.staplesSlot && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-black text-xs font-bold rounded">
                S:{play.staplesSlot}
              </span>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="text-xs text-slate-500 mt-1">
          {getMetaInfo()}
        </div>

        {/* Tags */}
        {getVisibleTags().length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {getVisibleTags().slice(0, 5).map(tag => (
              <span
                key={tag.key}
                className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-xs rounded"
              >
                {tag.text}
              </span>
            ))}
            {getVisibleTags().length > 5 && (
              <span className="text-slate-600 text-xs">+{getVisibleTags().length - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

