import api from './axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<{ data: LoginResponse }>('/auth/login', payload),

  getProfile: () => api.get('/drivers/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),

  updateFcmToken: (fcmToken: string) =>
    api.post('/drivers/me/fcm-token', { fcmToken }),
};
