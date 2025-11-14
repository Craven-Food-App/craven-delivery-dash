import React, { useState, useEffect } from 'react';
import { ArrowLeft, Car, FileText, Upload, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type VehicleDocumentsPageProps = {
  onBack: () => void;
};

const VehicleDocumentsPage: React.FC<VehicleDocumentsPageProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [documents, setDocuments] = useState<any>({});

  useEffect(() => {
    fetchVehicleData();
  }, []);

  const fetchVehicleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver vehicle data
      const vehicleQuery = await supabase
        .from('drivers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      const driverData = vehicleQuery.data;

      if (driverData) {
        setVehicleData(driverData);
        setDocuments({
          registration: null,
          insurance: null,
          inspection: null,
          license: null,
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | null | undefined) => {
    if (status === true) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between safe-area-top">
        <button onClick={onBack} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-gray-900 text-xl font-bold">Vehicle & Documents</h1>
        <div className="w-6"></div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Vehicle Information */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Vehicle Information</h2>
              <p className="text-sm text-gray-500">Your registered vehicle details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-2 block">Make</label>
                <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-900">{vehicleData?.vehicle_make || 'Not set'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-2 block">Model</label>
                <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-900">{vehicleData?.vehicle_model || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-2 block">Year</label>
                <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-900">{vehicleData?.vehicle_year || 'Not set'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-semibold mb-2 block">Color</label>
                <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-900">{vehicleData?.vehicle_color || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-semibold mb-2 block">License Plate</label>
              <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-900">{vehicleData?.license_plate || 'Not set'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-semibold mb-2 block">Vehicle Type</label>
              <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-900 capitalize">{vehicleData?.vehicle_type || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Document Status</h2>
              <p className="text-sm text-gray-500">Required documents and verification</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-bold text-gray-900">Vehicle Registration</p>
                  <p className="text-sm text-gray-500">Registration document</p>
                </div>
              </div>
              {getStatusIcon(documents.registration)}
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-bold text-gray-900">Insurance</p>
                  <p className="text-sm text-gray-500">
                    {documents.insurance ? `${documents.insurance.provider} - ${documents.insurance.policy}` : 'Not uploaded'}
                  </p>
                </div>
              </div>
              {getStatusIcon(documents.insurance)}
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-bold text-gray-900">Vehicle Inspection</p>
                  <p className="text-sm text-gray-500">Inspection certificate</p>
                </div>
              </div>
              {getStatusIcon(documents.inspection)}
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-bold text-gray-900">Driver's License</p>
                  <p className="text-sm text-gray-500">License number on file</p>
                </div>
              </div>
              {getStatusIcon(documents.license)}
            </div>
          </div>

          <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleDocumentsPage;

