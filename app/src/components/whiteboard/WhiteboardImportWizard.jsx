import { useState, useCallback, useRef } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Check, AlertCircle, Camera, Loader2, RefreshCw, Edit3 } from 'lucide-react';
import DiagramPreview from '../diagrams/DiagramPreview';
import {
  analyzeWhiteboardImage,
  convertToWizElements,
  SKILL_POSITION_OPTIONS,
  getImageQualityTips
} from '../../services/whiteboardAnalysis';

export default function WhiteboardImportWizard({
  isOpen,
  onClose,
  onSave,
  onOpenEditor,
  schoolId,
  positionColors = {},
  positionNames = {},
  existingElements = null,
  isLight = false
}) {
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [positionAssignments, setPositionAssignments] = useState({});
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setAnalysisError('Image must be less than 10MB');
      return;
    }

    setImageFile(file);
    setAnalysisError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } });
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  // Analyze the image
  const handleAnalyze = useCallback(async () => {
    if (!imageFile || !schoolId) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeWhiteboardImage(imageFile, schoolId);

      if (!result.success) {
        setAnalysisError(result.error || 'Analysis failed');
        return;
      }

      setAnalysisResult(result);
      setRateLimitInfo(result.rateLimitRemaining);

      // Initialize position assignments from AI suggestions
      const assignments = {};
      result.data?.players?.forEach((player) => {
        if (!player.groupId) { // Skip O-line (they have groupId)
          assignments[player.id] = player.label || '?';
        }
      });
      setPositionAssignments(assignments);

      setStep(3);
    } catch (error) {
      console.error('Analysis error:', error);
      if (error.code === 'functions/resource-exhausted') {
        setAnalysisError(error.message);
      } else {
        setAnalysisError('Failed to analyze image. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  }, [imageFile, schoolId]);

  // Update position assignment
  const handlePositionChange = useCallback((playerId, newPosition) => {
    setPositionAssignments((prev) => ({
      ...prev,
      [playerId]: newPosition
    }));
  }, []);

  // Get final elements with updated positions
  const getFinalElements = useCallback(() => {
    if (!analysisResult?.data) return [];

    const elements = convertToWizElements(analysisResult.data, positionColors);

    // Apply position assignments
    return elements.map((el) => {
      if (el.type === 'player' && positionAssignments[el.id]) {
        const newLabel = positionAssignments[el.id];
        return {
          ...el,
          label: newLabel,
          positionKey: newLabel,
          color: positionColors[newLabel] || el.color
        };
      }
      return el;
    });
  }, [analysisResult, positionAssignments, positionColors]);

  // Handle save
  const handleSave = useCallback(() => {
    const elements = getFinalElements();
    onSave(elements);
    onClose();
  }, [getFinalElements, onSave, onClose]);

  // Handle open in editor
  const handleOpenEditor = useCallback(() => {
    const elements = getFinalElements();
    onOpenEditor(elements);
    onClose();
  }, [getFinalElements, onOpenEditor, onClose]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setStep(1);
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setPositionAssignments({});
  }, []);

  if (!isOpen) return null;

  const skillPlayers = analysisResult?.data?.players?.filter((p) => !p.groupId) || [];
  const warnings = analysisResult?.data?.warnings || [];

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
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
              <Camera size={20} className="text-sky-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Import from Whiteboard
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Convert your hand-drawn play to a WIZ diagram
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
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-sky-500 text-white'
                  : isLight ? 'bg-gray-200 text-gray-500' : 'bg-slate-700 text-slate-500'
              }`}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > s ? 'bg-sky-500' : isLight ? 'bg-gray-200' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {analysisError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <div>{analysisError}</div>
                {analysisError.includes('quality') && (
                  <ul className="mt-2 text-sm space-y-1 opacity-80">
                    {getImageQualityTips().slice(0, 3).map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Upload Photo */}
          {step === 1 && (
            <div className="text-center py-8">
              <Camera size={64} className={`mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Upload Whiteboard Photo
              </h3>
              <p className={`mb-6 max-w-md mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Take a photo of your whiteboard play or upload an existing image.
                AI will detect players and routes.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`mx-auto max-w-md p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  isLight
                    ? 'border-gray-300 hover:border-sky-400 hover:bg-sky-50'
                    : 'border-slate-600 hover:border-sky-500 hover:bg-sky-500/10'
                }`}
              >
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg mb-4"
                    />
                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Click or drop to change image
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className={`mx-auto mb-3 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
                    <p className={`font-medium ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                      Drag & drop or click to upload
                    </p>
                    <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      PNG, JPG up to 10MB
                    </p>
                  </>
                )}
              </div>

              <div className={`mt-8 p-4 rounded-lg max-w-md mx-auto text-left ${
                isLight ? 'bg-sky-50 border border-sky-200' : 'bg-sky-500/10 border border-sky-500/20'
              }`}>
                <h4 className={`font-medium mb-2 ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>
                  Tips for best results:
                </h4>
                <ul className={`text-sm space-y-1 ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                  {getImageQualityTips().slice(0, 4).map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: AI Analysis (processing) */}
          {step === 2 && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <Loader2 size={64} className="animate-spin text-sky-500" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Analyzing Play...
              </h3>
              <p className={`max-w-md mx-auto ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                AI is detecting players, routes, and formations from your whiteboard.
                This usually takes 5-10 seconds.
              </p>

              {imagePreview && (
                <div className="mt-8 max-w-sm mx-auto">
                  <img
                    src={imagePreview}
                    alt="Analyzing"
                    className="w-full rounded-lg opacity-50"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Assign Positions */}
          {step === 3 && analysisResult && (
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Assign Positions
              </h3>
              <p className={`mb-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Review detected players and assign or correct their position labels.
              </p>

              {warnings.length > 0 && (
                <div className={`mb-4 p-3 rounded-lg ${
                  isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'
                }`}>
                  <h4 className={`font-medium mb-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                    Detection Notes:
                  </h4>
                  <ul className={`text-sm space-y-1 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                    {warnings.slice(0, 3).map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* Position assignments */}
                <div>
                  <h4 className={`font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                    Skill Positions ({skillPlayers.length} detected)
                  </h4>
                  <div className="space-y-2">
                    {skillPlayers.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          isLight ? 'bg-gray-50' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{
                            backgroundColor: positionColors[positionAssignments[player.id]] || '#3b82f6'
                          }}
                        >
                          {positionAssignments[player.id] || '?'}
                        </div>
                        <select
                          value={positionAssignments[player.id] || ''}
                          onChange={(e) => handlePositionChange(player.id, e.target.value)}
                          className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${
                            isLight
                              ? 'bg-white border-gray-300 text-gray-900'
                              : 'bg-slate-700 border-slate-600 text-white'
                          }`}
                        >
                          <option value="">Select position...</option>
                          {SKILL_POSITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {player.detectionConfidence < 0.7 && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            Low confidence
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {skillPlayers.length === 0 && (
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      No skill players detected. Try a clearer photo.
                    </p>
                  )}
                </div>

                {/* Live preview */}
                <div>
                  <h4 className={`font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                    Preview
                  </h4>
                  <div className={`rounded-lg overflow-hidden border ${
                    isLight ? 'border-gray-200' : 'border-slate-700'
                  }`}>
                    <DiagramPreview
                      elements={getFinalElements()}
                      width="100%"
                      height={200}
                      mode="wiz-skill"
                      showBackground={true}
                      positionColors={positionColors}
                      positionNames={positionNames}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Save */}
          {step === 4 && (
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Review & Save
              </h3>
              <p className={`mb-4 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                Your diagram is ready. Save it directly or open the editor to make adjustments.
              </p>

              {/* Full preview */}
              <div className={`rounded-xl overflow-hidden border mb-6 ${
                isLight ? 'border-gray-200' : 'border-slate-700'
              }`}>
                <DiagramPreview
                  elements={getFinalElements()}
                  width="100%"
                  height={300}
                  mode="wiz-skill"
                  showBackground={true}
                  positionColors={positionColors}
                  positionNames={positionNames}
                />
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${
                  isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'
                }`}>
                  <h4 className={`font-medium mb-1 ${isLight ? 'text-green-800' : 'text-green-400'}`}>
                    Detected Elements
                  </h4>
                  <ul className={`text-sm ${isLight ? 'text-green-700' : 'text-green-300'}`}>
                    <li>• {analysisResult?.data?.players?.filter((p) => p.groupId === 'oline').length || 5} O-Linemen</li>
                    <li>• {skillPlayers.length} Skill Players</li>
                    <li>• {analysisResult?.data?.routes?.length || 0} Routes</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg ${
                  isLight ? 'bg-sky-50 border border-sky-200' : 'bg-sky-500/10 border border-sky-500/20'
                }`}>
                  <h4 className={`font-medium mb-1 flex items-center gap-2 ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>
                    <Edit3 size={16} />
                    Need adjustments?
                  </h4>
                  <p className={`text-sm ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                    Open in the diagram editor to adjust route depths, add blocking, or move players.
                  </p>
                </div>
              </div>

              {/* Rate limit info */}
              {rateLimitInfo && (
                <div className={`mt-4 text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                  Remaining conversions: {rateLimitInfo.daily} today, {rateLimitInfo.monthly} this month
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${
          isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-800 bg-slate-800/50'
        }`}>
          <button
            onClick={() => {
              if (step === 1) {
                onClose();
              } else if (step === 2) {
                // Can't go back while analyzing
              } else {
                setStep(step - 1);
              }
            }}
            disabled={step === 2 && analyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 2 && analyzing
                ? 'opacity-50 cursor-not-allowed'
                : isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ChevronLeft size={18} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={() => {
                  if (imageFile) {
                    setStep(2);
                    handleAnalyze();
                  }
                }}
                disabled={!imageFile}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
                  !imageFile
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-sky-500 text-white hover:bg-sky-600'
                }`}
              >
                Analyze
                <ChevronRight size={18} />
              </button>
            )}

            {step === 2 && analyzing && (
              <button
                disabled
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-sky-500 text-white hover:bg-sky-600"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            )}

            {step === 4 && (
              <>
                <button
                  onClick={handleOpenEditor}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    isLight
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  <Edit3 size={18} />
                  Open Editor
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600"
                >
                  Save Diagram
                  <Check size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
