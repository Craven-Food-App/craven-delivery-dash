import React, { useState, useEffect, useRef } from "react";

// --- Icon Utility Component (Using Inline SVGs for single-file adherence) ---
const Icon = ({ name, className = "w-5 h-5", strokeWidth = 2, children }) => {
  const iconMap = {
    // Essential Icons
    "share-2": <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v14" />,
    // FIX: The 'user' icon was causing the syntax error. Multiple JSX elements need to be wrapped in an array or React Fragment.
    user: [<circle key="c1" cx="12" cy="7" r="4" />, <path key="p1" d="M22 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />],
    // FIX: The 'shopping-cart' icon also had multiple elements.
    "shopping-cart": [
      <circle key="c1" cx="9" cy="21" r="1" />,
      <circle key="c2" cx="20" cy="21" r="1" />,
      <path key="p1" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />,
    ],
    search: [<circle key="c1" cx="11" cy="11" r="8" />, <line key="l1" x1="21" y1="21" x2="16.65" y2="16.65" />],
    clock: [<circle key="c1" cx="12" cy="12" r="10" />, <path key="p1" d="M12 6v6l4 2" />],
    // FIX: The 'map-pin' icon also had multiple elements.
    "map-pin": [<path key="p1" d="M12 1.5l-4.5 9.5a5.5 5.5 0 0 0 9 0z" />, <circle key="c1" cx="12" cy="11" r="3" />],
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    "chevron-down": <polyline points="6 9 12 15 18 9" />,
    info: [
      <circle key="c1" cx="12" cy="12" r="10" />,
      <line key="l1" x1="12" y1="16" x2="12" y2="12" />,
      <line key="l2" x1="12" y1="8" x2="12" y2="8" />,
    ],
  };

  const SvgContent = iconMap[name]; // Don't default to search if not found, rely on logic below

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Render logic: If SvgContent is an array (multiple paths/elements), render as fragment */}
      {Array.isArray(SvgContent) ? <>{SvgContent}</> : SvgContent}
      {children}
    </svg>
  );
};

// --- Mock Data Replication ---
const DEALS_MOCK_DATA = [
  { id: 1, title: "15% Off up to $6", detail: "On orders of $15 or more" },
  { id: 2, title: "Platinum Delivery Perk", detail: "As a Platinum Ranker, you've unlocked 50% off up to $1..." },
  { id: 3, title: "Free Delivery", detail: "Get $0 delivery fee on orders of $12 or more" },
];

const FEATURED_ITEMS_MOCK_DATA = [
  {
    id: 101,
    title: "Pick Two and Save",
    subtitle: "Make It a Meal",
    price: "$8.99",
    imageUrl: "https://placehold.co/100x100/A31D24/ffffff?text=Meal",
  },
  {
    id: 102,
    title: "Big Buford® Combo",
    subtitle: "Our big, bold, beefy burger",
    price: "$10.99",
    imageUrl: "https://placehold.co/100x100/0F7D2B/ffffff?text=Buford",
  },
  {
    id: 103,
    title: "Bananaful® Combo",
    subtitle: "Banana milkshake topped with whipped cream",
    price: "$7.99",
    imageUrl: "https://placehold.co/100x100/D0A824/ffffff?text=Banana",
  },
  {
    id: 104,
    title: "Fry-Seasoned Tenders",
    subtitle: "Always served hot, always seasoned.",
    price: "$9.99",
    imageUrl: "https://placehold.co/100x100/1D4ED8/ffffff?text=Tenders",
  },
];

const SIDEBAR_LINKS = [
  { id: "full-menu", label: "Full Menu", href: "#full-menu" },
  { id: "deals", label: "Deals", href: "#deals" },
  { id: "combos", label: "Combos", href: "#combos" },
  { id: "burgers", label: "Burgers", href: "#burgers" },
  { id: "chicken", label: "Chicken", href: "#chicken" },
  { id: "hotdogs", label: "Hot Dogs & Chili", href: "#hotdogs" },
  { id: "fries", label: "Fries And Sides", href: "#fries" },
  { id: "every-day", label: "Every Day Deals", href: "#every-day" },
  { id: "drinks", label: "Shakes And Drinks", href: "#drinks" },
  { id: "kids", label: "Kids Meals", href: "#kids" },
  { id: "desserts", label: "Desserts", href: "#desserts" },
];

