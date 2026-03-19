import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import oasisLogo from "@/assets/oasis-logo-circle.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Preferences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasPets, setHasPets] = useState(false);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [accessInstructions, setAccessInstructions] = useState("");

  const handleSave = () => {
    toast({ title: "Preferences saved.", variant: "success" });
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
            <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Preferences</h1>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6 max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-foreground">Pets on Property</p>
              <p className="text-sm text-muted-foreground">Let the technician know if you have pets</p>
            </div>
            <Switch checked={hasPets} onCheckedChange={setHasPets} />
          </div>

          <div className="space-y-2">
            <Label>Preferred Cleaning Time</Label>
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8 AM – 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM – 4 PM)</SelectItem>
                <SelectItem value="evening">Evening (4 PM – 6 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access">Access Instructions</Label>
            <Input
              id="access"
              value={accessInstructions}
              onChange={(e) => setAccessInstructions(e.target.value)}
              placeholder="e.g., Use the side gate on the left"
            />
          </div>

          <Button onClick={handleSave} className="mt-2">Save Changes</Button>
        </div>
      </main>
    </div>
  );
};

export default Preferences;
