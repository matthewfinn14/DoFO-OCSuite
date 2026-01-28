import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';
import DiagramPreview from '../../diagrams/DiagramPreview';

/**
 * Playbook print template - supports card and list views
 */
export default function PlaybookPrint({
  viewMode = 'cards',
  cardsPerPage = 4,
  showDiagrams = true,
  showFormation = true,
  showTags = false,
  filterPhase = null,
  filterBucket = null,
  filterFormation = null,
  orientation = 'portrait'
}) {
  const { playsArray, settings, setupConfig } = useSchool();

  // Filter plays
  const filteredPlays = useMemo(() => {
    let plays = [...playsArray];

    if (filterPhase) {
      plays = plays.filter(p => p.phase === filterPhase);
    }
    if (filterBucket) {
      plays = plays.filter(p => p.bucket === filterBucket);
    }
    if (filterFormation) {
      plays = plays.filter(p => p.formation === filterFormation);
    }

    // Sort by name
    plays.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return plays;
  }, [playsArray, filterPhase, filterBucket, filterFormation]);

  const orientationClass = orientation === 'landscape' ? 'print-page-landscape' : '';

  return (
    <div className={`playbook-print ${orientationClass} bg-white`}>
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          {settings?.teamLogo && (
            <img src={settings.teamLogo} alt="Logo" className="print-header-logo" />
          )}
          <div className="print-header-info">
            <div className="print-header-title">Playbook</div>
            <div className="print-header-subtitle">
              {filteredPlays.length} Plays
              {filterPhase && ` - ${filterPhase}`}
              {filterBucket && ` - ${filterBucket}`}
            </div>
          </div>
        </div>
        <div className="print-header-right">
          <div className="print-header-date">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <ListView
          plays={filteredPlays}
          showFormation={showFormation}
          showTags={showTags}
        />
      ) : (
        <CardsView
          plays={filteredPlays}
          cardsPerPage={cardsPerPage}
          showDiagrams={showDiagrams}
          showFormation={showFormation}
          showTags={showTags}
          setupConfig={setupConfig}
        />
      )}
    </div>
  );
}

// Card view - grid of play cards
function CardsView({ plays, cardsPerPage, showDiagrams, showFormation, showTags, setupConfig }) {
  const gridClass = `playbook-print-cards cards-per-page-${cardsPerPage}`;

  return (
    <div className={gridClass}>
      {plays.map(play => (
        <div key={play.id} className="playbook-card">
          {/* Card Header */}
          <div className="playbook-card-header">
            <span className="playbook-card-name">{play.name}</span>
            {showFormation && play.formation && (
              <span className="playbook-card-formation">{play.formation}</span>
            )}
          </div>

          {/* Diagram */}
          {showDiagrams && (
            <div className="playbook-card-diagram">
              {play.diagramData ? (
                <DiagramPreview
                  diagramData={play.diagramData}
                  positionColors={setupConfig?.positionColors}
                  positionNames={setupConfig?.positionNames}
                  width="100%"
                  height="100%"
                />
              ) : (
                <span className="text-gray-400 text-sm">No diagram</span>
              )}
            </div>
          )}

          {/* Tags */}
          {showTags && (
            <div className="playbook-card-tags">
              {play.bucket && (
                <span className="playbook-card-tag">{play.bucket}</span>
              )}
              {play.conceptGroup && (
                <span className="playbook-card-tag">{play.conceptGroup}</span>
              )}
              {play.phase && (
                <span className="playbook-card-tag">{play.phase}</span>
              )}
            </div>
          )}

          {/* Additional Info */}
          {play.wristbandSlot && (
            <div className="text-xs text-blue-600 font-bold mt-1">
              Wristband: {play.wristbandSlot}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// List view - tabular format
function ListView({ plays, showFormation, showTags }) {
  return (
    <div className="playbook-print-list">
      <table className="playbook-list-table">
        <thead>
          <tr>
            <th>Play Name</th>
            {showFormation && <th>Formation</th>}
            <th>Phase</th>
            <th>Category</th>
            {showTags && <th>Concept</th>}
            <th>Wristband</th>
          </tr>
        </thead>
        <tbody>
          {plays.map(play => (
            <tr key={play.id}>
              <td className="font-medium">{play.name}</td>
              {showFormation && <td>{play.formation || '-'}</td>}
              <td>{play.phase || '-'}</td>
              <td>{play.bucket || '-'}</td>
              {showTags && <td>{play.conceptGroup || '-'}</td>}
              <td className="text-blue-600 font-bold">
                {play.wristbandSlot || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
