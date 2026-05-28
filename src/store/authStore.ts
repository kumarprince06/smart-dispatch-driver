import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, LoginPayload } from '../api/authApi';

export interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNo: string;
  roles: string[];
  profilePictureUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isBootstrapping: true,
  error: null,

  // Restore session on app launch
  bootstrap: async () => {
    try {
      // Add minimum delay to show off splash screen animation
      const minDelay = new Promise(resolve => setTimeout(resolve, 2500));
      const bootstrapTask = AsyncStorage.multiGet(['accessToken', 'user']);
      
      const [, results] = await Promise.all([minDelay, bootstrapTask]);
      const token = results[0];
      const userStr = results[1];
      
      const accessToken = token[1];
      const user = userStr[1] ? JSON.parse(userStr[1]) : null;
      if (accessToken && user) {
        set({ user, accessToken });
      }
    } catch {
      // Silently fail on corrupted storage
    } finally {
      set({ isBootstrapping: false });
    }
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(payload);
      const data = res.data.data;

      console.log(data);
      // Ensure this is a driver account
      if (data.role !== 'DRIVER') {
        throw new Error('This app is for drivers only. Please use the customer app.');
      }

      const user: User = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNumber,
        roles: [data.role],
      };

      await AsyncStorage.multiSet([
        ['accessToken', data.accessToken],
        ['refreshToken', data.refreshToken],
        ['user', JSON.stringify(user)],
      ]);

      set({ user, accessToken: data.accessToken, isLoading: false });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please try again.';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, accessToken: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
