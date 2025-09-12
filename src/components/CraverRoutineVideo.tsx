import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CraverRoutineVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Login for the Day",
      description: "Driver opens the app and logs in",
      duration: 2000
    },
    {
      title: "Choose Time Frame",
      description: "Select preferred working hours",
      duration: 2000
    },
    {
      title: "Go Live",
      description: "Driver goes online and becomes available",
      duration: 2000
    },
    {
      title: "Receive Order",
      description: "New order notification appears",
      duration: 2500
    },
    {
      title: "Accept Order",
      description: "Driver accepts the delivery request",
      duration: 2000
    },
    {
      title: "Pick Up Order",
      description: "Navigate to restaurant and collect food",
      duration: 3000
    },
    {
      title: "Drop Off Order",
      description: "Deliver to customer's location",
      duration: 3000
    },
    {
      title: "Take Photo",
      description: "Capture proof of delivery",
      duration: 2500
    },
    {
      title: "Complete Order",
      description: "Mark delivery as complete and earn money",
      duration: 2000
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, steps[currentStep]?.duration || 2000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-gradient-to-br from-background via-muted/20 to-primary/5 rounded-2xl overflow-hidden shadow-elegant">
      {/* Video Container */}
      <div className="relative aspect-video bg-gradient-to-b from-muted/30 to-background">
        {/* Phone Screen Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Phone Frame */}
            <div className="w-64 h-[450px] bg-foreground rounded-[2.5rem] p-2 shadow-glow">
              <div className="w-full h-full bg-background rounded-[2rem] overflow-hidden relative">
                
                {/* Status Bar */}
                <div className="h-8 bg-muted/50 flex items-center justify-between px-4 text-xs">
                  <span>9:41</span>
                  <span>100%</span>
                </div>

                {/* App Content based on current step */}
                <div className="flex-1 p-4">
                  {currentStep === 0 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="text-center mt-20">
                        <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-4">Welcome Back!</h3>
                        <div className="space-y-3">
                          <div className="h-10 bg-muted rounded animate-pulse"></div>
                          <div className="h-10 bg-muted rounded animate-pulse"></div>
                          <div className="h-10 bg-primary rounded flex items-center justify-center">
                            <span className="text-white font-medium">Login</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-6">Choose Your Hours</h3>
                        <div className="space-y-4">
                          <div className="p-3 border border-primary rounded-lg bg-primary/10">
                            <div className="font-medium">Today</div>
                            <div className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Evening</div>
                            <div className="text-sm text-muted-foreground">5:00 PM - 11:00 PM</div>
                          </div>
                          <div className="h-10 bg-primary rounded flex items-center justify-center mt-6">
                            <span className="text-white font-medium">Confirm Schedule</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="text-center mt-16">
                        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Going Live...</h3>
                        <p className="text-sm text-muted-foreground mb-6">You're now available for deliveries</p>
                        <div className="h-12 bg-green-500 rounded flex items-center justify-center">
                          <span className="text-white font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-scale-in' : ''}`}>
                      <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-lg text-white mt-8">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">New Order!</h3>
                          <div className="w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>🍕 Pizza Palace</div>
                          <div>📍 2.1 miles away</div>
                          <div>💰 $12.50 payout</div>
                          <div>⏱️ 15 min delivery</div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="h-8 bg-white/20 rounded flex items-center justify-center">
                            <span className="text-xs">Decline</span>
                          </div>
                          <div className="h-8 bg-white rounded flex items-center justify-center">
                            <span className="text-primary text-xs font-medium">Accept</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="mt-8">
                        <div className="bg-green-500 text-white p-3 rounded-lg mb-4 text-center">
                          ✅ Order Accepted!
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted/50 rounded">
                            <div className="font-medium">Pizza Palace</div>
                            <div className="text-sm text-muted-foreground">123 Main St</div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Status:</span>
                            <span className="text-primary font-medium">En Route to Restaurant</span>
                          </div>
                          <div className="h-10 bg-primary rounded flex items-center justify-center">
                            <span className="text-white font-medium">Navigate</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="mt-8">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                            🍕
                          </div>
                          <h3 className="font-semibold">At Restaurant</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-orange-100 rounded border-l-4 border-orange-500">
                            <div className="text-sm">Order #1234 for Mike</div>
                            <div className="text-xs text-muted-foreground">Large Pepperoni Pizza</div>
                          </div>
                          <div className="h-10 bg-orange-500 rounded flex items-center justify-center">
                            <span className="text-white font-medium">Mark as Picked Up</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="mt-8">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center animate-pulse">
                            🚗
                          </div>
                          <h3 className="font-semibold">En Route to Customer</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-100 rounded">
                            <div className="text-sm font-medium">Mike Johnson</div>
                            <div className="text-xs text-muted-foreground">456 Oak Avenue</div>
                            <div className="text-xs text-muted-foreground">ETA: 8 minutes</div>
                          </div>
                          <div className="h-10 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white font-medium">Navigate to Customer</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 7 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-fade-in' : ''}`}>
                      <div className="mt-8">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                            📸
                          </div>
                          <h3 className="font-semibold">Take Delivery Photo</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                                📦
                              </div>
                              <div className="text-xs text-muted-foreground">Order on porch</div>
                            </div>
                          </div>
                          <div className="h-10 bg-purple-500 rounded flex items-center justify-center">
                            <span className="text-white font-medium">Capture Photo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 8 && (
                    <div className={`transition-all duration-1000 ${isPlaying ? 'animate-scale-in' : ''}`}>
                      <div className="mt-8 text-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                          ✅
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Delivery Complete!</h3>
                        <div className="bg-green-100 p-4 rounded-lg mb-4">
                          <div className="text-2xl font-bold text-green-600">+$12.50</div>
                          <div className="text-sm text-muted-foreground">Added to your earnings</div>
                        </div>
                        <div className="h-10 bg-green-500 rounded flex items-center justify-center">
                          <span className="text-white font-medium">Find Next Order</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Floating elements */}
            {isPlaying && (
              <>
                {/* Notification badge */}
                {currentStep === 3 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs">1</span>
                  </div>
                )}
                
                {/* Money animation */}
                {currentStep === 8 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    💰
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
            <h4 className="font-semibold text-lg">{steps[currentStep]?.title}</h4>
            <p className="text-sm text-muted-foreground">{steps[currentStep]?.description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-background/50">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAnimation}
            disabled={isPlaying}
          >
            Reset
          </Button>
          <Button
            onClick={togglePlayback}
            className="flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {currentStep === 0 ? 'Play' : 'Resume'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CraverRoutineVideo;