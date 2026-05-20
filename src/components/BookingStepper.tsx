import { Check } from "lucide-react";

interface BookingStepperProps {
  currentStep: number;
  steps: { label: string }[];
  onStepClick?: (step: number) => void;
}

const BookingStepper = ({ currentStep, steps, onStepClick }: BookingStepperProps) => {
  return (
    <nav aria-label="Booking progress" className="mb-8 w-full">
      <ol className="flex items-start w-full">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isClickable = isCompleted && !!onStepClick;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.label}
              className={`flex items-start ${isLast ? "shrink-0" : "flex-1 min-w-0"}`}
            >
              <div className="flex flex-col items-center min-w-0 shrink-0">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(stepNum)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  } ${isClickable ? "cursor-pointer hover:ring-4 hover:ring-primary/30" : "cursor-default"}`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : stepNum}
                </button>
                <span
                  onClick={() => isClickable && onStepClick(stepNum)}
                  className={`text-[11px] sm:text-xs mt-1.5 font-medium text-center leading-tight px-0.5 ${
                    isCurrent
                      ? "text-foreground"
                      : isClickable
                      ? "text-primary cursor-pointer"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mt-4 sm:mt-[18px] mx-1.5 sm:mx-2 ${
                    stepNum < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BookingStepper;
