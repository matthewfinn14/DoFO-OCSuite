import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

// Card tab definitions (same as WristbandBuilder)
const CARD_TABS = [
  { id: 'card100', label: '100s', slotPrefix: 1, startSlot: 101 },
  { id: 'card200', label: '200s', slotPrefix: 2, startSlot: 201 },
  { id: 'card300', label: '300s', slotPrefix: 3, startSlot: 301 },
  { id: 'card400', label: '400s', slotPrefix: 4, startSlot: 401 },
  { id: 'card500', label: '500s', slotPrefix: 5, startSlot: 501 },
  { id: 'card600', label: '600s', slotPrefix: 6, startSlot: 601 },
  { id: 'cardStaples', label: 'STAPLES', slotPrefix: 0, startSlot: 10 }
];

// Color map for alternating row shades (matching WristbandBuilder)
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

// Header colors for mini-scripts
const HEADER_COLORS = {
  gray: { bg: '#d1d5db', text: '#000' },
  black: { bg: '#000', text: '#fff' },
  red: { bg: '#ef4444', text: '#fff' },
  blue: { bg: '#3b82f6', text: '#fff' },
  green: { bg: '#22c55e', text: '#000' },
  orange: { bg: '#f97316', text: '#000' }
};

/**
 * Wristband print template - supports player (4/page) and coach (2/page) formats
 * Prints 3.5"x4.5" cards for player format (4 per page in 2x2 grid)
 * Prints 7.5"x4.5" cards for coach format (2 per page vertical stack)
 */
