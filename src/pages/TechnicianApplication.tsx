import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, Upload, Plus, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import oasisLogo from "@/assets/oasis-logo-circle.png";

/* ── Types ── */
interface Certification {
  id: number;
  name: string;
  file: File | null;
}

const emptyCert = (): Certification => ({ id: Date.now(), name: "", file: null });

const STEPS = ["Personal Information", "Resume & Certifications"];
const TOTAL_STEPS = STEPS.length;

/* ── File Upload Component ── */
const FileUploadArea = ({
  label,
  hint,
  accept,
  optional,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  optional?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground">
      {label}
      {optional && <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>}
    </Label>
    <label
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
        value
          ? "border-green-500 bg-green-500/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {value ? (
        <>
          <CheckCircle2 className="h-6 w-6 text-green-600 mb-1.5" />
          <span className="text-sm font-semibold text-green-700">{value.name}</span>
        </>
      ) : (
        <>
          <Upload className="h-6 w-6 text-muted-foreground mb-1.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{hint}</p>
        </>
      )}
    </label>
  </div>
);

const TechnicianApplication = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId] = useState(() => "OO-" + Math.random().toString(36).substr(2, 8).toUpperCase());

  // Step 1 — Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [yearsExp, setYearsExp] = useState("");

  // Step 2 — Resume & Certifications
  const [resume, setResume] = useState<File | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([emptyCert()]);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, submitted]);

  const updateCert = (id: number, field: keyof Certification, value: string | File | null) => {
    setCertifications((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addCert = () => setCertifications((prev) => [...prev, emptyCert()]);

  const removeCert = (id: number) => {
    if (certifications.length <= 1) return;
    setCertifications((prev) => prev.filter((c) => c.id !== id));
  };

  const step1Valid = firstName && lastName && email && phone && city && state && zip && yearsExp;
  const step2Valid = resume && agreed;

  const canProceed = step === 1 ? !!step1Valid : !!step2Valid;

  const handleSubmit = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessing(false);

    const application = {
      applicantId: appId,
      firstName, lastName, email, phone, city, state, zip,
      yearsOfExperience: yearsExp,
      certifications: certifications.map((c) => ({ name: c.name, file: c.file?.name })),
      resumeFile: resume?.name,
      applicationStatus: "Pending Review",
      submittedAt: new Date().toISOString(),
    };
    console.log("Application submitted:", application);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step === 1) navigate("/technician");
    else setStep(step - 1);
  };

  /* ── Success Screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-[760px] mx-auto px-5 py-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Application Submitted Successfully</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md">
            Thank you for applying to become a pool technician with Orlando's Oasis. Our team will review your resume and certifications.
          </p>




          <Button onClick={() => navigate("/technician")} className="w-full max-w-sm h-14 text-[17px] font-bold rounded-2xl shadow-lg">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header — matches BookingFlow */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-[760px] mx-auto px-5 h-[56px] flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
          <span className="text-sm font-semibold text-foreground flex-1">Pool Technician Application</span>
          <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-5 py-6 pb-32">
        {/* ── Step 1: Personal Information ── */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Apply as a Pool Technician</h2>
              <p className="text-sm text-muted-foreground">
                Join Orlando's Oasis and help homeowners keep their pools clean, safe, and well maintained.
              </p>
            </div>

            {/* Name */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">PERSONAL DETAILS</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">First Name</Label>
                  <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Last Name</Label>
                  <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                <Label className="text-xs font-medium text-muted-foreground">Email Address</Label>
                <Input type="email" placeholder="john.doe@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                <Input type="tel" placeholder="(407) 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
              </div>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">SERVICE AREA</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">City</Label>
                  <Input placeholder="Orlando" value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">State</Label>
                  <Input placeholder="FL" value={state} onChange={(e) => setState(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">ZIP Code</Label>
                  <Input placeholder="32801" value={zip} onChange={(e) => setZip(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">EXPERIENCE</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Years of Pool Service Experience</Label>
                <Select value={yearsExp} onValueChange={setYearsExp}>
                  <SelectTrigger className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-than-1">Less than 1 year</SelectItem>
                    <SelectItem value="1-3">1 to 3 years</SelectItem>
                    <SelectItem value="3-5">3 to 5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Resume & Certifications ── */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Resume & Certifications</h2>
              <p className="text-sm text-muted-foreground">Upload your resume. Certifications are optional — add any you have.</p>
            </div>

            {/* Resume */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">RESUME</p>
              <FileUploadArea
                label="Resume"
                hint="PDF, DOC, DOCX accepted"
                accept=".pdf,.doc,.docx"
                value={resume}
                onChange={setResume}
              />
            </div>

            {/* Certifications */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-1">CERTIFICATIONS</p>
              <p className="text-xs text-muted-foreground mb-4">Upload your pool service certifications and give each one a name.</p>

              <div className="space-y-3">
                {certifications.map((cert, idx) => (
                  <div key={cert.id} className="rounded-xl border-2 border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold tracking-[0.8px] uppercase text-primary">
                        Certification {idx + 1}
                      </span>
                      {certifications.length > 1 && (
                        <button
                          onClick={() => removeCert(cert.id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Certification Name</Label>
                        <Input
                          placeholder="e.g. CPO Certified"
                          value={cert.name}
                          onChange={(e) => updateCert(cert.id, "name", e.target.value)}
                          className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm"
                        />
                      </div>
                      <FileUploadArea
                        label="Upload File"
                        hint="PDF, JPG, PNG accepted"
                        accept=".pdf,.jpg,.jpeg,.png"
                        optional
                        value={cert.file}
                        onChange={(f) => updateCert(cert.id, "file", f)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addCert}
                className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Another Certification
              </button>
            </div>

            {/* Agreement */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">AGREEMENT</p>
              <div
                onClick={() => setAgreed(!agreed)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              agreed
                    ? "bg-primary/5"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  agreed ? "bg-primary border-primary" : "border-border bg-background"
                }`}>
                  {agreed && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I confirm that the information provided is accurate and I agree to be contacted by Orlando's Oasis regarding this application.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA — matches BookingFlow */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
        <div className="max-w-[760px] mx-auto px-5 py-4 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="h-14 px-6 rounded-2xl text-sm font-semibold">
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed || isProcessing}
            className="flex-1 h-14 text-[17px] font-bold rounded-2xl shadow-lg"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step < TOTAL_STEPS ? (
              "Continue"
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TechnicianApplication;
