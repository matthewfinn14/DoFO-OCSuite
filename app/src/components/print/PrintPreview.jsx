import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/**
 * Universal preview container with zoom controls
 * Wraps any print template and provides scaling + print detection
 */
export default function PrintPreview({
  children,
  orientation = 'portrait',
  scale = 0.5,
  onScaleChange,
  className = ''
}) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Measure container for centering
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scaleOptions = [0.25, 0.5, 0.75, 1];

  const handleZoomIn = () => {
    const currentIndex = scaleOptions.indexOf(scale);
    if (currentIndex < scaleOptions.length - 1) {
      onScaleChange?.(scaleOptions[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = scaleOptions.indexOf(scale);
    if (currentIndex > 0) {
      onScaleChange?.(scaleOptions[currentIndex - 1]);
    }
  };

  const handleFitToWindow = () => {
    // Calculate scale to fit paper in viewport
    const paperWidth = orientation === 'landscape' ? 11 : 8.5;
    const paperHeight = orientation === 'landscape' ? 8.5 : 11;
    const dpi = 96; // Assume 96 DPI for screen

    const paperPixelWidth = paperWidth * dpi;
    const paperPixelHeight = paperHeight * dpi;

    const scaleX = (containerSize.width - 48) / paperPixelWidth;
    const scaleY = (containerSize.height - 48) / paperPixelHeight;

    const fitScale = Math.min(scaleX, scaleY, 1);
    // Round to nearest option
    const nearestScale = scaleOptions.reduce((prev, curr) =>
      Math.abs(curr - fitScale) < Math.abs(prev - fitScale) ? curr : prev
    );
    onScaleChange?.(nearestScale);
  };

  // Paper dimensions in pixels (at 96 DPI)
  const paperStyle = {
    width: orientation === 'landscape' ? '11in' : '8.5in',
    minHeight: orientation === 'landscape' ? '8.5in' : '11in',
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Zoom Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.25}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut size={18} className="text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 min-w-[48px] text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn size={18} className="text-gray-600" />
          </button>
          <button
            onClick={handleFitToWindow}
            className="p-1.5 rounded hover:bg-gray-100 ml-2"
            title="Fit to Window"
          >
            <Maximize2 size={18} className="text-gray-600" />
          </button>
        </div>
        <span className="text-xs text-gray-400">
          Preview only - actual print may vary
        </span>
      </div>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-200 rounded-lg p-6 print:p-0 print:bg-white print:overflow-visible"
      >
        <div className="flex justify-center">
          <div
            style={paperStyle}
            className="bg-white shadow-xl border border-gray-300 print:shadow-none print:border-0 print:transform-none"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
