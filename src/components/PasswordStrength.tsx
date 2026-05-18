import { useMemo } from "react";

type Strength = "empty" | "weak" | "fair" | "good" | "strong";

interface Props {
  password: string;
  /**
   * Minimum acceptable strength. The form-level submit handler can read
   * the boolean from this component's parent (via the onChange callback)
   * to decide whether to block submission. By default the meter is
   * informational only.
   */
  onChange?: (strength: Strength, score: number) => void;
}

const RULES: Array<{ test: (p: string) => boolean; label: string }> = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "An uppercase letter" },
  { test: (p) => /[a-z]/.test(p), label: "A lowercase letter" },
  { test: (p) => /\d/.test(p), label: "A number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "A symbol" },
];

function scoreToStrength(score: number): Strength {
  if (score === 0) return "empty";
  if (score <= 2) return "weak";
  if (score === 3) return "fair";
  if (score === 4) return "good";
  return "strong";
}

const STRENGTH_CONFIG: Record<Strength, { label: string; pct: number; color: string }> = {
  empty: { label: "", pct: 0, color: "bg-muted" },
  weak: { label: "Weak", pct: 25, color: "bg-red-500" },
  fair: { label: "Fair", pct: 50, color: "bg-orange-500" },
  good: { label: "Good", pct: 75, color: "bg-yellow-500" },
  strong: { label: "Strong", pct: 100, color: "bg-green-500" },
};

export function PasswordStrength({ password, onChange }: Props) {
  const { score, strength, unmet } = useMemo(() => {
    const passed = RULES.filter((r) => r.test(password));
    const score = passed.length;
    const strength = scoreToStrength(score);
    const unmet = RULES.filter((r) => !r.test(password)).map((r) => r.label);
    return { score, strength, unmet };
  }, [password]);

  // Notify parent on every change so it can gate submit.
  useMemo(() => {
    onChange?.(strength, score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strength, score]);

  if (!password) return null;
  const cfg = STRENGTH_CONFIG[strength];

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className="font-medium text-foreground">{cfg.label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-200 ${cfg.color}`}
          style={{ width: `${cfg.pct}%` }}
          role="progressbar"
          aria-valuenow={cfg.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${cfg.label || "empty"}`}
        />
      </div>
      {strength !== "strong" && unmet.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Add: {unmet.slice(0, 2).join(", ")}
          {unmet.length > 2 ? "…" : ""}
        </p>
      ) : null}
    </div>
  );
}

export default PasswordStrength;
