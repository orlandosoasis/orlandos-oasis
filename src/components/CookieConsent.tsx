import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const STORAGE_KEY = "oasis_cookie_consent";

type Consent = "all" | "necessary";

/**
 * Lightweight cookie consent banner. Compliant with the spirit of GDPR
 * and CCPA: the user can decline non-essential cookies, the choice is
 * persisted, and the banner doesn't reappear on subsequent visits.
 *
 * Storage:
 *   localStorage[oasis_cookie_consent] = "all" | "necessary"
 *
 * Consumers of analytics (PostHog, GA, etc.) should read this value
 * before initializing trackers:
 *   const c = localStorage.getItem("oasis_cookie_consent");
 *   if (c === "all") posthog.init(...);
 */
export function getCookieConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "all" || stored === "necessary" ? stored : null;
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Render banner only after a small delay so the first paint isn't
    // delayed by this non-critical element.
    const t = setTimeout(() => {
      if (!getCookieConsent()) setOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const setConsent = (value: Consent) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage can fail in private mode — banner just dismisses for the session.
    }
    setOpen(false);
    // Notify any listeners (e.g. analytics init) without forcing a reload.
    window.dispatchEvent(new CustomEvent("oasis-cookie-consent-changed", { detail: value }));
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-5 md:bottom-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">
            We use cookies to keep you signed in and improve the site. Choose what
            you want to share.{" "}
            <Link to="/privacy" className="underline hover:text-primary">
              Privacy policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConsent("necessary")}
            className="whitespace-nowrap"
          >
            Necessary only
          </Button>
          <Button
            size="sm"
            onClick={() => setConsent("all")}
            className="whitespace-nowrap"
          >
            Accept all
          </Button>
          <button
            type="button"
            aria-label="Dismiss for this session"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground sm:ml-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
