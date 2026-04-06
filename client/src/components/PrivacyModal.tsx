import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "waiz_privacy_accepted_v1";

export default function PrivacyModal({ onAccept }: { onAccept?: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setOpen(true);
    } catch (e) {
      setOpen(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    setOpen(false);
    onAccept?.();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Privacy & Terms</DialogTitle>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="text-foreground">Welcome to Waiz. Before continuing, please review and accept our Privacy Policy and Terms of Service. We respect your privacy and explain below how we collect and use data.</p>

          <section>
            <h4 className="font-semibold text-foreground">What we collect</h4>
            <ul className="list-disc pl-5">
              <li>Account details (name, email) when you sign up.</li>
              <li>Listings and transaction data to match households and junkshops.</li>
              <li>Location data you provide to improve pickup routing (optional).</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-foreground">How we use it</h4>
            <p>We use data to operate the marketplace, enable communications, calculate fair pricing, and provide analytics to authorized local partners. We do not sell personal data.</p>
          </section>

          <section>
            <h4 className="font-semibold text-foreground">Cookies & analytics</h4>
            <p>We use cookies and lightweight analytics to improve the product. No personally-identifying data is sold or shared with third parties for advertising.</p>
          </section>

          <section>
            <h4 className="font-semibold text-foreground">Your choices</h4>
            <p>You can delete your account or request data export by contacting us at hello@waiz.example. Some features require an account and contact details.</p>
          </section>

          <section>
            <h4 className="font-semibold text-foreground">Contact</h4>
            <p>If you have questions, email hello@waiz.example.</p>
          </section>
        </div>

        <DialogFooter>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { window.location.href = '/privacy'; }}>Read Full Policy</Button>
            <Button onClick={accept} variant="gold">I Accept</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
