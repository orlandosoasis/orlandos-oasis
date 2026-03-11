import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
}

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cards, setCards] = useState<SavedCard[]>([
    { id: "card-1", last4: "4242", brand: "Visa", expiry: "12/27" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvc: "" });

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate("/account-settings")} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Payment Methods</h1>

        <div className="space-y-3 max-w-md">
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
            <Button variant="outline" className="w-full gap-2 hover:bg-primary hover:text-white hover:border-transparent" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Add New Card
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentMethods;
