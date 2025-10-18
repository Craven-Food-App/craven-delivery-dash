import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RestaurantGrid from "@/components/RestaurantGrid";
import Footer from "@/components/Footer";
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

  // JSON-LD Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "Crave'N",
    "description": "Food delivery from local restaurants",
    "url": "https://craven.app",
    "logo": "https://craven.app/craven-logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "servesCuisine": ["American", "Italian", "Chinese", "Mexican", "Indian", "Japanese", "Thai"],
    "priceRange": "$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "2500"
    }
  };

  return (
    <>
      <Helmet>
        <title>Crave'N - Membership | Zero Delivery Fees & Exclusive Benefits</title>
        <meta name="description" content="Join our membership for $8.99/month and enjoy zero delivery fees, priority support, and exclusive perks. Limited lifetime memberships available for $249." />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <Hero />
        <Footer />
      </div>
    </>
  );
};

export default Index;
