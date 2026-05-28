import axiosInstance from './axios';

export interface LedgerEntry {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export const paymentApi = {
  getMyTransactions: () =>
    axiosInstance.get('/payments/my-transactions'),
};
