import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FuelRequest {
  id: string;
  vehicleId: string;
  fuelQuantity: number;
  status: 'pending' | 'approved' | 'denied';
  timestamp: string;
}

export interface LogisticsRequest {
  id: string;
  type: string;
  item: string;
  quantity: number;
  pickupLocation: string;
  deliveryLocation: string;
  requiredDate: string;
  notes: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: string;
}

interface RequestsContextProps {
  fuelRequests: FuelRequest[];
  logisticsRequests: LogisticsRequest[];
  createRequest: (request: FuelRequest | LogisticsRequest) => void;
  approveRequest: (id: string) => void;
  denyRequest: (id: string) => void;
}

const mockFuelRequests: FuelRequest[] = [
  {
    id: 'FR-123456',
    vehicleId: 'TRC-2024-01',
    fuelQuantity: 50,
    status: 'pending',
    timestamp: '2026-01-27T10:30:00Z',
  },
];

const mockLogisticsRequests: LogisticsRequest[] = [
  {
    id: 'LR-789012',
    type: 'Spare Parts',
    item: 'Tractor Tire - Front Left',
    quantity: 1,
    pickupLocation: 'Main Warehouse',
    deliveryLocation: 'Field Station B',
    requiredDate: '2026-01-28',
    notes: 'Urgent - tire puncture',
    status: 'pending',
    timestamp: '2026-01-27T11:45:00Z',
  },
];

const RequestsContext = createContext<RequestsContextProps | undefined>(undefined);

export const RequestsProvider = ({ children }: { children: ReactNode }) => {
  const [fuelRequests, setFuelRequests] = useState<FuelRequest[]>(mockFuelRequests);
  const [logisticsRequests, setLogisticsRequests] = useState<LogisticsRequest[]>(mockLogisticsRequests);

  const createRequest = (request: FuelRequest | LogisticsRequest) => {
    if ('fuelQuantity' in request) {
      setFuelRequests((prev) => [...prev, request]);
    } else {
      setLogisticsRequests((prev) => [...prev, request]);
    }
  };

  const approveRequest = (id: string) => {
    setFuelRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
    setLogisticsRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const denyRequest = (id: string) => {
    setFuelRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'denied' } : r));
    setLogisticsRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'denied' } : r));
  };

  return (
    <RequestsContext.Provider value={{ fuelRequests, logisticsRequests, createRequest, approveRequest, denyRequest }}>
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestsContext);
  if (!context) throw new Error('useRequests must be used within RequestsProvider');
  return context;
};
