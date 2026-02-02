import { useState } from "react";
import { Link } from "react-router-dom";
import { Waves, Calendar, ChevronRight, User, Clock, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Mock appointment data
const MOCK_UPCOMING = [
  {
    id: "apt-1",
    title: "Pool Cleaning",
    duration: "2 hours",
    date: "Feb 10, 2026",
    day: "Tuesday",
    arrivalWindow: "1:00 PM – 3:00 PM",
    address: "123 Palm Drive, Orlando",
    tech: {
      name: "Carlos M.",
      rating: 4.9,
      avatar: null,
    },
    status: "scheduled",
  },
  {
    id: "apt-2",
    title: "Chemical Balance",
    duration: "1 hour",
    date: "Feb 17, 2026",
    day: "Tuesday",
    arrivalWindow: "10:00 AM – 11:00 AM",
    address: "123 Palm Drive, Orlando",
    tech: {
      name: "Carlos M.",
      rating: 4.9,
      avatar: null,
    },
    status: "scheduled",
  },
];

const MOCK_PAST = [
  {
    id: "apt-3",
    title: "Pool Cleaning",
    duration: "2 hours",
    date: "Feb 3, 2026",
    day: "Monday",
    tech: {
      name: "Carlos M.",
      rating: 4.9,
    },
    status: "completed",
    hasReview: false,
  },
  {
    id: "apt-4",
    title: "Deep Clean + Filter",
    duration: "3 hours",
    date: "Jan 27, 2026",
    day: "Monday",
    tech: {
      name: "Maria S.",
      rating: 4.8,
    },
    status: "completed",
    hasReview: true,
  },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showCancelled, setShowCancelled] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-navy">Orlando's Oasis</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button size="sm" className="font-semibold">
                <Calendar className="h-4 w-4 mr-2" />
                Book
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">{user?.fullName}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Upcoming Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Services</h2>
          <div className="space-y-4">
            {MOCK_UPCOMING.map((apt) => (
              <Link
                key={apt.id}
                to={`/appointments/${apt.id}`}
                className="block bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{apt.title}</span>
                      <span className="text-sm text-muted-foreground">• {apt.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {apt.day}, {apt.date}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Expected arrival {apt.arrivalWindow}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{apt.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-8 w-8 rounded-full bg-oasis-teal/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-oasis-teal" />
                      </div>
                      <span className="text-sm font-medium">{apt.tech.name}</span>
                      <span className="text-sm text-muted-foreground">★ {apt.tech.rating}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Past Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Past Services</h2>
            <button
              onClick={() => setShowCancelled(!showCancelled)}
              className="text-sm text-primary hover:underline"
            >
              {showCancelled ? "Hide cancelled" : "Show cancelled"}
            </button>
          </div>
          <div className="space-y-4">
            {MOCK_PAST.map((apt) => (
              <div
                key={apt.id}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{apt.title}</span>
                      <span className="text-sm text-muted-foreground">• {apt.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {apt.day}, {apt.date}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-oasis-teal/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-oasis-teal" />
                      </div>
                      <span className="text-sm font-medium">{apt.tech.name}</span>
                      <span className="text-sm text-muted-foreground">★ {apt.tech.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!apt.hasReview && (
                      <Button size="sm" variant="outline">
                        Leave a tip
                      </Button>
                    )}
                    <Link to={`/appointments/${apt.id}`}>
                      <Button size="sm" variant="ghost">
                        See details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-center text-sm text-primary hover:underline">
            Load more
          </button>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
