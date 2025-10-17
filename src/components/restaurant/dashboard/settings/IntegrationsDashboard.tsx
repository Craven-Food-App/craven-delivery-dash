import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const IntegrationsDashboard = () => {
  const integrations = [
    // POS Systems
    { name: "Checkmate", category: "Point of sale (POS) system", featured: false },
    { name: "Olo", category: "Point of sale (POS) system", featured: false },
    { name: "Square", category: "Point of sale (POS) system", featured: false },
    { name: "Chowly", category: "Point of sale (POS) system", featured: false },
    { name: "Cliq", category: "Point of sale (POS) system", featured: false },
    { name: "QUICK/fOHo", category: "Point of sale (POS) system", featured: false },
    { name: "Bbot", category: "Point of sale (POS) system", featured: false },
    { name: "Revel", category: "Point of sale (POS) system", featured: false },
    { name: "Lavu", category: "Point of sale (POS) system", featured: false },
    { name: "Deliverect", category: "Point of sale (POS) system", featured: false },
    { name: "GoLive", category: "Point of sale (POS) system", featured: false },
    { name: "Restaurant Revolution", category: "Point of sale (POS) system", featured: false },
    { name: "Freshtxt", category: "Point of sale (POS) system", featured: false },
    { name: "Tabit", category: "Point of sale (POS) system", featured: false },
    { name: "Zytle", category: "Point of sale (POS) system", featured: false },
    { name: "Toast", category: "Point of sale (POS) system", featured: false },
    { name: "Crave'N for WooCommerce", category: "Point of sale (POS) system", featured: false },
    { name: "NCR", category: "Point of sale (POS) system", featured: false },
    { name: "Ordermark", category: "Point of sale (POS) system", featured: false },
    { name: "HungerRush", category: "Point of sale (POS) system", featured: false },
    { name: "Grover PointXCentral", category: "Point of sale (POS) system", featured: false },
    { name: "GloriaFood", category: "Point of sale (POS) system", featured: false },
    { name: "Omnivore", category: "Point of sale (POS) system", featured: false },
    { name: "TASK - Task", category: "Point of sale (POS) system", featured: false },
    { name: "Zelensea", category: "Point of sale (POS) system", featured: false },
    { name: "HotSchedules", category: "Point of sale (POS) system", featured: false },
    { name: "Lightspeed", category: "Point of sale (POS) system", featured: false },
    { name: "Deliveroo", category: "Point of sale (POS) system", featured: false },
    { name: "Chive", category: "Point of sale (POS) system", featured: false },
    { name: "Ordereze", category: "Point of sale (POS) system", featured: false },
    { name: "ItsaCheckmate", category: "Point of sale (POS) system", featured: false },
    { name: "Toobit", category: "Point of sale (POS) system", featured: false },
    { name: "FoodsHub", category: "Point of sale (POS) system", featured: false },
    { name: "Pax", category: "Point of sale (POS) system", featured: false },
    { name: "Micros", category: "Point of sale (POS) system", featured: false },
    { name: "Retsol", category: "Point of sale (POS) system", featured: false },
    { name: "Qu", category: "Point of sale (POS) system", featured: false },
    { name: "SYNQOS", category: "Point of sale (POS) system", featured: false },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect the apps and software that streamline the operations of your business.
        </p>
      </div>

      {/* POS Systems Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Point of sale (POS) system</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Crave'N users who use a POS integration point-of-sale solution, seamlessly send orders directly to your current experience and leveraging integrations.
        </p>

        {/* Featured Integration */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Receive orders directly on your point of sale</h4>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Point of sale integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Seamlessly accept and manage orders from multiple channels.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Get started</Button>
                  <Button variant="link">
                    Learn more
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <span className="text-lg">{integration.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{integration.name}</h4>
                      <p className="text-xs text-muted-foreground">{integration.category}</p>
                    </div>
                  </div>
                  <Button variant="link" size="sm">
                    Learn more
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsDashboard;
