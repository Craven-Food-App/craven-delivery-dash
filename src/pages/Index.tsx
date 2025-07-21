import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import RestaurantGrid from "@/components/RestaurantGrid";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategorySection />
      <RestaurantGrid />
      <Footer />
    </div>
  );
};

export default Index;
