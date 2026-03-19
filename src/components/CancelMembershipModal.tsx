import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CancelMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  nextServiceDate?: string;
}

const CancelMembershipModal = ({ open, onOpenChange, onConfirm, nextServiceDate }: CancelMembershipModalProps) => {
  const { toast } = useToast();

  const handleConfirm = () => {
    toast({ title: "Membership cancelled", description: "Your recurring pool service has been cancelled." });
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] pt-10">
        <DialogHeader>
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mx-auto mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Cancel your membership?</DialogTitle>
          <DialogDescription className="text-center">
            You will no longer receive scheduled pool services after your current billing period ends.
          </DialogDescription>
        </DialogHeader>

        {nextServiceDate && (
          <div className="space-y-1.5 text-sm text-center mt-2">
            <p className="text-muted-foreground">
              Your plan will remain active until <span className="font-medium text-foreground">{nextServiceDate}</span>.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Keep My Plan
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
            onClick={handleConfirm}
          >
            Yes, Cancel Membership
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelMembershipModal;
