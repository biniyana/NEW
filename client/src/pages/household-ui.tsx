import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Recycle, PickaxeIcon, Leaf, Zap, Package, MessageCircle, Settings, Menu, X } from "lucide-react";
import { User as UserType } from "@shared/schema";

interface CategoryCard {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  items: string[];
}

interface NavigationItem {
  label: string;
  action: () => void;
}

export default function HouseholdUI({ currentUser, onNavigate }: { currentUser: UserType; onNavigate: (section: string) => void }) {
  const [activeSection, setActiveSection] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories: CategoryCard[] = [
    {
      id: "plastic",
      name: "Plastic & Bottles",
      icon: <Recycle className="w-12 h-12" />,
      color: "from-blue-500 to-blue-600",
      description: "PET bottles, plastic bags, containers",
      items: ["Water bottles", "Plastic bags", "Food containers", "Plastic wrap"],
    },
    {
      id: "cardboard",
      name: "Cardboard & Paper",
      icon: <Package className="w-12 h-12" />,
      color: "from-amber-500 to-amber-600",
      description: "Boxes, paper, cardboard sheets",
      items: ["Cardboard boxes", "Newspaper", "Magazines", "Paper bags"],
    },
    {
      id: "metal",
      name: "Metals & Cans",
      icon: <Zap className="w-12 h-12" />,
      color: "from-gray-500 to-gray-600",
      description: "Aluminum, steel, copper, iron",
      items: ["Aluminum cans", "Tin cans", "Copper wire", "Steel scrap"],
    },
    {
      id: "glass",
      name: "Glass & Jars",
      icon: <Leaf className="w-12 h-12" />,
      color: "from-green-500 to-green-600",
      description: "Glass bottles and jars",
      items: ["Glass bottles", "Mason jars", "Glass containers", "Drinking glasses"],
    },
  ];

  const navigationItems: NavigationItem[] = [
    { label: "Sell Items", action: () => handleNavigate("sell") },
    { label: "Schedule Pickup", action: () => handleNavigate("pickup") },
    { label: "Learn", action: () => handleNavigate("learn") },
    { label: "Profile", action: () => handleNavigate("profile") },
  ];

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  // Home/Browse Section
  const renderHome = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Turn Your Waste Into Value
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Easily sell your recyclables and contribute to a sustainable environment. Quick, convenient, and rewarding.
        </p>
        <Button 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 px-8 rounded-full"
          onClick={() => handleNavigate("sell")}
        >
          Start Selling Now
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      {/* How It Works */}
      <section className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Sort & Prepare", description: "Gather your recyclables and sort them by category" },
            { step: "2", title: "Schedule Pickup", description: "Choose a convenient time for collection" },
            { step: "3", title: "Get Paid", description: "Receive instant payment for your materials" },
          ].map((item) => (
            <Card key={item.step} className="border-2 border-slate-100 hover:border-emerald-300 transition-colors">
              <CardContent className="pt-8">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 text-emerald-700 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">What We Buy</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleNavigate("sell")}
            >
              <CardHeader className={`bg-gradient-to-r ${category.color} text-white p-6`}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription className="text-emerald-50 mt-1">{category.description}</CardDescription>
                  </div>
                  <div className="text-white opacity-80 group-hover:opacity-100 transition-opacity">
                    {category.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { label: "Items Sold", value: "2,345", icon: "📦" },
          { label: "Users", value: "1,200+", icon: "👥" },
          { label: "Eco Impact", value: "50 Tons", icon: "♻️" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-50">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600 mt-2">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );

  // Sell Items Section
  const renderSell = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-900">Sell Your Recyclables</h2>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">Select what you want to sell:</p>
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover:bg-emerald-50 border-2 hover:border-emerald-300"
              >
                <div className="text-2xl mr-3">{category.icon}</div>
                <div>
                  <div className="font-semibold text-slate-900">{category.name}</div>
                  <div className="text-xs text-slate-500">{category.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Item Details Form</CardTitle>
          <CardDescription>Fill in the details of your recyclable items</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">📝 Coming Soon</p>
            <p>Detailed item entry form will be integrated here with image upload and weight estimation.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Schedule Pickup Section
  const renderPickup = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-900">Schedule Pickup</h2>
      
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Select Pickup Date & Time</CardTitle>
          <CardDescription>Choose when our team should collect your items</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-semibold mb-1">📅 Coming Soon</p>
            <p>Calendar picker and time slot selection will be available here with real-time availability.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Learn Section
  const renderLearn = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-900">Learn About Recycling</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            title: "Why Recycle?",
            description: "Learn about the environmental impact of recycling and how you contribute to sustainability.",
            icon: "🌍",
          },
          {
            title: "Types of Materials",
            description: "Understand different recyclable materials and their proper preparation.",
            icon: "♻️",
          },
          {
            title: "Market Prices",
            description: "Check current market rates for different recyclable materials.",
            icon: "💰",
          },
          {
            title: "Tips & Tricks",
            description: "Get helpful tips on sorting, storing, and preparing your recyclables.",
            icon: "💡",
          },
        ].map((item) => (
          <Card key={item.title} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-8">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{item.description}</p>
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 p-0">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-900">My Profile</h2>
      
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{currentUser.name}</CardTitle>
              <CardDescription className="mt-2">{currentUser.email}</CardDescription>
            </div>
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Sold</p>
                <p className="text-2xl font-bold text-slate-900">₱4,250</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Items Listed</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Pickups</p>
                <p className="text-2xl font-bold text-slate-900">3</p>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <Button variant="outline" className="w-full border-2 h-11">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "sell":
        return renderSell();
      case "pickup":
        return renderPickup();
      case "learn":
        return renderLearn();
      case "profile":
        return renderProfile();
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Recycle className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-lg text-slate-900">Waiz</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.label.toLowerCase().split(" ")[0]
                      ? "text-emerald-600 border-b-2 border-emerald-600 pb-4"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Profile & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-5 h-5 text-slate-600" />
                </Button>
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-900" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-900" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">About Waiz</h3>
              <p className="text-slate-400 text-sm">Making recycling easy and rewarding for everyone.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <p className="text-slate-400 text-sm">support@waiz.ph</p>
              <p className="text-slate-400 text-sm">+63 (0) 2 1234 5678</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Waiz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
