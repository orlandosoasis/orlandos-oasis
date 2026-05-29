import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Danger Zone block for account settings.
 * - Export my data: calls public.export_my_data() RPC and triggers a JSON
 *   download with everything the user owns. GDPR right-to-portability.
 * - Delete my account: requires typing DELETE to confirm, calls
 *   public.delete_my_account() RPC, signs out, redirects home. GDPR
 *   right-to-erasure.
 * Admins are blocked at the SQL layer; the button still appears but
 * the RPC will reject with a clear error.
 */
export function DangerZone() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await (supabase.rpc as any)("export_my_data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orlandos-oasis-data-export-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded", variant: "success" });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err?.message ?? "Try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await (supabase.rpc as any)("delete_my_account");
      if (error) throw error;
      await logout();
      toast({
        title: "Account deleted",
        description: "Your data has been removed. We're sorry to see you go.",
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({
        title: "Could not delete account",
        description: err?.message ?? "Try again or contact support.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <section aria-label="Account actions" className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
      {/* Export */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">Export my data</p>
          <p className="text-sm text-muted-foreground">
            Download a JSON file with your profile, services, pools, messages, and reviews.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 sm:shrink-0"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? "Preparing..." : "Download"}
        </Button>
      </div>

      {/* Delete */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">Delete my account</p>
          <p className="text-sm text-muted-foreground">
            Permanently remove your account and all associated data.
            {user?.role === "admin"
              ? " Admins must be deleted by another admin."
              : " Active bookings will be cancelled."}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setDeleteOpen(true)}
          disabled={user?.role === "admin"}
          className="gap-2 sm:shrink-0 bg-transparent hover:bg-transparent text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </Button>
      </div>


      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setConfirmText(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your profile, anonymizes your messages, and cancels
              any scheduled services. You won't be able to recover this account.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 pt-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete my account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default DangerZone;
