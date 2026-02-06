import { useState, useCallback, useMemo, useRef } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Check, AlertCircle, FileSpreadsheet, BookOpen, Eye, Settings2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Column aliases for auto-detection (from PostgameReview)
const COLUMN_ALIASES = {
  formation: ['OFF FORM', 'OFF FORMATION', 'FORMATION', 'FORM'],
  backfield: ['OFF BACKFIELD', 'BACKFIELD', 'BACK'],
  motion: ['OFF MOTION', 'MOTION', 'MOT'],
  playName: ['OFF PLAY', 'PLAY NAME', 'PLAY CALL', 'CALL'],
  playType: ['PLAY TYPE', 'TYPE', 'RUN/PASS', 'R/P'],
  playDir: ['PLAY DIR', 'DIRECTION', 'DIR', 'R/L'],
  personnel: ['PERSONNEL', 'PERS', 'GROUPING'],
  tag: ['TAG', 'SHIFT', 'CONCEPT TAG']
};

// Auto-detect column mapping from headers
function autoDetectColumnMapping(headers) {
  const mapping = {};
  const upperHeaders = headers.map(h => h.toUpperCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = upperHeaders.indexOf(alias.toUpperCase());
      if (idx !== -1) {
        mapping[field] = headers[idx];
        break;
      }
    }
  }

  return mapping;
}

// Build a full play call string from components
function buildPlayCall(play, includeFields) {
  const parts = [];
  if (includeFields.formation && play.formation) parts.push(play.formation);
  if (includeFields.backfield && play.backfield) parts.push(play.backfield);
  if (includeFields.playName && play.playName) parts.push(play.playName);
  if (includeFields.playDir && play.playDir) parts.push(play.playDir);
  if (includeFields.motion && play.motion) parts.push(`(${play.motion})`);
  if (includeFields.tag && play.tag) parts.push(`[${play.tag}]`);
  return parts.join(' ');
}

