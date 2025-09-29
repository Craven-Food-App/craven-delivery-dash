import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Hero = () => {
  const navigate = useNavigate();
  const handleOrderNow = () => {
    navigate('/restaurants');
  };
  return <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero">
      {/* Content */}
      <div className="relative text-center text-white px-4 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-stone-50 lg:text-9xl">
            Crave'N
          </h1>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Order food delivery
          </h2>
          
          <p className="text-xl md:text-2xl mb-12 opacity-90 font-medium text-zinc-50 lg:text-3xl">
            From your favorite local restaurants
          </p>

          <Button size="lg" onClick={handleOrderNow} className="h-16 md:h-20 px-12 md:px-16 text-xl md:text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            Order Now
          </Button>
        </div>
      </div>
    </section>;
};
export default Hero;