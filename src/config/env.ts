// Simple env wrapper with runtime setter/getter for staff id.
// If you later add a lib like react-native-dotenv or react-native-config,
// update this file to read from build-time env vars.
const env = ((globalThis as unknown as { process?: { env?: Record<string, unknown> } }).process?.env ?? {}) as Record<
	string,
	unknown
>;

export const BASE_URL = (env.BASE_URL as string) || 'https://farm-connect.amritagrotech.com/api';
export const VEHICLE_ID = (env.VEHICLE_ID as string) || 'TRC-2024-01';

let _staffId: string = (env.STAFF_ID as string) || '';

export const getStaffId = () => _staffId;
export const setStaffId = (id: string) => {
	_staffId = id;
};

// For convenience, export a function that returns a non-empty staff id or undefined
export const getStaffIdOrDefault = (def = '') => _staffId || def;
