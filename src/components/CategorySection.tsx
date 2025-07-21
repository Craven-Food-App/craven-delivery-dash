import { Button } from "@/components/ui/button";

const CategorySection = () => {
  const categories = [
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
    },
    {
      name: "Chinese",
      image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&h=200&fit=crop",
      color: "from-yellow-600 to-orange-600"
    },
    {
      name: "Indian",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop",
      color: "from-orange-600 to-red-600"
    }
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            What are you craving?
          </h2>
          <p className="text-muted-foreground text-lg">
            Browse by your favorite cuisine type
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <div 
              key={category.name} 
              className="group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-lg aspect-square mb-2 shadow-card hover:shadow-hover transition-all duration-300 transform hover:scale-105">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm text-center px-2">
                    {category.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            View All Cuisines
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;