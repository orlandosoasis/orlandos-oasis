import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile CAPTCHA widget.
 *
 * Why Turnstile (not reCAPTCHA): privacy-friendly, no Google tracking,
 * free unlimited, supported natively by Supabase Auth.
 *
 * Setup (one-time):
 *   1. Sign in at https://dash.cloudflare.com → Turnstile → Add site.
 *   2. Type: "managed challenge", domains: orlandosoasispools.com,
 *      pool-snap-magic.lovable.app, localhost.
 *   3. Copy the Site Key, paste it into .env as VITE_TURNSTILE_SITE_KEY.
 *   4. Copy the Secret Key into Supabase: Auth → Settings → CAPTCHA →
 *      Provider: Turnstile → paste Secret Key → Save.
 *
 * If VITE_TURNSTILE_SITE_KEY is unset, the widget renders nothing and
 * onVerify is called with an empty token so dev / preview environments
 * aren't blocked. The Supabase server enforces the actual CAPTCHA check
 * when it's enabled, so this fail-open behavior is safe in dev only.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface Props {
  /** Called with the Turnstile token when the challenge is solved. */
  onVerify: (token: string) => void;
  /** Optional error callback (network issue, expired challenge, etc.). */
  onError?: () => void;
  /** Visual size; "flexible" matches input width. Defaults to "flexible". */
  size?: "normal" | "compact" | "flexible";
  className?: string;
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve()));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ onVerify, onError, size = "flexible", className = "" }: Props) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Dev fallback: no site key configured → emit empty token so the form
  // is usable. Server-side check still enforces if Supabase has it on.
  useEffect(() => {
    if (!siteKey) {
      onVerify("");
      return;
    }
    loadTurnstileScript().then(() => setScriptReady(true)).catch(() => onError?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || !window.turnstile) return;
    // Defensive cleanup if HMR re-mounts us.
    if (widgetIdRef.current) {
      try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      size,
      theme: "auto",
      callback: (token) => onVerify(token),
      "error-callback": () => onError?.(),
      "expired-callback": () => onVerify(""),
    });
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey, size, onVerify, onError]);

  if (!siteKey) return null;

  return <div ref={containerRef} className={className} aria-label="Verify you're human" />;
}

export default TurnstileWidget;
