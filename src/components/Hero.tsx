import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-food.jpg";

const Hero = () => {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your delivery address to continue",
        variant: "destructive",
      });
      return;
    }

    // Navigate with or without search query - address is enough
    const params = new URLSearchParams();
    params.set('address', deliveryAddress);
    if (searchQuery.trim()) {
      params.set('search', searchQuery);
    }

    navigate(`/?${params.toString()}`);
    
    toast({
      title: "Searching...",
      description: searchQuery.trim() 
        ? `Looking for "${searchQuery}" near ${deliveryAddress}`
        : `Finding restaurants near ${deliveryAddress}`,
    });
  };

  const handleCategoryClick = (category: string) => {
    setSearchQuery(category);
    if (deliveryAddress.trim()) {
      const params = new URLSearchParams();
      params.set('address', deliveryAddress);
      params.set('search', category);
      navigate(`/?${params.toString()}`);
      
      toast({
        title: "Searching...",
        description: `Looking for ${category} near ${deliveryAddress}`,
      });
    } else {
      toast({
        title: "Address Required",
        description: "Please enter your delivery address first",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[500px] bg-gradient-hero overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Delicious food spread" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 text-center text-white">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your favorite food,
            <span className="block text-primary-glow">delivered fast</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover the best restaurants near you and get your cravings delivered in minutes
          </p>

          {/* Search Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Enter your delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Search for restaurants or food"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <Button 
                variant="hero" 
                size="lg" 
                className="h-14 px-8 font-semibold"
                onClick={handleSearch}
              >
                Find Food
              </Button>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Pizza", "Burgers", "Sushi", "Mexican", "Chinese", "Italian"].map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full cursor-pointer transition-all hover:scale-105"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Driver CTA Section */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-semibold"
                onClick={() => navigate('/mobile')}
              >
                <Truck className="mr-2 h-4 w-4" />
                Satisfy Crave Now
              </Button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-white/80 text-sm">Own a restaurant?</p>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-primary"
                  onClick={() => navigate('/restaurant/auth')}
                >
                  Join as a Restaurant Partner
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;