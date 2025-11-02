import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Address {
  label: string;
  name: string;
  address: string;
  apt_suite: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressSelectorProps {
  onAddressSelect: (address: Partial<Address>) => void;
  initialAddress: any;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({ onAddressSelect, initialAddress }) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Record<string, Address>>({});
  const [selectedTab, setSelectedTab] = useState('Home');
  const [showEditForm, setShowEditForm] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address>({
    label: 'Home',
    name: '',
    address: '',
    apt_suite: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    // Load saved addresses from localStorage
    const saved = localStorage.getItem('saved_addresses');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAddresses(parsed);
      
      // Auto-select first available address
      const firstAddr = parsed[selectedTab] || Object.values(parsed)[0];
      if (firstAddr) {
        onAddressSelect(firstAddr);
        setEditingAddress(firstAddr as Address);
        setShowEditForm(false);
      }
    }
  }, []);

  const handleTabClick = (label: string) => {
    setSelectedTab(label);
    const addr = addresses[label];
    if (addr) {
      onAddressSelect(addr);
      setEditingAddress(addr);
      setShowEditForm(false);
    } else {
      setShowEditForm(true);
      setEditingAddress({
        label,
        name: '',
        address: '',
        apt_suite: '',
        city: '',
        state: '',
        zip: ''
      });
    }
  };

  const handleSaveAddress = () => {
    if (!editingAddress.name || !editingAddress.address || !editingAddress.city || !editingAddress.state || !editingAddress.zip) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const updated = { ...addresses, [selectedTab]: { ...editingAddress, label: selectedTab } };
    setAddresses(updated);
    localStorage.setItem('saved_addresses', JSON.stringify(updated));
    onAddressSelect(editingAddress);
    setShowEditForm(false);
    toast({ title: "Success", description: "Address saved successfully" });
  };

  const selectedAddress = addresses[selectedTab];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {['Home', 'Work', 'Recent'].map((label) => (
          <button
            key={label}
            onClick={() => handleTabClick(label)}
            className={`px-3 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${
              selectedTab === label 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'hover:border-orange-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectedAddress && !showEditForm ? (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{selectedAddress.name}</p>
              <p className="text-sm text-gray-600">
                {selectedAddress.address}
                {selectedAddress.apt_suite && `, ${selectedAddress.apt_suite}`}
              </p>
              <p className="text-sm text-gray-600">
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
              </p>
            </div>
            <button
              onClick={() => setShowEditForm(true)}
              className="text-sm text-orange-500 hover:text-orange-600"
            >
              Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Full name"
              value={editingAddress.name}
              onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Street address"
              value={editingAddress.address}
              onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Apt, suite (optional)"
              value={editingAddress.apt_suite}
              onChange={(e) => setEditingAddress({ ...editingAddress, apt_suite: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="City"
              value={editingAddress.city}
              onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="State"
                value={editingAddress.state}
                onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="ZIP"
                value={editingAddress.zip}
                onChange={(e) => setEditingAddress({ ...editingAddress, zip: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveAddress}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
            >
              Save Address
            </button>
            {selectedAddress && (
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
