/**
 * Customer Segmentation Manager
 * Create and manage customer segments for targeted marketing
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Filter, TrendingUp, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Segment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  customerCount: number;
  createdAt: string;
}

interface SegmentCriteria {
  city?: string[];
  orderFrequency?: { min: number; max?: number };
  loyaltyTier?: string[];
  totalSpent?: { min: number; max?: number };
  lastOrderDays?: { max: number };
  hasReferrals?: boolean;
}

const CustomerSegmentation: React.FC = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    criteria: {} as SegmentCriteria
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      // TODO: Create customer_segments table in database
      // For now, using mock data structure
      setSegments([]);
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSegmentSize = async (criteria: SegmentCriteria): Promise<number> => {
    try {
      let query = supabase
        .from('user_profiles')
        .select('id, user_id', { count: 'exact', head: false });

      // Apply criteria filters (simplified for now)
      // TODO: Implement full filtering logic based on criteria
      
      const { count } = await query;
      return count || 0;
    } catch (error) {
      console.error('Error calculating segment size:', error);
      return 0;
    }
  };

  const handleCreateSegment = async () => {
    if (!newSegment.name.trim()) return;

    const customerCount = await calculateSegmentSize(newSegment.criteria);
    
    const segment: Segment = {
      id: `seg_${Date.now()}`,
      name: newSegment.name,
      criteria: newSegment.criteria,
      customerCount,
      createdAt: new Date().toISOString()
    };

    // TODO: Save to database
    setSegments([...segments, segment]);
    setNewSegment({ name: '', criteria: {} });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Segmentation</h2>
          <p className="text-gray-600 mt-1">Create targeted customer groups for personalized marketing</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Create Segment Form */}
      {showCreateForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New Segment</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="segmentName">Segment Name *</Label>
              <Input
                id="segmentName"
                value={newSegment.name}
                onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High-Value Customers in NYC"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City Filter */}
              <div>
                <Label>City</Label>
                <Input
                  placeholder="Enter cities (comma-separated)"
                  onChange={(e) => {
                    const cities = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                    setNewSegment(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, city: cities }
                    }));
                  }}
                  className="mt-1"
                />
              </div>

              {/* Loyalty Tier */}
              <div>
                <Label>Loyalty Tier</Label>
                <Select
                  onValueChange={(value) => {
                    setNewSegment(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, loyaltyTier: value ? [value] : undefined }
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Frequency */}
              <div>
                <Label>Min Orders</Label>
                <Input
                  type="number"
                  placeholder="Minimum orders"
                  onChange={(e) => {
                    const min = parseInt(e.target.value) || 0;
                    setNewSegment(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, orderFrequency: { min } }
                    }));
                  }}
                  className="mt-1"
                />
              </div>

              {/* Total Spent */}
              <div>
                <Label>Min Total Spent ($)</Label>
                <Input
                  type="number"
                  placeholder="Minimum spend"
                  onChange={(e) => {
                    const min = parseFloat(e.target.value) || 0;
                    setNewSegment(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, totalSpent: { min } }
                    }));
                  }}
                  className="mt-1"
                />
              </div>

              {/* Last Order */}
              <div>
                <Label>Last Order (days ago, max)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  onChange={(e) => {
                    const max = parseInt(e.target.value) || undefined;
                    setNewSegment(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, lastOrderDays: max ? { max } : undefined }
                    }));
                  }}
                  className="mt-1"
                />
              </div>

              {/* Has Referrals */}
              <div>
                <Label>Has Referrals</Label>
                <Select
                  onValueChange={(value) => {
                    setNewSegment(prev => ({
                      ...prev,
                      criteria: { ...prev.criteria, hasReferrals: value === 'yes' }
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateSegment} className="bg-orange-600 hover:bg-orange-700">
                <Save className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Segments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.length === 0 && !loading && (
          <Card className="p-6 col-span-full text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No segments yet</h3>
            <p className="text-gray-600 mb-4">Create your first customer segment to start targeted marketing</p>
            <Button onClick={() => setShowCreateForm(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </Card>
        )}

        {segments.map((segment) => (
          <Card key={segment.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">{segment.name}</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customers</span>
                <span className="text-lg font-bold text-gray-900">{segment.customerCount.toLocaleString()}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {segment.criteria.city && segment.criteria.city.length > 0 && (
                  <Badge variant="secondary">Cities: {segment.criteria.city.length}</Badge>
                )}
                {segment.criteria.loyaltyTier && (
                  <Badge variant="secondary">Tier: {segment.criteria.loyaltyTier.join(', ')}</Badge>
                )}
                {segment.criteria.orderFrequency && (
                  <Badge variant="secondary">{segment.criteria.orderFrequency.min}+ orders</Badge>
                )}
                {segment.criteria.totalSpent && (
                  <Badge variant="secondary">${segment.criteria.totalSpent.min}+ spent</Badge>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Filter className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Analyze
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerSegmentation;

