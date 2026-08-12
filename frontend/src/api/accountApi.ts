import api from './apiClient';
import type { Account, AccountBalance, PageResponse } from '../types';

export const accountApi = {
  getAccounts: async (page = 0, size = 20): Promise<PageResponse<Account>> => {
    const res = await api.get<PageResponse<Account>>('/accounts', {
      params: { page, size },
    });
    return res.data;
  },

  getAccountById: async (id: string): Promise<Account> => {
    const res = await api.get<Account>(`/accounts/${id}`);
    return res.data;
  },

  getAccountBalance: async (id: string): Promise<AccountBalance> => {
    const res = await api.get<AccountBalance>(`/accounts/${id}/balance`);
    return res.data;
  },

  createAccount: async (name: string, initialBalance: number, currency = 'INR'): Promise<Account> => {
    const res = await api.post<Account>('/accounts', {
      name,
      initialBalance,
      currency,
    });
    return res.data;
  },
};
