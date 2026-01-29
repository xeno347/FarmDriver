// Simple env wrapper with runtime setter/getter for staff id.
// If you later add a lib like react-native-dotenv or react-native-config,
// update this file to read from build-time env vars.
export const BASE_URL = (process.env.BASE_URL as string) || 'https://farm-connect.amritagrotech.com/api';
export const VEHICLE_ID = (process.env.VEHICLE_ID as string) || 'TRC-2024-01';

let _staffId: string = (process.env.STAFF_ID as string) || '';

export const getStaffId = () => _staffId;
export const setStaffId = (id: string) => {
	_staffId = id;
};

// For convenience, export a function that returns a non-empty staff id or undefined
export const getStaffIdOrDefault = (def = '') => _staffId || def;
