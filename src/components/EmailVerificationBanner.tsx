import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const DISMISS_KEY = "oasis_email_banner_dismissed_until";

/**
 * Sticky banner that nudges unverified users to confirm their email.
 *
 * Shows when:
 *   - The user is authenticated
 *   - auth.users.email_confirmed_at is null (we read it from
 *     supabase.auth.getUser() since AuthContext doesn't surface it)
 *   - The user hasn't dismissed the banner in the last 24h
 *
 * Includes a "Resend email" button that calls supabase.auth.resend().
 * Important: email verification only takes effect after the admin enables
 * "Confirm email" in Supabase Auth → Email → Settings. Without that toggle,
 * Supabase issues an unconfirmed session and this banner stays visible.
 */
export function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [hidden, setHidden] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) { setHidden(true); return; }
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() < dismissedUntil) { setHidden(true); return; }

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      // Banner only when the email confirmation timestamp is missing.
      setHidden(!data?.user || !!data.user.email_confirmed_at);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      toast({
        title: "Verification email sent",
        description: `Check ${user.email} for the link.`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Could not resend",
        description: err?.message ?? "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleDismiss = () => {
    // Snooze for 24 hours.
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
    >
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" aria-hidden="true" />
        <span>
          <strong>Verify your email.</strong> We sent a confirmation link to{" "}
          <code className="font-mono">{user?.email}</code>.
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs underline-offset-2 hover:bg-amber-100 hover:underline"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-amber-100"
          onClick={handleDismiss}
          aria-label="Dismiss for 24 hours"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default EmailVerificationBanner;
