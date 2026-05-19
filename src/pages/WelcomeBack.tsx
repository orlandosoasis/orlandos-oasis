import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Star } from "lucide-react";
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Please enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!streetAddress.trim()) e.streetAddress = "Street address is required";
    if (!city.trim()) e.city = "City is required";
    if (!state.trim()) e.state = "State is required";
    if (!zipCode.trim()) e.zipCode = "ZIP code is required";
    return e;
  };

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

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

  const errorInputClass = "border-destructive focus-visible:border-destructive";
  const inputCls = (key: string) => `h-12 ${errors[key] ? errorInputClass : ""}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-oasis via-oasis-teal to-navy flex flex-col">
      {/* Top branding */}
      <main className="flex-1">
        {/* Welcome / signup section */}
        <section className="py-10 md:py-16 px-4 md:px-6">
          <div className="container max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
              <div className="mb-6 text-center">
                <Link to="/" className="inline-flex items-center gap-2 mb-5">
                  <img src={oasisLogo} alt="Orlando's Oasis" className="h-9 w-9 object-contain" />
                  <span className="text-lg font-bold text-foreground">Orlando's Oasis</span>
                </Link>
                <h1 className="font-extrabold text-foreground text-center mb-2 text-4xl">Set up your account</h1>
                <p className="text-muted-foreground">
                  Track and manage your maintenance services all in one place.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="Enter your full name" value={fullName}
                    aria-invalid={!!errors.fullName}
                    onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }} className={inputCls("fullName")} />
                  {errors.fullName && <p className="text-xs text-destructive" role="alert">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email address" value={email}
                    aria-invalid={!!errors.email}
                    onChange={(e) => { setEmail(e.target.value); clearError("email"); }} className={inputCls("email")} />
                  {errors.email && <p className="text-xs text-destructive" role="alert">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password"
                      aria-invalid={!!errors.password}
                      value={password} onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                      className={`${inputCls("password")} pr-12`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Re-enter your password"
                    aria-invalid={!!errors.confirmPassword}
                    value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }} className={inputCls("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input id="streetAddress" placeholder="Enter your street address" value={streetAddress}
                    aria-invalid={!!errors.streetAddress}
                    onChange={(e) => { setStreetAddress(e.target.value); clearError("streetAddress"); }} className={inputCls("streetAddress")} />
                  {errors.streetAddress && <p className="text-xs text-destructive" role="alert">{errors.streetAddress}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="City" value={city}
                      aria-invalid={!!errors.city}
                      onChange={(e) => { setCity(e.target.value); clearError("city"); }} className={inputCls("city")} />
                    {errors.city && <p className="text-xs text-destructive" role="alert">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="State" value={state}
                      aria-invalid={!!errors.state}
                      onChange={(e) => { setState(e.target.value); clearError("state"); }} className={inputCls("state")} />
                    {errors.state && <p className="text-xs text-destructive" role="alert">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip</Label>
                    <Input id="zipCode" placeholder="ZIP code" value={zipCode}
                      aria-invalid={!!errors.zipCode}
                      onChange={(e) => { setZipCode(e.target.value); clearError("zipCode"); }} className={inputCls("zipCode")} />
                    {errors.zipCode && <p className="text-xs text-destructive" role="alert">{errors.zipCode}</p>}
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
        <section className="py-12 md:py-16 lg:py-20 px-4 md:px-6 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="font-extrabold text-foreground text-left mb-2 text-4xl">
              Verified Customer Reviews
            </h2>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground mb-10 md:mb-12">
              <span className="font-semibold text-navy">4.8</span>
              <span className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </span>
              <span>·</span>
              <span>2,847 reviews</span>
              <span>·</span>
              <span className="text-trust font-medium">100% verified</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {[
                {
                  initials: "PS",
                  name: "Paula S.",
                  location: "Orlando, FL",
                  text: "Carlos was amazing! My pool went from green to crystal clear in one visit. He explained everything he did and even gave me tips for maintaining the pH levels. Highly recommend!",
                },
                {
                  initials: "BG",
                  name: "Brad G.",
                  location: "Winter Park, FL",
                  text: "Best pool service in Orlando. The technician arrived on time, was super professional, and my pool has never looked this clean. The chemicals are perfectly balanced now.",
                },
                {
                  initials: "MR",
                  name: "Maria R.",
                  location: "Kissimmee, FL",
                  text: "Professional, thorough, and so friendly! He went above and beyond, even cleaning the pool deck. The $49 intro deal is amazing for the quality of service.",
                },
              ].map((review, index) => (
                <article
                  key={index}
                  className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-navy text-xs font-semibold shrink-0 bg-slate-300">
                      {review.initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-navy leading-tight">
                        {review.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {review.location}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FAQSection />

        {/* The Fine Print */}
        <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-muted">
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
