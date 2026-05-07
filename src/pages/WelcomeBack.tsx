import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import oasisLogo from "@/assets/oo-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ReviewsSection from "@/components/ReviewsSection";
import FAQSection from "@/components/FAQSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const WelcomeBack = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await signup(email, password, fullName, "homeowner", { streetAddress, city, state, zipCode, contractLocked: false });
    if (result.success) {
      toast({ title: "Welcome back!", description: "Your account is ready." });
      navigate("/dashboard");
    } else {
      toast({ title: "Signup failed", description: result.error || "Please try again.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-oasis via-oasis-teal to-navy flex flex-col">
      {/* Top branding */}
      <header className="px-6 py-4 flex justify-center">
        <Link to="/" className="flex items-center gap-2 bg-white rounded-full px-4 py-2">
          <img src={oasisLogo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold text-foreground">Orlando's Oasis</span>
        </Link>
      </header>

      <main className="flex-1">
        {/* Welcome / signup section */}
        <section className="py-10 md:py-16 px-4 md:px-6">
          <div className="container max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Set up your account</h1>
              <p className="text-white/80">
                Track and manage your maintenance services all in one place.
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="John Smith" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} required className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input id="streetAddress" placeholder="1234 Sunshine Blvd" value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)} className="h-12" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Orlando" value={city} onChange={(e) => setCity(e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="FL" value={state} onChange={(e) => setState(e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip</Label>
                    <Input id="zipCode" placeholder="32801" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="h-12" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="h-5 w-5 animate-spin mr-2" />Creating account…</>) : "Create My Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an online account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-white">
          <div className="container max-w-6xl mx-auto">
            <ReviewsSection />
          </div>
        </section>

        <FAQSection />

        {/* The Fine Print */}
        <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-center">The Fine Print</h4>
            <ul className="space-y-1 text-sm text-muted-foreground max-w-2xl mx-auto">
              {[
                "Online booking required.",
                "Reschedule/cancel policy: 6-hour notice.",
                "Service Pass expires after 12 months if unused.",
                "Executive Plan discounts apply while membership is active.",
                "Cancel any time. If cancelled before 6 paid months, the initial discounted month may be adjusted to standard pricing.",
              ].map((item, index) => (<li key={index}>• {item}</li>))}
            </ul>
          </div>
        </section>

        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default WelcomeBack;
