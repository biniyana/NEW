import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rateList = [
  { material: "White Paper (used)", price: "₱8.00 per kilo", icon: "📄", category: "Paper" },
  { material: "Cartons (Corrugated/Brown)", price: "₱2.50 per kilo", icon: "📦", category: "Paper" },
  { material: "Assorted/Mixed Paper", price: "₱1.50 per kilo", icon: "📰", category: "Paper" },
  { material: "Newspaper", price: "₱4.00 per kilo", icon: "📰", category: "Paper" },
  { material: "PET Bottle (Clean)", price: "₱16.00 per kilo", icon: "🍾", category: "Plastic" },
  { material: "PET Bottle (Unclean)", price: "₱12.00 per kilo", icon: "🍾", category: "Plastic" },
  { material: "Aluminum Cans", price: "₱50.00 per kilo", icon: "🥫", category: "Metal" },
  { material: "Plastic HDPE", price: "₱10.00 per kilo", icon: "♻️", category: "Plastic" },
  { material: "Plastic LDPE", price: "₱5.00 per kilo", icon: "♻️", category: "Plastic" },
  { material: "Copper Wire (Class A)", price: "₱300.00 per kilo", icon: "🔌", category: "Metal" },
  { material: "Copper Wire (Class B)", price: "₱250.00 per kilo", icon: "🔌", category: "Metal" },
  { material: "Steel/Iron Alloys", price: "₱9.00 per kilo", icon: "⚙️", category: "Metal" },
  { material: "Stainless Steel", price: "₱60.00 per kilo", icon: "⚙️", category: "Metal" },
  { material: "Tin Can (Lata)", price: "₱7.00 per kilo", icon: "🥫", category: "Metal" },
  { material: "Glass Cullets", price: "₱1.00 per kilo", icon: "🍷", category: "Glass" },
  { material: "Old Diskette", price: "₱8.00 each", icon: "💿", category: "Electronics" },
  { material: "Ink Jet Cartridge", price: "₱100-300 each", icon: "🖨️", category: "Electronics" },
  { material: "Car Battery", price: "₱100.00 each", icon: "🔋", category: "Hazardous" },
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
