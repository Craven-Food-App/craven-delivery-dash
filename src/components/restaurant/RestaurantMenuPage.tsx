import React, { useState, useEffect, useRef } from "react";

// --- Icon Utility Component (Using Inline SVGs for single-file adherence) ---
// This component replaces the lucide script import for guaranteed rendering.
const Icon = ({ name, className = "w-5 h-5", strokeWidth = 2, children }) => {
  const iconMap = {
    // Essential Icons
    "share-2": <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v14" />,
    heart: (
      <path d="M19 14c1.49-1.46 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1.24-4.5 3C10.5 4.24 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z" />
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    // FIX: Wrapped the multiple path elements in a React Fragment <>...</> to resolve compilation error
    truck: (
      <>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M16 18h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2" />
        <path d="M14 6h7" />
        <path d="M15 22l-1 2" />
        <path d="M19 22l-1 2" />
        <path d="M5 22l-1 2" />
        <path d="M9 22l-1 2" />
        <path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        <path d="M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </>
    ),
    "shopping-cart": (
      <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    menu: (
      <>
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </>
    ),
    percent: (
      <>
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </>
    ),
    sparkles: (
      <>
        <path d="M10 4L12 6L14 4" />
        <path d="M12 2V8" />
        <path d="M8 8L10 10L8 12" />
        <path d="M4 12H16" />
        <path d="M14 10L16 8L18 10" />
        <path d="M12 16V22" />
        <path d="M10 18L12 20L14 18" />
        <path d="M18 14L20 16L18 18" />
        <path d="M22 16H18" />
        <path d="M4 16H8" />
        <path d="M6 14L8 12L6 10" />
      </>
    ),
    burger: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1z" />
        <path d="M2 12a10 10 0 0 0 20 0H2z" />
        <path d="M17 14c-1 2-2 3-5 3s-4-1-5-3" />
      </>
    ), // Simple icon for burger
    fries: (
      <>
        <rect x="3" y="10" width="18" height="12" rx="2" />
        <path d="M7 10v4" />
        <path d="M12 10v4" />
        <path d="M17 10v4" />
        <path d="M7 14v4" />
        <path d="M12 14v4" />
        <path d="M17 14v4" />
      </>
    ), // Simple icon for fries
    coffee: (
      <>
        <path d="M17 6H3" />
        <path d="M6 6v14" />
        <path d="M14 10a4 4 0 0 1-4 4H6" />
        <path d="M17 14c1.33 0 2-1 2-2s-.67-2-2-2" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="8" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    // Default Placeholder
    default: <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />,
  };

  const SvgContent = iconMap[name] || iconMap["default"];

  // If SvgContent is an array of elements (Fragment), wrap it in a fragment for rendering.
  const Content = Array.isArray(SvgContent) ? <>{SvgContent}</> : SvgContent;

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
      {Content}
      {children}
    </svg>
  );
};

// --- Tailwind Configuration (Self-Contained) ---
const tailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        "dd-orange": "#ff7a00",
        "dd-lightgray": "#f5f5f5",
        "dd-dark": "#1f2937",
      },
    },
  },
};

