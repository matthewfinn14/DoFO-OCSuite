import { Edit2, Check, Handshake } from 'lucide-react';

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
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className={`h-44 flex items-center justify-center ${elements ? (diagramMode === 'wiz-skill' ? 'bg-slate-900' : 'bg-emerald-50') : 'bg-slate-800'}`}>
            {elements ? (
              <PlayDiagramPreview elements={elements} mode={diagramMode} />
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

// SVG diagram preview component
function PlayDiagramPreview({ elements, mode = 'standard' }) {
  const colors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  const isWizSkill = mode === 'wiz-skill';

  // Calculate bounds from elements for better framing
  const calculateBounds = () => {
    if (!elements || elements.length === 0) {
      return isWizSkill ? { x: 0, y: 0, width: 900, height: 320 } : { x: 0, y: 60, width: 800, height: 460 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
      if (el.points) {
        el.points.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      }
    });

    // Add padding around the content
    const padding = 40;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = maxX + padding;
    maxY = maxY + padding;

    return {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 200),
      height: Math.max(maxY - minY, 150)
    };
  };

  const bounds = calculateBounds();
  // For wiz-skill, use fixed viewBox for consistency; for standard, use calculated bounds
  const viewBox = isWizSkill
    ? '0 0 900 320'
    : `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Arrow markers */}
      <defs>
        {colors.map(c => (
          <marker
            key={c}
            id={`card-arrow-${c.replace('#', '')}`}
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={c} />
          </marker>
        ))}
      </defs>

      {/* Background */}
      {isWizSkill ? (
        <image
          href="/WIZ Background.jpg"
          x="0"
          y="0"
          width="900"
          height="320"
          preserveAspectRatio="none"
        />
      ) : (
        <g opacity="0.15">
          <line x1="0" y1="150" x2="800" y2="150" stroke="#000" strokeWidth="2" />
          <line x1="0" y1="250" x2="800" y2="250" stroke="#000" strokeWidth="2" />
          <line x1="0" y1="350" x2="800" y2="350" stroke="#000" strokeWidth="2" />
          <line x1="0" y1="400" x2="800" y2="400" stroke="#000" strokeWidth="3" />
          <line x1="0" y1="450" x2="800" y2="450" stroke="#000" strokeWidth="2" />
        </g>
      )}

      {/* Render elements */}
      {elements.map((el, idx) => {
        // Player element
        if (el.type === 'player' && el.points?.[0]) {
          const { x, y } = el.points[0];
          const isTextOnly = el.shape === 'text-only';
          const fontSize = el.fontSize || 16;

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

          const size = 18;
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
                  strokeWidth="3"
                />
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="white"
                  stroke={el.color || '#000'}
                  strokeWidth="3"
                />
              )}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
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
        const markerId = `card-arrow-${color.replace('#', '')}`;

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
          const perpX = (-dy / len) * 14;
          const perpY = (dx / len) * 14;
          endMarker = (
            <line
              x1={end.x - perpX}
              y1={end.y - perpY}
              x2={end.x + perpX}
              y2={end.y + perpY}
              stroke={color}
              strokeWidth="5"
            />
          );
        } else if (el.endType === 'dot') {
          const end = el.points[el.points.length - 1];
          endMarker = <circle cx={end.x} cy={end.y} r="6" fill={color} />;
        }

        return (
          <g key={el.id || idx}>
            <path
              d={d}
              stroke={color}
              strokeWidth={el.lineWidth || 6}
              fill="none"
              strokeDasharray={el.style === 'dashed' ? '10,5' : 'none'}
              markerEnd={markerEnd}
            />
            {endMarker}
          </g>
        );
      })}
    </svg>
  );
}
