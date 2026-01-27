import { useMemo } from 'react';

// Zigzag path generator
const getZigZagPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const A = points[i];
    const B = points[i + 1];
    const isLastSegment = i === points.length - 2;

    let targetB = B;
    let finalSegment = '';

    if (isLastSegment) {
      const totalDist = Math.hypot(B.x - A.x, B.y - A.y);
      const arrowSpace = 5;
      if (totalDist > arrowSpace) {
        const ratio = (totalDist - arrowSpace) / totalDist;
        targetB = {
          x: A.x + (B.x - A.x) * ratio,
          y: A.y + (B.y - A.y) * ratio
        };
        finalSegment = ` L ${B.x},${B.y}`;
      }
    }

    const dist = Math.hypot(targetB.x - A.x, targetB.y - A.y);
    const steps = Math.floor(dist / 10);

    if (steps <= 0) {
      d += ` L ${targetB.x},${targetB.y}`;
    } else {
      const dx = (targetB.x - A.x) / steps;
      const dy = (targetB.y - A.y) / steps;
      const nx = -dy * 0.5;
      const ny = dx * 0.5;
      for (let j = 1; j <= steps; j++) {
        const mx = A.x + dx * j;
        const my = A.y + dy * j;
        if (j === steps) {
          d += ` L ${mx},${my}`;
        } else {
          const side = j % 2 === 0 ? 1 : -1;
          d += ` L ${mx + nx * side},${my + ny * side}`;
        }
      }
    }

    if (finalSegment) {
      d += finalSegment;
    }
  }
  return d;
};

// Render arrow head manually (no markers to avoid CSP issues)
const renderArrowHead = (points, color) => {
  if (!points || points.length < 2) return null;
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = end.x - prev.x;
  const dy = end.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Arrow size
  const arrowLen = 12;
  const arrowWidth = 8;

  // Arrow points
  const tip = end;
  const left = {
    x: end.x - ux * arrowLen + uy * arrowWidth / 2,
    y: end.y - uy * arrowLen - ux * arrowWidth / 2
  };
  const right = {
    x: end.x - ux * arrowLen - uy * arrowWidth / 2,
    y: end.y - uy * arrowLen + ux * arrowWidth / 2
  };

  return (
    <polygon
      points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
      fill={color}
    />
  );
};

export default function DiagramPreview({
  elements = [],
  width = 150,
  height = 100,
  mode = 'wiz-oline',
  onClick
}) {
  // Generate unique ID for this preview instance
  const previewId = useMemo(() => `preview-${Math.random().toString(36).substr(2, 9)}`, []);

  const isWizSkill = mode === 'wiz-skill';
  const viewBox = isWizSkill ? '0 0 754 445' : '0 0 900 600';

  if (!elements || elements.length === 0) {
    return (
      <div
        onClick={onClick}
        className="flex items-center justify-center bg-slate-700/30 border border-slate-600 rounded text-slate-500 text-xs"
        style={{ width, height, cursor: onClick ? 'pointer' : 'default' }}
      >
        No diagram
      </div>
    );
  }

  // Render an element for the preview
  const renderElement = (el, index) => {
    if (!el || !el.points || el.points.length === 0) return null;

    const key = el.id || `el-${index}`;

    try {
      if (el.type === 'player') {
        const { x, y } = el.points[0];

        if (el.shape === 'text-only') {
          const tSize = el.fontSize || (isWizSkill ? 24 : 170);
          return (
            <g key={key}>
              <text
                x={x}
                y={y}
                dy="0.35em"
                textAnchor="middle"
                fontSize={tSize}
                fontWeight="bold"
                fill={el.color || 'black'}
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {el.label}
              </text>
            </g>
          );
        }

        // Circle/square
        const size = 30;
        const isRect = el.shape === 'square';
        const isFilled = el.variant === 'filled';
        const fillColor = isFilled ? el.color : 'white';
        const strokeColor = el.color || '#000';
        const textColor = isFilled ? 'white' : el.color;

        return (
          <g key={key}>
            {isRect ? (
              <rect x={x - size / 2} y={y - size / 2} width={size} height={size} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
            ) : (
              <circle cx={x} cy={y} r={size / 2} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
            )}
            <text
              x={x}
              y={y}
              dy="0.35em"
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill={textColor}
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {el.label}
            </text>
          </g>
        );
      }

      // Polyline
      if (!el.points || el.points.length < 2) return null;

      const color = el.color || '#000';
      let endMarker = null;

      if (el.endType === 't') {
        // T-block
        const end = el.points[el.points.length - 1];
        const prev = el.points[el.points.length - 2] || el.points[0];
        const dx = end.x - prev.x;
        const dy = end.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const sWidth = parseInt(el.strokeWidth || 4);
        const perpX = (-dy / len) * 15;
        const perpY = (dx / len) * 15;

        endMarker = (
          <line
            x1={end.x - perpX} y1={end.y - perpY}
            x2={end.x + perpX} y2={end.y + perpY}
            stroke={color}
            strokeWidth={sWidth}
            strokeLinecap="round"
          />
        );
      } else if (el.endType === 'dot') {
        const end = el.points[el.points.length - 1];
        endMarker = <circle cx={end.x} cy={end.y} r="6" fill={color} />;
      } else if (el.endType === 'arrow') {
        endMarker = renderArrowHead(el.points, color);
      }

      const strokeWidth = el.strokeWidth || 4;

      // Generate path for all points
      const segStyles = el.segmentStyles || [];
      const defaultStyle = el.style || 'solid';
      const segments = [];

      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = el.points[i];
        const p2 = el.points[i + 1];
        const segStyle = segStyles[i] || defaultStyle;

        let segD = '';
        if (segStyle === 'zigzag') {
          segD = getZigZagPath([p1, p2]);
        } else {
          segD = `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
        }

        segments.push(
          <path
            key={`${key}-seg-${i}`}
            d={segD}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={segStyle === 'dashed' ? '10,5' : undefined}
            strokeLinecap="round"
          />
        );
      }

      return (
        <g key={key}>
          {segments}
          {endMarker}
        </g>
      );
    } catch (err) {
      console.warn('Error rendering diagram element:', err);
      return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="border border-slate-500 rounded overflow-hidden shadow-sm hover:border-sky-400 transition-colors"
      style={{
        width,
        height,
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isWizSkill ? '#1e293b' : 'white'
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        {isWizSkill ? (
          <image
            href="/WIZ Background.jpg"
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          />
        ) : (
          <rect width="100%" height="100%" fill="#ffffff" />
        )}

        {/* Render elements */}
        {elements.map((el, idx) => renderElement(el, idx))}
      </svg>
    </div>
  );
}
