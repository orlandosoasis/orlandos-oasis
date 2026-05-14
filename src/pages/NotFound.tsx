import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Stays as console.error until error tracking is wired up.
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page not found — Orlando's Oasis";
  }, [location.pathname]);

  return (
    <main
      role="main"
      aria-labelledby="not-found-heading"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-50 px-4"
    >
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-sky-100 p-4">
            <Compass className="h-12 w-12 text-sky-600" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wider text-sky-600">
            404 · Off the deep end
          </p>
          <h1 id="not-found-heading" className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            We can't find that page
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            The link might be broken, or the page may have moved. Let's get you back to dry land.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Contact support</Link>
          </Button>
        </div>
        <p className="pt-4 text-xs text-slate-500">
          Quick links:{" "}
          <Link to="/services" className="underline hover:text-sky-700">
            Services
          </Link>{" "}
          ·{" "}
          <Link to="/about" className="underline hover:text-sky-700">
            About
          </Link>{" "}
          ·{" "}
          <Link to="/help" className="underline hover:text-sky-700">
            Help Center
          </Link>
        </p>
      </div>
    </main>
  );
};

export default NotFound;
