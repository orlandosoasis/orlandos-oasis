import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";

const PersonalInfo = () => {
  const { user, updateUser } = useAuth();
  const { checkoutData } = useBooking();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || checkoutData?.customerFirstName || user?.fullName?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.lastName || checkoutData?.customerLastName || user?.fullName?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || checkoutData?.customerEmail || "");
  const [phone, setPhone] = useState(user?.phone || checkoutData?.customerPhone || "");

  const handleSave = () => {
    toast({ title: "Personal information updated.", variant: "success" });
  };

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Personal Information</h1>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
          <Button onClick={handleSave} className="mt-2">Save Changes</Button>
        </div>
      </main>
    </>
  );
};

export default PersonalInfo;