export default function WristbandPrint({
  weekId,
  levelId,
  format = 'player',
  cardSelection = ['card100'],
  showSlotNumbers = true,
  showFormation = true,
  wizType = 'skill', // 'skill' or 'oline'
  cardWidth = 4.75, // inches
  cardHeight = 2.8  // inches
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
    const settings = currentWeek.wristbandSettings || {};
    return settings[selectedLevel] || {};
  }, [currentWeek, selectedLevel]);

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

  // Determine if player (4 per page) or coach (2 per page) format
  const isCoachFormat = format === 'coach';

  // For player format, print 4 copies of each card per page
  // For coach format, print 2 copies of each card per page
  const copiesPerPage = isCoachFormat ? 2 : 4;

  // Generate cards to print
  // When multiple unique card types selected: 1 copy of each, laid out to share pages
  // When single card type selected: fill page with copies (4 for player, 2 for coach)
  const cardsToPrint = useMemo(() => {
    const cards = [];
    const multipleUniqueCards = cardSelection.length > 1;

    cardSelection.forEach(cardId => {
      const tab = CARD_TABS.find(t => t.id === cardId);
      if (!tab) return;

      const cardSettings = wristbandSettings[cardId] || {
        type: 'standard',
        opponent: currentWeek?.opponent || '',
        iteration: '1',
        color: 'white',
        rows: []
      };

      // Generate slots for this card
      const isWiz = cardSettings.type === 'wiz';
      const count = cardId === 'cardStaples' ? 80 : (isWiz ? 16 : 48);
      const slots = cardId === 'cardStaples'
        ? Array.from({ length: count }, (_, i) => 10 + i)
        : Array.from({ length: count }, (_, i) => tab.startSlot + i);

      // For WIZ cards, generate SKILL and/or OLINE versions based on wizType setting
      if (isWiz) {
        if (wizType === 'both') {
          // Add 1 SKILL and 1 OLINE when multiple cards selected, or fill page when single
          const copiesPerVariant = multipleUniqueCards ? 1 : (copiesPerPage / 2);

          for (let i = 0; i < copiesPerVariant; i++) {
            cards.push({
              id: cardId,
              tab,
              settings: cardSettings,
              slots,
              wizVariant: 'skill',
              copyIndex: i
            });
          }
          for (let i = 0; i < copiesPerVariant; i++) {
            cards.push({
              id: cardId,
              tab,
              settings: cardSettings,
              slots,
              wizVariant: 'oline',
              copyIndex: i
            });
          }
        } else {
          // Single variant (skill only or oline only)
          const variant = wizType === 'skill' ? 'skill' : 'oline';
          const copies = multipleUniqueCards ? 1 : copiesPerPage;
          for (let i = 0; i < copies; i++) {
            cards.push({
              id: cardId,
              tab,
              settings: cardSettings,
              slots,
              wizVariant: variant,
              copyIndex: i
            });
          }
        }
      } else {
        // Non-WIZ cards
        const cardData = {
          id: cardId,
          tab,
          settings: cardSettings,
          slots
        };

        // When multiple unique cards: 1 copy each; when single card: fill page
        const copies = multipleUniqueCards ? 1 : copiesPerPage;
        for (let i = 0; i < copies; i++) {
          cards.push({ ...cardData, copyIndex: i });
        }
      }
    });

    return cards;
  }, [cardSelection, wristbandSettings, currentWeek, copiesPerPage, wizType]);

  // Check if any cards use WIZ layout (different dimensions)
  const hasWizCards = cardsToPrint.some(card => card.settings?.type === 'wiz');

  // Player format uses landscape, coach format uses portrait
  const pageOrientation = isCoachFormat ? 'portrait' : 'landscape';

  // Build container class
  const containerClass = [
    isCoachFormat ? 'wristband-print-coach' : 'wristband-print-player',
    hasWizCards && !isCoachFormat ? 'has-wiz-cards' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      <style>{`
        @media print {
          @page {
            size: letter ${pageOrientation};
            margin: 0.25in;
          }

          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          /* Ensure the print container doesn't cause extra pages */
          .wristband-print-player,
          .wristband-print-coach {
            page-break-after: avoid !important;
            break-after: avoid !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          /* Single page should never trigger a page break */
          .wristband-print-player:only-child,
          .wristband-print-coach:only-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Force hide print:hidden elements and ensure they take no space */
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
          }
        }

        /* Player format: 4 cards per page (2x2 flex layout) */
        /* Cards use dynamic dimensions from props */
        /* Letter landscape = 11" x 8.5" with 0.25" margins = 10.5" x 8" available */
        .wristband-print-player {
          display: block;
          background: white;
          width: 10.5in;
          max-width: 10.5in;
          max-height: 8in;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        .wristband-print-player .wristband-card {
          width: ${cardWidth}in !important;
          height: ${cardHeight}in !important;
          flex: 0 0 ${cardWidth}in !important;
          border: 1px solid black;
          background: white;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* WIZ cards: locked to 4.75" x 2.8" ratio */
        .wristband-print-player .wristband-card.layout-wiz {
          width: 4.75in !important;
          height: 2.8in !important;
          flex: 0 0 4.75in !important;
        }

        .wristband-print-player.has-wiz-cards {
          gap: 0.15in;
        }

        /* Coach format: 2 cards per page (vertical stack) on PORTRAIT paper */
        /* Portrait letter = 8.5" wide x 11" tall */
        /* Cards: 7.5" x 4" each - larger for sideline visibility */
        .wristband-print-coach {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4in;
          padding: 0.4in;
          background: white;
          min-height: 11in;
        }

        .wristband-print-coach .wristband-card {
          width: 7.5in;
          height: 4in;
          border: 2px solid black;
          background: white;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* WIZ cards for coach: LARGER for sideline visibility */
        /* 7.5" x 5" maintains 3:2 ratio, maximizes page usage */
        .wristband-print-coach .wristband-card.layout-wiz {
          width: 7.5in;
          height: 5in;
        }

        /* Page containers for proper page breaks */
        .wristband-page {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-content: flex-start;
          align-items: flex-start;
          gap: 0.15in;
          width: 100%;
          box-sizing: border-box;
        }

        /* Only add page break if there are multiple pages */
        .wristband-page:not(:last-child) {
          page-break-after: always;
          break-after: page;
        }

        /* Explicitly prevent page break after last page */
        .wristband-page:last-child,
        .wristband-page:only-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
          height: auto !important;
          min-height: 0 !important;
        }

        .wristband-print-player .wristband-page {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-content: flex-start;
          align-items: flex-start;
          gap: 0.15in;
          height: auto;
          max-height: 8in;
          padding: 0;
          margin: 0;
          overflow: hidden;
        }

        @media print {
          .wristband-print-player .wristband-page {
            max-height: none !important;
            overflow: visible !important;
          }
        }

        .wristband-print-coach .wristband-page {
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 0.3in;
          height: auto;
          max-height: 10.5in;
          padding: 0.1in;
        }

        /* Card header */
        .card-header-row {
          background: black;
          color: white;
          font-weight: bold;
          padding: 2px 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .wristband-print-player .card-header-row {
          font-size: 7pt;
          padding: 1px 4px;
        }

        .wristband-print-coach .card-header-row {
          font-size: 10pt;
        }

        /* Standard layout grid */
        .slot-grid-standard {
          flex: 1;
          display: grid;
          overflow: hidden;
          min-height: 0;
          max-height: 100%;
        }

        .slot-row-pair {
          display: grid;
          grid-template-columns: 20px 1fr 20px 1fr;
          border-bottom: 1px solid #ccc;
          min-height: 0;
        }

        .wristband-print-coach .slot-row-pair {
          grid-template-columns: 32px 1fr 32px 1fr;
          border-bottom: 1px solid #333;
        }

        .slot-row-pair:last-child {
          border-bottom: none;
        }

        .slot-number-cell {
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #333;
          color: black;
        }

        .wristband-print-player .slot-number-cell {
          font-size: 5pt;
          min-width: 18px;
        }

        .wristband-print-coach .slot-number-cell {
          font-size: 8pt;
        }

        .slot-play-cell {
          display: flex;
          align-items: center;
          padding: 0 2px;
          font-weight: bold;
          color: black;
          overflow: hidden;
        }

        .wristband-print-player .slot-play-cell {
          font-size: 5pt;
        }

        .wristband-print-coach .slot-play-cell {
          font-size: 8pt;
        }

        .slot-play-cell.with-border {
          border-right: 1px solid #333;
        }

        .slot-number-cell.left-border {
          border-left: 1px solid #333;
        }

        .play-name-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* WIZ layout */
        /* WIZ card header - compact red header for player format */
        .wristband-card.layout-wiz .card-header-row {
          background: #dc2626;
          font-size: 5pt;
          padding: 1px 4px;
          height: 10px;
          min-height: 10px;
        }

        /* Coach format WIZ: larger header for visibility */
        .wristband-print-coach .wristband-card.layout-wiz .card-header-row {
          font-size: 10pt;
          padding: 2px 8px;
          height: 18px;
          min-height: 18px;
        }

        .wiz-grid {
          flex: 1;
          display: grid;
          grid-template-rows: repeat(4, 1fr);
          overflow: hidden;
          border: 1px solid black;
          border-top: none;
        }

        .wiz-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        .wiz-cell {
          outline: 1px solid black;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .wiz-diagram-area {
          flex: 1;
          background: #f9fafb;
          min-height: 0;
        }

        .wiz-label-area {
          display: flex;
          border-top: 1px solid black;
          background: white;
          height: 11px;
          min-height: 11px;
          max-height: 11px;
          flex-shrink: 0;
        }

        /* Coach format WIZ: larger label area */
        .wristband-print-coach .wiz-label-area {
          height: 20px;
          min-height: 20px;
          max-height: 20px;
        }

        .wiz-slot-num {
          width: 18px;
          min-width: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 5pt;
          font-weight: bold;
          border-right: 1px solid black;
        }

        /* Coach format WIZ: larger slot numbers */
        .wristband-print-coach .wiz-slot-num {
          width: 28px;
          min-width: 28px;
          font-size: 9pt;
        }

        .wiz-play-name {
          flex: 1;
          display: flex;
          align-items: center;
          font-size: 5pt;
          font-weight: bold;
          padding: 0 2px;
          overflow: hidden;
        }

        /* Coach format WIZ: larger play names */
        .wristband-print-coach .wiz-play-name {
          font-size: 9pt;
          padding: 0 4px;
        }

        /* Mini-scripts layout */
        .mini-script-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .mini-script-table {
          border-collapse: collapse;
          width: 100%;
          flex: 1;
          table-layout: fixed;
        }

        .mini-script-table th {
          background: #e5e5e5;
          font-size: 8pt;
          font-weight: bold;
          border: 1px solid #333;
          padding: 2px;
        }

        .mini-script-table td {
          border: 1px solid #333;
          padding: 0 4px;
          font-size: 0.55rem;
          color: black;
        }

        .mini-script-table .coord-cell {
          text-align: center;
          font-weight: bold;
        }

        .mini-script-table .tempo-cell {
          text-align: center;
        }

        .mini-script-header-row {
          font-weight: bold;
          text-align: center;
        }
      `}</style>

      {/* Group cards into pages (4 per page for player, 2 for coach) */}
      {(() => {
        const pages = [];
        for (let i = 0; i < cardsToPrint.length; i += copiesPerPage) {
          const pageCards = cardsToPrint.slice(i, i + copiesPerPage);
          pages.push(
            <div key={`page-${i}`} className="wristband-page">
              {pageCards.map((card, idx) => (
                <WristbandCard
                  key={`${card.id}-${card.wizVariant || 'std'}-${card.copyIndex}-${i + idx}`}
                  card={card}
                  showSlotNumbers={showSlotNumbers}
                  showFormation={showFormation}
                  getPlayForSlot={(slot) => getPlayForSlot(card.id, slot)}
                  isCoachFormat={isCoachFormat}
                  wizVariant={card.wizVariant}
                />
              ))}
            </div>
          );
        }
        return pages;
      })()}
    </div>
  );
}

