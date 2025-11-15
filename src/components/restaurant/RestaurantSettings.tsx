import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  TextInput,
  Textarea,
  Switch,
  Select,
  Tabs,
  Text,
  Title,
  Stack,
  Group,
  Box,
  Loader,
  ActionIcon,
  Divider,
  FileButton,
  Image as MantineImage,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDeviceFloppy,
  IconClock,
  IconCurrencyDollar,
  IconMapPin,
  IconUpload,
  IconX,
  IconPhoto,
  IconCrop,
  IconScissors,
} from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import ImageCropper from "@/components/common/ImageCropper";
import { removeBackground, loadImage } from "@/utils/BackgroundRemovalService";
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";

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
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState('');
  const [cropperImageType, setCropperImageType] = useState<'image' | 'logo'>('logo');
  const [removingBackground, setRemovingBackground] = useState(false);

  useEffect(() => {
    setFormData(restaurant);
  }, [restaurant]);

  const handleInputChange = (field: keyof Restaurant, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadImage = async (file: File | Blob, type: 'image' | 'logo'): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'png';
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
      notifications.show({
        title: "Error",
        message: "Failed to upload image",
        color: 'red',
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifications.show({
        title: "Error",
        message: "Please select an image file",
        color: 'red',
      });
      return;
    }

    // Create URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImageSrc(imageUrl);
    setCropperImageType(type);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setCropperOpen(false);
    
    const imageUrl = await uploadImage(croppedImageBlob, cropperImageType);
    if (imageUrl) {
      const field = cropperImageType === 'logo' ? 'logo_url' : 'image_url';
      handleInputChange(field, imageUrl);
    }
    
    // Clean up the URL
    URL.revokeObjectURL(cropperImageSrc);
  };

  const handleRemoveBackground = async (type: 'image' | 'logo') => {
    const currentImageUrl = type === 'logo' ? formData.logo_url : formData.image_url;
    if (!currentImageUrl) {
      notifications.show({
        title: "Error",
        message: "No image to process",
        color: 'red',
      });
      return;
    }

    setRemovingBackground(true);
    try {
      // Load the current image
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      const imageElement = await loadImage(blob);
      
      // Remove background
      const processedBlob = await removeBackground(imageElement);
      
      // Upload the processed image
      const imageUrl = await uploadImage(processedBlob, type);
      if (imageUrl) {
        const field = type === 'logo' ? 'logo_url' : 'image_url';
        handleInputChange(field, imageUrl);
        notifications.show({
          title: "Success",
          message: "Background removed successfully",
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error removing background:', error);
      notifications.show({
        title: "Error",
        message: "Failed to remove background. Make sure your browser supports WebGPU.",
        color: 'red',
      });
    } finally {
      setRemovingBackground(false);
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

      notifications.show({
        title: "Success",
        message: "Basic information updated successfully",
        color: 'green',
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating basic info:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update basic information",
        color: 'red',
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

      notifications.show({
        title: "Success",
        message: "Address updated successfully",
        color: 'green',
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating address:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update address",
        color: 'red',
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

      notifications.show({
        title: "Success",
        message: "Delivery settings updated successfully",
        color: 'green',
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating delivery settings:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update delivery settings",
        color: 'red',
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
      
      notifications.show({
        title: "Success", 
        message: `Restaurant ${newStatus ? 'activated' : 'deactivated'} successfully`,
        color: 'green',
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update restaurant status",
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="xl">
      <Tabs defaultValue="basic">
        <Tabs.List>
          <Tabs.Tab value="basic">Basic Info</Tabs.Tab>
          <Tabs.Tab value="images">Images</Tabs.Tab>
          <Tabs.Tab value="address">Address</Tabs.Tab>
          <Tabs.Tab value="delivery">Delivery</Tabs.Tab>
          <Tabs.Tab value="status">Status</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="md">
          <Stack gap="md">
            <Card p="md" withBorder>
              <Stack gap="md">
                <Stack gap="xs">
                  <Title order={4}>Basic Information</Title>
                  <Text size="sm" c="dimmed">
                    Update your restaurant's basic information
                  </Text>
                </Stack>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Restaurant Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select 
                      label="Cuisine Type"
                      value={formData.cuisine_type} 
                      onChange={(value) => handleInputChange('cuisine_type', value)}
                      data={cuisineTypes.map(cuisine => ({ value: cuisine, label: cuisine }))}
                    />
                  </Grid.Col>
                </Grid>
                
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </Grid.Col>
                </Grid>

                <Button onClick={saveBasicInfo} disabled={saving} leftSection={saving ? <Loader size="sm" /> : <IconDeviceFloppy size={16} />}>
                  {saving ? "Saving..." : "Save Basic Info"}
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

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
                      onChange={(e) => handleImageSelect(e, 'logo')}
                      disabled={uploadingImage || removingBackground}
                    />
                    <div className="flex gap-2">
                      {formData.logo_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBackground('logo')}
                          disabled={uploadingImage || removingBackground}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          {removingBackground ? 'Removing...' : 'Remove Background'}
                        </Button>
                      )}
                    </div>
                    {(uploadingImage || removingBackground) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4 animate-spin" />
                        {uploadingImage ? 'Uploading logo...' : 'Processing image...'}
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
                      onChange={(e) => handleImageSelect(e, 'image')}
                      disabled={uploadingImage || removingBackground}
                    />
                    {(uploadingImage || removingBackground) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4 animate-spin" />
                        {uploadingImage ? 'Uploading image...' : 'Processing image...'}
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

              <Button onClick={saveBasicInfo} disabled={saving || uploadingImage || removingBackground}>
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
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => handleInputChange('address', value)}
                  onAddressParsed={(parsed) => {
                    setFormData(prev => ({
                      ...prev,
                      address: parsed.street,
                      city: parsed.city,
                      state: parsed.state,
                      zip_code: parsed.zipCode
                    }));
                  }}
                  placeholder="123 Main St, City, State 12345"
                  required
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

      <ImageCropper
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          URL.revokeObjectURL(cropperImageSrc);
        }}
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={cropperImageType === 'logo' ? 1 : undefined}
        cropShape={cropperImageType === 'logo' ? 'round' : 'rect'}
      />
    </div>
  );
};