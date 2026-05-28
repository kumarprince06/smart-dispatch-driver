import axiosInstance from './axios';

export interface OrderResponse {
  id: number;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropLatitude: number;
  dropLongitude: number;
  deliveryFee: number;
  estimatedDistance: number;
  priority: string;
  createdAt: string;
}

export const orderApi = {
  getDriverOrders: (page = 0, size = 10, status?: string) => {
    const params: any = { page, size };
    if (status) params.status = status;
    return axiosInstance.get('/orders/driver-orders', { params });
  },

  updateOrderStatus: (orderId: number, status: string, proofOfDeliveryUrl?: string) =>
    axiosInstance.patch(`/orders/${orderId}/status`, { status, proofOfDeliveryUrl }),

  getOrderById: (orderId: number) =>
    axiosInstance.get(`/orders/${orderId}`),
};
