import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rateList = [
  { material: "Plastic Bottles (PET)", price: "₱3 per piece", icon: "🍾", category: "Plastic" },
  { material: "Newspapers", price: "₱8 per kilo", icon: "📰", category: "Paper" },
  { material: "Aluminum Cans", price: "₱4 per piece", icon: "🥫", category: "Metal" },
  { material: "Glass Bottles", price: "₱2 per piece", icon: "🍷", category: "Glass" },
  { material: "Cardboard", price: "₱6 per kilo", icon: "📦", category: "Paper" },
  { material: "Copper Wire", price: "₱350 per kilo", icon: "🔌", category: "Metal" },
  { material: "Steel/Iron", price: "₱15 per kilo", icon: "⚙️", category: "Metal" },
  { material: "White Paper", price: "₱12 per kilo", icon: "📄", category: "Paper" },
  { material: "Mixed Plastic", price: "₱5 per kilo", icon: "♻️", category: "Plastic" },
  { material: "Batteries", price: "₱20 per kilo", icon: "🔋", category: "Hazardous" },
];

export default function RatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">₱</span>
          <h2 className="text-3xl font-bold text-foreground">Rate List</h2>
        </div>
        <p className="text-muted-foreground">Market prices for recyclable materials in Baguio City</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">₱</span>
            Recyclable Material Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rateList.map((rate, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg hover-elevate bg-card border border-card-border"
                data-testid={`rate-${index}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{rate.icon}</div>
                  <div>
                    <p className="font-medium text-foreground">{rate.material}</p>
                    <Badge variant="secondary" className="mt-1">{rate.category}</Badge>
                  </div>
                </div>
                <p className="text-xl font-bold text-primary">{rate.price}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Prices may vary depending on quality, quantity, and market conditions. 
            Contact junkshops directly for the most accurate pricing for your specific materials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
