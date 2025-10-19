import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, X } from 'lucide-react';
import cravenLogo from "@/assets/craven-logo.png";
const CraveMore: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'student'>('monthly');
  const benefits = [{
    id: 1,
    title: "Restaurant Delivery",
    description: "$0 delivery fee, lower service fees on orders over the minimum subtotal",
    icon: "🍽️"
  }, {
    id: 2,
    title: "Pickup",
    description: "5% CraveMore credits back on Pickup orders",
    icon: "🛍️"
  }, {
    id: 3,
    title: "Grocery & More",
    description: "Save with on-demand grocery delivery for your essentials and more",
    icon: "🛒"
  }, {
    id: 4,
    title: "Exclusive Offers",
    description: "Member-only exclusive offers. Only subscription with $0 delivery fees at partner restaurants",
    icon: "🎁"
  }, {
    id: 5,
    title: "Best Selection",
    description: "Thousands of local and national favorites in your neighborhood",
    icon: "⭐"
  }, {
    id: 6,
    title: "Cancel Anytime",
    description: "No contracts and seamless cancellation process",
    icon: "❌"
  }];
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <img src={cravenLogo} alt="CRAVE'N" className="h-10" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Side Menu */}
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <nav className="space-y-1">
              <button onClick={() => navigate('/restaurants')} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <span className="font-medium">Restaurants</span>
              </button>
              <button onClick={() => navigate('/crave-more')} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors bg-blue-100 text-blue-900">
                <span className="font-medium">CraveMore</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Hero Section */}
          <div className="relative px-8 py-16" style={{
          background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)'
        }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-100 bg-slate-950">
              <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-orange-700"></div>
              <div className="absolute top-32 right-40 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute bottom-20 right-16 w-40 h-40 rounded-full bg-orange-500"></div>
            </div>

            <div className="relative max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Logo */}
                  <div className="flex items-center mb-8">
                    
                    <div className="flex items-center">
                      <span className="font-bold text-orange-500 text-6xl px-0 mx-0">    Crave</span>
                      <span className="font-bold ml-1 text-slate-50 text-6xl mx-0 px-0 py-0 my-0">More</span>
                    </div>
                  </div>

                  {/* Headlines */}
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-orange-500 mx-[110px]">
                    Get $0 delivery fees on eligible orders
                  </h1>
                  <p className="text-xl mb-8 text-slate-50">
                    Save on restaurants, groceries, retail and more.
                  </p>
                </div>

                {/* Food Images */}
                <div className="hidden lg:block relative">
                  <div className="relative">
                    <div className="w-64 h-64 rounded-lg shadow-lg transform rotate-3 bg-amber-400"></div>
                    <div className="absolute top-4 left-4 w-56 h-56 bg-gray-100 rounded-lg shadow-lg transform -rotate-2"></div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="px-8 py-16 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {benefits.map(benefit => <div key={benefit.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
                  </div>)}
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
                <div className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedPlan('monthly')}>
                  {selectedPlan === 'monthly' && <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>}
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Monthly plan without HBO Max
                  </h3>
                  <div className="text-3xl font-bold text-black">
                    $9.99/month
                  </div>
                </div>

                {/* Annual Plan */}
                <div className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${selectedPlan === 'annual' ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedPlan('annual')}>
                  {selectedPlan === 'annual' && <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>}
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
                <div className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${selectedPlan === 'student' ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedPlan('student')}>
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
    </div>;
};
export default CraveMore;