import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  Camera, 
  CheckCircle, 
  Navigation, 
  Package, 
  User, 
  ChevronLeft,
  AlertCircle,
  X
} from 'lucide-react';

// Import Design System Components
import { 
  DeliveryCard, 
  DeliveryButton, 
  DeliveryHeader, 
  DeliveryInfoCard, 
  DeliveryActionGroup,
  DeliveryDivider,
  DeliveryMapContainer,
  DeliveryProgressBar,
  DeliveryStatusBadge,
  DeliveryPhotoPreview,
  DeliverySuccessState,
  typography 
} from '@/components/delivery/DeliveryDesignSystem';

// ===== TYPES =====

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'pickup_photo_verification' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

interface OrderItem {
  name: string;
  quantity: number;
  special_instructions?: string;
}

interface DeliveryProgress {
  currentStage: DeliveryStage;
  stageNumber: number;
  totalStages: number;
  stageName: string;
  isCompleted: boolean;
  pickupPhotoUrl?: string;
  deliveryPhotoUrl?: string;
}

interface ActiveDeliveryProps {
  orderDetails: any;
  onCompleteDelivery: () => void;
  onProgressChange?: (progress: DeliveryProgress) => void;
}

// Main Delivery Stages
const DELIVERY_STAGES = [
  { id: 'navigate_to_restaurant', name: 'Navigate to Restaurant', icon: Navigation },
  { id: 'arrived_at_restaurant', name: 'Arrived at Restaurant', icon: MapPin },
  { id: 'verify_pickup', name: 'Verify Pickup', icon: Package },
  { id: 'pickup_photo_verification', name: 'Photo Verification', icon: Camera },
  { id: 'navigate_to_customer', name: 'Navigate to Customer', icon: Navigation },
  { id: 'capture_proof', name: 'Capture Proof', icon: Camera },
  { id: 'delivered', name: 'Delivered', icon: CheckCircle }
];

