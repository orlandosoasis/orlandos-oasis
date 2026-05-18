import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** What the button reads. Defaults to "Continue with Google". */
  label?: string;
  /** Visual variant. */
  className?: string;
}

/**
 * Sign in / sign up with Google. The Supabase Auth provider must be
 * enabled in the dashboard for this to work; otherwise the user sees
 * a toast describing the misconfiguration.
 *
 * Role behavior: new Google users get the 'homeowner' role from the
 * handle_new_user trigger (which ignores client metadata for safety).
 * Existing users keep their role (admin / technician). Tech and admin
 * promotion still happens via admin tooling, not signup.
 */
export function GoogleSignInButton({ label = "Continue with Google", className }: Props) {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      toast({
        title: "Google sign-in unavailable",
        description: result.error || "Please try email / password instead.",
        variant: "destructive",
      });
      setLoading(false);
    }
    // If it succeeded, the browser is redirecting to Google now and this
    // component is about to unmount. No need to clear loading.
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className={`relative h-12 w-full gap-3 bg-white text-foreground hover:bg-gray-50 ${className ?? ""}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      <span className="font-medium">{label}</span>
    </Button>
  );
}

// Inline Google logo — official multicolor "G" mark.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default GoogleSignInButton;
