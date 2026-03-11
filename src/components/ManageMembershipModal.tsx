import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, CreditCard, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CancelMembershipModal from "./CancelMembershipModal";

interface ManageMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextServiceDate: string;
  currentFrequency: string;
}

const ManageMembershipModal = ({ open, onOpenChange, nextServiceDate, currentFrequency }: ManageMembershipModalProps) => {
  const { toast } = useToast();
  const [frequency, setFrequency] = useState(currentFrequency);
  const [showFrequencySelector, setShowFrequencySelector] = useState(false);
  const [pauseStart, setPauseStart] = useState<Date>();
  const [pauseEnd, setPauseEnd] = useState<Date>();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleUpdateSchedule = () => {
    setShowFrequencySelector(false);
    toast({ title: "Schedule updated successfully", description: "Your recurring service schedule has been updated." });
  };

  const handlePauseMembership = () => {
    if (!pauseStart || !pauseEnd) return;
    toast({ title: "Membership paused", description: `Recurring services paused until ${format(pauseEnd, "PPP")}.` });
    setPauseStart(undefined);
    setPauseEnd(undefined);
  };

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
            <DialogDescription>Update your recurring pool service schedule or membership settings.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Section A: Service Schedule */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Service Schedule</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium text-foreground capitalize">{frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Service Date</span>
                  <span className="font-medium text-foreground">{nextServiceDate}</span>
                </div>
              </div>

              {!showFrequencySelector ? (
                <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground hover:border-transparent" onClick={() => setShowFrequencySelector(true)}>
                  Change Frequency
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
                  <Label className="text-sm font-medium">Select Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleUpdateSchedule}>Update Schedule</Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Section B: Pause Membership */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Pause Membership</h3>
              <p className="text-sm text-muted-foreground">Temporarily stop your recurring service.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Pause Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal", !pauseStart && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {pauseStart ? format(pauseStart, "MMM d, yyyy") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={pauseStart} onSelect={setPauseStart} disabled={(date) => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Pause End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal", !pauseEnd && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {pauseEnd ? format(pauseEnd, "MMM d, yyyy") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={pauseEnd} onSelect={setPauseEnd} disabled={(date) => date < (pauseStart || new Date())} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground hover:border-transparent" disabled={!pauseStart || !pauseEnd} onClick={handlePauseMembership}>
                Pause Membership
              </Button>
            </div>

            <Separator />

            {/* Section C: Billing */}
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

            {/* Section D: Cancel Membership */}
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

      <CancelMembershipModal open={showCancelModal} onOpenChange={setShowCancelModal} onConfirm={() => { setShowCancelModal(false); onOpenChange(false); }} />
    </>
  );
};

export default ManageMembershipModal;
