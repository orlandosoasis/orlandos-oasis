import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTechClientMessages } from "@/hooks/useAdminDetails";
import { Eye, MessageSquare } from "lucide-react";
import { useMemo } from "react";

export default function TechClientUpdatesPanel({ technicianId }: { technicianId: string }) {
  const threads = useTechClientMessages(technicianId);

  const { recent, totalMessages, homeownerCount } = useMemo(() => {
    const all = (threads.data ?? []).flatMap((t) =>
      t.messages.map((m) => ({
        ...m,
        homeownerName: t.homeownerName,
        poolAddress: t.poolAddress,
      }))
    );
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const homeowners = new Set((threads.data ?? []).map((t) => t.homeownerName));
    return { recent: all.slice(0, 25), totalMessages: all.length, homeownerCount: homeowners.size };
  }, [threads.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" /> Client Updates (Read-Only)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Recent conversations with all clients · {totalMessages} messages across {homeownerCount} homeowner{homeownerCount === 1 ? "" : "s"}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {threads.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!threads.isLoading && recent.length === 0 && (
          <p className="text-sm text-muted-foreground italic flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> No client conversations yet.
          </p>
        )}
        <div className="max-h-[420px] overflow-y-auto space-y-2">
          {recent.map((m) => (
            <div
              key={m.id}
              className={`text-sm rounded-md p-2.5 border ${
                m.fromTech ? "bg-primary/5 border-primary/20" : "bg-muted border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.fromTech ? "Technician" : m.homeownerName} · {m.poolAddress}
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="whitespace-pre-wrap text-foreground">{m.body}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
