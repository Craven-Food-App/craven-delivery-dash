import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import RestaurantGrid from "@/components/RestaurantGrid";
import Footer from "@/components/Footer";

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
              {searchQuery ? `Searching for "${searchQuery}"` : "Restaurants near you"}
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
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
