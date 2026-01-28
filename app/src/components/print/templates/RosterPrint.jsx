import { useMemo } from 'react';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Roster/Attendance print template - checklist format
 */
export default function RosterPrint({
  sortBy = 'number',
  filterBy = { positions: [], years: [], status: 'active' },
  columns = ['number', 'name', 'position', 'year'],
  checkboxColumn = true,
  checkboxSize = 'medium',
  orientation = 'portrait',
  title = 'Roster'
}) {
  const { roster, settings } = useSchool();

  // Column definitions
  const COLUMN_DEFS = {
    number: { label: '#', width: '60px' },
    name: { label: 'Name', width: 'auto' },
    position: { label: 'Pos', width: '80px' },
    year: { label: 'Year', width: '80px' },
    height: { label: 'Height', width: '80px' },
    weight: { label: 'Weight', width: '80px' }
  };

  // Sort roster
  const sortedRoster = useMemo(() => {
    let filtered = [...roster];

    // Apply filters
    if (filterBy.positions?.length > 0) {
      filtered = filtered.filter(p => filterBy.positions.includes(p.position));
    }
    if (filterBy.years?.length > 0) {
      filtered = filtered.filter(p => filterBy.years.includes(p.year));
    }
    if (filterBy.status === 'active') {
      filtered = filtered.filter(p => p.status !== 'inactive' && p.status !== 'injured');
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return (parseInt(a.number) || 999) - (parseInt(b.number) || 999);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'position':
          return (a.position || '').localeCompare(b.position || '');
        case 'year':
          const yearOrder = { 'SR': 1, 'JR': 2, 'SO': 3, 'FR': 4, 'Senior': 1, 'Junior': 2, 'Sophomore': 3, 'Freshman': 4 };
          return (yearOrder[a.year] || 99) - (yearOrder[b.year] || 99);
        default:
          return 0;
      }
    });

    return filtered;
  }, [roster, sortBy, filterBy]);

  // Checkbox size class
  const checkboxClass = {
    small: 'w-3.5 h-3.5',
    medium: 'w-4.5 h-4.5',
    large: 'w-5.5 h-5.5'
  }[checkboxSize] || 'w-4.5 h-4.5';

  const orientationClass = orientation === 'landscape' ? 'print-page-landscape' : '';

  // Get value for a column
  const getColumnValue = (player, column) => {
    switch (column) {
      case 'number':
        return player.number || '-';
      case 'name':
        return player.name || '-';
      case 'position':
        return player.position || '-';
      case 'year':
        return player.year || '-';
      case 'height':
        return player.height || '-';
      case 'weight':
        return player.weight ? `${player.weight} lbs` : '-';
      default:
        return player[column] || '-';
    }
  };

  return (
    <div className={`roster-print ${orientationClass}`}>
      {/* Header */}
      <div className="print-header">
        <div className="print-header-left">
          {settings?.teamLogo && (
            <img src={settings.teamLogo} alt="Logo" className="print-header-logo" />
          )}
          <div className="print-header-info">
            <div className="print-header-title">{title}</div>
            <div className="print-header-subtitle">
              {sortedRoster.length} Players
            </div>
          </div>
        </div>
        <div className="print-header-right">
          <div className="print-header-date">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Roster Table */}
      <table className="attendance-table mt-4">
        <thead>
          <tr>
            {checkboxColumn && (
              <th style={{ width: '40px' }} className="text-center"></th>
            )}
            {columns.map(col => (
              <th
                key={col}
                style={{ width: COLUMN_DEFS[col]?.width || 'auto' }}
              >
                {COLUMN_DEFS[col]?.label || col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRoster.map((player, idx) => (
            <tr key={player.id || idx}>
              {checkboxColumn && (
                <td className="text-center">
                  <div
                    className={`attendance-checkbox ${checkboxClass} border-2 border-gray-800 mx-auto`}
                  ></div>
                </td>
              )}
              {columns.map(col => (
                <td
                  key={col}
                  className={col === 'number' ? 'font-bold' : ''}
                >
                  {getColumnValue(player, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer with signature lines */}
      {title.toLowerCase().includes('attendance') && (
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-400 mb-1 h-8"></div>
              <div className="text-sm text-gray-600">Coach Signature</div>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-1 h-8"></div>
              <div className="text-sm text-gray-600">Date</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
