import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Clock, DollarSign, MapPin, Upload, X, Image } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  is_active: boolean;
  image_url?: string;
  logo_url?: string;
}

interface RestaurantSettingsProps {
  restaurant: Restaurant;
  onUpdate: () => void;
}

const cuisineTypes = [
  "American", "Italian", "Chinese", "Mexican", "Japanese", "Indian", 
  "Thai", "Mediterranean", "French", "Greek", "Korean", "Vietnamese",
  "Middle Eastern", "Seafood", "Steakhouse", "Pizza", "Burgers", 
  "BBQ", "Vegetarian", "Vegan", "Fast Food", "Other"
];

export const RestaurantSettings = ({ restaurant, onUpdate }: RestaurantSettingsProps) => {
  const [formData, setFormData] = useState(restaurant);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(restaurant);
  }, [restaurant]);

  const handleInputChange = (field: keyof Restaurant, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadImage = async (file: File, type: 'image' | 'logo'): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = await uploadImage(file, type);
    if (imageUrl) {
      const field = type === 'logo' ? 'logo_url' : 'image_url';
      handleInputChange(field, imageUrl);
    }
  };

  const saveBasicInfo = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          description: formData.description,
          cuisine_type: formData.cuisine_type,
          phone: formData.phone,
          email: formData.email,
          image_url: formData.image_url,
          logo_url: formData.logo_url,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Basic information updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating basic info:", error);
      toast({
        title: "Error",
        description: "Failed to update basic information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating address:", error);
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveDeliverySettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          delivery_fee_cents: formData.delivery_fee_cents,
          min_delivery_time: formData.min_delivery_time,
          max_delivery_time: formData.max_delivery_time,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery settings updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating delivery settings:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async () => {
    setSaving(true);
    try {
      const newStatus = !formData.is_active;
      const { error } = await supabase
        .from("restaurants")
        .update({ is_active: newStatus })
        .eq("id", restaurant.id);

      if (error) throw error;

      setFormData(prev => ({ ...prev, is_active: newStatus }));
      
      toast({
        title: "Success", 
        description: `Restaurant ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update restaurant status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your restaurant's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine">Cuisine Type</Label>
                  <Select value={formData.cuisine_type} onValueChange={(value) => handleInputChange('cuisine_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineTypes.map((cuisine) => (
                        <SelectItem key={cuisine} value={cuisine}>
                          {cuisine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={saveBasicInfo} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Basic Info"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Restaurant Images
              </CardTitle>
              <CardDescription>
                Upload your restaurant logo and photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="restaurant-logo">Restaurant Logo</Label>
                  <div className="flex flex-col gap-2 mt-2">
                    <Input
                      id="restaurant-logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4 animate-spin" />
                        Uploading logo...
                      </div>
                    )}
                    {formData.logo_url && (
                      <div className="relative w-32 h-32">
                        <img
                          src={formData.logo_url}
                          alt="Restaurant logo"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => handleInputChange('logo_url', '')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="restaurant-image">Restaurant Photo</Label>
                  <div className="flex flex-col gap-2 mt-2">
                    <Input
                      id="restaurant-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'image')}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4 animate-spin" />
                        Uploading image...
                      </div>
                    )}
                    {formData.image_url && (
                      <div className="relative w-48 h-32">
                        <img
                          src={formData.image_url}
                          alt="Restaurant photo"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => handleInputChange('image_url', '')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={saveBasicInfo} disabled={saving || uploadingImage}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Images"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
              <CardDescription>
                Update your restaurant's address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={saveAddress} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Address"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Delivery Settings
              </CardTitle>
              <CardDescription>
                Configure your delivery options and timing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-fee">Delivery Fee ($)</Label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="delivery-fee"
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee_cents / 100}
                    onChange={(e) => handleInputChange('delivery_fee_cents', Math.round(parseFloat(e.target.value) * 100))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-time">Minimum Delivery Time (minutes)</Label>
                  <Input
                    id="min-time"
                    type="number"
                    value={formData.min_delivery_time}
                    onChange={(e) => handleInputChange('min_delivery_time', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-time">Maximum Delivery Time (minutes)</Label>
                  <Input
                    id="max-time"
                    type="number"
                    value={formData.max_delivery_time}
                    onChange={(e) => handleInputChange('max_delivery_time', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={saveDeliverySettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Delivery Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Status</CardTitle>
              <CardDescription>
                Control whether your restaurant is accepting orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="active-status">Restaurant Active</Label>
                  <p className="text-sm text-muted-foreground">
                    When active, customers can view and order from your restaurant
                  </p>
                </div>
                <Switch
                  id="active-status"
                  checked={formData.is_active}
                  onCheckedChange={toggleActiveStatus}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};