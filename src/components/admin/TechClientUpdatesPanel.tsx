import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTechClientMessages } from "@/hooks/useAdminDetails";
import { Eye } from "lucide-react";

export default function TechClientUpdatesPanel({ technicianId }: { technicianId: string }) {
  const threads = useTechClientMessages(technicianId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" /> Client Updates (Read-Only)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          All messages this technician has exchanged with clients, grouped by pool.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {threads.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!threads.isLoading && (threads.data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground italic">No client conversations yet.</p>
        )}
        {(threads.data ?? []).map((t, i) => (
          <div key={i} className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 border-b border-border">
              <div className="text-sm font-semibold">{t.poolAddress}</div>
              <div className="text-[11px] text-muted-foreground">{t.homeownerName} • {t.messages.length} messages</div>
            </div>
            <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
              {t.messages.slice(-15).map((m) => (
                <div key={m.id} className={`text-sm rounded-md p-2 ${m.fromTech ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-0.5">
                    {m.fromTech ? "Technician" : "Client"} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
