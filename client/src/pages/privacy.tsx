import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy & Terms</h1>
        <p className="text-muted-foreground mb-6">Last updated: February 2026</p>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="text-muted-foreground">Waiz is a local marketplace built to connect households and junkshops in Baguio. We collect only the information needed to operate the service and help the community transact recyclables safely and transparently. We do not sell personal data.</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">What we collect</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Account data: name, email, basic contact details when you sign up.</li>
              <li>Listing and transaction data: items you list, pricing and collection records.</li>
              <li>Location data you provide to arrange pickups (optional).</li>
              <li>Usage data: anonymous analytics to improve the product.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">How we use your data</h2>
            <p className="text-muted-foreground">We use data to operate the marketplace (match buyers/sellers, schedule pickups), provide customer support, and provide aggregated analytics to authorized local partners for improving waste management. We may share limited aggregated statistics but not personally-identifiable data for third-party advertising.</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Cookies & Analytics</h2>
            <p className="text-muted-foreground">We use cookies and lightweight analytics to understand product usage. These are limited to non-identifying session metrics. You may opt out by disabling cookies in your browser, but some features may not function correctly.</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Your Choices</h2>
            <p className="text-muted-foreground">You can request account deletion or a data export by contacting us at hello@waiz.example. Some data required for transaction integrity (e.g., receipts) may be retained for legal or auditing reasons.</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Terms of Service (short)</h2>
            <p className="text-muted-foreground">By using Waiz you agree to use the platform for lawful purposes and to provide accurate information. Waiz is a facilitator and does not assume liability for third-party transactions beyond providing the technical platform.</p>
          </CardContent>
        </Card>

        <div className="flex gap-3 items-center">
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <a href="mailto:hello@waiz.example">
            <Button>Contact Support</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