// --- Main Application Component ---
const App = () => {
  const [serviceType, setServiceType] = useState("delivery");
  const [activeSection, setActiveSection] = useState("full-menu");
  const sectionRefs = useRef({});

  // 1. Scroll Logic for Active Sidebar Link
  useEffect(() => {
    const sections = ["full-menu", "deals", "featured", "burgers", "sides", "drinks"];
    const updateActiveLink = () => {
      let currentActiveId = "full-menu";
      const offset = 200; // Offset accounts for sticky header height

      sections.forEach((id) => {
        const section = document.getElementById(id);
        if (section) {
          // Check if the section's top is visible or just above the offset line
          if (window.scrollY >= section.offsetTop - offset) {
            currentActiveId = id;
          }
        }
      });
      setActiveSection(currentActiveId);
    };

    // Attach listener
    window.addEventListener("scroll", updateActiveLink);

    // Initial check on load
    updateActiveLink();

    // Cleanup listener
    return () => window.removeEventListener("scroll", updateActiveLink);
  }, []); // Run only on mount and unmount

  // 2. Helper function to create Nav Links
  const NavLink = ({ id, iconName, label }) => {
    const isActive = activeSection === id;

    const baseClasses = "nav-link flex items-center p-3 rounded-xl transition duration-150";
    const activeClasses = "text-dd-dark bg-white border-l-4 border-dd-orange shadow-sm";
    const inactiveClasses = "text-gray-700 hover:bg-white";

    const iconActiveClasses = "text-dd-orange";
    const iconInactiveClasses = "text-gray-500";

    // Scroll to section on click
    const handleClick = (e) => {
      e.preventDefault();
      const section = document.getElementById(id);
      if (section) {
        // Scroll behavior matching HTML's smooth scroll
        window.scrollTo({
          top: section.offsetTop - 120, // Adjust for sticky header
          behavior: "smooth",
        });
      }
    };

    return (
      <li>
        <a
          href={`#${id}`}
          onClick={handleClick}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          data-id={id}
        >
          <Icon name={iconName} className={`w-5 h-5 mr-3 ${isActive ? iconActiveClasses : iconInactiveClasses}`} />
          {label}
        </a>
      </li>
    );
  };

  return (
    <div className="bg-gray-100 font-sans text-dd-dark antialiased">
      {/* --- Sticky Header/Banner --- */}
      <header className="sticky top-0 z-30 bg-white shadow-lg">
        <div className="relative h-56 sm:h-72 overflow-hidden">
          {/* Banner Image */}
          <img
            src="https://placehold.co/1400x400/1E3A8A/ffffff?text=Premium+Restaurant+Interior"
            alt="The Local Eatery interior and signature food"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Top Right Icons */}
          <div className="absolute top-4 right-4 flex space-x-3 text-white">
            <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition duration-200">
              <Icon name="share-2" className="w-5 h-5" strokeWidth={3} />
            </button>
            <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition duration-200">
              <Icon name="heart" className="w-5 h-5 fill-white" strokeWidth={2} />
            </button>
          </div>

          {/* Logo */}
          <div className="absolute top-4 left-4">
            <div className="text-xl font-black bg-white/90 text-dd-dark p-2 rounded-xl shadow-xl backdrop-blur-sm">
              LOEAY
            </div>
          </div>
        </div>

        {/* Restaurant Info & Controls Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between">
            {/* Restaurant Name and Details */}
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-extrabold text-dd-dark">The Local Eatery</h1>
              <p className="text-gray-500 text-sm mt-1">American • Gourmet Burgers • 6759 Nebraska Ave.</p>
              <div className="flex items-center space-x-6 mt-3 text-base text-gray-700 font-medium">
                <span className="flex items-center">
                  <Icon name="star" className="w-4 h-4 text-dd-orange fill-dd-orange mr-1.5" />
                  <strong className="text-dd-dark">4.7</strong>{" "}
                  <span className="text-gray-500 ml-1">• 850+ ratings</span>
                </span>
                <span className="flex items-center">
                  <Icon name="clock" className="w-4 h-4 text-gray-500 mr-1.5" />
                  <strong className="text-dd-dark">25-35 min</strong>
                </span>
                <span className="flex items-center">
                  <Icon name="truck" className="w-4 h-4 text-gray-500 mr-1.5" />
                  <strong className="text-dd-dark">Free delivery</strong>
                </span>
              </div>
            </div>

            {/* Delivery/Pickup Segmented Control & Cart Button */}
            <div className="flex items-center space-x-4">
              {/* Segmented Control */}
              <div className="flex border border-gray-300 rounded-full p-1 bg-gray-200 text-sm font-semibold transition duration-300">
                <button
                  onClick={() => setServiceType("delivery")}
                  className={`px-5 py-2 rounded-full transition duration-200 ${
                    serviceType === "delivery" ? "bg-white shadow-lg text-dd-dark" : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setServiceType("pickup")}
                  className={`px-5 py-2 rounded-full transition duration-200 ${
                    serviceType === "pickup" ? "bg-white shadow-lg text-dd-dark" : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Cart Button */}
              <button className="bg-dd-orange text-white px-5 py-2.5 rounded-full font-bold flex items-center shadow-lg hover:shadow-xl hover:bg-dd-orange/95 transition duration-200">
                <Icon name="shopping-cart" className="w-5 h-5 mr-2" />
                View Cart (0)
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full py-3 pl-12 pr-4 text-base border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-dd-orange focus:border-dd-orange transition duration-200"
              />
              <Icon
                name="search"
                className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2"
              />
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content Area: Sticky Sidebar & Menu Items --- */}
      <main className="max-w-7xl mx-auto flex">
        {/* Left Sidebar Navigation */}
        <aside className="hidden lg:block w-64 pt-8 sticky top-[180px] z-20">
          <nav className="sticky-sidebar pr-4">
            <ul className="space-y-1 text-base font-medium">
              <NavLink id="full-menu" iconName="menu" label="Full Menu" />
              <NavLink id="deals" iconName="percent" label="Deals" />
              <NavLink id="featured" iconName="sparkles" label="Featured Items" />
              <NavLink id="burgers" iconName="burger" label="Burgers" />
              <NavLink id="sides" iconName="fries" label="Sides" />
              <NavLink id="drinks" iconName="coffee" label="Drinks" />
            </ul>

            <div className="mt-8 border-t pt-4">
              <button className="flex items-center p-3 rounded-xl text-gray-700 hover:bg-white w-full text-left transition duration-150">
                <Icon name="info" className="w-5 h-5 mr-3 text-gray-500" />
                Store Info (Hours, Address)
              </button>
            </div>
          </nav>
        </aside>

        {/* Menu Item List */}
        <div id="full-menu" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 lg:ml-8">
          {/* Deals Section */}
          <section id="deals" className="mb-12 pt-1">
            <h2 className="text-3xl font-extrabold mb-6">Deals & Benefits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl card-shadow border border-dd-orange/30">
                <p className="text-xl font-bold text-dd-orange">15% Off</p>
                <p className="text-sm text-gray-600 mt-1">First order for new customers. Limited time offer.</p>
              </div>
              <div className="bg-white p-5 rounded-xl card-shadow border border-gray-200">
                <p className="text-xl font-bold">Free Drink</p>
                <p className="text-sm text-gray-600 mt-1">With any burger purchase over $10. Select drinks only.</p>
              </div>
              <div className="bg-white p-5 rounded-xl card-shadow border border-gray-200">
                <p className="text-xl font-bold">Weekend Special</p>
                <p className="text-sm text-gray-600 mt-1">Buy two sides, get one half off. Friday to Sunday.</p>
              </div>
            </div>
          </section>

          {/* Featured Items Section */}
          <section id="featured" className="mb-12 pt-1">
            <h2 className="text-3xl font-extrabold mb-6">Featured Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Item Card 1 */}
              <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden cursor-pointer border border-gray-200">
                <img
                  src="https://placehold.co/600x400/FF7A00/ffffff?text=Smashburger"
                  alt="Smashburger Combo"
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-1">Smashburger Combo</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    Crispy, golden-brown onion crust served with tangy sauce and a side of fries.
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-black text-dd-dark">$12.99</span>
                    <button className="bg-dd-orange text-white px-5 py-2 rounded-full font-bold text-base hover:bg-dd-orange/90 transition duration-150">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
              {/* Item Card 2 */}
              <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden cursor-pointer border border-gray-200">
                <img
                  src="https://placehold.co/600x400/9333ea/ffffff?text=Chicken+Sandwich"
                  alt="Ultimate Chicken Sandwich"
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-1">Ultimate Chicken Sandwich</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    Tender chicken breast, pickle chips, house slaw, and premium brioche bun.
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-black text-dd-dark">$10.50</span>
                    <button className="bg-dd-orange text-white px-5 py-2 rounded-full font-bold text-base hover:bg-dd-orange/90 transition duration-150">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
              {/* Item Card 3 */}
              <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden cursor-pointer border border-gray-200">
                <img
                  src="https://placehold.co/600x400/059669/ffffff?text=Onion+Rings"
                  alt="Garlic Parmesan Rings"
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-1">Garlic Parmesan Rings</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    Thick-cut onion rings tossed in a savory garlic and cheese blend. Highly recommended.
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-black text-dd-dark">$5.99</span>
                    <button className="bg-dd-orange text-white px-5 py-2 rounded-full font-bold text-base hover:bg-dd-orange/90 transition duration-150">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Burgers Section */}
          <section id="burgers" className="mb-12 pt-1">
            <h2 className="text-3xl font-extrabold mb-6 pt-4 border-t border-gray-200">Burgers</h2>
            {/* List Item 1 */}
            <div className="bg-white p-5 rounded-xl card-shadow mb-4 flex justify-between items-center hover:ring-2 hover:ring-dd-orange/20 transition duration-150 cursor-pointer">
              <div className="flex-1 pr-6">
                <h3 className="text-xl font-semibold">Classic Cheeseburger</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Our signature patty with cheddar, lettuce, tomato, and secret sauce.
                </p>
                <span className="text-lg font-bold text-dd-dark mt-2 block">$9.50</span>
                <span className="text-blue-600 text-xs mt-1 block hover:underline">Customize</span>
              </div>
              <div className="relative w-28 h-28 flex-shrink-0">
                <img
                  src="https://placehold.co/112x112/f87171/ffffff?text=Burger"
                  alt="Classic Cheeseburger"
                  className="rounded-lg w-full h-full object-cover shadow-md"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-dd-orange text-white rounded-full shadow-lg hover:bg-dd-orange/90 transition">
                  <Icon name="plus" className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* List Item 2 */}
            <div className="bg-white p-5 rounded-xl card-shadow mb-4 flex justify-between items-center hover:ring-2 hover:ring-dd-orange/20 transition duration-150 cursor-pointer">
              <div className="flex-1 pr-6">
                <h3 className="text-xl font-semibold">Mushroom Swiss Burger</h3>
                <p className="text-gray-500 text-sm mt-1">
                  A rich combination of sautéed mushrooms and melted Swiss cheese.
                </p>
                <span className="text-lg font-bold text-dd-dark mt-2 block">$10.99</span>
                <span className="text-blue-600 text-xs mt-1 block hover:underline">Customize</span>
              </div>
              <div className="relative w-28 h-28 flex-shrink-0">
                <img
                  src="https://placehold.co/112x112/fbbf24/ffffff?text=Swiss"
                  alt="Mushroom Swiss Burger"
                  className="rounded-lg w-full h-full object-cover shadow-md"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-dd-orange text-white rounded-full shadow-lg hover:bg-dd-orange/90 transition">
                  <Icon name="plus" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Sides Section */}
          <section id="sides" className="mb-12 pt-1">
            <h2 className="text-3xl font-extrabold mb-6 pt-4 border-t border-gray-200">Sides</h2>
            {/* List Item 1 */}
            <div className="bg-white p-5 rounded-xl card-shadow mb-4 flex justify-between items-center hover:ring-2 hover:ring-dd-orange/20 transition duration-150 cursor-pointer">
              <div className="flex-1 pr-6">
                <h3 className="text-xl font-semibold">Seasoned Fries</h3>
                <p className="text-gray-500 text-sm mt-1">Crispy, perfectly salted fries with a side of ketchup.</p>
                <span className="text-lg font-bold text-dd-dark mt-2 block">$3.99</span>
              </div>
              <div className="relative w-28 h-28 flex-shrink-0">
                <img
                  src="https://placehold.co/112x112/60a5fa/ffffff?text=Fries"
                  alt="Seasoned Fries"
                  className="rounded-lg w-full h-full object-cover shadow-md"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-dd-orange text-white rounded-full shadow-lg hover:bg-dd-orange/90 transition">
                  <Icon name="plus" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Drinks Section */}
          <section id="drinks" className="mb-12 pt-1">
            <h2 className="text-3xl font-extrabold mb-6 pt-4 border-t border-gray-200">Drinks</h2>
            {/* List Item 1 */}
            <div className="bg-white p-5 rounded-xl card-shadow mb-4 flex justify-between items-center hover:ring-2 hover:ring-dd-orange/20 transition duration-150 cursor-pointer">
              <div className="flex-1 pr-6">
                <h3 className="text-xl font-semibold">House-made Lemonade</h3>
                <p className="text-gray-500 text-sm mt-1">Freshly squeezed lemons with a hint of mint. Refillable.</p>
                <span className="text-lg font-bold text-dd-dark mt-2 block">$3.50</span>
              </div>
              <div className="relative w-28 h-28 flex-shrink-0">
                <img
                  src="https://placehold.co/112x112/4ade80/ffffff?text=Drink"
                  alt="Lemonade"
                  className="rounded-lg w-full h-full object-cover shadow-md"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-dd-orange text-white rounded-full shadow-lg hover:bg-dd-orange/90 transition">
                  <Icon name="plus" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Note: The <style> tag with custom CSS is moved into the JSX environment */}
      <style>{`
                /* Styles from the original HTML */
                html { scroll-behavior: smooth; }
                .sticky-sidebar {
                    height: calc(100vh - 200px); 
                    overflow-y: auto;
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .sticky-sidebar::-webkit-scrollbar {
                    display: none;
                }
                .card-shadow {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
                }
            `}</style>
    </div>
  );
};

export default App;
