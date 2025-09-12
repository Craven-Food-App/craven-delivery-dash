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
      <div className="relative container mx-auto px-4 py-12 md:py-20 text-center text-white">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Your favorite food,
            <span className="block text-primary-glow">delivered fast</span>
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 opacity-90">
            Discover the best restaurants near you and get your cravings delivered in minutes
          </p>

          {/* Search Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Enter your delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-12 md:h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50 text-base"
                />
              </div>
              
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Search for restaurants or food"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-12 md:h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50 text-base"
                />
              </div>
              
              <Button 
                variant="hero" 
                size="lg" 
                className="h-12 md:h-14 px-6 md:px-8 font-semibold text-base touch-manipulation"
                onClick={handleSearch}
              >
                Find Food
              </Button>
            </div>
          </div>

          {/* Category Grid */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">What are you craving?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-4xl mx-auto">
              {[
                {
                  name: "Fast Food",
                  image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop",
                  color: "from-red-500 to-orange-500"
                },
                {
                  name: "Pizza",
                  image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop",
                  color: "from-yellow-500 to-red-500"
                },
                {
                  name: "Sushi",
                  image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop",
                  color: "from-green-500 to-teal-500"
                },
                {
                  name: "Mexican",
                  image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=200&h=200&fit=crop",
                  color: "from-orange-500 to-red-500"
                },
                {
                  name: "Healthy",
                  image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
                  color: "from-green-400 to-green-600"
                },
                {
                  name: "Desserts",
                  image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop",
                  color: "from-pink-500 to-purple-500"
                }
              ].map((category, index) => (
                <div 
                  key={category.name} 
                  className="group cursor-pointer animate-fade-in touch-manipulation"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <div className="relative overflow-hidden rounded-lg aspect-square mb-2 shadow-card hover:shadow-hover transition-all duration-300 transform hover:scale-105 min-h-[80px]">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs md:text-sm text-center px-2 drop-shadow-lg">
                        {category.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver CTA Section */}
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-semibold h-12 px-6 touch-manipulation"
                onClick={() => navigate('/mobile')}
              >
                <Truck className="mr-2 h-4 w-4" />
                Satisfy Crave Now
              </Button>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-primary h-12 px-6 touch-manipulation"
                  onClick={() => navigate('/restaurant/auth')}
                >
                  MAKE'M CRAVE
                </Button>
                <p className="text-white/80 text-sm">Own a restaurant?</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;