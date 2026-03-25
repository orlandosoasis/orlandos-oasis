import { useNavigate, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceName = searchParams.get("service") || "Pool Service";
  const serviceDescription = searchParams.get("description") || "";

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="text-center space-y-5 px-6 max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Payment Successful</h2>
        <p className="text-muted-foreground">
          Your {serviceName} is confirmed. Schedule your first service.
        </p>
        <Button
          onClick={() =>
            navigate(
              `/dashboard?openBooking=true&serviceTitle=${encodeURIComponent(serviceName)}&serviceDescription=${encodeURIComponent(serviceDescription)}`
            )
          }
          className="mt-2 w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
        >
          Schedule a Service
        </Button>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
