import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Instagram, Image, Plus, ExternalLink } from "lucide-react";
import ImageCropper from "@/components/common/ImageCropper";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { toast } from "sonner";

const StoreSettingsDashboard = () => {
  const { restaurant, loading } = useRestaurantData();
  const [headerPhoto, setHeaderPhoto] = useState<string | null>(null);
  const [logoPhoto, setLogoPhoto] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageType, setCurrentImageType] = useState<"header" | "logo">("header");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [isEditingInstagram, setIsEditingInstagram] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeWebsite, setStoreWebsite] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (restaurant) {
      setStoreName(restaurant.name || "");
      setStorePhone(restaurant.phone || "");
      setStoreAddress(restaurant.address || "");
      setStoreDescription(restaurant.description || "");
      setHeaderPhoto(restaurant.header_image_url || null);
      setLogoPhoto(restaurant.logo_url || null);
      setInstagramHandle(restaurant.instagram_handle || "");
    }
  }, [restaurant]);

  const handleImageSelect = (type: "header" | "logo", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentImageSrc(e.target?.result as string);
      setCurrentImageType(type);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSaving(true);
    try {
      const fileExt = 'jpg';
      const fileName = `${restaurant?.id}/${currentImageType}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(filePath);

      const updateField = currentImageType === 'header' ? 'header_image_url' : 'logo_url';
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ [updateField]: publicUrl })
        .eq('id', restaurant?.id);

      if (updateError) throw updateError;

      if (currentImageType === 'header') {
        setHeaderPhoto(publicUrl);
      } else {
        setLogoPhoto(publicUrl);
      }

      toast.success(`${currentImageType === 'header' ? 'Header' : 'Logo'} updated successfully`);
      setCropperOpen(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveField = async (field: string, value: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ [field]: value })
        .eq('id', restaurant?.id);

      if (error) throw error;
      toast.success('Updated successfully');
      setEditingField(null);
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInstagram = async () => {
    if (instagramHandle) {
      await handleSaveField('instagram_handle', instagramHandle);
      setIsEditingInstagram(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-20 text-center">
            <p>Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Store details</h2>
              
              <div className="space-y-6">
                {/* Store Name */}
                {editingField === 'name' ? (
                  <Dialog open={editingField === 'name'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Store Name</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Store Name</Label>
                          <Input
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={() => handleSaveField('name', storeName)}
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold mb-1">Store name</h3>
                      <p>{storeName || 'Not set'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingField('name')}>Edit</Button>
                  </div>
                )}

                {/* Address */}
                {editingField === 'address' ? (
                  <Dialog open={editingField === 'address'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Address</Label>
                          <Textarea
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={() => handleSaveField('address', storeAddress)}
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex justify-between items-start pt-4 border-t">
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-sm">{storeAddress || 'Not set'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingField('address')}>Edit</Button>
                  </div>
                )}

                {/* Phone */}
                {editingField === 'phone' ? (
                  <Dialog open={editingField === 'phone'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Phone Number</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Phone Number</Label>
                          <Input
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                            type="tel"
                          />
                        </div>
                        <Button 
                          onClick={() => handleSaveField('phone', storePhone)}
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex justify-between items-start pt-4 border-t">
                    <div>
                      <h3 className="font-semibold mb-1">Phone number</h3>
                      <p className="text-sm">{storePhone || 'Not set'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This phone number is used to send or confirm orders and verify your store is open
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingField('phone')}>Edit</Button>
                  </div>
                )}

                {/* Description */}
                {editingField === 'description' ? (
                  <Dialog open={editingField === 'description'} onOpenChange={(open) => !open && setEditingField(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Description</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={storeDescription}
                            onChange={(e) => setStoreDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button 
                          onClick={() => handleSaveField('description', storeDescription)}
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex justify-between items-start pt-4 border-t">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Description</h3>
                      {storeDescription ? (
                        <p className="text-sm">{storeDescription}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Write a short description of your store for customers to read on your Crave'N store page
                        </p>
                      )}
                    </div>
                    <Button 
                      variant={storeDescription ? "outline" : "destructive"} 
                      size="sm" 
                      onClick={() => setEditingField('description')}
                    >
                      {storeDescription ? "Edit" : "Add"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Brand Assets */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Brand assets</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Showcase your brand on Crave'N by adding photos.
              </p>

              <div className="space-y-4">
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect("header", file);
                  }}
                />
                {headerPhoto ? (
                  <div className="border-2 rounded-lg overflow-hidden">
                    <div className="relative">
                      <img src={headerPhoto} alt="Header" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          onClick={() => headerInputRef.current?.click()}
                          variant="secondary"
                          size="sm"
                        >
                          Change photo
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">Header photo</h3>
                      <p className="text-sm text-muted-foreground">
                        This photo appears at the top of your store page.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">Header photo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a photo to make sure your store shows up in search and categories.
                    </p>
                    <Button onClick={() => headerInputRef.current?.click()}>Add photo</Button>
                  </div>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect("logo", file);
                  }}
                />
                {logoPhoto ? (
                  <div className="border-2 rounded-lg overflow-hidden">
                    <div className="relative flex justify-center p-6 bg-muted">
                      <div className="relative">
                        <img src={logoPhoto} alt="Logo" className="w-32 h-32 rounded-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                          <Button 
                            onClick={() => logoInputRef.current?.click()}
                            variant="secondary"
                            size="sm"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">Logo</h3>
                      <p className="text-sm text-muted-foreground">
                        Your logo appears on your store page and in search results.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">Logo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a logo to make sure your store shows up in search and categories.
                    </p>
                    <Button onClick={() => logoInputRef.current?.click()}>Add logo</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instagram Account */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Instagram account</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your Instagram account to feature content directly on Crave'N.
              </p>

              {!instagramHandle || isEditingInstagram ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium">@</span>
                      <Input
                        placeholder="yourusername"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                        className="flex-1"
                      />
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={handleSaveInstagram}
                      disabled={!instagramHandle || saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your Instagram username to link your profile.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-6 h-6 text-pink-600" />
                    <div>
                      <h3 className="font-semibold">@{instagramHandle}</h3>
                      <p className="text-sm text-muted-foreground">Connected Instagram account</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://instagram.com/${instagramHandle}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingInstagram(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Your store preview</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Preview how your store appears to customers
              </p>

              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="relative h-32 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                  {headerPhoto ? (
                    <img src={headerPhoto} alt="Header" className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-sm text-muted-foreground px-4 text-center">
                      Add a header photo
                    </p>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {logoPhoto ? (
                        <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs">Logo</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{storeName || 'Your Store'}</h4>
                      <p className="text-xs text-muted-foreground">
                        {storeDescription ? storeDescription.substring(0, 50) + '...' : 'Add description'}
                      </p>
                    </div>
                  </div>
                  
                  {instagramHandle && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span className="text-sm">@{instagramHandle}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Cropper Dialog */}
      {cropperOpen && (
        <ImageCropper
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={currentImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={currentImageType === "header" ? 16 / 9 : 1}
          cropShape={currentImageType === "logo" ? "round" : "rect"}
        />
      )}
    </div>
  );
};

export default StoreSettingsDashboard;
