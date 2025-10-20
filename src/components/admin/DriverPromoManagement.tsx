import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Gift,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Pause,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function DriverPromoManagement() {
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: '',
    description: '',
    short_description: '',
    icon: '🎯',
    challenge_type: 'delivery_count',
    requirement_value: 10,
    reward_type: 'cash_bonus',
    reward_amount_cents: 2500,
    max_participants: null as number | null,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const { data } = await supabase
        .from('driver_promotions')
        .select('*')
        .order('created_at', { ascending: false });

      setPromos(data || []);
    } catch (error) {
      console.error('Error fetching promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromo.title || !newPromo.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('driver_promotions')
        .insert({
          ...newPromo,
          starts_at: new Date(newPromo.starts_at).toISOString(),
          ends_at: new Date(newPromo.ends_at).toISOString(),
        });

      if (error) throw error;

      toast.success('Promo created successfully!');
      setShowCreateDialog(false);
      setNewPromo({
        title: '',
        description: '',
        short_description: '',
        icon: '🎯',
        challenge_type: 'delivery_count',
        requirement_value: 10,
        reward_type: 'cash_bonus',
        reward_amount_cents: 2500,
        max_participants: null,
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });
      fetchPromos();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create promo');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('driver_promotions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Promo ${!currentStatus ? 'activated' : 'paused'}`);
      fetchPromos();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update promo');
    }
  };

  const activePromos = promos.filter(p => p.is_active);
  const totalBudget = activePromos.reduce((sum, p) => 
    sum + (p.reward_amount_cents * (p.max_participants || 100)), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Driver Promotions & Challenges
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage driver incentive programs
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Promos</p>
                <p className="text-3xl font-bold text-purple-600">{activePromos.length}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(totalBudget / 100).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-3xl font-bold text-blue-600">
                  {activePromos.reduce((sum, p) => sum + (p.current_participants || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-orange-600">67%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promos List */}
      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {promos.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">No promotions created yet</p>
              </div>
            ) : (
              promos.map((promo) => (
                <div
                  key={promo.id}
                  className="p-4 rounded-lg border hover:border-primary transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{promo.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{promo.title}</h4>
                          {promo.is_featured && (
                            <Badge className="bg-purple-600">Featured</Badge>
                          )}
                          <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                            {promo.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="h-3 w-3" />
                            ${(promo.reward_amount_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">
                            {promo.current_participants || 0} enrolled
                          </span>
                          {promo.max_participants && (
                            <span className="text-muted-foreground">
                              / {promo.max_participants} max
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(promo.id, promo.is_active)}
                      >
                        {promo.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Promo Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Driver Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newPromo.title}
                onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                placeholder="Weekend Warrior"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newPromo.description}
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                placeholder="Complete 20 deliveries this weekend and earn a $50 bonus!"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_desc">Short Description</Label>
              <Input
                id="short_desc"
                value={newPromo.short_description}
                onChange={(e) => setNewPromo({ ...newPromo, short_description: e.target.value })}
                placeholder="20 deliveries → $50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={newPromo.icon}
                  onChange={(e) => setNewPromo({ ...newPromo, icon: e.target.value })}
                  placeholder="🎯"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge_type">Challenge Type</Label>
                <select
                  id="challenge_type"
                  value={newPromo.challenge_type}
                  onChange={(e) => setNewPromo({ ...newPromo, challenge_type: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="delivery_count">Delivery Count</option>
                  <option value="time_based">Time Based</option>
                  <option value="peak_hours">Peak Hours</option>
                  <option value="geographic">Geographic</option>
                  <option value="rating_based">Rating Based</option>
                  <option value="streak_based">Streak Based</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requirement">Requirement Value</Label>
                <Input
                  id="requirement"
                  type="number"
                  value={newPromo.requirement_value}
                  onChange={(e) => setNewPromo({ ...newPromo, requirement_value: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward_amount">Reward Amount ($)</Label>
                <Input
                  id="reward_amount"
                  type="number"
                  step="0.01"
                  value={(newPromo.reward_amount_cents / 100).toFixed(2)}
                  onChange={(e) => setNewPromo({ ...newPromo, reward_amount_cents: Math.round(parseFloat(e.target.value) * 100) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants (Optional)</Label>
              <Input
                id="max_participants"
                type="number"
                value={newPromo.max_participants || ''}
                onChange={(e) => setNewPromo({ ...newPromo, max_participants: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts At</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={newPromo.starts_at}
                  onChange={(e) => setNewPromo({ ...newPromo, starts_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends_at">Ends At</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={newPromo.ends_at}
                  onChange={(e) => setNewPromo({ ...newPromo, ends_at: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePromo}>
              <Plus className="h-4 w-4 mr-2" />
              Create Promo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

