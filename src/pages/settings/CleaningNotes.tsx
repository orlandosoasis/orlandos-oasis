import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const CleaningNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    toast({ title: "Cleaning notes saved.", variant: "success" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate("/account-settings")} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Cleaning Notes</h1>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5 max-w-md">
          <p className="text-sm text-muted-foreground">
            Add persistent instructions visible to your pool technician. Include gate access codes, equipment notes, or special requests.
          </p>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Technician</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Gate code is 1234. Pool pump is located behind the garage. Please avoid using chemicals near the garden area."
              className="min-h-[150px]"
            />
          </div>
          <Button onClick={handleSave} className="mt-2">Save Changes</Button>
        </div>
      </main>
    </div>
  );
};

export default CleaningNotes;
