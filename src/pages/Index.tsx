import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import RestaurantGrid from "@/components/RestaurantGrid";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    const search = searchParams.get("search");
    const address = searchParams.get("address");
    
    if (search) setSearchQuery(search);
    if (address) setDeliveryAddress(address);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
        {searchQuery || deliveryAddress ? (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {searchQuery 
                ? `Searching for "${searchQuery}"` 
                : "Restaurants near you"
              }
            </h2>
            {deliveryAddress && (
              <p className="text-muted-foreground">
                Delivering to: {deliveryAddress}
              </p>
            )}
          </div>
          <RestaurantGrid searchQuery={searchQuery} deliveryAddress={deliveryAddress} />
        </div>
      ) : (
        <>
          <CategorySection />
          <RestaurantGrid />
          
          {/* Restaurant Partner Section */}
          <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Grow Your Restaurant Business
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of restaurant partners who are reaching more customers 
                  and increasing their revenue with Crave'n's delivery platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => window.location.href = '/restaurant/auth'}
                    className="font-semibold"
                  >
                    Get Started Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.location.href = '/restaurant/auth'}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
