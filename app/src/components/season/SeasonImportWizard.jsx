import { useState, useCallback, useMemo } from 'react';
import {
  Upload, ChevronRight, ChevronLeft, Check, X, AlertTriangle, AlertCircle,
  FileSpreadsheet, Settings, Eye, CheckCircle2, Loader2, Download, Save
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  parseXLSXBuffer,
  autoDetectColumns,
  validateColumnMapping,
  processImport,
  getImportImpact,
  getDisabledFeatures,
  REQUIRED_COLUMNS,
  RECOMMENDED_COLUMNS,
  createImportProfile
} from '../../utils/seasonImport';

/**
 * 5-Step Import Wizard for Hudl XLSX files
 * Steps: FileSelector -> ColumnMapper -> ValidationPanel -> FeatureImpactPanel -> ReviewConfirm
 */
export default function SeasonImportWizard({ year, onComplete, onCancel }) {
  const { addImportedGames, saveImportProfile, getSeasonAnalyticsForYear } = useSchool();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // File state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [parsedData, setParsedData] = useState(null);

  // Mapping state
  const [columnMappings, setColumnMappings] = useState({});
  const [autoDetectedMappings, setAutoDetectedMappings] = useState({});
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [newProfileName, setNewProfileName] = useState('');

  // Validation state
  const [validation, setValidation] = useState(null);

  // Import result state
  const [importResult, setImportResult] = useState(null);

  // Get existing import profiles
  const yearData = getSeasonAnalyticsForYear(year);
  const importProfiles = yearData.importProfiles || [];

  const steps = [
    { id: 'file', label: 'Select File', icon: Upload },
    { id: 'mapping', label: 'Map Columns', icon: Settings },
    { id: 'validation', label: 'Validate', icon: Eye },
    { id: 'impact', label: 'Feature Impact', icon: AlertCircle },
    { id: 'review', label: 'Confirm', icon: CheckCircle2 }
  ];

  // ============================================================================
  // STEP 1: FILE SELECTOR
  // ============================================================================

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      // For now, handle single file (can extend to batch later)
      const file = files[0];
      const buffer = await file.arrayBuffer();
      const parsed = parseXLSXBuffer(buffer);

      setParsedData({
        fileName: file.name,
        headers: parsed.headers,
        rows: parsed.rows,
        sheetName: parsed.sheetName,
        buffer
      });
      setSelectedFiles([file.name]);

      // Auto-detect column mappings
      const detected = autoDetectColumns(parsed.headers);
      setAutoDetectedMappings(detected.mappings);
      setColumnMappings(detected.mappings);

      // Validate the auto-detected mappings
      const mappingValidation = validateColumnMapping(detected.mappings);
      setValidation(mappingValidation);

      setCurrentStep(1);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err.message || 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].name.endsWith('.xlsx')) {
      handleFileSelect({ target: { files } });
    }
  }, [handleFileSelect]);

  // ============================================================================
  // STEP 2: COLUMN MAPPER
  // ============================================================================

  const handleMappingChange = useCallback((columnKey, headerIndex) => {
    const newMappings = { ...columnMappings };
    if (headerIndex === '') {
      delete newMappings[columnKey];
    } else {
      newMappings[columnKey] = parseInt(headerIndex);
    }
    setColumnMappings(newMappings);

    // Re-validate
    const mappingValidation = validateColumnMapping(newMappings);
    setValidation(mappingValidation);
  }, [columnMappings]);

  const handleProfileSelect = useCallback((profileId) => {
    if (!profileId) {
      setSelectedProfileId(null);
      setColumnMappings(autoDetectedMappings);
      return;
    }

    const profile = importProfiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfileId(profileId);
      setColumnMappings(profile.columnMapping);
      const mappingValidation = validateColumnMapping(profile.columnMapping);
      setValidation(mappingValidation);
    }
  }, [importProfiles, autoDetectedMappings]);

  const handleSaveProfile = useCallback(async () => {
    if (!newProfileName.trim()) return;

    const profile = createImportProfile(newProfileName.trim(), columnMappings);
    await saveImportProfile(year, profile);
    setSelectedProfileId(profile.id);
    setNewProfileName('');
  }, [newProfileName, columnMappings, year, saveImportProfile]);

  // ============================================================================
  // STEP 5: FINAL IMPORT
  // ============================================================================

  const handleImport = useCallback(async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = processImport(parsedData.buffer, {
        columnMapping: columnMappings,
        profileId: selectedProfileId
      });

      setImportResult(result);

      // Add valid games to season analytics
      if (result.validGames.length > 0) {
        await addImportedGames(year, result.validGames, selectedProfileId);
      }

      // Move to final step to show results
      if (currentStep < 4) {
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import data');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData, columnMappings, selectedProfileId, year, addImportedGames, currentStep]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        return parsedData !== null;
      case 1:
        return validation?.isValid;
      case 2:
        return validation?.isValid;
      case 3:
        return true;
      case 4:
        return importResult !== null;
      default:
        return false;
    }
  }, [currentStep, parsedData, validation, importResult]);

  const handleNext = useCallback(() => {
    if (currentStep === 3) {
      // Start import on step 4
      handleImport();
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, handleImport]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    if (onComplete) {
      onComplete(importResult);
    }
  }, [onComplete, importResult]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Import Season Data</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-slate-700 bg-slate-750">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-sky-500/20 text-sky-400' :
                    isComplete ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {isComplete ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : (
                      <StepIcon size={16} />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight size={16} className="mx-2 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Step 0: File Selector */}
          {currentStep === 0 && (
            <FileSelector
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              isProcessing={isProcessing}
            />
          )}

          {/* Step 1: Column Mapper */}
          {currentStep === 1 && parsedData && (
            <ColumnMapper
              headers={parsedData.headers}
              mappings={columnMappings}
              autoDetected={autoDetectedMappings}
              validation={validation}
              importProfiles={importProfiles}
              selectedProfileId={selectedProfileId}
              onMappingChange={handleMappingChange}
              onProfileSelect={handleProfileSelect}
              onSaveProfile={handleSaveProfile}
              newProfileName={newProfileName}
              onNewProfileNameChange={setNewProfileName}
            />
          )}

          {/* Step 2: Validation Panel */}
          {currentStep === 2 && validation && (
            <ValidationPanel
              validation={validation}
              rowCount={parsedData?.rows?.length || 0}
            />
          )}

          {/* Step 3: Feature Impact Panel */}
          {currentStep === 3 && validation && (
            <FeatureImpactPanel validation={validation} />
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <ReviewConfirm
              parsedData={parsedData}
              validation={validation}
              importResult={importResult}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={currentStep === 0 ? onCancel : handleBack}
            disabled={isProcessing}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed || isProcessing}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : currentStep === 3 ? (
                <>
                  Import Data
                  <Download size={16} />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FileSelector({ selectedFiles, onFileSelect, onDrop, isProcessing }) {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Upload Hudl Export</h3>
        <p className="text-slate-400 text-sm">
          Upload your Hudl game data export file (.xlsx format). You can export this from Hudl's reports section.
        </p>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-sky-500/50 transition-colors"
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-sky-400 animate-spin" />
            <p className="text-slate-400">Processing file...</p>
          </div>
        ) : selectedFiles.length > 0 ? (
          <div className="flex flex-col items-center gap-4">
            <FileSpreadsheet size={48} className="text-emerald-400" />
            <p className="text-white font-medium">{selectedFiles[0]}</p>
            <label className="cursor-pointer text-sky-400 hover:text-sky-300 text-sm">
              Choose different file
              <input
                type="file"
                accept=".xlsx"
                onChange={onFileSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload size={48} className="text-slate-500" />
            <div>
              <p className="text-white font-medium">Drop your file here</p>
              <p className="text-slate-400 text-sm mt-1">or</p>
            </div>
            <label className="cursor-pointer px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors">
              Browse Files
              <input
                type="file"
                accept=".xlsx"
                onChange={onFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-slate-500 text-sm">Supports .xlsx files</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ColumnMapper({
  headers,
  mappings,
  autoDetected,
  validation,
  importProfiles,
  selectedProfileId,
  onMappingChange,
  onProfileSelect,
  onSaveProfile,
  newProfileName,
  onNewProfileNameChange
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Map Columns</h3>
          <p className="text-slate-400 text-sm">
            We've auto-detected most columns. Verify and adjust mappings as needed.
          </p>
        </div>

        {/* Import Profile Selector */}
        {importProfiles.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedProfileId || ''}
              onChange={(e) => onProfileSelect(e.target.value)}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
            >
              <option value="">Auto-detected</option>
              {importProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Completeness Indicator */}
      <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400">Core Completeness</span>
            <span className={`text-sm font-medium ${
              validation?.coreCompleteness >= 90 ? 'text-emerald-400' :
              validation?.coreCompleteness >= 70 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {validation?.coreCompleteness || 0}%
            </span>
          </div>
          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                validation?.coreCompleteness >= 90 ? 'bg-emerald-500' :
                validation?.coreCompleteness >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation?.coreCompleteness || 0}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400">Context Completeness</span>
            <span className={`text-sm font-medium ${
              validation?.contextCompleteness >= 75 ? 'text-emerald-400' :
              validation?.contextCompleteness >= 50 ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {validation?.contextCompleteness || 0}%
            </span>
          </div>
          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                validation?.contextCompleteness >= 75 ? 'bg-emerald-500' :
                validation?.contextCompleteness >= 50 ? 'bg-amber-500' : 'bg-slate-500'
              }`}
              style={{ width: `${validation?.contextCompleteness || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Column Mapping Grid */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {/* Required Columns */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            Required Columns
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {REQUIRED_COLUMNS.map(col => {
              const isMapped = mappings[col.key] !== undefined;
              const isAutoDetected = autoDetected[col.key] !== undefined;

              return (
                <div key={col.key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-slate-400">{col.key}</label>
                    <select
                      value={mappings[col.key] ?? ''}
                      onChange={(e) => onMappingChange(col.key, e.target.value)}
                      className={`w-full mt-1 px-3 py-1.5 bg-slate-700 border rounded-lg text-sm text-white ${
                        isMapped ? 'border-emerald-500/50' : 'border-red-500/50'
                      }`}
                    >
                      <option value="">-- Not Mapped --</option>
                      {headers.map((header, idx) => (
                        <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>
                  {isAutoDetected && (
                    <span className="text-xs text-sky-400 mt-5">Auto</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Columns */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            Recommended Columns (Optional)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {RECOMMENDED_COLUMNS.map(col => {
              const isMapped = mappings[col.key] !== undefined;
              const isAutoDetected = autoDetected[col.key] !== undefined;

              return (
                <div key={col.key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-slate-400">{col.key}</label>
                    <select
                      value={mappings[col.key] ?? ''}
                      onChange={(e) => onMappingChange(col.key, e.target.value)}
                      className={`w-full mt-1 px-3 py-1.5 bg-slate-700 border rounded-lg text-sm text-white ${
                        isMapped ? 'border-emerald-500/50' : 'border-slate-600'
                      }`}
                    >
                      <option value="">-- Not Mapped --</option>
                      {headers.map((header, idx) => (
                        <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>
                  {isAutoDetected && (
                    <span className="text-xs text-sky-400 mt-5">Auto</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Profile */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => onNewProfileNameChange(e.target.value)}
          placeholder="Profile name..."
          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
        />
        <button
          onClick={onSaveProfile}
          disabled={!newProfileName.trim()}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={14} />
          Save Profile
        </button>
      </div>
    </div>
  );
}

function ValidationPanel({ validation, rowCount }) {
  const impact = getImportImpact(validation);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Validation Results</h3>
        <p className="text-slate-400 text-sm">
          Review validation results before proceeding with the import.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
          <p className="text-3xl font-bold text-white">{rowCount}</p>
          <p className="text-sm text-slate-400">Total Rows</p>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
          <p className={`text-3xl font-bold ${validation?.coreCompleteness >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {validation?.coreCompleteness || 0}%
          </p>
          <p className="text-sm text-slate-400">Core Complete</p>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-lg text-center">
          <p className={`text-3xl font-bold ${validation?.contextCompleteness >= 75 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {validation?.contextCompleteness || 0}%
          </p>
          <p className="text-sm text-slate-400">Context Complete</p>
        </div>
      </div>

      {/* Blockers */}
      {impact.blockers.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h4 className="flex items-center gap-2 text-red-400 font-medium mb-2">
            <AlertCircle size={16} />
            Blocking Issues ({impact.blockers.length})
          </h4>
          <ul className="space-y-1">
            {impact.blockers.map((blocker, idx) => (
              <li key={idx} className="text-sm text-red-300 flex items-center gap-2">
                <X size={12} />
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {impact.warnings.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <h4 className="flex items-center gap-2 text-amber-400 font-medium mb-2">
            <AlertTriangle size={16} />
            Warnings ({impact.warnings.length})
          </h4>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {impact.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-amber-300">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success */}
      {impact.canProceed && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <h4 className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 size={16} />
            Ready to Import
          </h4>
          <p className="text-sm text-emerald-300 mt-1">
            All required columns are mapped. You can proceed with the import.
          </p>
        </div>
      )}
    </div>
  );
}

function FeatureImpactPanel({ validation }) {
  const disabledFeatures = getDisabledFeatures(validation.missingRecommended);
  const impact = getImportImpact(validation);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Feature Impact</h3>
        <p className="text-slate-400 text-sm">
          See which analytics features will be available based on your column mapping.
        </p>
      </div>

      {/* Unlocked Features */}
      {impact.unlocked.length > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <h4 className="flex items-center gap-2 text-emerald-400 font-medium mb-3">
            <CheckCircle2 size={16} />
            Enabled Features ({impact.unlocked.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {impact.unlocked.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-emerald-300">
                <Check size={14} />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disabled Features */}
      {disabledFeatures.length > 0 && (
        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
          <h4 className="flex items-center gap-2 text-slate-300 font-medium mb-3">
            <AlertCircle size={16} />
            Unavailable Features ({disabledFeatures.length})
          </h4>
          <div className="space-y-2">
            {disabledFeatures.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{item.feature}</span>
                <span className="text-slate-500 text-xs">Missing: {item.column}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Features Always Available */}
      <div className="p-4 bg-slate-700/30 rounded-lg">
        <h4 className="text-slate-300 font-medium mb-2">Core Features (Always Available)</h4>
        <ul className="grid grid-cols-2 gap-1 text-sm text-slate-400">
          <li>Bucket performance (Run/Pass/Screen/RPO)</li>
          <li>Concept family analysis</li>
          <li>Down & distance breakdown</li>
          <li>Field zone efficiency</li>
          <li>Game-by-game trends</li>
          <li>Self-scout tendencies</li>
          <li>Anomaly detection</li>
          <li>Smart recommendations</li>
        </ul>
      </div>
    </div>
  );
}

function ReviewConfirm({ parsedData, validation, importResult, isProcessing }) {
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={48} className="text-sky-400 animate-spin mb-4" />
        <p className="text-white font-medium">Importing data...</p>
        <p className="text-slate-400 text-sm mt-1">This may take a moment</p>
      </div>
    );
  }

  if (importResult) {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <CheckCircle2 size={64} className="text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white">Import Complete</h3>
        </div>

        {/* Import Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-emerald-400">{importResult.validGames.length}</p>
            <p className="text-sm text-slate-400">Games Imported</p>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg text-center">
            <p className="text-3xl font-bold text-white">{importResult.stats.validSnaps}</p>
            <p className="text-sm text-slate-400">Total Snaps</p>
          </div>
        </div>

        {/* Invalid Games Warning */}
        {importResult.invalidGames.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <h4 className="flex items-center gap-2 text-amber-400 font-medium mb-2">
              <AlertTriangle size={16} />
              {importResult.invalidGames.length} Games Skipped
            </h4>
            <ul className="space-y-1 text-sm text-amber-300">
              {importResult.invalidGames.map((invalid, idx) => (
                <li key={idx}>
                  {invalid.game.opponent || invalid.game.gameId}: {invalid.issues.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Imported Games List */}
        {importResult.validGames.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Imported Games</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {importResult.validGames.map((game, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg text-sm">
                  <span className="text-white">{game.opponent || game.gameId}</span>
                  <span className="text-slate-400">{game.snaps?.length || 0} snaps</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-import confirmation
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2">Ready to Import</h3>
        <p className="text-slate-400 text-sm">
          Review your import settings before proceeding.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-400">File</p>
          <p className="text-white font-medium">{parsedData?.fileName}</p>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-400">Rows to Import</p>
          <p className="text-white font-medium">{parsedData?.rows?.length || 0}</p>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-400">Core Completeness</p>
          <p className="text-white font-medium">{validation?.coreCompleteness || 0}%</p>
        </div>
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-400">Context Completeness</p>
          <p className="text-white font-medium">{validation?.contextCompleteness || 0}%</p>
        </div>
      </div>

      <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
        <p className="text-sm text-sky-300">
          Click "Import Data" below to process the file and add games to your season analytics.
        </p>
      </div>
    </div>
  );
}
