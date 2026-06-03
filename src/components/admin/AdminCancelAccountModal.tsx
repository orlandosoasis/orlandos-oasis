import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAdminCancelSubscription } from "@/hooks/usePricing";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

interface Props {
  open: boolean;
  onClose: () => void;
  homeownerId: string;
  homeownerName: string;
  outstandingBalance: number;
  onCollectPayment?: () => void;
}

export default function AdminCancelAccountModal({
  open, onClose, homeownerId, homeownerName, outstandingBalance, onCollectPayment,
}: Props) {
  const cancel = useAdminCancelSubscription();
  const { toast } = useToast();
  const [mode, setMode] = useState<"collect" | "preserve">("preserve");
  const [effective, setEffective] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  const hasBalance = outstandingBalance > 0;

  useEffect(() => {
    if (open) {
      setMode(hasBalance ? "collect" : "preserve");
      setEffective(format(addDays(new Date(), 0), "yyyy-MM-dd"));
      setReason("");
    }
  }, [open, hasBalance]);

  const handleConfirm = async () => {
    if (mode === "collect" && hasBalance) {
      onCollectPayment?.();
      toast({ title: "Open payment flow", description: "Collect the balance, then cancel.", variant: "default" });
      return;
    }
    try {
      await cancel.mutateAsync({
        homeownerId,
        effectiveEnd: effective,
        preserveBalance: hasBalance,
        reason,
      });
      toast({ title: "Account cancelled", description: hasBalance ? `Balance of ${money(outstandingBalance)} preserved.` : "Subscription cancelled.", variant: "success" });
      onClose();
    } catch (e) {
      toast({ title: "Cancellation failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px] pt-10">
        <DialogHeader>
          <DialogTitle>Cancel {homeownerName}'s Account</DialogTitle>
          <DialogDescription>This stops future services. Outstanding balances are preserved unless collected now.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">Outstanding balance</div>
            <div className={`text-xl font-bold ${hasBalance ? "text-destructive" : "text-foreground"}`}>{money(outstandingBalance)}</div>
          </div>

          {hasBalance && (
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "collect" | "preserve")} className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-md border border-input cursor-pointer">
                <RadioGroupItem value="collect" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Collect payment now</div>
                  <div className="text-xs text-muted-foreground">Open payment flow before cancelling.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-md border border-input cursor-pointer">
                <RadioGroupItem value="preserve" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Cancel and keep balance due</div>
                  <div className="text-xs text-muted-foreground">Balance stays visible in admin until cleared.</div>
                </div>
              </label>
            </RadioGroup>
          )}

          <div>
            <Label className="text-xs">Effective end date</Label>
            <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className="h-9" />
            <p className="text-xs text-muted-foreground mt-1">Services after this date will be cancelled.</p>
          </div>

          <div>
            <Label className="text-xs">Reason (optional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={cancel.isPending}>
            {mode === "collect" && hasBalance ? "Collect Payment" : "Cancel Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
