import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Document {
  name: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface MaintenanceRecord {
  date: string;
  type: string;
  odometer: number;
  cost: number;
  nextService: string;
  provider: string;
  notes: string;
}

interface VehicleContextProps {
  vehicleInfo: string;
  documents: Document[];
  maintenanceRecords: MaintenanceRecord[];
}

const mockDocuments: Document[] = [
  {
    name: 'RC',
    number: 'TRC-2024-01',
    issueDate: '2024-01-01',
    expiryDate: '2029-01-01',
    status: 'valid',
  },
  {
    name: 'Pollution Certificate',
    number: 'PC-2024-01',
    issueDate: '2025-01-01',
    expiryDate: '2026-01-01',
    status: 'valid',
  },
  {
    name: 'Insurance',
    number: 'INS-2024-01',
    issueDate: '2024-01-01',
    expiryDate: '2025-01-01',
    status: 'expiring',
  },
];

const mockMaintenance: MaintenanceRecord[] = [
  {
    date: '2025-12-01',
    type: 'Oil Change',
    odometer: 1200,
    cost: 1500,
    nextService: '2026-06-01',
    provider: 'Farm Service Center',
    notes: 'Changed oil and filter',
  },
];

const VehicleContext = createContext<VehicleContextProps | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [vehicleInfo] = useState('TRC-2024-01 - Tractor');
  const [documents] = useState<Document[]>(mockDocuments);
  const [maintenanceRecords] = useState<MaintenanceRecord[]>(mockMaintenance);

  return (
    <VehicleContext.Provider value={{ vehicleInfo, documents, maintenanceRecords }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) throw new Error('useVehicle must be used within VehicleProvider');
  return context;
};
