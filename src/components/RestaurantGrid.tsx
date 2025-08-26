import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import RestaurantCard from "./RestaurantCard";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  is_promoted: boolean;
  rating: number;
  image_url: string;
}

const RestaurantGrid = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("is_promoted", { ascending: false })
        .order("rating", { ascending: false });

      if (error) throw error;

      setRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Popular Restaurants Near You
            </h2>
            <p className="text-muted-foreground text-lg">
              Loading restaurants...
            </p>
          </div>
        </div>
      </section>
    );
  }

  const formatRestaurantData = (restaurant: Restaurant) => ({
    name: restaurant.name,
    image: restaurant.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    rating: restaurant.rating,
    deliveryTime: `${restaurant.min_delivery_time}-${restaurant.max_delivery_time} min`,
    deliveryFee: restaurant.delivery_fee_cents === 0 ? "Free" : `$${(restaurant.delivery_fee_cents / 100).toFixed(2)}`,
    cuisine: restaurant.cuisine_type,
    isPromoted: restaurant.is_promoted
  });

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Popular Restaurants Near You
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover the most loved places to eat in your area
          </p>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No restaurants available right now. Be the first to register your restaurant!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant, index) => (
              <div key={restaurant.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <RestaurantCard {...formatRestaurantData(restaurant)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RestaurantGrid;