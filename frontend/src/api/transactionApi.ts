import api from './apiClient';
import type { TransactionRequest, TransactionResponse, TransactionHistoryItem, PageResponse } from '../types';

export const transactionApi = {
  createTransaction: async (request: TransactionRequest, idempotencyKey: string): Promise<TransactionResponse> => {
    const res = await api.post<TransactionResponse>('/transactions', request, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return res.data;
  },

  getTransactionById: async (id: string): Promise<TransactionHistoryItem> => {
    const res = await api.get<TransactionHistoryItem>(`/transactions/${id}`);
    return res.data;
  },

  getAccountTransactions: async (
    accountId: string,
    params?: {
      type?: string;
      page?: number;
      size?: number;
      sortProperty?: string;
      sortDirection?: string;
    }
  ): Promise<PageResponse<TransactionHistoryItem>> => {
    const res = await api.get<PageResponse<TransactionHistoryItem>>(`/accounts/${accountId}/transactions`, {
      params,
    });
    return res.data;
  },
};
