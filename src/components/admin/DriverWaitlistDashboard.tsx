import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  Filter,
  Search,
  Download,
  Send,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  state: string;
  zip_code: string;
  vehicle_type: string;
  status: string;
  points: number;
  priority_score: number;
  waitlist_position: number;
  created_at: string;
  regions: {
    name: string;
    status: string;
    active_quota: number;
  };
}

interface Region {
  id: number;
  name: string;
  status: string;
  active_quota: number;
}

interface RegionStats {
  region_name: string;
  current_active: number;
  quota: number;
  waitlist_count: number;
  status: string;
}

export const DriverWaitlistDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('craver_applications')
        .select(`
          *,
          regions!inner(name, status, active_quota)
        `)
        .in('status', ['waitlist', 'approved'])
        .order('priority_score', { ascending: false });

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Load regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsError) throw regionsError;
      setRegions(regionsData || []);

      // Load region stats
      const { data: statsData, error: statsError } = await supabase
        .from('regions')
        .select(`
          id,
          name,
          status,
          active_quota,
          craver_applications!inner(status)
        `);

      if (statsError) throw statsError;
      
      // Process stats data
      const processedStats = regionsData?.map(region => {
        const regionDrivers = driversData?.filter(d => d.region_id === region.id) || [];
        return {
          region_name: region.name,
          current_active: regionDrivers.filter(d => d.status === 'approved').length,
          quota: region.active_quota,
          waitlist_count: regionDrivers.filter(d => d.status === 'waitlist').length,
          status: region.status
        };
      }) || [];

      setRegionStats(processedStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load waitlist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesRegion = selectedRegion === 'all' || driver.region_id?.toString() === selectedRegion;
    const matchesSearch = searchTerm === '' || 
      driver.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRegion && matchesSearch;
  });

  const activateDrivers = async (driverIds: string[]) => {
    try {
      const { error } = await supabase
        .from('craver_applications')
        .update({ 
          status: 'approved',
          background_check: true,
          background_check_initiated_at: new Date().toISOString()
        })
        .in('id', driverIds);

      if (error) throw error;

      toast({
        title: "Drivers Activated! 🎉",
        description: `${driverIds.length} drivers have been activated and will receive notification emails.`,
      });

      // Reload data
      await loadData();
      setSelectedDrivers([]);
    } catch (error) {
      console.error('Error activating drivers:', error);
      toast({
        title: "Error",
        description: "Failed to activate drivers",
        variant: "destructive",
      });
    }
  };

  const updateRegionStatus = async (regionId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('regions')
        .update({ status })
        .eq('id', regionId);

      if (error) throw error;

      toast({
        title: "Region Updated",
        description: `Region status updated to ${status}`,
      });

      await loadData();
    } catch (error) {
      console.error('Error updating region:', error);
      toast({
        title: "Error",
        description: "Failed to update region status",
        variant: "destructive",
      });
    }
  };

  const toggleDriverSelection = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const selectAllDrivers = () => {
    setSelectedDrivers(filteredDrivers.map(d => d.id));
  };

  const clearSelection = () => {
    setSelectedDrivers([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading waitlist data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Waitlist Management</h1>
            <p className="text-gray-600">Manage driver applications and region capacity</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => activateDrivers(selectedDrivers)}
              disabled={selectedDrivers.length === 0}
              className="bg-green-500 hover:bg-green-600"
            >
              <Send className="h-4 w-4 mr-2" />
              Activate Selected ({selectedDrivers.length})
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Region Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regionStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{stat.region_name}</h3>
                  <Badge 
                    variant={stat.status === 'active' ? 'default' : 'secondary'}
                    className={stat.status === 'active' ? 'bg-green-500' : ''}
                  >
                    {stat.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Drivers:</span>
                    <span className="font-medium">{stat.current_active}/{stat.quota}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Waitlist:</span>
                    <span className="font-medium">{stat.waitlist_count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(stat.current_active / stat.quota) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRegionStatus(index + 1, 'active')}
                    disabled={stat.status === 'active'}
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRegionStatus(index + 1, 'limited')}
                    disabled={stat.status === 'limited'}
                  >
                    Limit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRegionStatus(index + 1, 'paused')}
                    disabled={stat.status === 'paused'}
                  >
                    Pause
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search drivers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAllDrivers}>
                  Select All
                </Button>
                <Button variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Drivers ({filteredDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        checked={selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0}
                        onChange={selectedDrivers.length === filteredDrivers.length ? clearSelection : selectAllDrivers}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Vehicle</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Points</th>
                    <th className="text-left p-3 font-medium">Position</th>
                    <th className="text-left p-3 font-medium">Applied</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedDrivers.includes(driver.id)}
                          onChange={() => toggleDriverSelection(driver.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{driver.first_name} {driver.last_name}</div>
                          <div className="text-sm text-gray-600">{driver.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{driver.city}, {driver.state}</div>
                          <div className="text-sm text-gray-600">{driver.zip_code}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {driver.vehicle_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={driver.status === 'approved' ? 'default' : 'secondary'}
                          className={driver.status === 'approved' ? 'bg-green-500' : ''}
                        >
                          {driver.status === 'approved' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Waitlist</>
                          )}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{driver.points}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-center">
                          <div className="font-bold text-orange-600">
                            #{driver.waitlist_position || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">
                          {new Date(driver.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {driver.status === 'waitlist' && (
                            <Button 
                              size="sm" 
                              onClick={() => activateDrivers([driver.id])}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

