/**
 * Restaurant Menu Management Dashboard
 * Comprehensive menu editor with photo uploads, item availability, prep times
 * Competes with DoorDash's merchant menu management tools
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Save,
  X,
  Image as ImageIcon,
  ChefHat,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  is_available: boolean;
  prep_time_minutes?: number;
  dietary_tags?: string[];
  spice_level?: number;
  created_at: string;
  updated_at: string;
}

interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  items: MenuItem[];
}

export function MenuManagement({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dietary tags
  const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Spicy', 'Halal', 'Kosher'];
  const CATEGORIES = ['Appetizers', 'Mains', 'Desserts', 'Drinks', 'Sides', 'Specials'];

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('category, name');

      if (error) throw error;

      // Group by category
      const grouped = data.reduce((acc: Record<string, MenuItem[]>, item: MenuItem) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});

      const categoriesData: MenuCategory[] = Object.keys(grouped).map((categoryName, index) => ({
        id: categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        display_order: index,
        items: grouped[categoryName]
      }));

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setCurrentItem({
      name: '',
      description: '',
      price: 0,
      category: 'Mains',
      is_available: true,
      prep_time_minutes: 15,
      dietary_tags: [],
      spice_level: 0
    });
    setImagePreview(null);
    setEditDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setCurrentItem(item);
    setImagePreview(item.image_url || null);
    setEditDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!currentItem) return;

    try {
      const itemData = {
        ...currentItem,
        restaurant_id: restaurantId,
        updated_at: new Date().toISOString()
      };

      if (currentItem.id) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', currentItem.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Menu item updated successfully'
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert(itemData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Menu item created successfully'
        });
      }

      setEditDialogOpen(false);
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Menu item deleted successfully'
      });

      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive'
      });
    }
  };

  const handleToggleAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentAvailability })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Item ${!currentAvailability ? 'enabled' : 'disabled'} successfully`
      });

      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item availability',
        variant: 'destructive'
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('menu-items')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-items')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setImagePreview(publicUrl);
      setCurrentItem(prev => prev ? { ...prev, image_url: publicUrl } : null);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setCurrentItem(prev => prev ? { ...prev, image_url: undefined } : null);
  };

  const toggleDietaryTag = (tag: string) => {
    setCurrentItem(prev => {
      if (!prev) return null;
      const tags = prev.dietary_tags || [];
      const newTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag];
      return { ...prev, dietary_tags: newTags };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Menu Management</h2>
          <p className="text-gray-600 mt-1">Manage your menu items, prices, and availability</p>
        </div>
        <Button onClick={handleAddItem} className="bg-gradient-to-r from-orange-500 to-red-500">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Menu Items by Category */}
      <Tabs defaultValue={categories[0]?.id || 'all'} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)` }}>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name} ({category.items.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  {/* Item Image */}
                  {item.image_url ? (
                    <div className="relative h-48 bg-gray-100">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-lg">
                            <EyeOff className="w-4 h-4 mr-2" />
                            Unavailable
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-orange-300" />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <span className="text-lg font-bold text-orange-600">
                        ${(item.price / 100).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Prep Time & Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.prep_time_minutes && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.prep_time_minutes} min
                        </Badge>
                      )}
                      {item.dietary_tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(item.id, item.is_available)}
                        className="flex-1"
                      >
                        {item.is_available ? (
                          <><Eye className="w-4 h-4 mr-1" /> Available</>
                        ) : (
                          <><EyeOff className="w-4 h-4 mr-1" /> Unavailable</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {category.items.length === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No items in this category yet</p>
                <Button variant="outline" onClick={handleAddItem} className="mt-4">
                  Add First Item
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit/Add Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentItem?.id ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {currentItem?.id ? 'Update' : 'Create'} your menu item with photos and details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Item Photo</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImage}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploadingImage}
                      className="mt-4"
                    >
                      {uploadingImage ? 'Uploading...' : 'Choose File'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Item Name */}
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={currentItem?.name || ''}
                onChange={(e) => setCurrentItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="e.g., Margherita Pizza"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={currentItem?.description || ''}
                onChange={(e) => setCurrentItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Describe your delicious dish..."
                rows={3}
              />
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={(currentItem?.price || 0) / 100}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, price: Math.round(parseFloat(e.target.value) * 100) } : null)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={currentItem?.category}
                  onValueChange={(value) => setCurrentItem(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prep Time */}
            <div>
              <Label htmlFor="prep_time">Prep Time (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="prep_time"
                  type="number"
                  min="0"
                  value={currentItem?.prep_time_minutes || ''}
                  onChange={(e) => setCurrentItem(prev => prev ? { ...prev, prep_time_minutes: parseInt(e.target.value) || 0 } : null)}
                  className="pl-8"
                  placeholder="15"
                />
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={currentItem?.dietary_tags?.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDietaryTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Available Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Item Availability</Label>
                <p className="text-sm text-gray-600">Make this item available for ordering</p>
              </div>
              <Switch
                checked={currentItem?.is_available || false}
                onCheckedChange={(checked) => setCurrentItem(prev => prev ? { ...prev, is_available: checked } : null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={!currentItem?.name || !currentItem?.description}>
              <Save className="w-4 h-4 mr-2" />
              {currentItem?.id ? 'Update' : 'Create'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
