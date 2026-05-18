/**
 * Centralized hooks for error monitoring and product analytics.
 *
 * The actual vendors (Sentry for errors, PostHog for analytics) are not
 * installed yet because they need env-injected keys. This file is a
 * no-op shim that:
 *   - is safe to import everywhere today
 *   - swallows errors / events in dev
 *   - documents the wire-up points so adding the real SDKs is one
 *     `npm install` + a few `if (window.posthog) ...` lines
 *
 * When you're ready:
 *   1. `npm install @sentry/react posthog-js`
 *   2. Set VITE_SENTRY_DSN and VITE_POSTHOG_KEY in .env
 *   3. Replace the bodies of captureError / trackEvent / identify below
 *      with real Sentry.captureException / posthog.capture / posthog.identify
 *   4. Initialize Sentry + PostHog in main.tsx (gated on the cookie-consent
 *      "all" value from getCookieConsent()).
 */

import { getCookieConsent } from "@/components/CookieConsent";

interface ErrorContext {
  componentStack?: string;
  [key: string]: unknown;
}

let initialized = false;

export function initMonitoring() {
  if (initialized) return;
  initialized = true;
  // TODO: when SDKs are installed, init Sentry + PostHog here, gated on consent.
  // Example pseudocode:
  //   if (import.meta.env.VITE_SENTRY_DSN) Sentry.init({ dsn: ... });
  //   if (getCookieConsent() === "all" && import.meta.env.VITE_POSTHOG_KEY) {
  //     posthog.init(import.meta.env.VITE_POSTHOG_KEY, { api_host: "..." });
  //   }
  if (import.meta.env.DEV) {
    console.info("[monitoring] init stub (no Sentry/PostHog SDKs installed yet)");
  }
  // React to cookie-consent changes so analytics can spin up after the user accepts.
  window.addEventListener("oasis-cookie-consent-changed", (e: Event) => {
    const value = (e as CustomEvent<"all" | "necessary">).detail;
    if (import.meta.env.DEV) console.info("[monitoring] consent changed:", value);
    // TODO: posthog.opt_in_capturing() or opt_out_capturing()
  });
}

export function captureError(err: unknown, ctx?: ErrorContext) {
  if (import.meta.env.DEV) {
    console.error("[monitoring] captureError:", err, ctx);
  }
  // TODO: Sentry.captureException(err, { contexts: { react: ctx } });
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  // Respect the user's consent choice.
  if (getCookieConsent() !== "all") return;
  if (import.meta.env.DEV) {
    console.info("[monitoring] trackEvent:", name, props);
  }
  // TODO: posthog.capture(name, props);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (getCookieConsent() !== "all") return;
  if (import.meta.env.DEV) {
    console.info("[monitoring] identify:", userId, traits);
  }
  // TODO: posthog.identify(userId, traits);
}

export function resetIdentity() {
  if (import.meta.env.DEV) console.info("[monitoring] resetIdentity");
  // TODO: posthog.reset();
}
