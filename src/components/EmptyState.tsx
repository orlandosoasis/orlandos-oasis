import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  /** Compact variant for tight spaces (sidebars, table rows). */
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Consistent empty-state used across homeowner / technician / admin views.
 * Provides clear messaging, optional icon, and an optional CTA so empty
 * sections never appear as blank containers.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  compact = false,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4 gap-2" : "py-12 px-6 gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          compact ? "h-10 w-10" : "h-14 w-14",
        )}
      >
        <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} aria-hidden="true" />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {(actionLabel && (onAction || actionHref)) && (
        <Button
          size={compact ? "sm" : "default"}
          className="mt-2"
          onClick={onAction}
          {...(actionHref ? { asChild: true } : {})}
        >
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

export default EmptyState;