// Individual wristband card - renders based on layout type
function WristbandCard({ card, showSlotNumbers, showFormation, getPlayForSlot, isCoachFormat, wizVariant }) {
  const { tab, settings, slots } = card;
  const cardColor = settings.color || 'white';
  const layoutType = settings.type || 'standard';
  const title = `${settings.opponent || 'OPPONENT'} ${settings.iteration || '1'}`;

  // For WIZ cards, show SKILL or OLINE in the header
  const headerLabel = layoutType === 'wiz' && wizVariant
    ? `${tab.label} ${wizVariant.toUpperCase()}`
    : tab.label;

  // Get row color for alternating shades
  const getRowColor = (rowIndex) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = rowIndex % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  return (
    <div className={`wristband-card layout-${layoutType}`}>
      {/* Card Header */}
      <div className="card-header-row">
        <span>{headerLabel}</span>
        <span>{title}</span>
      </div>

      {/* Card Content - varies by layout type */}
      {layoutType === 'wiz' ? (
        <WizLayout
          slots={slots}
          getPlayForSlot={getPlayForSlot}
          showSlotNumbers={showSlotNumbers}
          showFormation={showFormation}
          wizVariant={wizVariant}
        />
      ) : layoutType === 'mini-scripts' ? (
        <MiniScriptsLayout
          rows={settings.rows || []}
          startCoord={tab.startSlot}
          cardColor={cardColor}
          title={title}
        />
      ) : (
        <StandardLayout
          slots={slots}
          getPlayForSlot={getPlayForSlot}
          showSlotNumbers={showSlotNumbers}
          showFormation={showFormation}
          getRowColor={getRowColor}
        />
      )}
    </div>
  );
}

