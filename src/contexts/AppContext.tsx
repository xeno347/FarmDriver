import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextProps {
  isCheckedIn: boolean;
  currentVehicle: string | null;
  checkIn: (vehicleId: string) => void;
  checkOut: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<string | null>(null);

  const checkIn = (vehicleId: string) => {
    setIsCheckedIn(true);
    setCurrentVehicle(vehicleId);
  };

  const checkOut = () => {
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
