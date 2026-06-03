import { useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  usePricingPoolSizes, useUpdatePoolSize,
  usePricingFrequencies, useUpdateFrequency,
  usePricingAddons, useCreateAddon, useUpdateAddon, useDeleteAddon,
  useGrandfatheredPlans, useCreateGrandfatheredPlan, useUpdateGrandfatheredPlan, useDeleteGrandfatheredPlan,
} from "@/hooks/usePricing";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ─────────── Pool sizes tab ─────────── */
function PoolSizesTab() {
  const { data = [], isLoading } = usePricingPoolSizes();
  const update = useUpdatePoolSize();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      {data.map(p => {
        const draft = drafts[p.id] ?? p.basePrice;
        const dirty = draft !== p.basePrice;
        return (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-sm">{p.displayName}</div>
                <div className="text-xs text-muted-foreground">Key: {p.size}</div>
              </div>
              <div className="w-32">
                <Label className="text-[11px] text-muted-foreground">Base monthly</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    value={draft}
                    onChange={e => setDrafts(d => ({ ...d, [p.id]: Number(e.target.value) }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={p.active} onCheckedChange={(v) => update.mutate({ id: p.id, active: v })} />
                <span className="text-xs text-muted-foreground">{p.active ? "Active" : "Off"}</span>
              </div>
              <Button
                size="sm"
                disabled={!dirty || update.isPending}
                onClick={async () => {
                  await update.mutateAsync({ id: p.id, basePrice: draft });
                  toast({ title: "Saved", description: `${p.displayName} → ${money(draft)}/mo`, variant: "success" });
                  setDrafts(d => { const c = { ...d }; delete c[p.id]; return c; });
                }}
              >
                {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────── Frequencies tab ─────────── */
function FrequenciesTab() {
  const { data = [], isLoading } = usePricingFrequencies();
  const update = useUpdateFrequency();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, { multiplier?: number; priceDelta?: number }>>({});

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Final monthly price = pool-size base × multiplier + adjustment.</p>
      {data.map(f => {
        const draft = drafts[f.id] ?? {};
        const mult = draft.multiplier ?? f.multiplier;
        const delta = draft.priceDelta ?? f.priceDelta;
        const dirty = mult !== f.multiplier || delta !== f.priceDelta;
        return (
          <Card key={f.id}>
            <CardContent className="p-4 flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[160px]">
                <div className="font-semibold text-sm">{f.displayName}</div>
                <div className="text-xs text-muted-foreground">Key: {f.frequency}</div>
              </div>
              <div className="w-28">
                <Label className="text-[11px] text-muted-foreground">Multiplier</Label>
                <Input
                  type="number" step="0.05" value={mult}
                  onChange={e => setDrafts(d => ({ ...d, [f.id]: { ...d[f.id], multiplier: Number(e.target.value) } }))}
                  className="h-9"
                />
              </div>
              <div className="w-28">
                <Label className="text-[11px] text-muted-foreground">Adjustment $</Label>
                <Input
                  type="number" value={delta}
                  onChange={e => setDrafts(d => ({ ...d, [f.id]: { ...d[f.id], priceDelta: Number(e.target.value) } }))}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={f.active} onCheckedChange={(v) => update.mutate({ id: f.id, active: v })} />
                <span className="text-xs text-muted-foreground">{f.active ? "Active" : "Off"}</span>
              </div>
              <Button
                size="sm"
                disabled={!dirty || update.isPending}
                onClick={async () => {
                  await update.mutateAsync({ id: f.id, multiplier: mult, priceDelta: delta });
                  toast({ title: "Saved", description: f.displayName, variant: "success" });
                  setDrafts(d => { const c = { ...d }; delete c[f.id]; return c; });
                }}
              >
                <Save className="h-4 w-4" /> Save
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────── Add-ons tab ─────────── */
function AddonsTab() {
  const { data = [], isLoading } = usePricingAddons();
  const create = useCreateAddon();
  const update = useUpdateAddon();
  const del = useDeleteAddon();
  const { toast } = useToast();
  const [draft, setDraft] = useState({ key: "", name: "", price: 0, billingType: "one_time" as "one_time" | "monthly", description: "" });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Add new add-on</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <Input placeholder="Key (slug)" value={draft.key} onChange={e => setDraft({ ...draft, key: e.target.value })} className="h-9" />
            <Input placeholder="Display name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="h-9 md:col-span-2" />
            <Input type="number" placeholder="Price" value={draft.price} onChange={e => setDraft({ ...draft, price: Number(e.target.value) })} className="h-9" />
            <Select value={draft.billingType} onValueChange={(v) => setDraft({ ...draft, billingType: v as "one_time" | "monthly" })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Description (optional)" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2} />
          <Button
            size="sm"
            disabled={!draft.key.trim() || !draft.name.trim() || create.isPending}
            onClick={async () => {
              await create.mutateAsync({ ...draft });
              toast({ title: "Add-on created", variant: "success" });
              setDraft({ key: "", name: "", price: 0, billingType: "one_time", description: "" });
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {data.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold text-sm">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.description || a.key}</div>
              </div>
              <div className="w-28">
                <Input type="number" defaultValue={a.price} onBlur={e => {
                  const v = Number(e.target.value);
                  if (v !== a.price) update.mutate({ id: a.id, price: v });
                }} className="h-9" />
              </div>
              <Select value={a.billingType} onValueChange={(v) => update.mutate({ id: a.id, billingType: v as "one_time" | "monthly" })}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={a.active} onCheckedChange={(v) => update.mutate({ id: a.id, active: v })} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Grandfathered plans tab ─────────── */
function GrandfatheredTab() {
  const { data = [], isLoading } = useGrandfatheredPlans();
  const create = useCreateGrandfatheredPlan();
  const update = useUpdateGrandfatheredPlan();
  const del = useDeleteGrandfatheredPlan();
  const { toast } = useToast();
  const [draft, setDraft] = useState({ name: "", monthlyPrice: 0, description: "" });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Add new grandfathered plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Plan name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="h-9 md:col-span-2" />
            <Input type="number" placeholder="Monthly price" value={draft.monthlyPrice} onChange={e => setDraft({ ...draft, monthlyPrice: Number(e.target.value) })} className="h-9" />
          </div>
          <Textarea placeholder="Description (optional)" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2} />
          <Button
            size="sm"
            disabled={!draft.name.trim() || create.isPending}
            onClick={async () => {
              await create.mutateAsync({ ...draft });
              toast({ title: "Plan created", variant: "success" });
              setDraft({ name: "", monthlyPrice: 0, description: "" });
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {data.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold text-sm">{p.name}</div>
                {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
              </div>
              <div className="w-28">
                <Input type="number" defaultValue={p.monthlyPrice} onBlur={e => {
                  const v = Number(e.target.value);
                  if (v !== p.monthlyPrice) update.mutate({ id: p.id, monthlyPrice: v });
                }} className="h-9" />
              </div>
              <Switch checked={p.active} onCheckedChange={(v) => update.mutate({ id: p.id, active: v })} />
              <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Main page ─────────── */
export default function AdminPricingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Services & Pricing</h2>
        <p className="text-sm text-muted-foreground">Manage the catalog used in customer signup, billing, and admin tools.</p>
      </div>

      <Tabs defaultValue="pool-sizes">
        <TabsList>
          <TabsTrigger value="pool-sizes">Pool Sizes</TabsTrigger>
          <TabsTrigger value="frequencies">Service Frequency</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="grandfathered">Grandfathered</TabsTrigger>
        </TabsList>
        <TabsContent value="pool-sizes" className="mt-4"><PoolSizesTab /></TabsContent>
        <TabsContent value="frequencies" className="mt-4"><FrequenciesTab /></TabsContent>
        <TabsContent value="addons" className="mt-4"><AddonsTab /></TabsContent>
        <TabsContent value="grandfathered" className="mt-4"><GrandfatheredTab /></TabsContent>
      </Tabs>
    </div>
  );
}
