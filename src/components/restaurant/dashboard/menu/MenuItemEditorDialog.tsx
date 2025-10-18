import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, MoreVertical, X, Upload } from "lucide-react";
import { useForm } from "react-hook-form";

interface MenuItem {
  id?: string;
  name: string;
  description?: string;
  price_cents: number;
  image_url?: string;
  is_available: boolean;
  category_id?: string;
}

interface MenuItemEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item?: MenuItem | null;
  restaurantId: string;
  onSave: () => void;
}

export default function MenuItemEditorDialog({
  isOpen,
  onClose,
  item,
  restaurantId,
  onSave,
}: MenuItemEditorDialogProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [availability, setAvailability] = useState(item?.is_available ?? true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<MenuItem>({
    defaultValues: item || {
      name: "",
      description: "",
      price_cents: 0,
      is_available: true,
    },
  });

  useEffect(() => {
    if (item) {
      reset(item);
      setImagePreview(item.image_url || null);
      setAvailability(item.is_available);
    }
  }, [item, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("menu-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const onSubmit = async (data: MenuItem) => {
    setIsUploading(true);

    try {
      const imageUrl = await uploadImage();

      const itemData = {
        restaurant_id: restaurantId,
        name: data.name,
        description: data.description || null,
        price_cents: Math.round(parseFloat(data.price_cents.toString()) * 100),
        image_url: imageUrl,
        is_available: availability,
      };

      if (item?.id) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", item.id);

        if (error) throw error;

        toast({
          title: "Item updated",
          description: "Menu item has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert([itemData]);

        if (error) throw error;

        toast({
          title: "Item created",
          description: "New menu item has been added.",
        });
      }

      onSave();
      onClose();
      reset();
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: "Failed to save menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkUnavailable = async () => {
    setAvailability(false);
    if (item?.id) {
      await supabase
        .from("menu_items")
        .update({ is_available: false })
        .eq("id", item.id);
      toast({
        title: "Item marked unavailable",
        description: "This item is now unavailable for today.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Item</span>
              <DialogTitle className="text-xl font-bold mt-1">
                {item?.name || "New Menu Item"}
              </DialogTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="border-b pb-4">
          <div className="flex items-start gap-3 mb-3">
            {availability ? (
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">
                {availability ? "Available" : "Unavailable"}
              </div>
              <div className="text-sm text-muted-foreground">
                {availability
                  ? "Customers can view and order this item during store hours"
                  : "This item is currently unavailable"}
              </div>
            </div>
            {availability && (
              <Button
                variant="outline"
                onClick={handleMarkUnavailable}
                className="ml-auto"
              >
                Mark as Unavailable for Today
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="name">Name</Label>
                  <span className="text-xs text-muted-foreground">Required</span>
                </div>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  placeholder="Item name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price_cents", { required: "Price is required" })}
                  placeholder="0.00"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setValue("price_cents", value);
                  }}
                  defaultValue={item ? (item.price_cents / 100).toFixed(2) : ""}
                />
                {errors.price_cents && (
                  <p className="text-xs text-destructive mt-1">{errors.price_cents.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description">Description</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Add a description..."
                  rows={4}
                />
              </div>
            </div>

            <div>
              <Label>Product Image</Label>
              <div className="relative mt-2 aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imagePreview && (
                  <div className="absolute top-2 right-2 bg-background rounded-full p-1.5 shadow-md">
                    <Upload className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
