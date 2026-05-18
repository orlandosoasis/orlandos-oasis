import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Trash2 } from "lucide-react";
import {
  useAdminNotes,
  useAddAdminNote,
  useDeleteAdminNote,
  type AdminNoteTarget,
} from "@/hooks/useAdminDetails";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotesPanel({
  targetType,
  targetId,
  title = "Admin Notes (Private)",
}: {
  targetType: AdminNoteTarget;
  targetId: string;
  title?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const notes = useAdminNotes(targetType, targetId);
  const addNote = useAddAdminNote();
  const deleteNote = useDeleteAdminNote();
  const [draft, setDraft] = useState("");

  const handleSave = async () => {
    if (!draft.trim() || !user) return;
    try {
      await addNote.mutateAsync({ targetType, targetId, body: draft.trim(), authorId: user.id });
      setDraft("");
    } catch (e) {
      toast({ title: "Failed to save note", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote.mutateAsync({ id, targetType, targetId });
    } catch (e) {
      toast({ title: "Failed to delete note", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-amber-600" /> {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Visible to admins only - not shown to technicians or clients.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Add a private note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={!draft.trim() || addNote.isPending}>
            {addNote.isPending ? "Saving…" : "Save Note"}
          </Button>
        </div>

        <div className="space-y-2 pt-2">
          {notes.isLoading && <p className="text-xs text-muted-foreground">Loading notes…</p>}
          {!notes.isLoading && (notes.data?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground italic">No private notes yet.</p>
          )}
          {(notes.data ?? []).map((n) => (
            <div key={n.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm whitespace-pre-wrap text-foreground flex-1">{n.body}</div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5">
                {n.authorName} • {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
