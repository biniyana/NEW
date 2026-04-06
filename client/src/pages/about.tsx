import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, DollarSign, MessageSquare, Calendar, Star } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h2 className="text-4xl font-bold mb-6 text-foreground">About Waiz</h2>

        <Card className="mb-8">
          <CardContent className="p-8">
            <p className="text-base mb-4 text-foreground">
              Waiz is an innovative eco-marketplace designed specifically for Baguio City. We bridge the gap between households and junkshops, making recycling easier and more accessible for everyone.
            </p>
            <p className="text-base mb-4 text-foreground">
              Our platform enables households to connect with local junkshops for the collection and sale of recyclable materials. Whether you're a household looking to responsibly dispose of recyclables or a junkshop seeking new sources of materials, Waiz makes the process seamless.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Key Features</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-foreground">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Location-based matching with junkshops in Baguio</span>
              </li>
              <li className="flex items-start gap-3 text-foreground">
                <DollarSign className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Transparent rate lists for all recyclable materials</span>
              </li>
              <li className="flex items-start gap-3 text-foreground">
                <MessageSquare className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Direct messaging between households and junkshops</span>
              </li>
              <li className="flex items-start gap-3 text-foreground">
                <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Easy collection request scheduling</span>
              </li>
              <li className="flex items-start gap-3 text-foreground">
                <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span>Trust and quality assurances</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/signup">
            <Button size="lg" data-testid="button-join-now">Join Waiz Today</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
