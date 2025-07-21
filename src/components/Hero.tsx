import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-food.jpg";

const Hero = () => {
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
                  className="pl-12 h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input 
                  placeholder="Search for restaurants or food"
                  className="pl-12 h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <Button variant="hero" size="lg" className="h-14 px-8 font-semibold">
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
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;