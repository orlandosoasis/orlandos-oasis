import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHomeownerServiceRequests, useUpdateServiceRequest } from "@/hooks/useAdminDetails";
import { useToast } from "@/hooks/use-toast";

const StatusPill = ({ s }: { s: string }) => {
  const cls: Record<string, string> = {
    open: "bg-amber-50 text-amber-600 border-amber-200",
    in_progress: "bg-blue-50 text-blue-600 border-blue-200",
    resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    cancelled: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls[s] ?? "bg-muted"}`}>
      {s.replace("_", " ")}
    </span>
  );
};

export default function HomeownerRequestsPanel({ homeownerId }: { homeownerId: string }) {
  const { toast } = useToast();
  const { data, isLoading } = useHomeownerServiceRequests(homeownerId);
  const update = useUpdateServiceRequest();

  const open = (data ?? []).filter((r) => r.status === "open" || r.status === "in_progress");
  const past = (data ?? []).filter((r) => r.status === "resolved" || r.status === "cancelled");

  const updateStatus = async (id: string, status: "in_progress" | "resolved" | "cancelled") => {
    try {
      await update.mutateAsync({ id, status });
      toast({ title: "Updated", variant: "success" });
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const Section = ({ title, rows, kind }: { title: string; rows: typeof open; kind: "open" | "past" }) => (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title} ({rows.length})</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              {kind === "open" && <TableHead className="w-40">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-sm italic">No requests.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold whitespace-nowrap">{r.requestType}</TableCell>
                <TableCell className="max-w-[260px] text-muted-foreground">{r.description}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><StatusPill s={r.status} /></TableCell>
                {kind === "open" && (
                  <TableCell>
                    <div className="flex gap-1.5">
                      {r.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "in_progress")}>Start</Button>
                      )}
                      <Button size="sm" onClick={() => updateStatus(r.id, "resolved")}>Resolve</Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Section title="Open Service Requests" rows={open} kind="open" />
      <Section title="Past Service Requests" rows={past} kind="past" />
    </div>
  );
}
