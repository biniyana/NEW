import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Store, MessageCircle } from "lucide-react"; // Removed Recycle import

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Logo replaced with custom image */}
              <div className="flex items-center justify-center">
  <img src="/waiz logo.png" alt="Waiz Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">WAIZ</h1>
                <p className="text-xs text-muted-foreground">Eco Marketplace for Baguio</p>
              </div>
            </div>
            <nav className="flex gap-4 items-center">
              <Link href="/about">
                <Button variant="ghost" data-testid="link-about">About</Button>
              </Link>
              <Link href="/login">
                <Button data-testid="button-login">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Connect. Recycle. Sustain.
          </h2>
          <p className="text-lg md:text-xl mb-10 text-muted-foreground max-w-2xl mx-auto">
            Bridging households and junkshops in Baguio for a greener tomorrow
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="px-8" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="px-8" data-testid="button-learn-more">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
            How Waiz Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate" data-testid="card-feature-household">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Home className="w-12 h-12 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-3 text-foreground">For Households</h4>
                <p className="text-muted-foreground">
                  List your recyclables and connect with nearby junkshops for easy pickup
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-junkshop">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Store className="w-12 h-12 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-3 text-foreground">For Junkshops</h4>
                <p className="text-muted-foreground">
                  Discover recyclable materials from households in Baguio and manage collections
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-communication">
              <CardContent className="p-6">
                <div className="mb-4">
                  <MessageCircle className="w-12 h-12 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-3 text-foreground">Direct Communication</h4>
                <p className="text-muted-foreground">
                  Chat directly with households or junkshops to arrange collections and sales
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}