export default function HudlDataImportWizard({ isOpen, onClose, onImport, existingPlays = [], isLight = false }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [extractedPlays, setExtractedPlays] = useState([]);
  const [selectedPlays, setSelectedPlays] = useState(new Set());
  const [includeFields, setIncludeFields] = useState({
    formation: true,
    backfield: true,
    playName: true,
    playDir: true,
    motion: false,
    tag: false
  });
  const [createSelfScout, setCreateSelfScout] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setImportError(null);
    setFile(selectedFile);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        setImportError('File appears to be empty or has no data rows');
        return;
      }

      const fileHeaders = jsonData[0].map(h => String(h || '').trim());
      setHeaders(fileHeaders);
      setRawData(jsonData.slice(1));

      // Auto-detect column mapping
      const detected = autoDetectColumnMapping(fileHeaders);
      setColumnMapping(detected);

      setStep(2);
    } catch (err) {
      console.error('Import error:', err);
      setImportError('Failed to read file. Please ensure it\'s a valid Excel file.');
    }
  }, []);

  // Extract unique plays based on current mapping and field selection
  const extractPlays = useCallback(() => {
    if (!headers.length || !rawData.length) return;

    const getValue = (row, field) => {
      const colName = columnMapping[field];
      if (!colName) return '';
      const colIdx = headers.indexOf(colName);
      if (colIdx === -1) return '';
      return String(row[colIdx] || '').trim();
    };

    // Extract all plays with their components
    const allPlays = rawData
      .filter(row => row && row.length > 0)
      .map(row => ({
        formation: getValue(row, 'formation'),
        backfield: getValue(row, 'backfield'),
        playName: getValue(row, 'playName'),
        playDir: getValue(row, 'playDir'),
        motion: getValue(row, 'motion'),
        tag: getValue(row, 'tag'),
        playType: getValue(row, 'playType'),
        personnel: getValue(row, 'personnel')
      }))
      .filter(p => p.playName); // Must have at least a play name

    // Build unique play call strings
    const uniquePlays = new Map();
    allPlays.forEach(play => {
      const callString = buildPlayCall(play, includeFields);
      if (callString && !uniquePlays.has(callString)) {
        uniquePlays.set(callString, {
          ...play,
          callString,
          count: 1,
          id: `import_${Date.now()}_${uniquePlays.size}`
        });
      } else if (callString) {
        uniquePlays.get(callString).count++;
      }
    });

    // Check against existing plays
    const existingNames = new Set(existingPlays.map(p => p.name?.toLowerCase()));
    const plays = Array.from(uniquePlays.values()).map(play => ({
      ...play,
      alreadyExists: existingNames.has(play.callString.toLowerCase())
    }));

    // Sort by count (most used first)
    plays.sort((a, b) => b.count - a.count);

    setExtractedPlays(plays);
    // Select all non-existing plays by default
    setSelectedPlays(new Set(plays.filter(p => !p.alreadyExists).map(p => p.id)));
  }, [headers, rawData, columnMapping, includeFields, existingPlays]);

  // Run extraction when moving to step 3
  const goToStep3 = useCallback(() => {
    extractPlays();
    setStep(3);
  }, [extractPlays]);

  // Handle final import
  const handleImport = useCallback(async () => {
    setImporting(true);

    try {
      const playsToImport = extractedPlays
        .filter(p => selectedPlays.has(p.id))
        .map(p => ({
          name: p.callString,
          formation: p.formation,
          backfield: p.backfield,
          playDir: p.playDir,
          motion: p.motion,
          tag: p.tag,
          playType: p.playType?.toLowerCase().includes('run') ? 'run' :
                    p.playType?.toLowerCase().includes('pass') ? 'pass' : 'run',
          personnel: p.personnel,
          importedFromHudl: true,
          importedAt: new Date().toISOString(),
          usageCount: p.count // Track how often it was called last season
        }));

      await onImport(playsToImport, createSelfScout ? rawData : null, createSelfScout ? columnMapping : null);
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
      setImportError('Failed to import plays. Please try again.');
    } finally {
      setImporting(false);
    }
  }, [extractedPlays, selectedPlays, createSelfScout, rawData, columnMapping, onImport, onClose]);

  // Toggle all plays selection
  const toggleSelectAll = useCallback(() => {
    if (selectedPlays.size === extractedPlays.filter(p => !p.alreadyExists).length) {
      setSelectedPlays(new Set());
    } else {
      setSelectedPlays(new Set(extractedPlays.filter(p => !p.alreadyExists).map(p => p.id)));
    }
  }, [extractedPlays, selectedPlays]);

  // Stats for step 3
  const stats = useMemo(() => ({
    total: extractedPlays.length,
    selected: selectedPlays.size,
    existing: extractedPlays.filter(p => p.alreadyExists).length,
    new: extractedPlays.filter(p => !p.alreadyExists).length
  }), [extractedPlays, selectedPlays]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col ${
        isLight ? 'bg-white' : 'bg-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isLight ? 'border-gray-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Import Hudl Data
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Import game data for self-scout, QC, and play terminology
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'}`}
          >
            <X size={20} className={isLight ? 'text-gray-500' : 'text-slate-400'} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className={`flex items-center justify-center gap-2 py-3 border-b ${
          isLight ? 'border-gray-100 bg-gray-50' : 'border-slate-800 bg-slate-800/50'
        }`}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-amber-500 text-white'
                  : isLight ? 'bg-gray-200 text-gray-500' : 'bg-slate-700 text-slate-500'
              }`}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  step > s ? 'bg-amber-500' : isLight ? 'bg-gray-200' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {importError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle size={18} />
              {importError}
            </div>
          )}

          {/* Step 1: Upload File */}
          {step === 1 && (
            <div className="text-center py-8">
              <FileSpreadsheet size={64} className={`mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Upload Last Season's Game Data
              </h3>
              <p className={`mb-6 max-w-md mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Export any game from last season in Hudl as an Excel file (.xlsx).
                We'll extract your play calls to build your playbook.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                <Upload size={20} />
                Select Hudl Export File
              </button>

              <div className={`mt-8 p-4 rounded-lg max-w-md mx-auto text-left ${
                isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <h4 className={`font-medium mb-2 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                  Before you export from Hudl:
                </h4>
                <ul className={`text-sm space-y-1 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                  <li>1. Make sure the game is fully tagged</li>
                  <li>2. Include columns for: Formation, Backfield, Play Name, R/L</li>
                  <li>3. Go to Reports → Play Data → Export as Excel</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Map Your Columns
              </h3>
              <p className={`mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Select which columns from your Hudl export contain your play call information.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {Object.entries({
                  formation: 'Formation',
                  backfield: 'Backfield',
                  playName: 'Play Name *',
                  playDir: 'Direction (R/L)',
                  motion: 'Motion',
                  tag: 'Tag/Concept',
                  playType: 'Play Type (Run/Pass)',
                  personnel: 'Personnel'
                }).map(([key, label]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium mb-1 ${
                      isLight ? 'text-gray-700' : 'text-slate-300'
                    }`}>
                      {label}
                    </label>
                    <select
                      value={columnMapping[key] || ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [key]: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900'
                          : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    >
                      <option value="">-- Not Used --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className={`p-4 rounded-lg ${isLight ? 'bg-sky-50 border border-sky-200' : 'bg-sky-500/10 border border-sky-500/20'}`}>
                <h4 className={`font-medium mb-3 flex items-center gap-2 ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>
                  <Settings2 size={16} />
                  Include in Play Name:
                </h4>
                <div className="flex flex-wrap gap-3">
                  {Object.entries({
                    formation: 'Formation',
                    backfield: 'Backfield',
                    playName: 'Play Name',
                    playDir: 'Direction',
                    motion: 'Motion',
                    tag: 'Tag'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeFields[key]}
                        onChange={(e) => setIncludeFields(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded"
                      />
                      <span className={`text-sm ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>{label}</span>
                    </label>
                  ))}
                </div>
                <p className={`mt-2 text-xs ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
                  Example: {buildPlayCall({ formation: 'Trips Rt', backfield: 'Gun', playName: 'Mesh', playDir: 'R', motion: 'Jet', tag: 'Y-Sail' }, includeFields) || '(select fields above)'}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Import */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Review Extracted Plays
                  </h3>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                    Found {stats.total} unique plays • {stats.new} new • {stats.existing} already in playbook
                  </p>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className={`text-sm px-3 py-1 rounded ${
                    isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedPlays.size === stats.new ? 'Deselect All' : 'Select All New'}
                </button>
              </div>

              <div className={`max-h-64 overflow-y-auto rounded-lg border ${
                isLight ? 'border-gray-200' : 'border-slate-700'
              }`}>
                {extractedPlays.map(play => (
                  <label
                    key={play.id}
                    className={`flex items-center gap-3 px-4 py-2 border-b last:border-b-0 cursor-pointer ${
                      play.alreadyExists
                        ? isLight ? 'bg-gray-50 opacity-60' : 'bg-slate-800/50 opacity-60'
                        : isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800/50'
                    } ${isLight ? 'border-gray-100' : 'border-slate-800'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlays.has(play.id)}
                      disabled={play.alreadyExists}
                      onChange={(e) => {
                        const newSelected = new Set(selectedPlays);
                        if (e.target.checked) {
                          newSelected.add(play.id);
                        } else {
                          newSelected.delete(play.id);
                        }
                        setSelectedPlays(newSelected);
                      }}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {play.callString}
                      </div>
                      <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                        Called {play.count}x last season
                        {play.playType && ` • ${play.playType}`}
                      </div>
                    </div>
                    {play.alreadyExists && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isLight ? 'bg-gray-200 text-gray-600' : 'bg-slate-700 text-slate-400'
                      }`}>
                        Already exists
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* Self-Scout Option */}
              <div className={`mt-6 p-4 rounded-lg ${
                isLight ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/20'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createSelfScout}
                    onChange={(e) => setCreateSelfScout(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className={`font-medium flex items-center gap-2 ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
                      <Eye size={16} />
                      Also create a Self-Scout review
                    </div>
                    <p className={`text-sm mt-1 ${isLight ? 'text-purple-600' : 'text-purple-300'}`}>
                      Import this game into Postgame Review for quality control analysis of last season's performance.
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary */}
              <div className={`mt-6 p-4 rounded-lg ${
                isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
              }`}>
                <div className={`font-medium flex items-center gap-2 ${isLight ? 'text-green-800' : 'text-green-400'}`}>
                  <BookOpen size={16} />
                  Ready to Import
                </div>
                <p className={`text-sm mt-1 ${isLight ? 'text-green-700' : 'text-green-300'}`}>
                  {stats.selected} plays will be added to your playbook
                  {createSelfScout && ' + self-scout review created'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800 bg-slate-800/50'
        }`}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ChevronLeft size={18} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => step === 2 ? goToStep3() : null}
              disabled={step === 2 && !columnMapping.playName}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
                step === 2 && !columnMapping.playName
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing || stats.selected === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
                importing || stats.selected === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {importing ? 'Importing...' : `Import ${stats.selected} Plays`}
              <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
