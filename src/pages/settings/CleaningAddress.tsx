import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FORM_LIMITS } from "@/lib/form-limits";
import BackLink from "@/components/BackLink";
import { usePools } from "@/hooks/usePools";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { AccessMethod } from "@/contexts/BookingContext";

const POOL_SIZE_OPTIONS: Record<string, { title: string; subtitle: string }> = {
  small: { title: "Small Pool", subtitle: "Standard residential" },
  medium: { title: "Medium Pool", subtitle: "Mid-size residential" },
  large: { title: "Large Pool", subtitle: "Large or custom" },
};

const ACCESS_OPTIONS: { value: AccessMethod; icon: string; label: string }[] = [
  { value: "home", icon: "🏠", label: "I will be home" },
  { value: "gate", icon: "🔢", label: "Gate code provided" },
  { value: "key", icon: "🗝️", label: "Key on property" },
  { value: "other", icon: "📝", label: "Other instructions" },
];

const parseAccessDetail = (method: AccessMethod, detail: string) => {
  if (method === "gate") {
    const [code, ...rest] = (detail || "").split(" · ");
    return { gateCode: code ?? "", gateNotes: rest.join(" · "), keyLocation: "", otherInstructions: "" };
  }
  if (method === "key") return { gateCode: "", gateNotes: "", keyLocation: detail ?? "", otherInstructions: "" };
  if (method === "other") return { gateCode: "", gateNotes: "", keyLocation: "", otherInstructions: detail ?? "" };
  return { gateCode: "", gateNotes: "", keyLocation: "", otherInstructions: "" };
};

