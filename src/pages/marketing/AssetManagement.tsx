/**
 * Document & Asset Management
 * Store and manage marketing assets
 */

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Folder, Image as ImageIcon, FileText, Video, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  url: string;
  folder: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('All');
  const [folders] = useState<string[]>(['All', 'Campaigns', 'Merchants', 'Brand Guidelines', 'Social Media']);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                    file.type === 'application/pdf' ? 'pdf' : 'other';

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `marketing-assets/${currentFolder === 'All' ? 'general' : currentFolder.toLowerCase()}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(filePath);

      const asset: Asset = {
        id: data.path,
        name: file.name,
        type: fileType,
        url: publicUrl,
        folder: currentFolder === 'All' ? 'general' : currentFolder,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'current_user' // TODO: Get from auth
      };

      setAssets([...assets, asset]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const filteredAssets = currentFolder === 'All'
    ? assets
    : assets.filter(a => a.folder === currentFolder.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Management</h2>
          <p className="text-gray-600 mt-1">Store and organize marketing assets and documents</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-orange-600 hover:bg-orange-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      {/* Folders */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {folders.map((folder) => (
          <Button
            key={folder}
            variant={currentFolder === folder ? 'default' : 'outline'}
            onClick={() => setCurrentFolder(folder)}
            className={currentFolder === folder ? 'bg-orange-600' : ''}
          >
            <Folder className="h-4 w-4 mr-2" />
            {folder}
          </Button>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upload Asset</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-2">Drop files here or click to upload</p>
            <p className="text-xs text-gray-500 mb-4">Supports images, videos, PDFs (max 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,.pdf"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Select Files
            </Button>
          </div>
        </Card>
      )}

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets in this folder</h3>
          <p className="text-gray-600 mb-4">Upload your first marketing asset to get started</p>
          <Button onClick={() => setShowUpload(true)} className="bg-orange-600 hover:bg-orange-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Asset
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="p-3 hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                ) : asset.type === 'video' ? (
                  <Video className="h-12 w-12 text-gray-400" />
                ) : (
                  <FileText className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 truncate" title={asset.name}>
                {asset.name}
              </p>
              <p className="text-xs text-gray-500">
                {(asset.size / 1024).toFixed(1)} KB
              </p>
              <div className="flex gap-1 mt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <a href={asset.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetManagement;