const MOST_ORDERED_ITEMS = [
  {
    id: 201,
    title: "Famous Seasoned Fries",
    description: "Legendary, famous, perfectly seasoned, and always served hot. Just the right crisp and flavor.",
    price: "$3.99",
    imageUrl: "https://placehold.co/120x120/A31D24/ffffff?text=Fries",
  },
  {
    id: 202,
    title: "Big Buford® Combo",
    description:
      "Two large hand-seasoned 100% beef patties topped with lettuce, tomato, onion, dill pickles, ketchup, mustard, and mayonnaise.",
    price: "$10.99",
    imageUrl: "https://placehold.co/120x120/0F7D2B/ffffff?text=Buford",
  },
  {
    id: 203,
    title: "Classic Milkshakes",
    description: "Hand-scooped, classic ice cream milkshakes. Choose from vanilla, chocolate, or strawberry.",
    price: "$5.50",
    imageUrl: "https://placehold.co/120x120/C4C4C4/000000?text=Shake",
  },
];

// --- Main Application Component ---
const App = () => {
  const [activeSection, setActiveSection] = useState("full-menu");

  // Simple scroll function for sidebar links
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 150, // Offset for sticky header
        behavior: "smooth",
      });
    }
  };

  // Component to render a single menu item in a list style (Most Ordered)
  const ListItemCard = ({ item }) => (
    <div
      id={`item-${item.id}`}
      className="flex p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200"
    >
      <div className="flex-1 pr-4">
        <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-3">{item.description}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-lg font-extrabold text-red-700">{item.price}</span>
          <button className="text-sm font-semibold text-red-700 hover:text-red-900 transition">Add to bag</button>
        </div>
      </div>
      <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden">
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>
    </div>
  );

  // Component to render a single featured item in a grid style
  const FeaturedItemCard = ({ item }) => (
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition duration-200 cursor-pointer">
      <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />
      <div className="p-3">
        <h4 className="text-sm font-bold text-gray-800 line-clamp-2">{item.title}</h4>
        <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-bold text-gray-800">{item.price}</span>
          <button className="bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xl pb-1 hover:bg-red-800 transition">
            +
          </button>
        </div>
      </div>
    </div>
  );

  // Component for the Deals slider
  const DealsSection = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Deals & Benefits</h2>
        <button className="text-sm font-semibold text-red-700 hover:text-red-900">See all</button>
      </div>

      <div className="flex overflow-x-auto space-x-4 pb-4 snap-x snap-mandatory">
        {DEALS_MOCK_DATA.map((deal) => (
          <div
            key={deal.id}
            className="flex-shrink-0 w-[260px] sm:w-[320px] bg-white p-4 rounded-xl shadow-md border border-red-200 snap-start"
          >
            <span className="inline-block text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full mb-2">
              Available
            </span>
            <h3 className="text-base font-bold text-gray-800 mb-1">{deal.title}</h3>
            <p className="text-sm text-gray-500">{deal.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Sidebar Component
  const Sidebar = () => (
    <nav className="sticky top-[200px] w-full pt-4 pr-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <h3 className="text-lg font-bold mb-2">Full Menu</h3>
      <ul className="space-y-1">
        {SIDEBAR_LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.id);
              }}
              className={`block p-2 rounded-lg text-sm font-medium transition duration-150 
                                ${
                                  activeSection === link.id
                                    ? "bg-red-100 text-red-700 font-bold"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  // Function to check which section is active on scroll (simple implementation)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only update if it's mostly visible or above the fold
            if (entry.boundingClientRect.top < window.innerHeight / 2) {
              setActiveSection(entry.target.id);
            }
          }
        });
      },
      {
        rootMargin: "-150px 0px -50% 0px", // Header offset and high threshold
        threshold: 0.1, // When 10% is visible
      },
    );

    SIDEBAR_LINKS.forEach((link) => {
      const section = document.getElementById(link.id);
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      SIDEBAR_LINKS.forEach((link) => {
        const section = document.getElementById(link.id);
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 antialiased">
      {/* --- Top Bar --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end h-14">
          {" "}
          {/* Adjusted to justify-end */}
          <div className="flex items-center space-x-4 text-sm">
            <button className="flex items-center space-x-1 text-gray-700 hover:text-red-700 transition">
              <Icon name="user" className="w-5 h-5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-700 hover:text-red-700 transition">
              <Icon name="shopping-cart" className="w-5 h-5" />
              <span className="hidden sm:inline">Bag (0)</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- Header Image Banner --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <img
          src="https://placehold.co/1200x160/A31D24/ffffff?text=Checkers+&+Rally's+Limited+Time+Offer+-+BIG+BURGERS"
          alt="Promotional Banner - Limited Time Offer"
          className="w-full h-auto rounded-xl object-cover shadow-lg"
        />
      </div>

      {/* --- Sticky Main Header / Search / Delivery --- */}
      <header className="sticky top-0 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Icon
                name="search"
                className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Search Checkers & Rally's"
                className="w-full py-3 pl-12 pr-4 text-sm border border-gray-300 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>

            {/* Delivery/Pickup Tabs */}
            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded-full p-0.5 bg-gray-100 text-sm font-semibold transition duration-300">
                <button className="px-5 py-2 rounded-full bg-red-700 shadow-lg text-white font-bold transition duration-200">
                  Delivery
                </button>
                <button className="px-5 py-2 rounded-full text-gray-600 font-medium hover:bg-white transition duration-200">
                  Pickup
                </button>
                <button className="px-5 py-2 rounded-full text-gray-600 font-medium hover:bg-white transition duration-200 hidden sm:inline-block">
                  Group Order
                </button>
              </div>

              {/* Time/Min Order Info */}
              <div className="hidden sm:block text-sm text-right">
                <p className="font-semibold text-gray-700">Today: 11:00 AM</p>
                <p className="text-gray-500">Min Order $10.00</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content Layout --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* --- LEFT SIDEBAR (Desktop) --- */}
          <div className="hidden lg:block lg:col-span-3">
            {/* NEW: Company Name Placement */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <img
                  src="https://placehold.co/30x30/A31D24/ffffff?text=C"
                  alt="Logo"
                  className="w-8 h-8 rounded-full"
                />
                <h1 className="text-2xl font-extrabold text-red-700">Checkers & Rally's</h1>
              </div>
              <div className="text-sm text-gray-600 mt-1 pl-10">
                <p>American • Burgers</p>
                <p className="flex items-center mt-1">
                  <Icon name="star" className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="ml-1 font-semibold">4.1 Stars</span> (100+ ratings)
                </p>
              </div>
            </div>

            <Sidebar />
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Icon name="clock" className="w-4 h-4" />
                <span>Open until 1:00 AM</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <Icon name="map-pin" className="w-4 h-4" />
                <span>6759 Nebraska Ave.</span>
              </div>
              <button className="flex items-center text-sm font-semibold text-red-700 mt-4 hover:text-red-900 transition">
                <Icon name="info" className="w-4 h-4 mr-1" />
                More Info (Hours, Address)
              </button>
            </div>
          </div>

          {/* --- RIGHT MENU CONTENT --- */}
          <div className="lg:col-span-9 min-w-0">
            {/* 1. Deals & Benefits (Scrollable Row) */}
            <section id="deals" className="pt-20 -mt-20">
              <DealsSection />
            </section>

            {/* 2. Featured Items (Grid Row) */}
            <section id="featured" className="mb-10 pt-20 -mt-20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Featured Items</h2>
                <button className="text-sm font-semibold text-red-700 hover:text-red-900">See all</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {FEATURED_ITEMS_MOCK_DATA.map((item) => (
                  <FeaturedItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* 3. Reviews Section */}
            <section
              id="reviews"
              className="mb-10 pt-20 -mt-20 p-5 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
                <button className="text-sm font-semibold text-red-700 hover:text-red-900">Add Review</button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-extrabold text-red-700">4.1</div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center text-yellow-500">
                    <Icon name="star" className="w-4 h-4 fill-yellow-500" />
                    <Icon name="star" className="w-4 h-4 fill-yellow-500" />
                    <Icon name="star" className="w-4 h-4 fill-yellow-500" />
                    <Icon name="star" className="w-4 h-4 fill-yellow-500" />
                    <Icon name="star" className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="mt-1">100+ ratings • 46 reviews</p>
                </div>
              </div>
              {/* Mock Review */}
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-bold">
                  Chris M. • <span className="text-gray-500 font-normal">4.5 • 18 contributions</span>
                </p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  Chicken Bites & Fries Box was great! Food was hot and fresh. Delivered fast. Highly recommend this for
                  a quick lunch!
                </p>
              </div>
            </section>

            {/* 4. Most Ordered Section */}
            <section id="most-ordered" className="space-y-4 mb-10 pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800">Most Ordered</h2>
              {MOST_ORDERED_ITEMS.map((item) => (
                <ListItemCard key={item.id} item={item} />
              ))}
            </section>

            {/* 5. Limited Time Offerings Section */}
            <section id="limited-time" className="space-y-4 pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800">Limited Time Offerings</h2>
              {/* Mock Limited Item 1 */}
              <div className="flex p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-bold text-gray-800">BBQ Brisket Buford Combo</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                    Brisket Buford features two large 100% beef hamburger patties topped with savory shredded beef
                    brisket, smoky BBQ sauce, Swiss cheese and red onions, all on a toasted brioche bun.
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-extrabold text-red-700">$11.49</span>
                    <button className="text-sm font-semibold text-red-700 hover:text-red-900 transition">
                      Add to bag
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden">
                  <img
                    src="https://placehold.co/120x120/8B4513/ffffff?text=BBQ"
                    alt="BBQ Brisket Buford Combo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Generic Section Headers for Sidebar Linking */}
            <div id="combos" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Combos</h2>
              <p className="text-gray-500 text-sm mb-4">Choose your favorite combo meal.</p>
            </div>
            <div id="burgers" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Burgers</h2>
              <p className="text-gray-500 text-sm mb-4">Juicy, flavorful, and made to order.</p>
            </div>
            <div id="chicken" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Chicken</h2>
              <p className="text-gray-500 text-sm mb-4">Tenders, bites, and sandwiches.</p>
            </div>
            <div id="hotdogs" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Hot Dogs & Chili</h2>
              <p className="text-gray-500 text-sm mb-4">Classic dogs with a kick.</p>
            </div>
            <div id="fries" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Fries And Sides</h2>
              <p className="text-gray-500 text-sm mb-4">Famous seasoned fries and more.</p>
            </div>
            <div id="every-day" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Every Day Deals</h2>
              <p className="text-gray-500 text-sm mb-4">Great value any day of the week.</p>
            </div>
            <div id="drinks" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Shakes And Drinks</h2>
              <p className="text-gray-500 text-sm mb-4">Quench your thirst.</p>
            </div>
            <div id="kids" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Kids Meals</h2>
              <p className="text-gray-500 text-sm mb-4">Fun meals for the little ones.</p>
            </div>
            <div id="desserts" className="pt-20 -mt-20">
              <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-t pt-4">Desserts</h2>
              <p className="text-gray-500 text-sm mb-4">Sweet treats to end your meal.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Note: CSS to make the fixed header work correctly with scroll-to offsets */}
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
