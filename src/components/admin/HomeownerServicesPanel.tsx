import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, DollarSign, Package, Layers, Wrench, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePools } from "@/hooks/usePools";
import {
  usePricingAddons,
  useHomeownerAddons,
  useUpdateCustomPricing,
  useHomeownerPricingInfo,
} from "@/hooks/usePricing";
import { useServiceCatalog, type ServiceCatalogItem } from "@/hooks/useServiceCatalog";
import {
  useHomeownerCustomServices,
  useCreateHomeownerCustomService,
  useUpdateHomeownerCustomService,
  useDeleteHomeownerCustomService,
  useAddHomeownerAddon,
  useRemoveHomeownerAddon,
  useUpdateHomeownerAddonPrice,
  useAdminBookCatalogService,
  type HomeownerCustomService,
} from "@/hooks/useHomeownerServices";

const money = (n: number) => `$${Number(n).toFixed(2)}`;

const TIME_WINDOWS = [
  { value: "morning" as const, label: "Morning", sub: "8 AM – 12 PM" },
  { value: "afternoon" as const, label: "Afternoon", sub: "12 – 4 PM" },
  { value: "evening" as const, label: "Evening", sub: "4 – 6 PM" },
];

function toDateMin() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Section: Base Plan Pricing ──────────────────────────────────────────────

