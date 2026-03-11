import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CancelMembershipModal from "./CancelMembershipModal";

interface ManageMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextServiceDate: string;
  onCancelled: () => void;
}

const ManageMembershipModal = ({ open, onOpenChange, nextServiceDate, onCancelled }: ManageMembershipModalProps) => {
  const { toast } = useToast();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleSaveCard = () => {
    setShowPaymentForm(false);
    setCardNumber("");
    setExpDate("");
    setCvc("");
    toast({ title: "Payment method updated", description: "Your billing information has been saved." });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[520px] max-h-[85vh] overflow-y-auto pt-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manage Membership</DialogTitle>
            <DialogDescription>Update your membership billing or cancel your plan.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Billing */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Billing</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> Visa •••• 1234
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium text-foreground">Monthly</span>
                </div>
              </div>

              {!showPaymentForm ? (
                <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground hover:border-transparent" onClick={() => setShowPaymentForm(true)}>
                  Update Payment Method
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Card Number</Label>
                    <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Expiration Date</Label>
                      <Input placeholder="MM / YY" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">CVC</Label>
                      <Input placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleSaveCard}>Save Card</Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Cancel Membership */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Cancel Membership</h3>
              <p className="text-sm text-muted-foreground">Cancel your membership and stop future recurring cleanings.</p>
              <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent" onClick={() => setShowCancelModal(true)}>
                Cancel Membership
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CancelMembershipModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={() => {
          setShowCancelModal(false);
          onOpenChange(false);
          onCancelled();
        }}
      />
    </>
  );
};

export default ManageMembershipModal;
