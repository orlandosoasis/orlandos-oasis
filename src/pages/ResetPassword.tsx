import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import oasisLogo from "@/assets/oo-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    (async () => {
      // 1) PKCE flow: ?code=... in query string
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) setLinkError(error.message);
          else {
            setReady(true);
            url.searchParams.delete("code");
            window.history.replaceState({}, "", url.pathname + url.search + url.hash);
          }
        }
        return;
      }

      // 2) Hash error from Supabase (expired/invalid)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashErr = hash.get("error_description") || hash.get("error");
      if (hashErr) {
        if (!cancelled) setLinkError(decodeURIComponent(hashErr.replace(/\+/g, " ")));
        return;
      }

      // 3) Implicit/hash flow: session auto-created by detectSessionInUrl
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) setReady(true);
      else if (!cancelled) {
        // Give the auth listener a moment, then show a friendly error
        setTimeout(async () => {
          const { data: d2 } = await supabase.auth.getSession();
          if (!cancelled && !d2.session) {
            setLinkError("This reset link is invalid or has expired. Please request a new one.");
          }
        }, 2000);
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You're signed in.", variant: "success" });
    navigate("/admin-dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-oasis via-oasis-teal to-navy flex flex-col">
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2 text-white">
          <img src={oasisLogo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
          <span className="text-2xl font-bold">Orlando's Oasis</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Set your password</h1>
              <p className="text-muted-foreground">Choose a password to finish signing in.</p>
            </div>
            {!ready ? (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Verifying reset link...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Set password"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