const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({ 
  orderDetails, 
  onCompleteDelivery, 
  onProgressChange 
}) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoType, setPhotoType] = useState<'pickup' | 'delivery'>('pickup');

  // Calculate progress
  const currentIndex = DELIVERY_STAGES.findIndex(s => s.id === currentStage);
  const progress = {
    currentStage,
    stageNumber: currentIndex + 1,
    totalStages: DELIVERY_STAGES.length,
    stageName: DELIVERY_STAGES[currentIndex]?.name || '',
    isCompleted: currentStage === 'delivered',
    pickupPhotoUrl: pickupPhoto,
    deliveryPhotoUrl: deliveryPhoto
  };

  // Notify parent of progress changes
  useEffect(() => {
    onProgressChange?.(progress);
  }, [currentStage, pickupPhoto, deliveryPhoto]);

  const handleStageComplete = (stage: DeliveryStage) => {
    const currentIndex = DELIVERY_STAGES.findIndex(s => s.id === stage);
    const nextStage = DELIVERY_STAGES[currentIndex + 1];
    
    if (nextStage) {
      setCurrentStage(nextStage.id as DeliveryStage);
    } else {
      // All stages completed
      onCompleteDelivery();
    }
  };

  const handlePhotoCapture = (type: 'pickup' | 'delivery') => {
    setPhotoType(type);
    setShowPhotoModal(true);
  };

  const handlePhotoConfirm = (photoUrl: string) => {
    if (photoType === 'pickup') {
      setPickupPhoto(photoUrl);
      handleStageComplete('pickup_photo_verification');
    } else {
      setDeliveryPhoto(photoUrl);
      handleStageComplete('capture_proof');
    }
    setShowPhotoModal(false);
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
        return (
          <div className="space-y-6">
            <DeliveryInfoCard
              icon={MapPin}
              title="Restaurant Location"
              subtitle={orderDetails.restaurant?.name || 'Restaurant Name'}
            >
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {orderDetails.restaurant?.address || '123 Main St, City, State'}
                </p>
                <DeliveryButton
                  onClick={() => handleStageComplete('navigate_to_restaurant')}
                  variant="primary"
                  fullWidth
                  icon={<Navigation className="w-5 h-5" />}
                >
                  Start Navigation
                </DeliveryButton>
              </div>
            </DeliveryInfoCard>

            <DeliveryCard>
              <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="space-y-2">
                {orderDetails.items?.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.special_instructions && (
                        <p className="text-sm text-gray-500">{item.special_instructions}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-orange-600">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </DeliveryCard>
          </div>
        );

      case 'arrived_at_restaurant':
        return (
          <div className="space-y-6">
            <DeliverySuccessState
              title="Arrived at Restaurant"
              message="You have arrived at the restaurant. Please proceed to verify your pickup."
            />
            
            <DeliveryActionGroup
              primaryAction={{
                onClick: () => handleStageComplete('arrived_at_restaurant'),
                children: 'Confirm Arrival'
              }}
            />
          </div>
        );

      case 'verify_pickup':
        return (
          <div className="space-y-6">
            <DeliveryInfoCard
              icon={Package}
              title="Verify Pickup"
              subtitle="Check that all items are correct before leaving"
            >
              <div className="mt-4 space-y-3">
                <DeliveryCard className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Order Checklist</h4>
                  <div className="space-y-2">
                    {orderDetails.items?.map((item: OrderItem, index: number) => (
                      <label key={index} className="flex items-center space-x-3">
                        <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" />
                        <span className="text-sm text-gray-700">{item.name} (x{item.quantity})</span>
                      </label>
                    ))}
                  </div>
                </DeliveryCard>
                
                <DeliveryActionGroup
                  primaryAction={{
                    onClick: () => handleStageComplete('verify_pickup'),
                    children: 'Items Verified'
                  }}
                />
              </div>
            </DeliveryInfoCard>
          </div>
        );

      case 'pickup_photo_verification':
        return (
          <div className="space-y-6">
            <DeliveryInfoCard
              icon={Camera}
              title="Photo Verification"
              subtitle="Take a photo of the order for verification"
            />
            
            {pickupPhoto ? (
              <DeliveryPhotoPreview
                src={pickupPhoto}
                alt="Pickup verification"
                onRemove={() => setPickupPhoto(null)}
              />
            ) : (
              <DeliveryButton
                onClick={() => handlePhotoCapture('pickup')}
                variant="primary"
                fullWidth
                icon={<Camera className="w-5 h-5" />}
              >
                Take Pickup Photo
              </DeliveryButton>
            )}
          </div>
        );

      case 'navigate_to_customer':
        return (
          <div className="space-y-6">
            <DeliveryInfoCard
              icon={MapPin}
              title="Customer Location"
              subtitle={orderDetails.customer?.name || 'Customer Name'}
            >
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {orderDetails.customer?.address || '456 Customer St, City, State'}
                </p>
                <DeliveryButton
                  onClick={() => handleStageComplete('navigate_to_customer')}
                  variant="primary"
                  fullWidth
                  icon={<Navigation className="w-5 h-5" />}
                >
                  Start Navigation
                </DeliveryButton>
              </div>
            </DeliveryInfoCard>

            <DeliveryCard>
              <h3 className="font-semibold text-gray-900 mb-3">Customer Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{orderDetails.customer?.phone || '(555) 123-4567'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Send Message</span>
                </div>
              </div>
            </DeliveryCard>
          </div>
        );

      case 'capture_proof':
        return (
          <div className="space-y-6">
            <DeliveryInfoCard
              icon={Camera}
              title="Delivery Proof"
              subtitle="Take a photo to confirm delivery"
            />
            
            {deliveryPhoto ? (
              <DeliveryPhotoPreview
                src={deliveryPhoto}
                alt="Delivery proof"
                onRemove={() => setDeliveryPhoto(null)}
              />
            ) : (
              <DeliveryButton
                onClick={() => handlePhotoCapture('delivery')}
                variant="primary"
                fullWidth
                icon={<Camera className="w-5 h-5" />}
              >
                Take Delivery Photo
              </DeliveryButton>
            )}
          </div>
        );

      case 'delivered':
        return (
          <DeliverySuccessState
            title="Delivery Complete!"
            message="Thank you for completing this delivery. Your earnings have been updated."
          >
            <DeliveryActionGroup
              primaryAction={{
                onClick: onCompleteDelivery,
                children: 'Finish Delivery'
              }}
            />
          </DeliverySuccessState>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DeliveryHeader
        title="Active Delivery"
        subtitle={`Step ${currentIndex + 1} of ${DELIVERY_STAGES.length}`}
        onBack={() => window.history.back()}
      />
      
      <DeliveryProgressBar 
        currentStep={currentIndex} 
        totalSteps={DELIVERY_STAGES.length} 
      />

      <div className="p-4 space-y-6">
        {renderStageContent()}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <DeliveryCard className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {photoType === 'pickup' ? 'Pickup Photo' : 'Delivery Photo'}
              </h3>
              
              <div className="space-y-4">
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
                
                <DeliveryActionGroup
                  secondaryAction={{
                    onClick: () => setShowPhotoModal(false),
                    children: 'Cancel'
                  }}
                  primaryAction={{
                    onClick: () => handlePhotoConfirm('https://via.placeholder.com/400x300'),
                    children: 'Confirm Photo'
                  }}
                />
              </div>
            </div>
          </DeliveryCard>
        </div>
      )}
    </div>
  );
};

export default ActiveDeliveryFlow;