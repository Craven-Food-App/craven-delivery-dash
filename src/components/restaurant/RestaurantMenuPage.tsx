import React, { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { ShoppingCart } from "lucide-react";

// --- Mock Data Types ---
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Category {
  id: number;
  name: string;
}

// --- Mock Data ---
const categories: Category[] = [
  { id: 1, name: "Burgers" },
  { id: 2, name: "Fries" },
  { id: 3, name: "Drinks" },
];

const menuItems: MenuItem[] = [
  { id: 1, name: "Cheeseburger", description: "Delicious cheese burger", price: 8, image: "/burger.jpg" },
  { id: 2, name: "French Fries", description: "Crispy golden fries", price: 3, image: "/fries.jpg" },
  { id: 3, name: "Cola", description: "Refreshing soda", price: 2, image: "/cola.jpg" },
  { id: 4, name: "Double Burger", description: "Double patty burger", price: 10, image: "/burger2.jpg" },
];

// --- Animated Menu Item Component ---
const AnimatedMenuItem: React.FC<{ item: MenuItem; onAddToCart: (item: MenuItem) => void }> = ({ item, onAddToCart }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px",
          border: "1px solid #eee",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "20vw",
            minWidth: "80px",
            height: "20vw",
            minHeight: "80px",
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{item.name}</h3>
          <p style={{ margin: "4px 0", fontSize: "14px", color: "#555" }}>{item.description}</p>
          <p style={{ fontWeight: 600 }}>${item.price}</p>
        </div>
        <button
          onClick={() => onAddToCart(item)}
          style={{
            backgroundColor: "#FF6B35",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

// --- Main Restaurant Page ---
const RestaurantPage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number>(categories[0].id);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [cartBounce, setCartBounce] = useState(false);

  // Scroll listener for parallax
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) setScrollY(scrollRef.current.scrollTop);
    };
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", handleScroll);
    return () => ref?.removeEventListener("scroll", handleScroll);
  }, []);

  // Add to cart with bounce
  const addToCart = (item: MenuItem) => {
    setCart([...cart, item]);
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 300);
  };

  // Filtered menu items per category
  const filteredItems = menuItems.filter((item) => item.id % categories.length === selectedCategory % categories.length);

  return (
    <div
      ref={scrollRef}
      style={{
        height: "100vh",
        overflowY: "scroll",
        fontFamily: "sans-serif",
        backgroundColor: "#fafafa",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          height: "35vh",
          background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(/hero.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "16px",
          color: "#fff",
          transform: `translateY(${scrollY * 0.3}px)`,
          transition: "transform 0.1s linear",
          scrollSnapAlign: "start",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "5vw", fontWeight: 700 }}>Joyful's Koney Island</h1>
        <p style={{ margin: 0, fontSize: "3vw" }}>Toledo, OH</p>
      </div>

      {/* Categories */}
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#fff",
          display: "flex",
          overflowX: "auto",
          padding: "12px 16px",
          gap: "16px",
          zIndex: 10,
          borderBottom: "1px solid #eee",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              background: "none",
              border: "none",
              padding: "8px 0",
              fontWeight: selectedCategory === cat.id ? 600 : 400,
              color: selectedCategory === cat.id ? "#FF6B35" : "#333",
              cursor: "pointer",
              minWidth: "80px",
              fontSize: "4vw",
            }}
          >
            {cat.name}
          </button>
        ))}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            height: "3px",
            width: "20vw",
            maxWidth: "80px",
            backgroundColor: "#FF6B35",
            borderRadius: "2px",
            transform: `translateX(${categories.findIndex((c) => c.id === selectedCategory) * 24}vw)`,
            transition: "transform 0.3s ease",
          }}
        />
      </div>

      {/* Menu Items */}
      <div style={{ padding: "16px" }}>
        {filteredItems.map((item) => (
          <AnimatedMenuItem key={item.id} item={item} onAddToCart={addToCart} />
        ))}
      </div>

      {/* Floating Cart */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#FF6B35",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: "50px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          transform: cartBounce ? "scale(1.1)" : "scale(1)",
          transition: "transform 0.3s ease",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <ShoppingCart size={20} />
        <span>{cart.length}</span>
      </div>
    </div>
  );
};

export default RestaurantPage;
