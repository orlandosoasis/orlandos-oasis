import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Settings2, Receipt } from "lucide-react";
import {
  useHomeownerAddons,
  useHomeownerPricingInfo,
  useSnapshotGrandfathered,
} from "@/hooks/usePricing";
import { useToast } from "@/hooks/use-toast";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function HomeownerPricingPanel({
  homeownerId,
  monthlyAmount,
}: {
  homeownerId: string;
  monthlyAmount: number | null | undefined;
}) {
  const { toast } = useToast();
  const { data: addons = [] } = useHomeownerAddons(homeownerId);
  const { data: pricing } = useHomeownerPricingInfo(homeownerId);
  const snapshot = useSnapshotGrandfathered();

  const recurringTotal = addons
    .filter((a) => a.billing_type_snapshot === "recurring")
    .reduce((s, a) => s + Number(a.price_snapshot), 0);
  const oneTimeTotal = addons
    .filter((a) => a.billing_type_snapshot === "one_time")
    .reduce((s, a) => s + Number(a.price_snapshot), 0);

  const snap = pricing?.grandfathered_snapshot;
  const isCustom = !!pricing?.use_custom_pricing;
  const isGrandfathered = !!pricing?.is_grandfathered;

  const handleSnapshot = async () => {
    try {
      await snapshot.mutateAsync(homeownerId);
      toast({ title: "Grandfathered pricing snapshotted", variant: "success" });
    } catch (e) {
      toast({
        title: "Snapshot failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5" /> Pricing & Add-ons
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isCustom && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
              <Settings2 className="h-3 w-3" /> Custom Pricing
            </span>
          )}
          {isGrandfathered && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
              <ShieldCheck className="h-3 w-3" /> Grandfathered
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Add-ons */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Selected Add-ons
          </div>
          {addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No add-ons selected.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {addons.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{a.name ?? "Add-on"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {a.billing_type_snapshot === "recurring" ? "Recurring" : "One-time"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{money(Number(a.price_snapshot))}</div>
                </li>
              ))}
            </ul>
          )}
          {addons.length > 0 && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Add-ons total</span>
              <span className="font-semibold">{money(recurringTotal + oneTimeTotal)}</span>
            </div>
          )}
          {recurringTotal > 0 && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Recurring portion in monthly: {money(recurringTotal)}
            </div>
          )}
        </div>

        {/* Monthly summary */}
        <div className="rounded-md border border-border p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Monthly total</span>
            <span className="text-lg font-semibold">
              {money(Number(monthlyAmount ?? 0))}
            </span>
          </div>
          {isCustom && (
            <div className="text-[11px] text-violet-700 mt-1">
              Custom override is active. Calculated pricing is ignored.
            </div>
          )}
        </div>

        {/* Grandfathered snapshot panel */}
        {isGrandfathered && (
          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-amber-900">Legacy Pricing Locked</div>
                <div className="text-[11px] text-amber-800/80">
                  {snap
                    ? `Snapshotted ${new Date(snap.snapshotted_at).toLocaleDateString()}. Future price changes won't affect this account.`
                    : "No snapshot captured yet. Click Snapshot Now to freeze current pricing."}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleSnapshot} disabled={snapshot.isPending}>
                {snapshot.isPending ? "Saving…" : snap ? "Re-snapshot" : "Snapshot Now"}
              </Button>
            </div>
            {snap && (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-amber-800/70">Pool size</dt>
                <dd className="text-amber-900 font-medium">
                  {snap.pool_size ?? "—"} · {money(Number(snap.pool_size_price ?? 0))}
                </dd>
                <dt className="text-amber-800/70">Frequency</dt>
                <dd className="text-amber-900 font-medium">
                  {snap.frequency ?? "—"} · ×{snap.frequency_multiplier} {snap.frequency_delta ? `(+${money(snap.frequency_delta)})` : ""}
                </dd>
                <dt className="text-amber-800/70">Add-ons total</dt>
                <dd className="text-amber-900 font-medium">{money(Number(snap.addons_total ?? 0))}</dd>
                <dt className="text-amber-800/70">Frozen monthly</dt>
                <dd className="text-amber-900 font-bold">{money(Number(snap.monthly_total ?? 0))}</dd>
              </dl>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
