// Simple env wrapper. If you later add a lib like react-native-dotenv
// or react-native-config, you can update this file to read from process.env.
export const BASE_URL = (process.env.BASE_URL as string) || 'https://farm-connect.amritagrotech.com/api';
export const VEHICLE_ID = (process.env.VEHICLE_ID as string) || 'TRC-2024-01';
export const STAFF_ID = (process.env.STAFF_ID as string) || 'driver';
