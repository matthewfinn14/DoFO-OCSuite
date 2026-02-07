import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';
import { getPlayCall } from '../../../utils/playDisplay';

// Card definitions - standard wristband cards
const CARD_TABS = [
  { id: 'card100', label: '100s', startSlot: 101, count: 48 },
  { id: 'card200', label: '200s', startSlot: 201, count: 48 },
  { id: 'card300', label: '300s', startSlot: 301, count: 48 },
  { id: 'card400', label: '400s', startSlot: 401, count: 48 },
  { id: 'card500', label: '500s', startSlot: 501, count: 48 },
  { id: 'card600', label: '600s', startSlot: 601, count: 48 },
  { id: 'cardStaples', label: 'Staples', startSlot: 10, count: 80 }
];

// Color map for alternating row shades
const COLOR_MAP = {
  'green-light': '#d1fae5', 'green-medium': '#a7f3d0',
  'orange-light': '#fed7aa', 'orange-medium': '#fdba74',
  'red-light': '#fecaca', 'red-medium': '#fca5a5',
  'blue-light': '#bfdbfe', 'blue-medium': '#93c5fd',
  'yellow-light': '#fef08a', 'yellow-medium': '#fde047',
  'purple-light': '#e9d5ff', 'purple-medium': '#d8b4fe',
  'teal-light': '#99f6e4', 'teal-medium': '#5eead4',
  'pink-light': '#fbcfe8', 'pink-medium': '#f9a8d4'
};

/**
 * Coach's Play Sheet - Large wristband cards for sideline use
 * Portrait orientation, 2 cards per page (half page each)
 * Page 1: 100s + 200s, Page 2: 300s + 400s
 */
