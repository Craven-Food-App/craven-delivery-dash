import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Clock,
  Truck,
  Plus,
  Minus,
  ShoppingCart,
  X,
  ChevronLeft,
  Utensils,
  Heart,
  Share2,
  MapPin,
  Phone,
  Navigation,
  MessageCircle,
  CheckCircle,
  Filter,
  Search,
  ChefHat,
  Leaf,
  Info,
  ArrowUp,
  Timer,
  Flame,
} from "lucide-react";

// Assuming these paths are configured in your environment
// NOTE: These variables are imported but not used in the current component logic
import { supabase } from "@/integrations/supabase/client";
import { toast as showToast } from "sonner";

// --- Mock Data Replication (UI/Data remains identical) ---
const DEALS_MOCK_DATA = [
  { id: 1, title: "15% Off up to $6", detail: "Add $30 to apply" },
  { id: 2, title: "Platinum Dasher Perk", detail: "As a Platinum Dasher, you've unlocked 30% off (up to $1..." },
  { id: 3, title: "Get $0 delivery fee", detail: "Plus, low service fee" },
];

const FEATURED_ITEMS_MOCK_DATA = [
  {
    id: 101,
    title: "Pick Two and Save: Make It a Meal",
    price: "$11.79 • 84% (454)",
    imageUrl: "https://placehold.co/100x100/A31D24/ffffff?text=Meal",
  },
  {
    id: 102,
    title: "Big Buford® Combo",
    price: "$12.99 • 77% (216)",
    imageUrl: "https://placehold.co/100x100/0F7D2B/ffffff?text=Buford",
  },
  {
    id: 103,
    title: "Baconzilla!® Combo",
    price: "$12.99 • 86% (236)",
    imageUrl: "https://placehold.co/100x100/D0A824/ffffff?text=Bacon",
  },
  {
    id: 104,
    title: "Fry-Seasoned Tenders",
    price: "$9.79 • 84% (454)",
    imageUrl: "https://placehold.co/100x100/1D4ED8/ffffff?text=Tenders",
  },
];

const MOST_ORDERED_ITEMS = [
  {
    id: 201,
    title: "Famous Seasoned Fries",
    price: "$3.99 • 92% (1.2k)",
    imageUrl: "https://placehold.co/120x120/A31D24/ffffff?text=Fries",
  },
  {
    id: 202,
    title: "Big Buford® Combo",
    price: "$10.99 • 85% (850)",
    imageUrl: "https://placehold.co/120x120/0F7D2B/ffffff?text=Buford",
  },
  {
    id: 203,
    title: "Classic Milkshakes",
    price: "$5.50 • 90% (520)",
    imageUrl: "https://placehold.co/120x120/C4C4C4/000000?text=Shake",
  },
  {
    id: 204,
    title: "Chili Cheese Fries",
    price: "$5.99 • 78% (310)",
    imageUrl: "https://placehold.co/120x120/FFC300/000000?text=Chili",
  },
];

const LIMITED_TIME_ITEMS = [
  {
    id: 301,
    title: "BBQ Brisket Buford Combo",
    price: "$11.49 • 79% (345)",
    imageUrl: "https://placehold.co/120x120/8B4513/ffffff?text=BBQ",
  },
  {
    id: 302,
    title: "GlowFix Unbeatable Meal Deal",
    price: "$9.99 • 88% (420)",
    imageUrl: "https://placehold.co/120x120/000000/ffffff?text=Deal",
  },
  {
    id: 303,
    title: "Lemonade Cooler",
    price: "$3.49 • 95% (210)",
    imageUrl: "https://placehold.co/120x120/FFD700/000000?text=Lemon",
  },
  {
    id: 304,
    title: "Crispy Onion Rings",
    price: "$4.99 • 81% (180)",
    imageUrl: "https://placehold.co/120x120/94A3B8/ffffff?text=Rings",
  },
];

const COMBO_MEALS = [
  {
    id: 401,
    title: "Spicy Chicken Sandwich Combo",
    price: "$9.59 • 81% (300)",
    imageUrl: "https://placehold.co/100x100/F05252/ffffff?text=Spicy",
  },
  {
    id: 402,
    title: "Cheeseburger & Fries Combo",
    price: "$8.29 • 88% (450)",
    imageUrl: "https://placehold.co/100x100/3B82F6/ffffff?text=Burger",
  },
  {
    id: 403,
    title: "Crispy Fish Sandwich Combo",
    price: "$10.49 • 75% (150)",
    imageUrl: "https://placehold.co/100x100/6B7280/ffffff?text=Fish",
  },
  {
    id: 404,
    title: "The Big Chicken Box",
    price: "$14.99 • 91% (550)",
    imageUrl: "https://placehold.co/100x100/4F46E5/ffffff?text=Box",
  },
];

