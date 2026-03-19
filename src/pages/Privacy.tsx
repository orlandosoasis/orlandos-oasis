import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import oasisLogo from "@/assets/oo-logo.png";

const Privacy = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        <h1 className="text-2xl font-bold text-foreground mb-6">Privacy Policy</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">1. Information We Collect</h2>
            <p>We collect the following information when you create an account or book a service:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Name</li>
              <li>Address</li>
              <li>Contact details (email, phone number)</li>
              <li>Payment information</li>
              <li>Service history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">2. How We Use Information</h2>
            <p>Your information is used to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Schedule and manage your pool services</li>
              <li>Assign qualified technicians to your appointments</li>
              <li>Process payments and manage billing</li>
              <li>Improve service quality and customer experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">3. Data Sharing</h2>
            <p>Your personal information is only shared with assigned technicians and service partners when necessary to fulfill your booked services. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">4. Data Security</h2>
            <p>We use industry-standard encryption and secure storage practices to protect your information. Access to personal data is limited to authorized personnel on a need-to-know basis.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">5. User Rights</h2>
            <p>You may update your account information at any time through the app. For additional requests or support regarding your data, please contact our support team.</p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-10">Last updated: March 2026</p>
      </main>
    </div>
  );
};

export default Privacy;
