import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { transactionApi } from '../api/transactionApi';
import type { Account, TransactionResponse } from '../types';
import { Send, Key, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('500.00');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionResponse | null>(null);
  const [error, setError] = useState('');

  const generateUuidKey = () => {
    setIdempotencyKey(crypto.randomUUID());
  };

  useEffect(() => {
    accountApi.getAccounts().then((res) => {
      setAccounts(res.content);
      if (res.content.length > 0) {
        setSelectedAccountId(res.content[0].id);
      }
    });
    generateUuidKey();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!idempotencyKey.trim()) {
      setError('Idempotency key is required');
      return;
    }

    setLoading(true);

    try {
      const res = await transactionApi.createTransaction(
        {
          accountId: selectedAccountId,
          amount: parsedAmount,
          type,
          currency: 'INR',
        },
        idempotencyKey
      );
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transaction processing failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Execute Financial Transaction</h1>
        <p className="text-slate-400 text-sm">Process a Debit or Credit transaction with idempotency protection</p>
      </div>

      {/* Main Form */}
      <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-8 shadow-xl space-y-6">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Balance: ₹{acc.balance.toFixed(2)} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Type & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'DEBIT' | 'CREDIT')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="DEBIT">DEBIT (Subtract)</option>
                <option value="CREDIT">CREDIT (Add)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Idempotency Key Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Idempotency-Key <span className="text-xs text-indigo-400 font-normal">(Required)</span>
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  placeholder="Unique idempotency key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={generateUuidKey}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-indigo-400" /> Generate
              </button>
            </div>
          </div>

          {/* Confirmation Callout */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm flex items-center gap-3">
            <Send className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <span>
              You are about to <strong>{type}</strong> ₹{parseFloat(amount || '0').toFixed(2)} on account{' '}
              <strong>{selectedAccount?.name || 'Selected Account'}</strong>.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-base disabled:opacity-50"
          >
            {loading ? 'Processing Transaction...' : 'Submit Transaction'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Transaction Result Modal / Card */}
        {result && (
          <div className="mt-8 border-t border-slate-700 pt-6 animate-fade-in">
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="text-lg font-bold">Transaction Successfully Processed</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <p className="text-slate-400">Transaction ID</p>
                  <p className="font-mono font-semibold text-slate-200 select-all">{result.transactionId}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="font-bold text-emerald-400">{result.status}</p>
                </div>
                <div>
                  <p className="text-slate-400">Updated Balance</p>
                  <p className="font-extrabold text-slate-100 text-base">
                    ₹{result.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Cached Response?</p>
                  <p className="font-semibold text-indigo-400">
                    {result.cached ? 'Yes (Returned from Redis)' : 'No (First Execution)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
