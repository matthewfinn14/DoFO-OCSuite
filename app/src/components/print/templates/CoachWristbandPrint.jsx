import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

// Card definitions
const CARD_TABS = [
  { id: 'card100', label: '100s', startSlot: 101, count: 48 },
  { id: 'card200', label: '200s', startSlot: 201, count: 48 },
  { id: 'card300', label: '300s', startSlot: 301, count: 48 },
  { id: 'card400', label: '400s', startSlot: 401, count: 48 },
  { id: 'card500', label: '500s', startSlot: 501, count: 48 },
  { id: 'card600', label: '600s', startSlot: 601, count: 48 },
  { id: 'cardStaples', label: 'Staples', startSlot: 10, count: 80 }
];

/**
 * Coach's Consolidated Wristband - All slots on one mega-card page
 * 8.5" x 11" landscape, organized by card sections
 */
export default function CoachWristbandPrint({
  weekId,
  levelId,
  cardSelection = ['card100', 'card200', 'card300', 'card400'],
  consolidationMode = 'byCard',
  fontSize = 'medium',
  showColorCoding = true
}) {
  const { playsArray, weeks, programLevels, activeLevelId, settings } = useSchool();

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === weekId);
  }, [weeks, weekId]);

  // Get selected level
  const selectedLevel = levelId || activeLevelId || programLevels?.[0]?.id || 'varsity';

  // Get wristband settings
  const wristbandSettings = useMemo(() => {
    if (!currentWeek) return {};
    const settings = currentWeek.wristbandSettings || {};
    return settings[selectedLevel] || {};
  }, [currentWeek, selectedLevel]);

  // Build slot map
  const slotMap = useMemo(() => {
    const map = {};
    playsArray.forEach(p => {
      if (p.wristbandSlot) map[p.wristbandSlot] = p;
      if (p.staplesSlot) map[p.staplesSlot] = p;
    });
    return map;
  }, [playsArray]);

  // Get populated slots for selected cards
  const cardSections = useMemo(() => {
    return cardSelection
      .map(cardId => {
        const tab = CARD_TABS.find(t => t.id === cardId);
        if (!tab) return null;

        const cardSettings = wristbandSettings[cardId] || {};
        const slots = [];

        for (let i = 0; i < tab.count; i++) {
          const slotNum = tab.startSlot + i;
          const play = slotMap[slotNum];
          if (play) {
            slots.push({ slot: slotNum, play, cardSettings });
          }
        }

        return {
          id: cardId,
          label: tab.label,
          slots,
          color: cardSettings.color || 'white'
        };
      })
      .filter(Boolean)
      .filter(section => section.slots.length > 0);
  }, [cardSelection, wristbandSettings, slotMap]);

  // Merged mode - combine all slots
  const allSlots = useMemo(() => {
    if (consolidationMode !== 'merged') return [];
    return cardSections
      .flatMap(section => section.slots)
      .sort((a, b) => a.slot - b.slot);
  }, [cardSections, consolidationMode]);

  const fontSizeClass = {
    small: 'text-[8pt]',
    medium: 'text-[10pt]',
    large: 'text-[12pt]'
  }[fontSize] || 'text-[10pt]';

  return (
    <div className="coach-megacard-print bg-white p-4" style={{ width: '10in', minHeight: '7.5in' }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black">
        <div className="flex items-center gap-3">
          {settings?.teamLogo && (
            <img src={settings.teamLogo} alt="Team Logo" className="h-10 w-auto" />
          )}
          <div>
            <div className="font-bold text-lg">Coach's Play Sheet</div>
            <div className="text-sm text-gray-600">
              {currentWeek?.name} {currentWeek?.opponent && `vs ${currentWeek.opponent}`}
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      {consolidationMode === 'merged' ? (
        <MergedView slots={allSlots} fontSizeClass={fontSizeClass} showColorCoding={showColorCoding} />
      ) : (
        <ByCardView sections={cardSections} fontSizeClass={fontSizeClass} showColorCoding={showColorCoding} />
      )}
    </div>
  );
}

// View grouped by card (100s, 200s, etc.)
function ByCardView({ sections, fontSizeClass, showColorCoding }) {
  // Calculate grid columns based on number of sections
  const cols = Math.min(sections.length, 4);

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {sections.map(section => (
        <div key={section.id} className="border border-gray-300 rounded">
          <div
            className="font-bold text-center py-1 border-b border-gray-300"
            style={{
              backgroundColor: showColorCoding ? getCardBgColor(section.color) : '#f1f5f9'
            }}
          >
            {section.label}
          </div>
          <div className={`p-2 ${fontSizeClass}`}>
            {section.slots.map(({ slot, play }) => (
              <div
                key={slot}
                className="flex gap-2 py-0.5 border-b border-dotted border-gray-200 last:border-0"
              >
                <span className="font-bold min-w-[28px]">{slot}</span>
                <span className="truncate">{play.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Merged view - all slots in columns
function MergedView({ slots, fontSizeClass, showColorCoding }) {
  // Split into 4 columns
  const colSize = Math.ceil(slots.length / 4);
  const columns = [
    slots.slice(0, colSize),
    slots.slice(colSize, colSize * 2),
    slots.slice(colSize * 2, colSize * 3),
    slots.slice(colSize * 3)
  ].filter(col => col.length > 0);

  return (
    <div className="grid grid-cols-4 gap-3">
      {columns.map((column, colIdx) => (
        <div key={colIdx} className="border border-gray-300 rounded p-2">
          <div className={fontSizeClass}>
            {column.map(({ slot, play, cardSettings }) => (
              <div
                key={slot}
                className="flex gap-2 py-0.5 border-b border-dotted border-gray-200 last:border-0"
                style={{
                  backgroundColor: showColorCoding
                    ? `${getCardBgColor(cardSettings?.color)}20`
                    : 'transparent'
                }}
              >
                <span className="font-bold min-w-[28px]">{slot}</span>
                <span className="truncate">{play.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper to get card background color
function getCardBgColor(color) {
  const colors = {
    white: '#ffffff',
    green: '#d1fae5',
    orange: '#fed7aa',
    blue: '#bfdbfe',
    yellow: '#fef08a',
    red: '#fecaca',
    purple: '#e9d5ff',
    pink: '#fbcfe8',
    teal: '#99f6e4'
  };
  return colors[color] || colors.white;
}
