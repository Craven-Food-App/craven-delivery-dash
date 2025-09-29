// src/screens/OrderVerificationScreen.tsx
// @ts-nocheck
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  User,
  MapPin,
  Phone,
  MessageSquare,
  Camera,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Store,
  Truck,
  Home,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeliveryCamera } from "./DeliveryCamera";
import { supabase } from "@/integrations/supabase/client";
import cravenLogo from "@/assets/craven-c.png";

interface OrderItem {
  name: string;
  quantity: number;
  price_cents: number;
  special_instructions?: string;
}

interface OrderVerificationProps {
  orderDetails: {
    id: string;
    order_number: string;
    restaurant_name: string;
    customer_name: string;
    customer_phone?: string;
    pickup_address: any;
    dropoff_address: any;
    items: OrderItem[];
    subtotal_cents: number;
    delivery_notes?: string;
    payout_cents: number;
    pickup_by?: string;
    isTestOrder?: boolean;
  };
  onPickupConfirmed: (pickupPhotoUrl?: string) => void;
  onCancel: () => void;
}

export const OrderVerificationScreen: React.FC<OrderVerificationProps> = ({
  orderDetails,
  onPickupConfirmed,
  onCancel,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const { toast } = useToast();

  // Calculate payout if not set (70% of delivery fee + base amount)
  const calculatePayout = () => {
    if (orderDetails.payout_cents && orderDetails.payout_cents > 0) {
      return orderDetails.payout_cents;
    }
    const deliveryFee = 299;
    const baseAmount = 300;
    return Math.round(deliveryFee * 0.7 + baseAmount);
  };

  const formatAddress = (address: any, fallbackAddress?: string) => {
    if (typeof address === "string") return address;
    if (typeof address === "object" && address) {
      return `${address.street || ""} ${address.city || ""} ${
        address.state || ""
      } ${address.zip || ""}`.trim();
    }
    if (fallbackAddress) return fallbackAddress;
    return "Address not available";
  };

  const updateOrderStatus = async (status: string, fields: Record<string, any> = {}) => {
    if (orderDetails.isTestOrder) return;
    const { error } = await supabase
      .from("orders")
      .update({ order_status: status, ...fields })
      .eq("id", orderDetails.id);
    if (error) console.error("Order update error:", error);
  };

  const handlePhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileName = `pickup-${orderDetails.order_number}-${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("delivery-photos")
        .upload(filePath, photoBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("delivery-photos").getPublicUrl(filePath);

      await updateOrderStatus("picked_up", {
        pickup_photo_url: publicUrl,
        pickup_confirmed_at: new Date().toISOString(),
      });

      setPickupPhoto(publicUrl);
      setShowCamera(false);

      toast({
        title: "Pickup Confirmed!",
        description: "Order photo captured and pickup confirmed.",
      });

      setTimeout(() => {
        onPickupConfirmed(publicUrl);
      }, 1500);
    } catch (error: any) {
      console.error("Error uploading pickup photo:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload pickup photo. Please try again.",
        variant: "destructive",
      });
    }
    setIsUploadingPhoto(false);
  };

  const handleConfirmWithoutPhoto = async () => {
    try {
      await updateOrderStatus("picked_up", {
        pickup_confirmed_at: new Date().toISOString(),
      });

      toast({
        title: "Pickup Confirmed!",
        description: orderDetails.isTestOrder
          ? "Test pickup confirmed"
          : "Ready to deliver to customer.",
      });

      onPickupConfirmed();
    } catch (error: any) {
      console.error("Error confirming pickup:", error);
      toast({
        title: "Update Failed",
        description: "Failed to confirm pickup. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (showCamera) {
    return (
      <div className="absolute inset-0 z-10 bg-background">
        <div className="p-4">
          <h2 className="text-xl font-bold text-center">Take Pickup Photo</h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Capture a photo of the order for verification
          </p>
          <DeliveryCamera
            onPhotoCapture={handlePhotoCapture}
            onCancel={() => setShowCamera(false)}
            isUploading={isUploadingPhoto}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-background">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with pickup time */}
        <div className="bg-black text-white rounded-b-3xl px-4 py-6 text-center">
          <Clock className="h-5 w-5 mx-auto mb-2 text-orange-400" />
          <h1 className="text-lg font-semibold">
            Pick up by{" "}
            {orderDetails.pickup_by
              ? new Date(orderDetails.pickup_by).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "N/A"}
          </h1>
        </div>

        <div className="px-4 space-y-4">
          {orderDetails.isTestOrder && (
            <div className="p-4 bg-orange-100 border border-orange-300 rounded-xl">
              <p className="font-bold text-orange-800">🧪 Test Order</p>
              <p className="text-sm text-orange-700">
                This is a test order. You can skip the photo or take one for testing.
              </p>
            </div>
          )}

          {/* Customer + Restaurant Info */}
          <div className="flex items-center gap-3">
            <img src={cravenLogo} alt="Crave'N" className="w-8 h-8" />
            <div>
              <p className="text-gray-600 text-sm">Order for</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {orderDetails.customer_name || "Customer"}
              </h2>
            </div>
            <div className="ml-auto flex gap-2">
              {orderDetails.customer_phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 rounded-full bg-gray-200"
                  onClick={() =>
                    orderDetails.isTestOrder
                      ? toast({
                          title: "Test Mode",
                          description:
                            "Would call " + orderDetails.customer_phone,
                        })
                      : window.open(`tel:${orderDetails.customer_phone}`)
                  }
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-full bg-gray-200"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Delivery Notes */}
          {orderDetails.delivery_notes && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
              <StickyNote className="text-yellow-600 h-5 w-5 mt-0.5" />
              <p className="text-sm text-yellow-700">
                {orderDetails.delivery_notes}
              </p>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm">
            <div
              className="flex items-center justify-between cursor-pointer py-3 px-4"
              onClick={() => setShowOrderItems(!showOrderItems)}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">
                  {orderDetails.items.length} items
                </span>
              </div>
              {showOrderItems ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            {showOrderItems && (
              <div className="space-y-3 pb-4 px-4">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="border-l-2 border-orange-200 pl-4">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs">{item.quantity}×</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        {item.special_instructions && (
                          <p className="text-sm text-gray-600">
                            {item.special_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DD-style Action Buttons */}
          <Button
            onClick={() => updateOrderStatus("arrived_at_store")}
            className="w-full h-12 bg-blue-500 text-white rounded-xl"
          >
            <Store className="h-4 w-4 mr-2" />
            Arrived at Store
          </Button>

          <Button
            onClick={() => setShowCamera(true)}
            className="w-full h-14 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg rounded-xl"
          >
            <Camera className="h-5 w-5 mr-2" />
            Verify Pickup with Photo
          </Button>

          <Button
            onClick={handleConfirmWithoutPhoto}
            variant="outline"
            className="w-full h-12 border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {orderDetails.isTestOrder
              ? "Test: Confirm Pickup"
              : "Confirm Pickup (No Photo)"}
          </Button>

          <Button
            onClick={() => updateOrderStatus("delivering")}
            className="w-full h-12 bg-indigo-500 text-white rounded-xl"
          >
            <Truck className="h-4 w-4 mr-2" />
            Start Delivery
          </Button>

          <Button
            onClick={() => updateOrderStatus("delivered")}
            className="w-full h-12 bg-green-500 text-white rounded-xl"
          >
            <Home className="h-4 w-4 mr-2" />
            Confirm Delivery
          </Button>

          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full h-10 text-gray-500"
          >
            Back to Navigation
          </Button>

          {/* Earnings */}
          <div className="p-4 bg-gray-100 rounded-xl flex items-center justify-between">
            <span className="text-gray-600">Earnings</span>
            <span className="font-bold text-lg">
              ${(calculatePayout() / 100).toFixed(2)}
            </span>
          </div>

          {pickupPhoto && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="text-green-800 font-semibold">Pickup Confirmed!</p>
                  <p className="text-sm text-green-600">
                    Photo uploaded successfully
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
