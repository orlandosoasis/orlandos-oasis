import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "";
  const lastName = user?.lastName || user?.fullName?.split(" ").slice(1).join(" ") || "";
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const streetAddress = user?.streetAddress || "";
  const city = user?.city || "";
  const state = user?.state || "";
  const zipCode = user?.zipCode || "";

  if (!isLoading && !isAuthenticated) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleSave = () => {
    toast({ title: "Success! Profile updated.", variant: "success" });
  };

  return (
    <>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-1.5 text-primary hover:text-primary hover:bg-transparent"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

        <div className="space-y-5 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} disabled className="bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(407) 555-1234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input id="streetAddress" value={streetAddress} disabled className="bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input id="zipCode" value={zipCode} disabled className="bg-muted" />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4">Save Changes</Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
