import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Zap, Shield, Clock } from "lucide-react";
import cravemoreIcon from "@/assets/cravemore-icon.png";
import { CraveMoreText } from "@/components/ui/cravemore-text";

const Hero = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Zap, text: "Zero delivery fees with", highlight: true },
    { icon: Shield, text: "Priority customer support" },
    { icon: Clock, text: "Exclusive early access to new restaurants" },
    { icon: Sparkles, text: "Special member-only discounts" }
  ];

  const pricingTiers = [
    {
      name: "Monthly",
      price: "$8.99",
      period: "per month",
      features: ["All benefits", "Cancel anytime", "Instant activation"]
    },
    {
      name: "Annual",
      price: "$90.00",
      period: "per year",
      savings: "Save $17.88",
      features: ["All benefits", "2 months free", "Best value"],
      popular: true
    },
    {
      name: "Lifetime",
      price: "$249.00",
      period: "one-time",
      savings: "Limited to first 1,000 customers",
      features: ["All benefits", "Never pay again", "Exclusive founding member status"],
      limited: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-hero">
        <div className="relative text-center text-white px-4 animate-fade-in">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              Crave'N
            </h1>
            
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Your Local Food Delivery Partner
            </h2>
            
            <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 font-medium max-w-3xl mx-auto">
              We connect you with the best local restaurants in your area, delivering delicious meals right to your door with unbeatable service and value.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">Who We Are</h2>
            <div className="text-lg text-muted-foreground max-w-4xl mx-auto space-y-6 text-left">
              <p>
                Crave'n is a next-generation food delivery company built on a simple principle: when local businesses succeed, entire communities benefit. We are redefining the delivery landscape by prioritizing fairness, transparency, and sustainable growth for restaurants, drivers, and customers.
              </p>
              <p>
                Crave'n was created with a mission to restore balance in an industry that often disadvantages small businesses. Our platform uses advanced logistics and modern technology to empower independent restaurants with the tools, insights, and operational support they need to compete at scale. We believe every neighborhood kitchen deserves the opportunity to thrive without sacrificing profits to excessive fees or restrictive practices.
              </p>
              <p>
                Our commitment reaches far beyond convenience. We focus on strengthening merchant relationships, improving delivery infrastructure, and creating meaningful earning opportunities for drivers. For customers, we deliver an elevated experience centered on reliability, speed, accuracy, and trust.
              </p>
              <p>
                Crave'n is not just delivering meals. We are reshaping the future of local commerce by championing equitable economics, community driven innovation, and uncompromising service quality. Our goal is to build a platform where every participant benefits, from the restaurant to the driver to the customer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CraveMore Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <img 
              src={cravemoreIcon} 
              alt="CraveMore" 
              className="w-24 h-24 mx-auto mb-6 animate-fade-in"
            />
            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-6 py-2 rounded-full mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Introducing <CraveMoreText /></span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Unlimited Perks, Zero Delivery Fees
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Join <CraveMoreText /> and unlock unlimited benefits designed to make every meal special
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <benefit.icon className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <p className="font-medium text-foreground">
                  {benefit.text}
                  {benefit.highlight && <> <CraveMoreText className="justify-center mt-1" /></>}
                </p>
              </Card>
            ))}
          </div>

          {/* Pricing Tiers */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`p-8 relative ${tier.popular ? 'border-orange-500 border-2 shadow-xl' : ''} ${tier.limited ? 'border-orange-600 border-2 shadow-2xl' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                {tier.limited && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold animate-pulse">
                    Limited Offer
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{tier.name}</h3>
                  <div className="text-4xl font-bold text-orange-500 mb-1">{tier.price}</div>
                  <p className="text-sm text-muted-foreground">{tier.period}</p>
                  {tier.savings && (
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-2">
                      {tier.savings}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6"
                  onClick={() => navigate('/restaurants')}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Start Saving?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join thousands of satisfied customers who are already enjoying unlimited benefits
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/restaurants')}
            className="h-14 px-12 text-lg font-bold bg-white text-orange-500 hover:bg-white/90 shadow-2xl rounded-xl transform hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              Order Now & Join <CraveMoreText />
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Hero;