const CleaningAddress = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: pools } = usePools(user?.id);
  const pool = pools?.[0];

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [accessMethod, setAccessMethod] = useState<AccessMethod>("home");
  const [gateCode, setGateCode] = useState("");
  const [gateNotes, setGateNotes] = useState("");
  const [keyLocation, setKeyLocation] = useState("");
  const [otherInstructions, setOtherInstructions] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const poolSizeKey = (pool?.poolSize?.toLowerCase() as keyof typeof POOL_SIZE_OPTIONS) || "small";
  const poolSizeOption = POOL_SIZE_OPTIONS[poolSizeKey] || POOL_SIZE_OPTIONS.small;

  // Hydrate from pool + user
  useEffect(() => {
    setAddress(pool?.address || user?.streetAddress || "");
    setCity(pool?.city || user?.city || "");
    setState(pool?.state || user?.state || "");
    setZip(pool?.zip || user?.zipCode || "");
    const method = ((pool?.accessMethod as AccessMethod) || "home") as AccessMethod;
    setAccessMethod(method);
    const parsed = parseAccessDetail(method, pool?.accessDetail || "");
    setGateCode(parsed.gateCode);
    setGateNotes(parsed.gateNotes);
    setKeyLocation(parsed.keyLocation);
    setOtherInstructions(parsed.otherInstructions);
  }, [pool, user]);

  const markTouched = (f: string) => setTouched((p) => ({ ...p, [f]: true }));
  const fieldError = (f: string, v: string) => touched[f] && !v.trim();

  const getAccessDetail = () => {
    if (accessMethod === "gate") return gateCode + (gateNotes ? ` · ${gateNotes}` : "");
    if (accessMethod === "key") return keyLocation;
    if (accessMethod === "other") return otherInstructions;
    return "";
  };

  const canSave = useMemo(() => {
    if (!address.trim() || !city.trim() || !state.trim() || !zip.trim()) return false;
    if (accessMethod === "gate" && !gateCode.trim()) return false;
    if (accessMethod === "key" && !keyLocation.trim()) return false;
    if (accessMethod === "other" && !otherInstructions.trim()) return false;
    return true;
  }, [address, city, state, zip, accessMethod, gateCode, keyLocation, otherInstructions]);

  const handleSave = async () => {
    if (!canSave) {
      setTouched({ address: true, city: true, state: true, zip: true, gateCode: true, keyLocation: true, otherInstructions: true });
      return;
    }
    setSaving(true);
    try {
      updateUser({ streetAddress: address, city, state, zipCode: zip });
      if (pool?.id) {
        const { error } = await supabase
          .from("pools")
          .update({
            address,
            city,
            state,
            zip,
            access_method: accessMethod,
            access_detail: getAccessDetail(),
          })
          .eq("id", pool.id);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["pools"] });
      }
      toast({ title: "Cleaning address updated.", variant: "success" });
    } catch (err) {
      toast({ title: "Failed to save changes", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-[760px] mx-auto px-5 py-8">
      <BackLink />
      <h1 className="text-2xl font-bold text-foreground mb-1">Cleaning Address</h1>
      <p className="text-sm text-muted-foreground mb-6">Keep your service address and pool access info up to date.</p>

      <div className="space-y-5">
        {/* Address */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">ADDRESS</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Street Address <span className="text-destructive">*</span></label>
              <Input
                placeholder="Street address"
                value={address}
                maxLength={FORM_LIMITS.streetAddress}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={() => markTouched("address")}
                className={`h-10 rounded-lg border bg-muted/30 text-sm ${fieldError("address", address) ? "border-destructive" : "border-border"}`}
              />
              {fieldError("address", address) && <p className="text-[11px] text-destructive">This field is required</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">City <span className="text-destructive">*</span></label>
                <Input placeholder="City" value={city} maxLength={FORM_LIMITS.city} onChange={(e) => setCity(e.target.value)} onBlur={() => markTouched("city")} className={`h-10 rounded-lg border bg-muted/30 text-sm ${fieldError("city", city) ? "border-destructive" : "border-border"}`} />
                {fieldError("city", city) && <p className="text-[11px] text-destructive">Required</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">State <span className="text-destructive">*</span></label>
                <Input placeholder="State" value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} onBlur={() => markTouched("state")} className={`h-10 rounded-lg border bg-muted/30 text-sm ${fieldError("state", state) ? "border-destructive" : "border-border"}`} />
                {fieldError("state", state) && <p className="text-[11px] text-destructive">Required</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">ZIP <span className="text-destructive">*</span></label>
                <Input placeholder="ZIP" value={zip} maxLength={5} inputMode="numeric" onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} onBlur={() => markTouched("zip")} className={`h-10 rounded-lg border bg-muted/30 text-sm ${fieldError("zip", zip) ? "border-destructive" : "border-border"}`} />
                {fieldError("zip", zip) && <p className="text-[11px] text-destructive">Required</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Pool Details + Access */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL DETAILS</p>
          <div className="grid grid-cols-1 gap-3 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Pool Size</label>
              <div
                role="combobox"
                aria-disabled="true"
                aria-readonly="true"
                tabIndex={-1}
                className="h-auto min-h-12 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm flex items-center justify-between gap-2 cursor-not-allowed opacity-90"
              >
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-foreground">{poolSizeOption.title}</span>
                  <span className="text-xs text-muted-foreground">{poolSizeOption.subtitle}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 shrink-0" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL ACCESS</p>
            <p className="text-[13px] text-muted-foreground mb-3">How will we access your pool?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {ACCESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccessMethod(opt.value)}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 transition-all text-left ${
                    accessMethod === opt.value ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <span className="text-xl leading-none">{opt.icon}</span>
                  <span className="text-[13px] font-medium text-foreground leading-snug">{opt.label}</span>
                </button>
              ))}
            </div>

            {accessMethod === "gate" && (
              <div className="mt-3.5 flex flex-col gap-2.5 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Gate Code <span className="text-destructive">*</span></label>
                  <Input placeholder="e.g. 4821" value={gateCode} onChange={(e) => setGateCode(e.target.value)} onBlur={() => markTouched("gateCode")} maxLength={12} className={`h-10 rounded-lg border bg-muted/30 text-sm ${fieldError("gateCode", gateCode) ? "border-destructive" : "border-border"}`} />
                  {fieldError("gateCode", gateCode) && <p className="text-[11px] text-destructive">Required</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Additional gate notes (optional)</label>
                  <Input placeholder="e.g. Blue door on left side" value={gateNotes} maxLength={FORM_LIMITS.poolAccessDetail} onChange={(e) => setGateNotes(e.target.value)} className="h-10 rounded-lg border border-border bg-muted/30 text-sm" />
                </div>
              </div>
            )}
            {accessMethod === "key" && (
              <div className="mt-3.5 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Where is the key? <span className="text-destructive">*</span></label>
                  <Input placeholder="e.g. Under the welcome mat" value={keyLocation} maxLength={FORM_LIMITS.poolAccessDetail} onChange={(e) => setKeyLocation(e.target.value)} onBlur={() => markTouched("keyLocation")} className={`h-10 rounded-lg border bg-muted/30 text-sm ${fieldError("keyLocation", keyLocation) ? "border-destructive" : "border-border"}`} />
                  {fieldError("keyLocation", keyLocation) && <p className="text-[11px] text-destructive">Required</p>}
                </div>
              </div>
            )}
            {accessMethod === "other" && (
              <div className="mt-3.5 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Access Instructions <span className="text-destructive">*</span></label>
                  <Textarea placeholder="Describe how to access the pool…" value={otherInstructions} maxLength={FORM_LIMITS.poolAccessDetail} onChange={(e) => setOtherInstructions(e.target.value)} onBlur={() => markTouched("otherInstructions")} rows={3} className={`rounded-lg border bg-muted/30 text-sm resize-y min-h-[72px] ${fieldError("otherInstructions", otherInstructions) ? "border-destructive" : "border-border"}`} />
                  {fieldError("otherInstructions", otherInstructions) && <p className="text-[11px] text-destructive">Required</p>}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Pets on Property</p>
                <p className="text-xs text-muted-foreground">Let the technician know if you have pets</p>
              </div>
              <Switch checked={hasPets} onCheckedChange={setHasPets} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CleaningAddress;