// Combine all menu sections into one structure for simpler rendering in the loop
const MENU_SECTIONS = [
  { id: "featured", title: "Featured Items", items: FEATURED_ITEMS_MOCK_DATA },
  { id: "most-ordered", title: "Most Ordered", items: MOST_ORDERED_ITEMS },
  { id: "limited-time", title: "Limited Time Offerings", items: LIMITED_TIME_ITEMS },
  { id: "combo-meals", title: "Combo Meals", items: COMBO_MEALS },
  { id: "home-of-the-2for", title: "Home Of The 2-For", items: COMBO_MEALS }, // Reusing data for visual purposes
  { id: "burgers", title: "Burgers", items: MOST_ORDERED_ITEMS }, // Reusing data
  { id: "chicken", title: "Chicken", items: LIMITED_TIME_ITEMS }, // Reusing data
  { id: "hot-dogs", title: "Hot Dogs & Chili", items: FEATURED_ITEMS_MOCK_DATA }, // Reusing data
  { id: "fries", title: "Fries And Sides", items: MOST_ORDERED_ITEMS }, // Reusing data
  { id: "every-day", title: "Every Day Deals", items: LIMITED_TIME_ITEMS }, // Reusing data
  { id: "drinks", title: "Shakes And Drinks", items: COMBO_MEALS }, // Reusing data
  { id: "kids", title: "Kids Meals", items: FEATURED_ITEMS_MOCK_DATA }, // Reusing data
  { id: "desserts", title: "Desserts", items: MOST_ORDERED_ITEMS }, // Reusing data
];

const SIDEBAR_LINKS = MENU_SECTIONS.map((s) => ({
  id: s.id,
  label: s.title,
  href: `#${s.id}`,
}))
  .concat([
    // Reviews is a standalone section
    { id: "reviews", label: "Reviews", href: "#reviews" },
  ])
  .sort((a, b) => {
    // Keep 'featured' and 'reviews' at the top if they exist
    if (a.id === "featured") return -1;
    if (b.id === "featured") return 1;
    if (a.id === "reviews") return -1;
    if (b.id === "reviews") return 1;
    return a.id.localeCompare(b.id);
  });

