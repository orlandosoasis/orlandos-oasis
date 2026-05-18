import { BadgeCheck, ShieldCheck, FileCheck2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TechVerificationData {
  isVerified?: boolean | null;
  isBackgroundChecked?: boolean | null;
  isInsured?: boolean | null;
  rating?: number | null;
  servicesCompleted?: number | null;
}

interface Props {
  tech: TechVerificationData;
  /** Visual size; defaults to inline-row. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Marketplace trust signals for a technician. Shown to homeowners on
 * service detail pages, technician cards, and during booking.
 *
 * Only renders the badges that are TRUE — so a partially-verified tech
 * still shows whatever flags they've earned. If nothing is verified, the
 * component renders nothing (no empty hint to homeowners).
 *
 * Admin-controlled flags live on public.profiles:
 *   is_background_checked, is_insured, is_verified
 *
 * The verified flag is the umbrella signal — set when admin has confirmed
 * identity, photo, references. The other two are independent.
 */
export function TechVerificationBadges({ tech, size = "sm", className = "" }: Props) {
  const items: Array<{
    show: boolean;
    icon: typeof BadgeCheck;
    label: string;
    tooltip: string;
    tone: "primary" | "success" | "neutral";
  }> = [
    {
      show: !!tech.isVerified,
      icon: BadgeCheck,
      label: "Verified",
      tooltip: "Identity, photo, and references confirmed by Orlando's Oasis.",
      tone: "primary",
    },
    {
      show: !!tech.isBackgroundChecked,
      icon: ShieldCheck,
      label: "Background-checked",
      tooltip: "Passed a third-party background screening.",
      tone: "success",
    },
    {
      show: !!tech.isInsured,
      icon: FileCheck2,
      label: "Insured",
      tooltip: "Carries active general liability insurance.",
      tone: "neutral",
    },
  ];

  const visible = items.filter((i) => i.show);
  const hasRating = typeof tech.rating === "number" && tech.rating > 0;
  const hasCompleted = typeof tech.servicesCompleted === "number" && tech.servicesCompleted > 0;
  if (visible.length === 0 && !hasRating && !hasCompleted) return null;

  const sizeClass = size === "md" ? "text-sm px-2.5 py-1 gap-1.5" : "text-xs px-2 py-0.5 gap-1";
  const iconSize = size === "md" ? "h-4 w-4" : "h-3 w-3";

  const toneClass: Record<typeof items[number]["tone"], string> = {
    primary: "bg-sky-50 text-sky-700 border-sky-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`${sizeClass} font-medium ${toneClass[item.tone]}`}
                >
                  <Icon className={iconSize} aria-hidden="true" />
                  {item.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {hasRating ? (
          <Badge
            variant="outline"
            className={`${sizeClass} font-medium bg-amber-50 text-amber-700 border-amber-200`}
          >
            <Star className={`${iconSize} fill-current`} aria-hidden="true" />
            {tech.rating!.toFixed(1)}
          </Badge>
        ) : null}
        {hasCompleted ? (
          <span className="text-xs text-muted-foreground">
            {tech.servicesCompleted!.toLocaleString()} service{tech.servicesCompleted === 1 ? "" : "s"} completed
          </span>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

export default TechVerificationBadges;
