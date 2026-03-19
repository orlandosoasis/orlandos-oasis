import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Plus, Trash2, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import ManageMembershipModal from "@/components/ManageMembershipModal";

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
}

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { booking } = useBooking();
  const [cards, setCards] = useState<SavedCard[]>([
    { id: "card-1", last4: "4242", brand: "Visa", expiry: "12/27" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvc: "" });
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const isMonthly = booking?.frequency === "monthly";
  const d = booking?.scheduleData?.selectedDate || new Date();
  const planName = booking?.selectedPass?.label || booking?.selectedPlan?.label || "Pool Care Membership";

  const getNextDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };
  const nextDateStr = getNextDate();

  const handleRemove = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    toast({ title: "Card removed.", variant: "success" });
  };

  const handleAdd = () => {
    if (!newCard.number || !newCard.expiry) return;
    setCards([...cards, { id: `card-${Date.now()}`, last4: newCard.number.slice(-4), brand: "Card", expiry: newCard.expiry }]);
    setNewCard({ number: "", expiry: "", cvc: "" });
    setShowAdd(false);
    toast({ title: "Card added.", variant: "success" });
  };

  const handleCancelled = () => {
    setCancelled(true);
    toast({
      title: "Membership cancelled successfully",
      description: "Your recurring service will no longer renew.",
    });
  };

  return (
    <>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Payment & Membership</h1>

        {/* Payment Methods */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-foreground">Payment Methods</h2>
          <div className="space-y-3">
            {cards.map(card => (
              <div key={card.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">{card.brand} •••• {card.last4}</p>
                    <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(card.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {showAdd ? (
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="4242 4242 4242 4242" value={newCard.number} onChange={e => setNewCard({ ...newCard, number: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" value={newCard.expiry} onChange={e => setNewCard({ ...newCard, expiry: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" value={newCard.cvc} onChange={e => setNewCard({ ...newCard, cvc: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd}>Add Card</Button>
                  <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2 hover:bg-primary hover:text-primary-foreground hover:border-transparent" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add New Card
              </Button>
            )}
          </div>
        </section>

        <Separator />

        {/* Membership Section */}
        <section className="space-y-4">
          <h2 className="text-[17px] font-bold text-foreground">Membership</h2>

          {isMonthly ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 space-y-3">
                <h3 className="text-[15px] font-semibold text-foreground">Membership Status</h3>

                {cancelled && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm">
                    <p className="font-medium text-destructive">Your membership has been cancelled.</p>
                    <p className="text-destructive/80 mt-1">No future recurring services will be scheduled.</p>
                  </div>
                )}

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium text-foreground">{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${cancelled ? "text-destructive" : "text-primary"}`}>
                      {cancelled ? "Cancelled" : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span className="font-medium text-foreground">Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Billing Date</span>
                    <span className="font-medium text-foreground">{cancelled ? "—" : nextDateStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-renew</span>
                    <span className="font-medium text-foreground">{cancelled ? "No" : "Yes"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-6 space-y-3">
                <h3 className="text-[15px] font-semibold text-foreground">Recurring Schedule</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium text-foreground">Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Service Date</span>
                    <span className="font-medium text-foreground">{cancelled ? "None scheduled" : nextDateStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-renew</span>
                    <span className="font-medium text-foreground">{cancelled ? "No" : "Yes"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-6">
                <Button className="w-full" disabled={cancelled} onClick={() => setManageOpen(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {cancelled ? "Membership Cancelled" : "Manage Plan"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active membership found.</p>
    </div>
          )}
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      <ManageMembershipModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        nextServiceDate={nextDateStr}
        onCancelled={handleCancelled}
      />
    </>
  );
};

export default PaymentMethods;
