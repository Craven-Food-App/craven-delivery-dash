import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, X, Search, MapPin, Bell, ShoppingCart, Menu, Home, Store, Coffee, Heart, Shield, User, Clock } from 'lucide-react';
import cravenLogo from "@/assets/craven-logo.png";
import AccountPopup from '@/components/AccountPopup';
import Footer from '@/components/Footer';

const CraveMore: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'student'>('monthly');
  
  // Header state
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('6759 Nebraska Ave');
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Account popup state
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [accountPopupPosition, setAccountPopupPosition] = useState({ top: 0, left: 0 });
  
  // Active category state
  const [activeCategory, setActiveCategory] = useState('crave-more');

  // Helper functions
  const handleAddressSearch = (query: string) => {
    // Mock address suggestions
    const suggestions = [
      '6759 Nebraska Ave, Tampa, FL',
      '123 Main St, Tampa, FL',
      '456 Oak Ave, Tampa, FL'
    ].filter(addr => addr.toLowerCase().includes(query.toLowerCase()));
    setAddressSuggestions(suggestions);
  };

  const selectAddress = (address: string) => {
    setLocation(address);
    setShowAddressSelector(false);
    setAddressSuggestions([]);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  // Navigation categories
  const navCategories = [
    { id: 'all', label: 'All', icon: Home, active: activeCategory === 'all' },
    { id: 'grocery', label: 'Grocery', icon: Store, active: activeCategory === 'grocery' },
    { id: 'convenience', label: 'Convenience', icon: Coffee, active: activeCategory === 'convenience' },
    { id: 'dashmart', label: 'CraveMart', icon: Store, active: activeCategory === 'dashmart' },
    { id: 'beauty', label: 'Beauty', icon: Heart, active: activeCategory === 'beauty' },
    { id: 'pets', label: 'Pets', icon: Heart, active: activeCategory === 'pets' },
    { id: 'health', label: 'Health', icon: Shield, active: activeCategory === 'health' },
    { id: 'crave-more', label: 'CraveMore', icon: Store, active: activeCategory === 'crave-more' },
    { id: 'orders', label: 'Orders', icon: Clock, active: activeCategory === 'orders' },
    { id: 'account', label: 'Account', icon: User, active: activeCategory === 'account' }
  ];

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    if (categoryId === 'orders') {
      window.location.href = '/customer-dashboard?tab=orders';
      return;
    } else if (categoryId === 'account') {
      const sideMenuElement = document.querySelector('.side-menu-container');
      if (sideMenuElement) {
        const rect = sideMenuElement.getBoundingClientRect();
        setAccountPopupPosition({
          top: rect.top + 100,
          left: rect.right + 20
        });
      } else {
        setAccountPopupPosition({ top: 100, left: 300 });
      }
      setShowAccountPopup(true);
      return;
    } else if (categoryId !== 'crave-more') {
      navigate('/restaurants');
      return;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowAddressSelector(false);
        setShowNotifications(false);
        setShowCart(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const benefits = [
    {
      id: 1,
      title: "Restaurant Delivery",
      description: "$0 delivery fee, lower service fees on orders over the minimum subtotal",
      icon: "🍽️"
    },
    {
      id: 2,
      title: "Pickup",
      description: "5% CraveMore credits back on Pickup orders",
      icon: "🛍️"
    },
    {
      id: 3,
      title: "Grocery & More",
      description: "Save with on-demand grocery delivery for your essentials and more",
      icon: "🛒"
    },
    {
      id: 4,
      title: "Exclusive Offers",
      description: "Member-only exclusive offers. Only subscription with $0 delivery fees at partner restaurants",
      icon: "🎁"
    },
    {
      id: 5,
      title: "Best Selection",
      description: "Thousands of local and national favorites in your neighborhood",
      icon: "⭐"
    },
    {
      id: 6,
      title: "Cancel Anytime",
      description: "No contracts and seamless cancellation process",
      icon: "❌"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center space-x-4">
              <img src={cravenLogo} alt="CRAVE'N" className="h-10" />
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  placeholder="Search Crave'N" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Right: Location, Delivery/Pickup, Notifications, Cart */}
            <div className="flex items-center space-x-4">
              {/* Location Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowAddressSelector(!showAddressSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-32 truncate">{location}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Address Selector Dropdown */}
                {showAddressSelector && (
                  <div data-dropdown className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Select delivery address</h3>
                      <div className="space-y-2">
                        <input
                          placeholder="Search for an address"
                          onChange={(e) => handleAddressSearch(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                        {addressSuggestions.length > 0 && (
                          <div className="space-y-1">
                            {addressSuggestions.map((address, index) => (
                              <button
                                key={index}
                                onClick={() => selectAddress(address)}
                                className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-sm"
                              >
                                {address}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <button className="text-orange-600 text-sm font-medium">
                            Add new address
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery/Pickup Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setDeliveryMode('delivery')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    deliveryMode === 'delivery' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Delivery
                </button>
                <button 
                  onClick={() => setDeliveryMode('pickup')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    deliveryMode === 'pickup' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div data-dropdown className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button className="text-sm text-orange-600">Mark all as read</button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-3 rounded-lg border ${
                                notification.read ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="relative">
                <button 
                  onClick={() => setShowCart(!showCart)}
                  className="relative"
                >
                  <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                {showCart && (
                  <div data-dropdown className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Your Cart</h3>
                        <button className="text-sm text-orange-600">Clear all</button>
                      </div>
                      {cartItems.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cartItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                                <p className="text-xs text-gray-600">${item.price?.toFixed(2) || '0.00'}</p>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold">Total: ${getCartTotal().toFixed(2)}</span>
                            </div>
                            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium">
                              Checkout
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Your cart is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu */}
              <button 
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="lg:hidden p-2"
              >
                {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Right Side Navigation */}
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 min-h-screen side-menu-container">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Browse</h3>
            <nav className="space-y-1">
              {navCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <category.icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Hero Section - CraveMore Header Image */}
          <div className="relative w-full h-96 overflow-hidden">
            <img 
              src="/src/assets/cravemore-header.png" 
              alt="CraveMore - Get $0 delivery fees on eligible orders"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a placeholder if image doesn't exist
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
            {/* Fallback content if image doesn't load */}
            <div 
              className="hidden w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
              }}
            >
              <div className="text-center text-white max-w-4xl mx-auto px-8">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center">
                    <span className="text-orange-500 font-bold text-4xl">Crave</span>
                    <span className="text-white font-bold text-4xl ml-2">More</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-orange-500 mb-6">
                  Get $0 delivery fees on eligible orders
                </h1>
                <p className="text-xl text-gray-300">
                  Save on restaurants, groceries, retail and more.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="px-8 py-16 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {benefits.map((benefit) => (
                  <div key={benefit.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{benefit.icon}</div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-left">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                  Learn more about benefit details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Plan Selection Section */}
          <div className="px-8 py-16 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">
                Choose your plan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Monthly Plan */}
                <div 
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlan === 'monthly' 
                      ? 'border-black' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  {selectedPlan === 'monthly' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Monthly plan without HBO Max
                  </h3>
                  <div className="text-3xl font-bold text-black">
                    $9.99/month
                  </div>
                </div>

                {/* Annual Plan */}
                <div 
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlan === 'annual' 
                      ? 'border-black' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('annual')}
                >
                  {selectedPlan === 'annual' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Annual plan with HBO Max
                  </h3>
                  <div className="text-3xl font-bold text-black mb-2">
                    $8/mo ($96/year, one time charge)
                  </div>
                  <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium mb-2 inline-block">
                    HBO Max
                  </div>
                  <p className="text-gray-600 text-sm">
                    Stream iconic series, hit movies, fresh originals and more on HBO Max Basic With Ads.
                  </p>
                </div>

                {/* Student Plan */}
                <div 
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlan === 'student' 
                      ? 'border-black' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('student')}
                >
                  <div className="absolute top-4 right-4">
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Student Plans
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Same great benefits for half the price
                  </p>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    Now Available
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                      VISA
                    </div>
                    <span className="text-gray-700">Visa....1319</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Terms */}
              <div className="text-center text-sm text-gray-500 mb-8">
                By continuing, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                . You can{' '}
                <a href="#" className="text-red-600 hover:underline">Cancel</a>
                {' '}anytime.
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <button className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors">
                  Start 30-day free trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Browse</h3>
                <button 
                  onClick={() => setShowMobileNav(false)}
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleCategoryClick(category.id);
                      setShowMobileNav(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <category.icon className="w-5 h-5" />
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Account Popup */}
      <AccountPopup 
        isOpen={showAccountPopup}
        onClose={() => setShowAccountPopup(false)}
        position={accountPopupPosition}
      />
    </div>
  );
};

export default CraveMore;
