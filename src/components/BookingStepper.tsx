import { Check } from "lucide-react";

interface BookingStepperProps {
  currentStep: number;
  steps: { label: string }[];
  onStepClick?: (step: number) => void;
}

const BookingStepper = ({ currentStep, steps, onStepClick }: BookingStepperProps) => {
  return (
    <div className="-mx-4 md:mx-0 mb-8 overflow-x-auto scrollbar-hide">
      <div className="flex items-center justify-between md:justify-between min-w-max md:min-w-0 px-4 md:px-0">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(stepNum)}
                  className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  } ${isClickable ? "cursor-pointer hover:ring-4 hover:ring-primary/30" : "cursor-default"}`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </button>
                <span
                  className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                    isCurrent ? "text-foreground" : isClickable ? "text-primary cursor-pointer" : "text-muted-foreground"
                  }`}
                  onClick={() => isClickable && onStepClick(stepNum)}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 mx-2 mb-5 shrink-0 ${
                    stepNum < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStepper;
