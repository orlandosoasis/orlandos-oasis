import { useState } from "react";
import { Clock, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
"@/components/ui/dialog";

interface PassOption {
  id: string;
  hours: number;
  label: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  percentOff: number;
  isMostPopular: boolean;
}

interface Step4Props {
  selectedPass: PassOption;
  timeLeft: {minutes: number;seconds: number;};
  email: string;
  onChangePass: (passId: string) => void;
  passOptions: PassOption[];
  onContinue: () => void;
}

type PaymentMethod = "card" | "paypal" | "gpay" | null;

const Step4Checkout = ({ selectedPass, timeLeft, email, onChangePass, passOptions, onContinue }: Step4Props) => {
  const [editOpen, setEditOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Congrats Banner */}
      <div className="bg-primary rounded-2xl py-5 px-6 text-center">
        <p className="text-[15px] font-bold text-primary-foreground leading-relaxed">
          Congratulations, you reserved one of our last<br />remaining discount pool services for…
        </p>
      </div>

      {/* Deal Row */}
      <div className="bg-muted rounded-xl py-3.5 px-5 text-center">
        <p className="text-base font-bold text-foreground">
          {selectedPass.label} for ${selectedPass.discountPrice} – {selectedPass.percentOff}% off!
        </p>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.8} />
        <p className="text-sm text-muted-foreground">
          We'll hold it for you for the next
        </p>
        <span className="text-sm font-bold text-foreground tabular-nums ml-0.5">
          {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>

      {/* Payment Method */}
      <h3 className="text-lg font-bold text-foreground px-1">Payment Method</h3>

      {/* Google Pay */}
      <button
        type="button"
        onClick={() => setPaymentMethod("gpay")}
        className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-colors font-medium text-[15px] ${
        paymentMethod === "gpay" ?
        "border-primary bg-foreground text-background" :
        "border-border bg-foreground text-background hover:opacity-90"}`
        }>
        
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
        </svg>
        <span className="font-semibold">Pay</span>
      </button>

      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">Or pay with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {/* Credit/Debit Card */}
        <div className={`border-b border-border ${paymentMethod === "card" ? "bg-muted/30" : ""}`}>
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className="w-full flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-muted/30">
            
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            paymentMethod === "card" ? "border-foreground" : "border-muted-foreground/40"}`
            }>
              {paymentMethod === "card" &&
              <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
              }
            </div>
            <span className="text-[15px] font-medium text-foreground flex-1 text-left">Use credit or debit card</span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className="text-[11px] font-extrabold italic text-[#1a1f71]">VISA</span>
              <div className="w-7 h-[18px] bg-gradient-to-br from-[#eb001b] to-[#f79e1b] rounded-[3px]" />
              <span className="text-[10px] font-bold text-muted-foreground">AMEX</span>
            </div>
          </button>
          {paymentMethod === "card" &&
          <div className="px-5 pb-4 space-y-3 animate-fade-in">
              <Input
              placeholder="Credit Card Number"
              className="h-12 rounded-lg border-border bg-background text-sm" />
            
              <div className="flex gap-3">
                <Input
                placeholder="Expiration"
                className="h-12 rounded-lg border-border bg-background text-sm flex-1" />
              
                <div className="relative flex-1">
                  <Input
                  placeholder="CVC"
                  className="h-12 rounded-lg border-border bg-background text-sm pr-10" />
                
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          }
        </div>

        {/* PayPal */}
        <div className={`${paymentMethod === "paypal" ? "bg-muted/30" : ""}`}>
          <button
            type="button"
            onClick={() => setPaymentMethod("paypal")}
            className="w-full flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-muted/30">
            
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            paymentMethod === "paypal" ? "border-foreground" : "border-muted-foreground/40"}`
            }>
              {paymentMethod === "paypal" &&
              <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
              }
            </div>
            <span className="text-[15px] font-medium text-foreground flex-1 text-left">Use PayPal account</span>
            <span className="text-[15px] font-extrabold">
              <span className="text-[#003087]">Pay</span>
              <span className="text-[#009cde]">Pal</span>
            </span>
          </button>
          {paymentMethod === "paypal" &&
          <div className="px-5 pb-4 animate-fade-in">
              <button
              type="button"
              className="w-full h-12 rounded-lg font-bold text-[16px] text-[#003087] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFC439" }}>
              
                <span className="text-[#003087]">Pay</span>
                <span className="text-[#009cde]">Pal</span>
              </button>
            </div>
          }
        </div>
      </div>

      {/* Email */}
      <div className="border border-border rounded-xl px-5 py-3.5">
        <p className="text-[11px] text-muted-foreground mb-1">Email to deliver confirmation to:</p>
        <p className="text-sm font-medium text-muted-foreground">{email || "Enter your email address"}</p>
      </div>

      {/* Legal */}
      <h3 className="text-base font-bold text-foreground px-1">From our Legal Team</h3>
      <div className="flex flex-col gap-3 px-1">
        {[
        <>By continuing, you agree to our <a href="#" className="text-primary hover:underline">Privacy Policy</a> and <a href="#" className="text-primary hover:underline">Terms &amp; Conditions</a>, which includes an arbitration agreement.</>,
        <>By redeeming your voucher, you agree to enroll in Orlando's Oasis membership, and be charged $59/mo (taxes may apply) until you cancel.</>,
        <>Cancel anytime online in your "Account Settings" or by <a href="#" className="text-primary hover:underline">submitting a help ticket</a>.</>,
        <>Canceling within the first 6-months will result in an <a href="#" className="text-primary hover:underline">early termination fee</a> calculated based on the <a href="#" className="text-primary hover:underline">full price of your first pool service</a>.</>,
        <>More information about autorenewal and cancelation terms, click <a href="#" className="text-primary hover:underline">here</a>.</>].
        map((text, i) =>
        <div key={i} className="flex gap-3 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-2" />
            <p className="text-[13px] text-muted-foreground leading-relaxed">{text}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <Button
        disabled={!paymentMethod}
        onClick={onContinue}
        className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg">
        
        Purchase &amp; schedule
      </Button>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Summary Bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest mb-0.5">You're Getting</p>
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-bold text-foreground">{selectedPass.label}</p>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors">
              
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground line-through">${selectedPass.originalPrice}</p>
          <p className="text-[22px] font-extrabold text-foreground">${selectedPass.discountPrice}</p>
          <p className="text-[11px] font-bold text-primary tracking-wide">{selectedPass.percentOff}% OFF</p>
        </div>
      </div>

      {/* Edit Package Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Change Package</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Select your preferred service package</DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedPass.id}
            onValueChange={(val) => {
              onChangePass(val);
              setEditOpen(false);
            }}
            className="space-y-3 mt-2">
            
            {passOptions.map((pass) =>
            <label
              key={pass.id}
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedPass.id === pass.id ?
              "border-foreground bg-background shadow-sm" :
              "border-border bg-background hover:border-muted-foreground"}`
              }>
              
                {pass.isMostPopular &&
              <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </Badge>
              }
                <RadioGroupItem
                value={pass.id}
                className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground" />
              
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-[15px]">{pass.label}</p>
                  <p className="text-sm text-muted-foreground">{pass.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-muted-foreground">
                    <span className="line-through">${pass.originalPrice}</span>{" "}
                    <span className="text-lg font-bold text-foreground">${pass.discountPrice}</span>
                    <span className="text-foreground">*</span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {pass.percentOff}% OFF
                  </p>
                </div>
              </label>
            )}
          </RadioGroup>
          <p className="text-xs text-muted-foreground text-center px-2 mt-1">
            *Vouchers cover the full price of your first pool service. Don't worry - your technician will be paid in full!
          </p>
        </DialogContent>
      </Dialog>
    </div>);

};

export default Step4Checkout;