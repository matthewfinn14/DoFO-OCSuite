import { Check } from 'lucide-react';

/**
 * Step progress indicator showing dots/checkmarks for wizard steps
 */
export function WizardStepIndicator({
  currentStep,
  totalSteps,
  completedSteps = [],
  isLight = false,
  maxVisible = 7,
}) {
  // Calculate which steps to show (window around current step)
  const getVisibleSteps = () => {
    if (totalSteps <= maxVisible) {
      return Array.from({ length: totalSteps }, (_, i) => i);
    }

    const half = Math.floor(maxVisible / 2);
    let start = currentStep - half;
    let end = currentStep + half;

    if (start < 0) {
      start = 0;
      end = maxVisible - 1;
    }

    if (end >= totalSteps) {
      end = totalSteps - 1;
      start = totalSteps - maxVisible;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visibleSteps = getVisibleSteps();
  const showStartEllipsis = visibleSteps[0] > 0;
  const showEndEllipsis = visibleSteps[visibleSteps.length - 1] < totalSteps - 1;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {showStartEllipsis && (
        <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>...</span>
      )}

      {visibleSteps.map((stepIndex) => {
        const isCompleted = completedSteps.includes(stepIndex);
        const isCurrent = stepIndex === currentStep;
        const isPast = stepIndex < currentStep;

        return (
          <div
            key={stepIndex}
            className={`
              flex items-center justify-center rounded-full transition-all duration-200
              ${isCurrent
                ? 'w-6 h-6 ring-2 ring-sky-500 ring-offset-2 ' + (isLight ? 'ring-offset-white' : 'ring-offset-slate-900')
                : 'w-4 h-4'
              }
              ${isCompleted || isPast
                ? 'bg-sky-500 text-white'
                : isCurrent
                  ? 'bg-sky-500 text-white'
                  : isLight
                    ? 'bg-gray-200'
                    : 'bg-slate-700'
              }
            `}
          >
            {isCompleted && !isCurrent ? (
              <Check size={10} strokeWidth={3} />
            ) : isCurrent ? (
              <span className="text-[10px] font-bold">{stepIndex + 1}</span>
            ) : null}
          </div>
        );
      })}

      {showEndEllipsis && (
        <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>...</span>
      )}
    </div>
  );
}

export default WizardStepIndicator;
