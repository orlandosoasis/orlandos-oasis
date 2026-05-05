import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePastServiceDetail } from "@/hooks/useAdminDetails";
import { Eye } from "lucide-react";

export default function PastServiceDetailModal({
  serviceId,
  onClose,
}: {
  serviceId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = usePastServiceDetail(serviceId ?? undefined);

  return (
    <Dialog open={!!serviceId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="pt-10 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" /> Service Details (Read-Only)
          </DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {data && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><span className="font-semibold">Type:</span> {data.service.serviceType}</div>
                <div><span className="font-semibold">Date:</span> {data.service.serviceDate}</div>
                {data.service.completedAt && (
                  <div><span className="font-semibold">Completed:</span> {new Date(data.service.completedAt).toLocaleString()}</div>
                )}
                {data.service.techNotes && (
                  <div><span className="font-semibold">Tech notes:</span> <span className="text-muted-foreground whitespace-pre-wrap">{data.service.techNotes}</span></div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Conversation</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {data.messages.length === 0 && <p className="text-sm text-muted-foreground italic">No messages between participants.</p>}
                {data.messages.map((m) => (
                  <div key={m.id} className="text-sm rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-0.5">
                      {m.senderName} ({m.senderRole}) • {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Photos ({data.photos.length})</CardTitle></CardHeader>
              <CardContent>
                {data.photos.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No photos uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.photos.map((p) => (
                      <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
                        <img src={p.url} alt={p.type} className="w-full h-32 object-cover rounded-md border border-border" />
                        <div className="text-[11px] text-muted-foreground mt-1 capitalize">{p.type}</div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
