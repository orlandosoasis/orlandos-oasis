import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import { supabase } from "@/integrations/supabase/client";
import { formatUsPhone } from "@/lib/phone";
import { FORM_LIMITS } from "@/lib/form-limits";

const Profile = () => {
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const { checkoutData } = useBooking();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const firstName = user?.firstName || checkoutData?.customerFirstName || user?.fullName?.split(" ")[0] || "";
  const lastName = user?.lastName || checkoutData?.customerLastName || user?.fullName?.split(" ").slice(1).join(" ") || "";
  const [email, setEmail] = useState(user?.email || checkoutData?.customerEmail || "");
  const [phone, setPhone] = useState(user?.phone || checkoutData?.customerPhone || "");
  const streetAddress = user?.streetAddress || "";
  const city = user?.city || "";
  const state = user?.state || "";
  const zipCode = user?.zipCode || "";

  if (!isLoading && !isAuthenticated) {
    navigate("/login", { replace: true });
    return null;
  }

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateUser({ avatarUrl: data.publicUrl });
      toast({ title: "Avatar updated.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = () => {
    updateUser({ phone });
    toast({ title: "Success! Profile updated.", variant: "success" });
  };

  return (
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
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} alt={firstName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Change avatar"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
          </div>
        </div>

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
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={FORM_LIMITS.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={FORM_LIMITS.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={(e) => setPhone(formatUsPhone(e.target.value))}
            placeholder="(407) 555-1234"
          />
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
  );
};

export default Profile;
