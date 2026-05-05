import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHomeownerBilling, useUpdateHomeownerBilling } from "@/hooks/useAdminDetails";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CalendarClock } from "lucide-react";

export default function HomeownerBillingPanel({ homeownerId }: { homeownerId: string }) {
  const { toast } = useToast();
  const { data } = useHomeownerBilling(homeownerId);
  const update = useUpdateHomeownerBilling();
  const [amount, setAmount] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setAmount(data.monthlyAmount?.toString() ?? "");
      setStart(data.contractStartDate ?? "");
      setLocked(data.contractLocked);
    }
  }, [data]);

  const remaining = (() => {
    if (!data?.contractStartDate || !data.contractLocked) return null;
    const start = new Date(data.contractStartDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const ms = end.getTime() - Date.now();
    if (ms <= 0) return "Contract complete";
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days >= 30) return `${Math.round(days / 30)} months remaining`;
    return `${days} days remaining`;
  })();

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        homeownerId,
        monthlyAmount: amount ? Number(amount) : null,
        contractStartDate: start || null,
        contractLocked: locked,
      });
      toast({ title: "Billing updated", variant: "success" });
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5" /> Billing & Contract
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Monthly amount ($)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label className="text-xs">Contract start date</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <div className="text-sm font-semibold">1-Year Contract Lock</div>
            <p className="text-xs text-muted-foreground">Early cancellation incurs a penalty.</p>
          </div>
          <Switch checked={locked} onCheckedChange={setLocked} />
        </div>
        {remaining && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="font-semibold">{remaining}</span>
          </div>
        )}
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
