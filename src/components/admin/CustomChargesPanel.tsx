import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useHomeownerCustomCharges, useAddCustomCharge, useDeleteCustomCharge } from "@/hooks/usePricing";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function CustomChargesPanel({ homeownerId }: { homeownerId: string }) {
  const { data = [] } = useHomeownerCustomCharges(homeownerId);
  const add = useAddCustomCharge();
  const del = useDeleteCustomCharge();
  const { toast } = useToast();
  const [draft, setDraft] = useState({ name: "", amount: 0, billingType: "one_time" as "one_time" | "monthly" });

  const handleAdd = async () => {
    if (!draft.name.trim() || draft.amount <= 0) {
      toast({ title: "Missing info", description: "Name and amount required.", variant: "destructive" });
      return;
    }
    await add.mutateAsync({ homeownerId, ...draft });
    toast({ title: "Charge added", variant: "success" });
    setDraft({ name: "", amount: 0, billingType: "one_time" });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_auto] gap-2 items-end">
        <div>
          <Label className="text-xs">Service / charge name</Label>
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Filter replacement" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Amount ($)</Label>
          <Input type="number" value={draft.amount} onChange={e => setDraft({ ...draft, amount: Number(e.target.value) })} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Billing</Label>
          <Select value={draft.billingType} onValueChange={(v) => setDraft({ ...draft, billingType: v as "one_time" | "monthly" })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One-time</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={add.isPending}><Plus className="h-4 w-4" /> Add</Button>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No custom charges yet.</p>
      ) : (
        <div className="space-y-1.5">
          {data.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-2.5 border border-border rounded-md text-sm">
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {money(c.amount)} · {c.billingType === "monthly" ? "Recurring" : "One-time"}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => del.mutate({ id: c.id, homeownerId })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
