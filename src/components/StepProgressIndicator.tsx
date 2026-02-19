interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Select Discount Voucher" },
  { number: 2, label: "Contact" },
  { number: 3, label: "Review" },
  { number: 4, label: "Checkout" },
  { number: 5, label: "Schedule" },
];

interface StepProgressIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const StepProgressIndicator = ({ currentStep, onStepClick }: StepProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1 py-3 overflow-x-auto">
      {STEPS.map((step) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isDisabled = step.number > 3;
        const isClickable = isCompleted;

        return (
          <button
            key={step.number}
            onClick={() => isClickable && onStepClick(step.number)}
            disabled={!isCurrent && !isClickable}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm whitespace-nowrap ${
              isCurrent
                ? "cursor-default"
                : isClickable
                ? "cursor-pointer hover:bg-muted"
                : "cursor-default opacity-40"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0 ${
                isCurrent
                  ? "bg-foreground text-background"
                  : isCompleted
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number}
            </span>
            <span
              className={`text-sm font-medium ${
                isCurrent
                  ? "text-foreground font-bold"
                  : isCompleted
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StepProgressIndicator;
