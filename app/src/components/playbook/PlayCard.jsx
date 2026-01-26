import { Edit2, Check } from 'lucide-react';

// Tag categories for formatting
const MOTION_TAGS = ['Jet', 'Orbit', 'Zoom', 'Rocket', 'Fly', 'Shift'];

export default function PlayCard({
  play,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onQuickEdit
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

  // Get diagram elements from any available source
  const getDiagramElements = () => {
    if (play.wizSkillData?.length > 0) return play.wizSkillData;
    if (play.rooskiSkillData?.length > 0) return play.rooskiSkillData;
    if (play.wizOlineData?.length > 0) return play.wizOlineData;
    if (play.diagramData) {
      if (Array.isArray(play.diagramData) && play.diagramData.length > 0) {
        return play.diagramData;
      }
      if (play.diagramData.elements?.length > 0) {
        return play.diagramData.elements;
      }
    }
    return null;
  };

  const elements = getDiagramElements();

  // Get display name
  const getDisplayName = () => {
    return play.name || 'Unnamed Play';
  };

  // Format meta info
  const getMetaInfo = () => {
    const parts = [];
    const nameLower = (play.name || '').toLowerCase();

    // Show formation if not already in name
    if (play.formation && !nameLower.includes(play.formation.toLowerCase())) {
      let txt = play.formation;
      if (play.formationTag && !nameLower.includes(play.formationTag.toLowerCase())) {
        txt += ` (${play.formationTag})`;
      }
      parts.push(txt);
    } else if (play.formationTag && !nameLower.includes(play.formationTag.toLowerCase())) {
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
      className={`bg-slate-900 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-slate-600 ${
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
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className={`h-44 flex items-center justify-center ${elements ? 'bg-emerald-50' : 'bg-slate-800'}`}>
            {elements ? (
              <PlayDiagramPreview elements={elements} />
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
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{getDisplayName()}</h3>
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

// SVG diagram preview component
function PlayDiagramPreview({ elements }) {
  const colors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <svg
      viewBox="0 60 800 460"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Arrow markers */}
      <defs>
        {colors.map(c => (
          <marker
            key={c}
            id={`arrow-${c.replace('#', '')}`}
            markerWidth="6"
            markerHeight="4"
            refX="5"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill={c} />
          </marker>
        ))}
      </defs>

      {/* Field lines */}
      <g opacity="0.15">
        <line x1="0" y1="150" x2="800" y2="150" stroke="#000" strokeWidth="2" />
        <line x1="0" y1="250" x2="800" y2="250" stroke="#000" strokeWidth="2" />
        <line x1="0" y1="350" x2="800" y2="350" stroke="#000" strokeWidth="2" />
        <line x1="0" y1="400" x2="800" y2="400" stroke="#000" strokeWidth="3" />
        <line x1="0" y1="450" x2="800" y2="450" stroke="#000" strokeWidth="2" />
      </g>

      {/* Render elements */}
      {elements.map((el, idx) => {
        // Player element
        if (el.type === 'player' && el.points?.[0]) {
          const { x, y } = el.points[0];
          const isTextOnly = el.shape === 'text-only';
          const fontSize = el.fontSize || 14;

          if (isTextOnly) {
            return (
              <text
                key={el.id || idx}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill={el.color || '#000'}
              >
                {el.label}
              </text>
            );
          }

          const size = 14;
          const isRect = el.shape === 'square';

          return (
            <g key={el.id || idx}>
              {isRect ? (
                <rect
                  x={x - size}
                  y={y - size}
                  width={size * 2}
                  height={size * 2}
                  fill="white"
                  stroke={el.color || '#000'}
                  strokeWidth="2"
                />
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="white"
                  stroke={el.color || '#000'}
                  strokeWidth="2"
                />
              )}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="bold"
                fill={el.color || '#000'}
              >
                {el.label}
              </text>
            </g>
          );
        }

        // Line/route element
        if (!el.points || el.points.length < 2) return null;

        const d = `M ${el.points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const color = el.color || '#000';
        const markerId = `arrow-${color.replace('#', '')}`;

        let markerEnd = undefined;
        let endMarker = null;

        if (el.endType === 'arrow' || (!el.endType && el.type !== 'free')) {
          markerEnd = `url(#${markerId})`;
        } else if (el.endType === 't') {
          const end = el.points[el.points.length - 1];
          const prev = el.points[el.points.length - 2] || el.points[0];
          const dx = end.x - prev.x;
          const dy = end.y - prev.y;
          const len = Math.hypot(dx, dy) || 1;
          const perpX = (-dy / len) * 12;
          const perpY = (dx / len) * 12;
          endMarker = (
            <line
              x1={end.x - perpX}
              y1={end.y - perpY}
              x2={end.x + perpX}
              y2={end.y + perpY}
              stroke={color}
              strokeWidth="3"
            />
          );
        } else if (el.endType === 'dot') {
          const end = el.points[el.points.length - 1];
          endMarker = <circle cx={end.x} cy={end.y} r="5" fill={color} />;
        }

        return (
          <g key={el.id || idx}>
            <path
              d={d}
              stroke={color}
              strokeWidth="3"
              fill="none"
              strokeDasharray={el.style === 'dashed' ? '8,4' : 'none'}
              markerEnd={markerEnd}
            />
            {endMarker}
          </g>
        );
      })}
    </svg>
  );
}
