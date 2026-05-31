import axiosInstance from './axios';

export interface DriverProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: number;
  vehicleCapacityKg?: number;
  licenseNumber?: string;
  status: string;
  currentLatitude?: number;
  currentLongitude?: number;
  rating?: number;
  totalDeliveries?: number;
  totalTrips?: number;
  totalEarnings?: number;
  walletBalance?: number;
}

export const driverApi = {
  getMe: () => axiosInstance.get<{ data: DriverProfile }>('/drivers/me'),
  updateStatus: (status: 'AVAILABLE' | 'OFFLINE') => 
    axiosInstance.put('/drivers/me/status', { status }),
  updateLocation: (latitude: number, longitude: number) =>
    axiosInstance.put('/drivers/me/location', { latitude, longitude }),
  updateProfile: (id: number, data: any) =>
    axiosInstance.put(`/drivers/${id}`, data),
  getTransactions: () => 
    axiosInstance.get('/payments/my-transactions')
};
