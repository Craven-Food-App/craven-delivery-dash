import RestaurantCard from "./RestaurantCard";

const RestaurantGrid = () => {
  const restaurants = [
    {
      name: "Burger Palace",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      rating: 4.5,
      deliveryTime: "25-35 min",
      deliveryFee: "Free",
      cuisine: "American, Burgers",
      isPromoted: true
    },
    {
      name: "Pizza Corner",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      rating: 4.8,
      deliveryTime: "20-30 min",
      deliveryFee: "$2.99",
      cuisine: "Italian, Pizza"
    },
    {
      name: "Sushi Express",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
      rating: 4.6,
      deliveryTime: "30-40 min",
      deliveryFee: "Free",
      cuisine: "Japanese, Sushi"
    },
    {
      name: "Taco Fiesta",
      image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop",
      rating: 4.3,
      deliveryTime: "15-25 min",
      deliveryFee: "$1.99",
      cuisine: "Mexican, Tacos"
    },
    {
      name: "Green Garden",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
      rating: 4.7,
      deliveryTime: "20-30 min",
      deliveryFee: "Free",
      cuisine: "Healthy, Salads"
    },
    {
      name: "Noodle House",
      image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop",
      rating: 4.4,
      deliveryTime: "25-35 min",
      deliveryFee: "$2.49",
      cuisine: "Asian, Noodles"
    }
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, index) => (
            <div key={restaurant.name} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <RestaurantCard {...restaurant} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantGrid;