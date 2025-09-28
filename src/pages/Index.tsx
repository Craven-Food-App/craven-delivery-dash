import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RestaurantGrid from "@/components/RestaurantGrid";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Utensils, Truck } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const navigate = useNavigate();

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
      <MobileBottomNav />
    </div>
  );
};

export default Index;
