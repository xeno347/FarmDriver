import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, getStaffId } from '../config/env';

type CheckInOptions = {
  timestamp?: string;
  location?: Record<string, unknown>;
};

interface AppContextProps {
  isCheckedIn: boolean;
  currentVehicle: string | null;
  checkIn: (vehicleId: string, initialEngineHours: number, options?: CheckInOptions) => Promise<void>;
  checkOut: (finalEngineHours: number, fuelRequested: number) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<string | null>(null);

  const debugLog = (...args: any[]) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[AppContext]', ...args);
    }
  };

  const resolveStaffId = async (): Promise<string> => {
    const runtime = String(getStaffId() || '').trim();
    if (runtime) return runtime;
    try {
      const stored = await AsyncStorage.getItem('STAFF_ID');
      if (stored) return String(stored).trim();
    } catch {
      // ignore
    }
    return '';
  };

  const checkIn = async (vehicleId: string, initialEngineHours: number, options?: CheckInOptions) => {
    const staffId = await resolveStaffId();
    if (!staffId) {
      throw new Error('Missing staff id. Please log in again.');
    }

    const payload: Record<string, unknown> = {
      staff_id: staffId,
      // API expects this exact key (note spelling)
      intial_engine_hours: initialEngineHours,
    };
    if (options?.timestamp) payload.timestamp = options.timestamp;
    if (options?.location) payload.location = options.location;

    debugLog('checkIn() calling API', { url: `${BASE_URL}/admin_staff/check_in`, payload });

    const res = await fetch(`${BASE_URL}/admin_staff/check_in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    debugLog('checkIn() response', { ok: res.ok, status: res.status });

    let data: any = undefined;
    try {
      data = await res.json();
    } catch {
      // ignore non-json
    }

    if (!res.ok) {
      const message =
        (data && (data.message || data.detail || data.error)) || `Check-in failed (${res.status})`;
      throw new Error(String(message));
    }

    setIsCheckedIn(true);
    setCurrentVehicle(vehicleId);
  };

  const checkOut = async (finalEngineHours: number, fuelRequested: number) => {
    const staffId = await resolveStaffId();
    if (!staffId) {
      throw new Error('Missing staff id. Please log in again.');
    }

    if (!Number.isFinite(finalEngineHours) || finalEngineHours <= 0) {
      throw new Error('Invalid final engine hours.');
    }
    if (!Number.isFinite(fuelRequested) || fuelRequested < 0) {
      throw new Error('Invalid fuel requested.');
    }

    const payload: Record<string, unknown> = {
      staff_id: staffId,
      final_engine_hours: finalEngineHours,
      fuel_requested: fuelRequested,
    };

    debugLog('checkOut() calling API', { url: `${BASE_URL}/admin_staff/check_out`, payload });

    const res = await fetch(`${BASE_URL}/admin_staff/check_out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    debugLog('checkOut() response', { ok: res.ok, status: res.status });

    let data: any = undefined;
    try {
      data = await res.json();
    } catch {
      // ignore non-json
    }

    if (!res.ok) {
      const message =
        (data && (data.message || data.detail || data.error)) || `Check-out failed (${res.status})`;
      throw new Error(String(message));
    }

    setIsCheckedIn(false);
    setCurrentVehicle(null);
  };

  return (
    <AppContext.Provider value={{ isCheckedIn, currentVehicle, checkIn, checkOut }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
