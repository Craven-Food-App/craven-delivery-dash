import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ZoneDrawingMap from './ZoneDrawingMap';
import ZoneVisualizationMap from './ZoneVisualizationMap';

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state: string;
  zip_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

const DeliveryZoneManager: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    city: '',
    state: '',
    zip_code: '',
  });

  // Load delivery zones
  const loadZones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error loading zones:', error);
      toast.error('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  // Create new zone with GeoJSON
  const createZone = async (zoneData: {
    name: string;
    city: string;
    state: string;
    zip_code: string;
    geojson: any;
  }) => {
    try {
      setIsCreating(true);
      
      // Call the Edge Function instead of direct table insert
      const { data, error } = await supabase.functions.invoke('create-delivery-zone', {
        body: {
          name: zoneData.name,
          city: zoneData.city,
          state: zoneData.state,
          zip_code: zoneData.zip_code,
          geojson: zoneData.geojson
        }
      });

      if (error) throw error;
      
      toast.success('Delivery zone created successfully');
      loadZones();
    } catch (error) {
      console.error('Error creating zone:', error);
      toast.error('Failed to create delivery zone');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle zone active status
  const toggleZoneStatus = async (zoneId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ active: !currentStatus })
        .eq('id', zoneId);

      if (error) throw error;
      
      toast.success(`Zone ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadZones();
    } catch (error) {
      console.error('Error updating zone:', error);
      toast.error('Failed to update zone status');
    }
  };

  // Delete zone
  const deleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;

    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;
      
      toast.success('Delivery zone deleted');
      loadZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete delivery zone');
    }
  };

  // Filter zones based on search term
  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.zip_code.includes(searchTerm)
  );

  useEffect(() => {
    loadZones();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Zone Management</h1>
          <p className="text-gray-600 mt-1">Manage delivery zones and coverage areas</p>
        </div>
        <Button onClick={() => setSelectedZone(null)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          New Zone
        </Button>
      </div>

      <Tabs defaultValue="zones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="zones">All Zones</TabsTrigger>
          <TabsTrigger value="create">Create Zone</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search zones by name, city, state, or ZIP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Badge variant="outline" className="text-sm">
                  {filteredZones.length} zones
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Zones List */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading delivery zones...</p>
              </CardContent>
            </Card>
          ) : filteredZones.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No zones found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No zones match your search criteria.' : 'Create your first delivery zone to get started.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setSelectedZone(null)} className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Zone
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredZones.map((zone) => (
                <Card key={zone.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                          <Badge variant={zone.active ? "default" : "secondary"}>
                            {zone.active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {zone.city}, {zone.state}
                          </span>
                          <span>ZIP: {zone.zip_code}</span>
                          <span>Created: {new Date(zone.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedZone(zone)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleZoneStatus(zone.id, zone.active)}
                        >
                          {zone.active ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteZone(zone.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Delivery Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <ZoneDrawingMap
                onZoneCreated={createZone}
                onCancel={() => setSelectedZone(null)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Zones</p>
                    <p className="text-2xl font-bold text-gray-900">{zones.length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Zones</p>
                    <p className="text-2xl font-bold text-green-600">
                      {zones.filter(z => z.active).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inactive Zones</p>
                    <p className="text-2xl font-bold text-red-600">
                      {zones.filter(z => !z.active).length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Zone Coverage Map</CardTitle>
            </CardHeader>
            <CardContent>
              <ZoneVisualizationMap
                zones={zones}
                onZoneClick={(zone) => setSelectedZone(zone)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryZoneManager;
