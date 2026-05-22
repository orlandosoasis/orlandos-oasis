import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FORM_LIMITS } from "@/lib/form-limits";
import BackLink from "@/components/BackLink";

const CleaningNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    toast({ title: "Cleaning notes saved.", variant: "success" });
  };

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-8">
        <BackLink />
        <h1 className="text-2xl font-bold text-foreground mb-6">Cleaning Notes</h1>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Add persistent instructions visible to your pool technician. Include gate access codes, equipment notes, or special requests.
          </p>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Technician</Label>
            <Textarea
              id="notes"
              name="cleaning-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={FORM_LIMITS.cleaningNotes}
              placeholder="e.g., Gate code is 1234. Pool pump is located behind the garage. Please avoid using chemicals near the garden area."
              className="min-h-[150px]"
            />
            <div className="text-right text-xs text-muted-foreground">{notes.length} / {FORM_LIMITS.cleaningNotes}</div>
          </div>
          <Button onClick={handleSave} className="mt-2">Save Changes</Button>
        </div>
      </main>
    </>
  );
};

export default CleaningNotes;