// --- Main Application Component ---
const App = () => {
  // Hooks imported from the user's request
  const { id } = useParams(); // Unused but imported
  const navigate = useNavigate(); // Unused but imported

  const [activeSection, setActiveSection] = useState("featured");
  const [isMenuFixed, setIsMenuFixed] = useState(false);
  const tabsRef = useRef(null);

  // Converted to useCallback to honor the import request
  const scrollToSection = useCallback((id) => {
    const section = document.getElementById(id);
    if (section) {
      const offset = tabsRef.current ? tabsRef.current.offsetHeight + 16 : 100;
      window.scrollTo({
        top: section.offsetTop - offset,
        behavior: "smooth",
      });
    }
  }, []);

  // Observer to track which section is currently visible for active link highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Determine if the top of the section is visible near the top of the viewport
          if (entry.isIntersecting && entry.boundingClientRect.top < 250) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -50% 0px",
        threshold: 0.1,
      },
    );

    // Observe all menu sections
    MENU_SECTIONS.concat([{ id: "reviews" }]).forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      MENU_SECTIONS.concat([{ id: "reviews" }]).forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) {
          observer.unobserve(el);
        }
      });
    };
  }, []);

  // Observer for fixing the menu sidebar based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        // This logic ensures the sidebar only becomes fixed when the sticky tabs bar is visible
        const rightColumn = document.querySelector(".lg\\:col-span-9");
        if (rightColumn) {
          setIsMenuFixed(window.scrollY > rightColumn.offsetTop - 100); // Start fixing slightly before the content begins
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- UNIFIED MENU ITEM CARD (Grid Style) ---
  const MenuItemCard = ({ item }) => (
    <div className="w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden cursor-pointer group transition duration-300 hover:shadow-2xl">
      {/* Image Section - Prominent */}
      <div className="h-32 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/100x100/CCCCCC/666666?text=Item";
          }}
        />
      </div>

      {/* Text Section - Tighter Padding */}
      <div className="p-3 relative">
        <h4 className="text-base font-extrabold text-gray-800 line-clamp-2 leading-tight">{item.title}</h4>

        {/* Price/Rating Block (Structured for less generic look) */}
        <div className="mt-2 text-sm font-semibold">
          <span className="text-gray-700">{item.price.split(" • ")[0]}</span>
          {/* Rating part is usually the second element, displayed smaller/faded */}
          <span className="text-xs text-gray-400 block">{item.price.split(" • ")[1]}</span>
        </div>

        {/* Plus button with enhanced styling and custom shadow (Using Lucide Plus) */}
        <button
          className="absolute -top-6 right-3 bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-xl pb-1 hover:bg-red-800 transition duration-200"
          style={{ boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.4), 0 2px 4px -2px rgba(220, 38, 38, 0.4)" }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Component for the Deals slider
  const DealsSection = () => (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Deals & benefits</h2>

      <div className="flex overflow-x-auto space-x-3 pb-2 snap-x snap-mandatory">
        {DEALS_MOCK_DATA.map((deal) => (
          <div
            key={deal.id}
            className="flex-shrink-0 w-[240px] sm:w-[300px] bg-white p-4 rounded-xl shadow-md border border-gray-200 snap-start relative"
          >
            <h3 className="text-base font-bold text-red-700 mb-1">{deal.title}</h3>
            <p className="text-sm text-gray-500">{deal.detail}</p>
            {/* Replaced Icon with Lucide ArrowUp (rotated) */}
            <ArrowUp
              className="w-4 h-4 text-red-700 absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90"
              strokeWidth={3}
            />
          </div>
        ))}
        <button className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center self-center text-gray-600 hover:bg-gray-200 transition">
          {/* Replaced Icon with Lucide ArrowUp (rotated) */}
          <ArrowUp className="w-6 h-6 transform rotate-90" strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  // Store Info and Sidebar Component (Left Column)
  const LeftColumn = () => (
    // Sidebar fix to hide on mobile and only show/fix on large screens
    <div
      className={`pt-8 ${
        isMenuFixed
          ? "hidden lg:block fixed top-1 left-1/2 transform -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:max-w-[calc(25%-1rem)] xl:max-w-[calc((1120px*0.25)-1rem)] w-full max-w-xs lg:w-auto"
          : "hidden lg:block"
      }`}
    >
      <div className="space-y-4">
        {/* Store Info */}
        <div className="text-sm space-y-2">
          <h3 className="font-bold text-gray-700">Store Info</h3>
          <div className="flex items-center text-green-600 font-semibold">
            {/* Using Truck for DashPass - Closest available icon for Delivery/Pass */}
            <Truck className="w-4 h-4 mr-1" />
            <span>DashPass</span>
          </div>
          <p className="flex items-center space-x-1 text-red-700 font-semibold">
            {/* Replaced Icon with Lucide Clock */}
            <Clock className="w-4 h-4" />
            <span>Closed • Order now, get it later</span>
          </p>
          <p className="flex items-center space-x-1 text-gray-600">
            {/* Replaced Icon with Lucide Star (filled) */}
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span>
              4.1 <span className="text-gray-400">(20k+)</span> • 7.1 mi
            </span>
          </p>
          <p className="text-gray-600">
            {/* Replaced Icon with Lucide MapPin */}
            <MapPin className="w-4 h-4 inline-block -mt-1 mr-1 text-red-500" />
            American
          </p>
          <button className="text-red-700 font-semibold text-sm hover:text-red-900 transition">See More</button>
        </div>

        {/* Full Menu Navigation */}
        <nav className="border-t border-gray-200 pt-4 space-y-1">
          <h3 className="font-bold text-gray-700 mb-2">Full Menu</h3>
          <div className="text-xs text-gray-500 mb-3">9:00 AM - 3:45 AM</div>

          <ul className="space-y-1 text-sm">
            {SIDEBAR_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.id);
                  }}
                  className={`block p-2 rounded-lg font-medium transition duration-150 
                                        ${
                                          activeSection === link.id
                                            ? "bg-red-50 text-red-700 font-semibold border-l-4 border-red-700 -ml-2 pl-4"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 antialiased">
      <div className="max-w-7xl mx-auto">
        {/* --- Header Image Banner --- */}
        <div className="relative h-64 overflow-hidden rounded-b-xl shadow-lg">
          <img
            src="https://placehold.co/1200x400/A31D24/ffffff?text=Checkers+&+Rally's+Limited+Time+Offer+-+BIG+BURGERS"
            alt="Promotional Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/1200x400/A31D24/ffffff?text=Checkers+&+Rally's+Menu";
            }}
          />

          {/* Logo Overlay */}
          <div className="absolute top-6 left-6 flex flex-col items-center p-2 bg-white rounded-xl shadow-xl">
            <img
              src="https://placehold.co/60x60/A31D24/ffffff?text=C&R"
              alt="Checkers & Rally's Logo"
              className="w-12 h-12"
            />
          </div>

          {/* Status Bar Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-white flex items-center px-4 shadow-xl">
            <p className="text-sm font-semibold text-gray-700 flex-1">
              <span className="text-red-700">Closed</span> • Order now, get it later
            </p>
            {/* Replaced Icon with Lucide ArrowUp (rotated) */}
            <ArrowUp className="w-5 h-5 text-gray-500 transform rotate-90" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* --- Main Content Layout --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- Restaurant Name & Search Bar (Full Width) --- */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Checkers & Rally's</h1>
          <div className="relative">
            {/* Replaced Icon with Lucide Search */}
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Checkers & Rally's"
              className="w-full py-3 pl-12 pr-4 text-sm border border-gray-300 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
          </div>
        </div>

        {/* --- Two-Column Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Sticky Store Info and Menu Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-4" style={{ top: "32px" }}>
              <LeftColumn />
            </div>
          </div>

          {/* RIGHT: Delivery Tabs, Price/Time, and Scrollable Menu Content */}
          <div className="lg:col-span-9 min-w-0">
            {/* Delivery Tabs and Price/Time (Sticky Top Bar) */}
            <div
              ref={tabsRef}
              className="sticky top-0 bg-gray-50 pt-2 pb-4 z-20 border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
            >
              <div className="flex justify-between items-center space-x-4">
                {/* Delivery/Pickup Tabs */}
                <div className="flex border border-gray-300 rounded-lg p-0.5 bg-gray-100 text-sm font-semibold transition duration-300">
                  <button className="px-5 py-2 rounded-md bg-red-700 shadow-lg text-white font-bold transition duration-200">
                    Delivery
                  </button>
                  <button className="px-5 py-2 rounded-md text-gray-600 font-medium hover:bg-white transition duration-200">
                    Pickup
                  </button>
                  <button className="px-5 py-2 rounded-md text-gray-600 font-medium hover:bg-white transition duration-200 hidden sm:inline-block">
                    Group Order
                  </button>
                </div>

                {/* Price/Time Info Box */}
                <div className="flex items-center space-x-2 text-sm text-right">
                  <div className="flex flex-col text-xs text-gray-600 font-medium">
                    <div className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      $0.49 <span className="line-through text-gray-500">$0.00</span> delivery fee over $12
                    </div>
                    <p className="mt-1 text-gray-500">Long Distance Delivery • 7.1 mi</p>
                  </div>
                  <div className="hidden sm:block text-xs text-right">
                    <p className="font-semibold text-gray-700">Opens 9:00 AM</p>
                    <p className="text-gray-500">Order for later</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Deals & Benefits (Scrollable Row) */}
            <section id="deals" className="pt-8">
              <DealsSection />
            </section>

            {/* 2. Reviews Section (Non-Grid) */}
            <section
              id="reviews"
              className="mb-10 pt-20 -mt-20 p-5 bg-white rounded-xl shadow-xl border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
                <button className="text-sm font-semibold text-red-700 hover:text-red-900">Add Review</button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-extrabold text-red-700">4.1</div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center text-yellow-500">
                    {/* Using Lucide Star (4 filled, 1 empty) */}
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="mt-1">100+ ratings • 46 reviews</p>
                </div>
              </div>
            </section>

            {/* --- Dynamically Rendered Menu Sections (ALL in Grid Layout) --- */}
            {MENU_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="mb-10 pt-20 -mt-20">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {section.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
                {/* Add a border separator for subsequent sections */}
                <div className="mt-8 border-t border-gray-200"></div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <style>{`
                /* Global styles for smooth scrolling and intersection observer support */
                html { scroll-behavior: smooth; }
                /* Custom styles for the scrollable deals section to match the screenshot style */
                .snap-x > * {
                    scroll-snap-align: start;
                }
            `}</style>
    </div>
  );
};

export default App;
