import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Package } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import {
  usePricingAddons,
  useCreatePricingAddon,
  useUpdatePricingAddon,
  useDeletePricingAddon,
  useReorderPricingAddons,
  type PricingAddon,
} from "@/hooks/usePricing";

const emptyDraft = {
  name: "",
  description: "",
  price: 0,
  billing_type: "one_time" as "one_time" | "recurring",
  active: true,
};

export default function AddonsManagementPage() {
  const { toast } = useToast();
  const { data: addons = [], isLoading } = usePricingAddons(true);
  const create = useCreatePricingAddon();
  const update = useUpdatePricingAddon();
  const del = useDeletePricingAddon();
  const reorder = useReorderPricingAddons();

  const [editing, setEditing] = useState<PricingAddon | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (a: PricingAddon) => {
    setEditing(a);
    setDraft({
      name: a.name,
      description: a.description ?? "",
      price: Number(a.price),
      billing_type: a.billing_type,
      active: a.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          price: Number(draft.price) || 0,
          billing_type: draft.billing_type,
          active: draft.active,
        });
        toast({ title: "Add-on updated", variant: "success" });
      } else {
        await create.mutateAsync({
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          price: Number(draft.price) || 0,
          billing_type: draft.billing_type,
          active: draft.active,
        });
        toast({ title: "Add-on created", variant: "success" });
      }
      setOpen(false);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const remove = async (a: PricingAddon) => {
    if (!confirm(`Delete "${a.name}"? It will be hidden from new bookings.`)) return;
    try {
      await del.mutateAsync(a.id);
      toast({ title: "Add-on deleted", variant: "success" });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...addons];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    try {
      await reorder.mutateAsync(next.map((a) => a.id));
    } catch (e) {
      toast({ title: "Reorder failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Add-ons Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Master list of add-ons. Prices here flow to homeowner records and the booking flow.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Add-on
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{addons.length} add-ons</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : addons.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No add-ons yet"
              description="Create your first add-on to make it bookable."
              actionLabel="New Add-on"
              onAction={openCreate}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map((a, idx) => (
                  <TableRow key={a.id} className={!a.active ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(idx, -1)} disabled={idx === 0}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(idx, 1)} disabled={idx === addons.length - 1}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{a.name}</div>
                      {a.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-md">{a.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">${Number(a.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                        {a.billing_type === "recurring" ? "Recurring" : "One-time"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          a.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {a.active && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(a)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md pt-10">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Add-on" : "New Add-on"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Filter Cleaning"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
                placeholder="Short description shown to customers"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Billing</Label>
                <Select
                  value={draft.billing_type}
                  onValueChange={(v: "one_time" | "recurring") => setDraft({ ...draft, billing_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring (monthly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Inactive add-ons are hidden from new bookings.</div>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>
              {editing ? "Save Changes" : "Create Add-on"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
