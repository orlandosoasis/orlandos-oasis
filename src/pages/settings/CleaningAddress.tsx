import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CleaningAddress = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [zipCode, setZipCode] = useState(user?.zipCode || "");
  const [unitInfo, setUnitInfo] = useState("");

  const handleSave = () => {
    updateUser({ streetAddress, city, state, zipCode });
    toast({ title: "Cleaning address updated.", variant: "success" });
  };

  return (
    <>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Cleaning Address</h1>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input id="streetAddress" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="1234 Sunshine Blvd" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitInfo">Unit / Access Information (Optional)</Label>
            <Input id="unitInfo" value={unitInfo} onChange={(e) => setUnitInfo(e.target.value)} placeholder="Apt 2B, Gate code: 1234" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Orlando" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="FL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="32801" />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-2">Save Changes</Button>
        </div>
      </main>
    </div>
  );
};

export default CleaningAddress;
