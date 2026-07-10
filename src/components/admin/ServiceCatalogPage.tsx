import { useState } from "react";
import { Plus, Pencil, Power, PowerOff, Clock, DollarSign, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useServiceCatalog,
  useCreateServiceCatalogItem,
  useUpdateServiceCatalogItem,
  useDeleteServiceCatalogItem,
  type ServiceCatalogItem,
} from "@/hooks/useServiceCatalog";

const CATEGORIES = ["Equipment", "Supplies", "Repair", "Cleaning", "Inspection", "Other"];

interface FormState {
  name: string;
  description: string;
  price: string;
  durationHours: string;
  category: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  durationHours: "1",
  category: "",
  active: true,
};

function fmtDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === 1) return "1 hr";
  return `${hours} hrs`;
}

export default function ServiceCatalogPage() {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useServiceCatalog(true);
  const createItem = useCreateServiceCatalogItem();
  const updateItem = useUpdateServiceCatalogItem();
  const deleteItem = useDeleteServiceCatalogItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: ServiceCatalogItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      durationHours: String(item.durationHours),
      category: item.category ?? "",
      active: item.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const price = parseFloat(form.price);
    const durationHours = parseFloat(form.durationHours);
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    if (isNaN(price) || price < 0) return toast({ title: "Invalid price", variant: "destructive" });
    if (isNaN(durationHours) || durationHours <= 0) return toast({ title: "Invalid duration", variant: "destructive" });

    try {
      if (editingId) {
        await updateItem.mutateAsync({
          id: editingId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price,
          durationHours,
          category: form.category.trim() || null,
          active: form.active,
        });
        toast({ title: "Service updated", variant: "success" });
      } else {
        await createItem.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price,
          durationHours,
          category: form.category.trim() || undefined,
          active: form.active,
          sortOrder: items.length,
        });
        toast({ title: "Service created", variant: "success" });
      }
      setDialogOpen(false);
    } catch (e) {
      toast({ title: "Failed to save", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  const toggleActive = async (item: ServiceCatalogItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, active: !item.active });
      toast({ title: item.active ? "Service disabled" : "Service enabled", variant: "success" });
    } catch (e) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const active = items.filter((i) => i.active);
  const inactive = items.filter((i) => !i.active);

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Service Catalog</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} active service{active.length !== 1 ? "s" : ""} available for homeowners to book
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active services */}
          <div className="space-y-3">
            {active.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No active services. Click "Add Service" to create one.
                </CardContent>
              </Card>
            ) : active.map((item) => (
              <ServiceRow key={item.id} item={item} onEdit={openEdit} onToggle={toggleActive} />
            ))}
          </div>

          {/* Disabled services */}
          {inactive.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Disabled</p>
              {inactive.map((item) => (
                <ServiceRow key={item.id} item={item} onEdit={openEdit} onToggle={toggleActive} disabled />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service" : "New Service"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Leak Detection & Repair"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does this service include?"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label>Duration (hours) *</Label>
                <Input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={form.durationHours}
                  onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: f.category === cat ? "" : cat }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.category === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Homeowners can see and book this service</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : editingId ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceRow({
  item,
  onEdit,
  onToggle,
  disabled = false,
}: {
  item: ServiceCatalogItem;
  onEdit: (item: ServiceCatalogItem) => void;
  onToggle: (item: ServiceCatalogItem) => void;
  disabled?: boolean;
}) {
  return (
    <Card className={disabled ? "opacity-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold">{item.name}</p>
              {item.category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {item.category}
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${item.price.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {fmtDuration(item.durationHours)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(item)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={item.active ? "text-destructive border-destructive/30 hover:bg-destructive/5" : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"}
              onClick={() => onToggle(item)}
            >
              {item.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
              {item.active ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