export default function CoachWristbandPrint({
  weekId,
  levelId,
  wizType = 'skill' // 'skill' or 'oline'
}) {
  const { playsArray, weeks, programLevels, activeLevelId, settings } = useSchool();

  // Get current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => w.id === weekId);
  }, [weeks, weekId]);

  // Get selected level
  const selectedLevel = levelId || activeLevelId || programLevels?.[0]?.id || 'varsity';

  // Get wristband settings for current week and level
  const wristbandSettings = useMemo(() => {
    if (!currentWeek) return {};
    const ws = currentWeek.wristbandSettings || {};
    return ws[selectedLevel] || {};
  }, [currentWeek, selectedLevel]);

  // Get enabled cards for this week (default to 100s-400s)
  const enabledCards = useMemo(() => {
    const defaultEnabled = ['card100', 'card200', 'card300', 'card400'];
    return wristbandSettings.enabledCards || defaultEnabled;
  }, [wristbandSettings.enabledCards]);

  // Build global slot map for quick lookup
  const globalSlotMap = useMemo(() => {
    const map = {};
    playsArray.forEach(p => {
      if (p.wristbandSlot) map[p.wristbandSlot] = p;
      if (p.staplesSlot) map[p.staplesSlot] = p;
    });
    return map;
  }, [playsArray]);

  // Play lookup by ID
  const playById = useMemo(() => {
    const map = {};
    playsArray.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [playsArray]);

  // Get play for a slot - check card-specific slots first, then global
  const getPlayForSlot = (cardId, slot) => {
    // Check card-specific slots first
    const cardSettings = wristbandSettings[cardId];
    if (cardSettings?.slots?.[slot]?.playId) {
      return playById[cardSettings.slots[slot].playId] || null;
    }
    // Fallback to global slot map
    return globalSlotMap[slot] || null;
  };

  // Filter to only enabled cards that aren't STAPLES (100s-600s only for coach sheets)
  const cardIds = enabledCards.filter(id => id !== 'cardStaples');

  // Build card data
  const cards = cardIds.map(cardId => {
    const tab = CARD_TABS.find(t => t.id === cardId);
    if (!tab) return null;

    const cardSettings = wristbandSettings[cardId] || {
      type: 'standard',
      opponent: currentWeek?.opponent || '',
      iteration: '1',
      color: 'white'
    };

    const isWiz = cardSettings.type === 'wiz';
    const slotCount = isWiz ? 16 : 48;
    const slots = Array.from({ length: slotCount }, (_, i) => tab.startSlot + i);

    return {
      id: cardId,
      tab,
      settings: cardSettings,
      slots,
      isWiz
    };
  }).filter(Boolean);

  // Split into pages (2 cards per page)
  const pages = [];
  for (let i = 0; i < cards.length; i += 2) {
    pages.push(cards.slice(i, i + 2));
  }

  const opponent = currentWeek?.opponent || 'OPPONENT';

  return (
    <div className="coach-playsheet-print">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.25in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        .coach-playsheet-print {
          background: white;
          width: 8in;
        }

        .coach-playsheet-page {
          width: 8in;
          height: 10.5in;
          display: flex;
          flex-direction: column;
          gap: 0.15in;
          page-break-after: always;
          break-after: page;
        }

        .coach-playsheet-page:last-child {
          page-break-after: avoid;
          break-after: avoid;
        }

        .coach-card {
          height: 5.1in;
          max-height: 5.1in;
          border: 2px solid black;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: white;
        }

        .coach-card-header {
          background: black;
          color: white;
          font-weight: bold;
          font-size: 14pt;
          padding: 4px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        /* Standard layout - 2 column grid */
        .coach-slot-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(24, 1fr);
          overflow: hidden;
        }

        .coach-slot-row {
          display: flex;
          border-bottom: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }

        .coach-slot-row:nth-child(even) {
          border-right: none;
        }

        .coach-slot-num {
          font-weight: bold;
          font-size: 11pt;
          min-width: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #333;
          background: #f8fafc;
        }

        .coach-slot-play {
          flex: 1;
          font-size: 10pt;
          font-weight: 600;
          padding: 0 6px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .coach-slot-play span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* WIZ layout - 4x4 grid */
        .coach-wiz-grid {
          flex: 1;
          display: grid;
          grid-template-rows: repeat(4, 1fr);
          border-top: 1px solid black;
        }

        .coach-wiz-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid black;
        }

        .coach-wiz-row:last-child {
          border-bottom: none;
        }

        .coach-wiz-cell {
          outline: 1px solid black;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .coach-wiz-diagram {
          flex: 1;
          background: #f9fafb;
        }

        .coach-wiz-label {
          display: flex;
          border-top: 1px solid black;
          background: white;
          height: 24px;
          flex-shrink: 0;
        }

        .coach-wiz-slot-num {
          width: 32px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10pt;
          font-weight: bold;
          border-right: 1px solid black;
        }

        .coach-wiz-play-name {
          flex: 1;
          display: flex;
          align-items: center;
          font-size: 10pt;
          font-weight: bold;
          padding: 0 4px;
          overflow: hidden;
        }

        .coach-wiz-play-name span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      {pages.map((pageCards, pageIdx) => (
        <div key={pageIdx} className="coach-playsheet-page">
          {pageCards.map(card => (
            <div key={card.id} className="coach-card">
              {/* Header */}
              <div className="coach-card-header" style={{
                background: card.isWiz ? '#dc2626' : 'black'
              }}>
                <span>
                  {card.tab.label}
                  {card.isWiz && ` ${wizType.toUpperCase()}`}
                </span>
                <span>{opponent} {card.settings.iteration || '1'}</span>
              </div>

              {/* Content */}
              {card.isWiz ? (
                <WizLayout
                  card={card}
                  getPlayForSlot={getPlayForSlot}
                  wizType={wizType}
                />
              ) : (
                <StandardLayout
                  card={card}
                  getPlayForSlot={getPlayForSlot}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Standard 2-column layout for regular cards
function StandardLayout({ card, getPlayForSlot }) {
  const cardColor = card.settings.color || 'white';

  const getRowColor = (rowIndex) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = rowIndex % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  // Split slots into pairs (odd/even for 2 columns)
  const col1 = card.slots.filter((_, i) => i % 2 === 0);
  const col2 = card.slots.filter((_, i) => i % 2 === 1);

  const rows = [];
  for (let i = 0; i < Math.max(col1.length, col2.length); i++) {
    rows.push([col1[i], col2[i]]);
  }

  return (
    <div className="coach-slot-grid">
      {rows.map((pair, rowIdx) => (
        pair.map((slot, colIdx) => {
          if (slot === undefined) return <div key={`empty-${rowIdx}-${colIdx}`} className="coach-slot-row" />;

          const play = getPlayForSlot(card.id, slot);
          const playName = play ? getPlayCall(play) : '';

          return (
            <div
              key={slot}
              className="coach-slot-row"
              style={{ background: getRowColor(rowIdx) }}
            >
              <div className="coach-slot-num">{slot}</div>
              <div className="coach-slot-play">
                <span>{playName}</span>
              </div>
            </div>
          );
        })
      ))}
    </div>
  );
}

// WIZ 4x4 grid layout
function WizLayout({ card, getPlayForSlot, wizType }) {
  // Split 16 slots into 4 rows of 4
  const rows = [];
  for (let i = 0; i < card.slots.length; i += 4) {
    rows.push(card.slots.slice(i, i + 4));
  }

  return (
    <div className="coach-wiz-grid">
      {rows.map((rowSlots, rIndex) => (
        <div key={rIndex} className="coach-wiz-row">
          {rowSlots.map(slot => {
            const play = getPlayForSlot(card.id, slot);

            // For SKILL: show play name/abbreviation with formation
            // For OLINE: show OL scheme name
            let displayName = '';
            if (play) {
              if (wizType === 'oline') {
                displayName = play.wizOlineRef?.name || '';
              } else {
                displayName = play.wizAbbreviation || getPlayCall(play);
              }
            }

            return (
              <div key={slot} className="coach-wiz-cell">
                <div className="coach-wiz-diagram">
                  {/* Diagram placeholder */}
                </div>
                <div className="coach-wiz-label">
                  <div className="coach-wiz-slot-num">{slot}</div>
                  <div className="coach-wiz-play-name">
                    <span>{displayName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
