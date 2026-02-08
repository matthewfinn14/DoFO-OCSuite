import { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  History,
  Calendar,
  Eye,
  CheckCircle,
  Upload,
  ArrowRight,
  Plus,
  FileSpreadsheet
} from 'lucide-react';

export default function SeasonHistory() {
  const {
    availableSeasons,
    activeYear,
    viewingYear,
    isViewingArchive,
    switchToSeason,
    settings
  } = useSchool();

  const [showImportHint, setShowImportHint] = useState(false);

  // Get theme
  const theme = settings?.theme || 'dark';
  const isLight = theme === 'light';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History size={32} className={isLight ? 'text-gray-700' : 'text-white'} />
          <h1 className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Season History
          </h1>
        </div>
        <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
          View and manage your program's seasons. Switch between seasons to access historical data.
        </p>
      </div>

      {/* Current Season Banner */}
      {isViewingArchive && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
          isLight
            ? 'bg-amber-50 border-amber-200'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <Eye className="text-amber-500" size={20} />
            <div>
              <p className={`font-medium ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                Currently viewing {viewingYear} (archived)
              </p>
              <p className={`text-sm ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>
                You're viewing historical data. Switch to {activeYear} to make changes.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchToSeason(activeYear)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Return to {activeYear}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Seasons List */}
      <div className={`rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
          <h2 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            All Seasons
          </h2>
        </div>

        <div className="divide-y divide-slate-800">
          {availableSeasons && availableSeasons.length > 0 ? (
            availableSeasons.map(season => {
              const isCurrent = season.year === activeYear;
              const isViewing = season.year === viewingYear;

              return (
                <div
                  key={season.year}
                  className={`p-4 flex items-center justify-between ${
                    isViewing ? (isLight ? 'bg-sky-50' : 'bg-sky-500/10') : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isCurrent
                        ? 'bg-green-500/20 text-green-500'
                        : isLight ? 'bg-gray-100 text-gray-500' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {season.label || season.year}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">
                            <CheckCircle size={12} />
                            Current
                          </span>
                        )}
                        {isViewing && !isCurrent && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-sky-500/20 text-sky-400 rounded-full">
                            <Eye size={12} />
                            Viewing
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        {isCurrent ? 'Active season - all changes saved here' : 'Archived - view only'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isViewing && (
                      <button
                        onClick={() => switchToSeason(season.year)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : isLight
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isCurrent ? 'Go to Current' : 'View Season'}
                      </button>
                    )}
                    {isViewing && (
                      <span className={`px-4 py-2 text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        Currently viewing
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <Calendar size={48} className={`mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-slate-600'}`} />
              <h3 className={`font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Only Current Season
              </h3>
              <p className={`text-sm mb-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                You only have one season. When you start a new season, previous seasons will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Import Historical Data Section */}
      <div className={`mt-6 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className={`px-4 py-3 border-b ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
          <h2 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Import Historical Data
          </h2>
        </div>

        <div className="p-4">
          <div className={`p-4 rounded-lg ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${isLight ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
                <FileSpreadsheet className="text-blue-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Import Last Season's Hudl Data
                </h3>
                <p className={`text-sm mb-3 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Upload your Hudl breakdown spreadsheets from last season to quickly import all your
                  play calls, formations, and game data. This creates a historical record you can reference.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Navigate to Playbook with Hudl import wizard open
                      window.location.href = '/playbook?import=hudl';
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Upload size={16} />
                    Import Hudl Data
                  </button>
                  <button
                    onClick={() => setShowImportHint(!showImportHint)}
                    className={`text-sm ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}
                  >
                    How does this work?
                  </button>
                </div>

                {showImportHint && (
                  <div className={`mt-4 p-3 rounded text-sm ${isLight ? 'bg-white border border-gray-200' : 'bg-slate-800'}`}>
                    <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                      <strong className={isLight ? 'text-gray-900' : 'text-white'}>Steps:</strong>
                    </p>
                    <ol className={`list-decimal ml-4 mt-2 space-y-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      <li>Export your breakdown data from Hudl as a CSV/Excel file</li>
                      <li>Click "Import Hudl Data" above</li>
                      <li>Map the columns to match your play call fields</li>
                      <li>Review and import - plays are automatically tagged with their season</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start New Season Section */}
      <div className={`mt-6 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
                <Plus className={isLight ? 'text-gray-600' : 'text-slate-400'} size={24} />
              </div>
              <div>
                <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Start a New Season
                </h3>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  Archive the current season and start fresh for the new year
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // TODO: Open New Season Wizard
                alert('New Season Wizard coming soon');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isLight
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus size={16} />
              New Season
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