// Standard 2-column layout (matching SpreadsheetTable from WristbandBuilder)
function StandardLayout({ slots, getPlayForSlot, showSlotNumbers, showFormation, getRowColor }) {
  // Split into odd/even for two columns
  const col1 = slots.filter((_, i) => i % 2 === 0);
  const col2 = slots.filter((_, i) => i % 2 === 1);
  const rowCount = Math.max(col1.length, col2.length);

  const tableRows = [];
  for (let i = 0; i < rowCount; i++) {
    tableRows.push([col1[i], col2[i]]);
  }

  return (
    <div
      className="slot-grid-standard"
      style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
    >
      {tableRows.map((rowGroup, rowIndex) => (
        <div
          key={rowIndex}
          className="slot-row-pair"
          style={{ background: getRowColor(rowIndex) }}
        >
          {rowGroup.map((slot, colIndex) => {
            if (slot === undefined) {
              return [
                <div key={`empty-slot-${colIndex}`} className="slot-number-cell" />,
                <div key={`empty-play-${colIndex}`} className={`slot-play-cell ${colIndex === 0 ? 'with-border' : ''}`} />
              ];
            }
            const play = getPlayForSlot(slot);
            const playText = play
              ? (showFormation && play.formation
                ? `${play.formation} ${play.name}`
                : play.name)
              : '';

            return [
              <div
                key={`slot-${slot}`}
                className={`slot-number-cell ${colIndex === 1 ? 'left-border' : ''}`}
              >
                {showSlotNumbers && slot}
              </div>,
              <div
                key={`play-${slot}`}
                className={`slot-play-cell ${colIndex === 0 ? 'with-border' : ''}`}
              >
                <span className="play-name-text">{playText}</span>
              </div>
            ];
          })}
        </div>
      ))}
    </div>
  );
}

