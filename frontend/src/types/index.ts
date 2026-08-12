export interface User {
  userId: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  name: string;
  email: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface TransactionRequest {
  accountId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  currency?: string;
}

export interface TransactionResponse {
  transactionId: string;
  accountId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  status: string;
  balanceAfter: number;
  currency: string;
  createdAt: string;
  message?: string;
  cached: boolean;
}

export interface TransactionHistoryItem {
  transactionId: string;
  accountId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  status: string;
  balanceAfter: number;
  currency: string;
  createdAt: string;
  description: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