function BasePricingSection({ homeownerId, monthlyAmount }: { homeownerId: string; monthlyAmount?: number | null }) {
  const { toast } = useToast();
  const { data: pricing } = useHomeownerPricingInfo(homeownerId);
  const updateCustom = useUpdateCustomPricing();

  const isCustom = !!pricing?.use_custom_pricing;
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState(false);

  const effectiveIsCustom = enabled !== null ? enabled : isCustom;
  const effectivePrice = editing ? price : (pricing?.custom_monthly_price != null ? String(pricing.custom_monthly_price) : "");

  const handleSave = async () => {
    const parsed = parseFloat(effectivePrice);
    if (effectiveIsCustom && (isNaN(parsed) || parsed < 0)) {
      toast({ title: "Enter a valid price", variant: "destructive" });
      return;
    }
    try {
      await updateCustom.mutateAsync({
        homeownerId,
        useCustom: effectiveIsCustom,
        customPrice: effectiveIsCustom ? parsed : null,
      });
      setEditing(false);
      setEnabled(null);
      setPrice("");
      toast({ title: "Pricing updated", variant: "success" });
    } catch (e) {
      toast({ title: "Failed to save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const isDirty = enabled !== null || editing;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Base Plan Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Custom monthly price</p>
            <p className="text-xs text-muted-foreground">Override the calculated monthly rate for this homeowner</p>
          </div>
          <Switch
            checked={effectiveIsCustom}
            onCheckedChange={(v) => { setEnabled(v); if (!v) setEditing(false); }}
          />
        </div>

        {effectiveIsCustom && (
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly override price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 149.99"
              value={effectivePrice}
              onChange={(e) => { setPrice(e.target.value); setEditing(true); }}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
          <span className="text-muted-foreground">Current monthly total</span>
          <span className="font-semibold text-base">{money(monthlyAmount ?? 0)}</span>
        </div>

        {isDirty && (
          <Button size="sm" className="w-full" onClick={handleSave} disabled={updateCustom.isPending}>
            {updateCustom.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : "Save Pricing"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section: Add-ons ────────────────────────────────────────────────────────

function AddonsSection({ homeownerId }: { homeownerId: string }) {
  const { toast } = useToast();
  const { data: catalog = [], isLoading: catalogLoading } = usePricingAddons(true);
  const { data: assigned = [], isLoading: assignedLoading } = useHomeownerAddons(homeownerId);
  const addAddon = useAddHomeownerAddon();
  const removeAddon = useRemoveHomeownerAddon();
  const updatePrice = useUpdateHomeownerAddonPrice();

  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  const assignedMap = new Map(assigned.map((a) => [a.addon_id, a]));
  const isLoading = catalogLoading || assignedLoading;

  const toggle = async (addonId: string, currentlyOn: boolean, price: number, billingType: "one_time" | "recurring") => {
    try {
      if (currentlyOn) {
        await removeAddon.mutateAsync({ homeownerId, addonId });
        toast({ title: "Add-on removed", variant: "success" });
      } else {
        await addAddon.mutateAsync({ homeownerId, addonId, price, billingType });
        toast({ title: "Add-on added", variant: "success" });
      }
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const savePrice = async (addonId: string) => {
    const raw = editingPrice[addonId];
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    try {
      await updatePrice.mutateAsync({ homeownerId, addonId, price: parsed });
      setEditingPrice((prev) => { const n = { ...prev }; delete n[addonId]; return n; });
      toast({ title: "Price updated", variant: "success" });
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  if (isLoading) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading add-ons…</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Add-ons
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Toggle add-ons for this homeowner. Prices shown are their individual overrides.</p>
      </CardHeader>
      <CardContent>
        {catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No add-ons in catalog.</p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {catalog.map((addon) => {
              const existing = assignedMap.get(addon.id);
              const isOn = !!existing;
              const isPriceDirty = editingPrice[addon.id] !== undefined;
              const displayPrice = isPriceDirty
                ? editingPrice[addon.id]
                : String(existing?.price_snapshot ?? addon.price);

              return (
                <div key={addon.id} className={`flex items-center gap-3 px-4 py-3 ${!addon.active ? "opacity-50" : ""}`}>
                  <Switch
                    checked={isOn}
                    onCheckedChange={() => toggle(addon.id, isOn, addon.price, addon.billing_type)}
                    disabled={addAddon.isPending || removeAddon.isPending}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{addon.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {addon.billing_type === "recurring" ? "Recurring" : "One-time"}
                      {!addon.active && " · Inactive in catalog"}
                    </p>
                  </div>
                  {isOn ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={displayPrice}
                        onChange={(e) => setEditingPrice((prev) => ({ ...prev, [addon.id]: e.target.value }))}
                        className="w-20 rounded border border-border bg-background px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {isPriceDirty && (
                        <>
                          <button
                            onClick={() => savePrice(addon.id)}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            title="Save price"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPrice((prev) => { const n = { ...prev }; delete n[addon.id]; return n; })}
                            className="rounded p-1 text-muted-foreground hover:bg-muted"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{money(addon.price)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section: One-time Services ──────────────────────────────────────────────

function OneTimeServicesSection({ homeownerId }: { homeownerId: string }) {
  const { toast } = useToast();
  const { data: catalog = [], isLoading } = useServiceCatalog(true);
  const { data: pools = [] } = usePools(homeownerId);
  const bookService = useAdminBookCatalogService();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceCatalogItem | null>(null);
  const [serviceDate, setServiceDate] = useState(toDateMin());
  const [timeWindow, setTimeWindow] = useState<"morning" | "afternoon" | "evening">("morning");
  const [customPrice, setCustomPrice] = useState("");

  const pool = pools[0];

  const openBook = (item: ServiceCatalogItem) => {
    setSelected(item);
    setCustomPrice(String(item.price));
    setServiceDate(toDateMin());
    setTimeWindow("morning");
    setOpen(true);
  };

  const handleBook = async () => {
    if (!pool || !selected) return;
    const price = parseFloat(customPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    try {
      await bookService.mutateAsync({
        homeownerId,
        poolId: pool.id,
        serviceName: selected.name,
        serviceDate,
        timeWindow,
        price,
        durationHours: selected.durationHours,
      });
      toast({ title: "Service booked", variant: "success" });
      setOpen(false);
    } catch (e) {
      toast({ title: "Failed to book", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            One-time Services
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Book a catalog service for this homeowner with a custom price.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading catalog…</p>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services in catalog.</p>
          ) : !pool ? (
            <p className="text-sm text-muted-foreground">No pool registered for this homeowner.</p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {catalog.map((item) => (
                <div key={item.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${!item.active ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {money(item.price)} · {item.durationHours}h
                      {!item.active && " · Inactive"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => openBook(item)}>
                    <Plus className="h-3.5 w-3.5" /> Book
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Book — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={serviceDate} min={toDateMin()} onChange={(e) => setServiceDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time Window</Label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_WINDOWS.map((tw) => (
                  <button
                    key={tw.value}
                    onClick={() => setTimeWindow(tw.value)}
                    className={`rounded-lg border p-2 text-left transition-colors ${timeWindow === tw.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    <p className="text-xs font-semibold">{tw.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tw.sub}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Price for this customer ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={String(selected?.price ?? "0")}
              />
              <p className="text-[11px] text-muted-foreground">Catalog default: {money(selected?.price ?? 0)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={bookService.isPending}>Cancel</Button>
            <Button onClick={handleBook} disabled={bookService.isPending || !serviceDate}>
              {bookService.isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Booking…</> : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Section: Custom Services ────────────────────────────────────────────────

interface CustomServiceForm {
  name: string;
  description: string;
  price: string;
  active: boolean;
}

const EMPTY_CS_FORM: CustomServiceForm = { name: "", description: "", price: "", active: true };

function CustomServicesSection({ homeownerId }: { homeownerId: string }) {
  const { toast } = useToast();
  const { data: services = [], isLoading } = useHomeownerCustomServices(homeownerId);
  const create = useCreateHomeownerCustomService();
  const update = useUpdateHomeownerCustomService();
  const del = useDeleteHomeownerCustomService();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomServiceForm>(EMPTY_CS_FORM);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_CS_FORM); setOpen(true); };
  const openEdit = (s: HomeownerCustomService) => {
    setEditingId(s.id);
    setForm({ name: s.name, description: s.description ?? "", price: String(s.price), active: s.active });
    setOpen(true);
  };

  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (isNaN(price) || price < 0) { toast({ title: "Invalid price", variant: "destructive" }); return; }
    try {
      if (editingId) {
        await update.mutateAsync({
          id: editingId,
          homeownerId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price,
          active: form.active,
        });
        toast({ title: "Service updated", variant: "success" });
      } else {
        await create.mutateAsync({
          homeownerId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price,
          active: form.active,
        });
        toast({ title: "Custom service created", variant: "success" });
      }
      setOpen(false);
    } catch (e) {
      toast({ title: "Failed to save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const handleDelete = async (s: HomeownerCustomService) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      await del.mutateAsync({ id: s.id, homeownerId });
      toast({ title: "Deleted", variant: "success" });
    } catch (e) {
      toast({ title: "Failed to delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Custom Services
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Services specific to this homeowner. Not visible to other customers.</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom services yet.</p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {services.map((s) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${!s.active ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{s.name}</p>
                      {!s.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Inactive</span>
                      )}
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-1">{s.description}</p>}
                  </div>
                  <span className="text-sm font-semibold shrink-0">{money(s.price)}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(s)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Custom Service" : "New Custom Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Weekly Phosphate Treatment"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does this service include?"
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price ($) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive services are hidden from the homeowner</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : editingId ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function HomeownerServicesPanel({
  homeownerId,
  monthlyAmount,
}: {
  homeownerId: string;
  monthlyAmount?: number | null;
}) {
  return (
    <div className="space-y-5">
      <BasePricingSection homeownerId={homeownerId} monthlyAmount={monthlyAmount} />
      <AddonsSection homeownerId={homeownerId} />
      <OneTimeServicesSection homeownerId={homeownerId} />
      <CustomServicesSection homeownerId={homeownerId} />
    </div>
  );
}