// WIZ 4x4 grid layout
function WizLayout({ slots, getPlayForSlot, showSlotNumbers, showFormation, wizVariant = 'skill' }) {
  const rows = [];
  for (let i = 0; i < slots.length; i += 4) {
    rows.push(slots.slice(i, i + 4));
  }

  return (
    <div className="wiz-grid">
      {rows.map((rowSlots, rIndex) => (
        <div key={rIndex} className="wiz-row">
          {rowSlots.map((slot, cIndex) => {
            const play = getPlayForSlot(slot);

            // For SKILL: show play name/abbreviation
            // For OLINE: show OL scheme name
            let displayName = '';
            if (play) {
              if (wizVariant === 'oline') {
                // OLINE variant shows the OL blocking scheme
                displayName = play.wizOlineRef?.name || '';
              } else {
                // SKILL variant shows the play abbreviation or name
                displayName = play.wizAbbreviation || (showFormation && play.formation
                  ? `${play.formation} ${play.name}`
                  : play.name);
              }
            }

            return (
              <div key={slot} className="wiz-cell">
                <div className="wiz-diagram-area">
                  {/* Diagram placeholder - could show wizSkillData or wizOlineRef.diagramData */}
                </div>
                <div className="wiz-label-area">
                  {showSlotNumbers && (
                    <div className="wiz-slot-num">{slot}</div>
                  )}
                  <div className="wiz-play-name">
                    <span className="play-name-text">{displayName}</span>
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

// Mini-scripts 5-column table layout
function MiniScriptsLayout({ rows, startCoord, cardColor, title }) {
  let currentCoord = startCoord;
  let playRowIndex = 0;

  const getRowColor = (idx) => {
    if (!cardColor || cardColor === 'white') return 'transparent';
    const shade = idx % 2 === 0 ? 'light' : 'medium';
    return COLOR_MAP[`${cardColor}-${shade}`] || 'transparent';
  };

  return (
    <div className="mini-script-container">
      <table className="mini-script-table">
        <colgroup>
          <col style={{ width: '38px' }} />
          <col style={{ width: '50px' }} />
          <col />
          <col style={{ width: '50px' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>TEMPO</th>
            <th>PLAY A</th>
            <th>TEMPO</th>
            <th>PLAY B</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === 'header') {
              const hc = HEADER_COLORS[row.color] || HEADER_COLORS.gray;
              return (
                <tr key={row.id}>
                  <td
                    colSpan={5}
                    className="mini-script-header-row"
                    style={{
                      background: hc.bg,
                      color: hc.text,
                      padding: '2px 8px'
                    }}
                  >
                    {row.label}
                  </td>
                </tr>
              );
            } else {
              const coord = currentCoord++;
              const bg = getRowColor(playRowIndex++);
              return (
                <tr key={row.id} style={{ background: bg }}>
                  <td className="coord-cell">{coord}</td>
                  <td
                    className="tempo-cell"
                    style={{ background: row.col0 ? '#fed7aa' : 'transparent' }}
                  >
                    {row.col0}
                  </td>
                  <td>{row.col1}</td>
                  <td
                    className="tempo-cell"
                    style={{ background: row.col2 ? '#fed7aa' : 'transparent' }}
                  >
                    {row.col2}
                  </td>
                  <td>{row.col3}</td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}

// Export card tabs for use by other components
export { CARD_TABS };
