import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, Droplets, Wrench, SprayCan, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ISSUE_CATEGORIES = [
  { id: "water", label: "Water Quality", icon: Droplets },
  { id: "equipment", label: "Equipment", icon: Wrench },
  { id: "cleaning", label: "Cleaning Issue", icon: SprayCan },
  { id: "other", label: "Other", icon: HelpCircle },
] as const;

type Step = "category" | "details" | "submitted";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportIssueModal = ({ open, onOpenChange }: ReportIssueModalProps) => {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const { toast } = useToast();

  const handleClose = (val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setStep("category");
        setCategory("");
        setDetails("");
      }, 200);
    }
    onOpenChange(val);
  };

  const handleSubmit = () => {
    setStep("submitted");
    toast({ title: "Issue reported successfully", variant: "success" as any });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        {step === "category" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Report an Issue
              </DialogTitle>
              <DialogDescription>Select the category that best describes the issue.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setStep("details");
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:border-primary hover:bg-primary/5 transition-colors text-center"
                >
                  <cat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Describe the Issue</DialogTitle>
              <DialogDescription>
                Category: {ISSUE_CATEGORIES.find((c) => c.id === category)?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="issue-details">Details</Label>
                <Textarea
                  id="issue-details"
                  placeholder="Please describe the issue in detail…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="mt-1.5 min-h-[120px]"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("category")}>
                  Back
                </Button>
                <Button className="flex-1" disabled={!details.trim()} onClick={handleSubmit}>
                  Submit Report
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "submitted" && (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Report Received</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
              Our team will review your issue and get back to you within 24 hours.
            </p>
            <Button className="mt-2 w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueModal;
