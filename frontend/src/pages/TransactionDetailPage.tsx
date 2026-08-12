import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { transactionApi } from '../api/transactionApi';
import type { TransactionHistoryItem } from '../types';
import { ShieldCheck, ArrowLeft, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      transactionApi
        .getTransactionById(id)
        .then(setTransaction)
        .catch((err) => setError(err.response?.data?.message || 'Transaction not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="text-center py-12 text-slate-400">Loading transaction details...</div>;

  if (error || !transaction) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-rose-400 mb-4">{error || 'Transaction not found'}</p>
        <Link to="/transactions" className="text-indigo-400 underline">
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/transactions" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700/70 pb-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                transaction.type === 'CREDIT'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {transaction.type === 'CREDIT' ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{transaction.type} Transaction</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{transaction.transactionId}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {transaction.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Transaction Amount</p>
            <p className={`text-2xl font-extrabold mt-1 ${transaction.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'}`}>
              ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Account Balance After</p>
            <p className="text-2xl font-extrabold text-slate-100 mt-1">
              ₹{transaction.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-700/40">
            <span className="text-slate-400">Account ID</span>
            <span className="font-mono text-slate-200">{transaction.accountId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700/40">
            <span className="text-slate-400">Currency</span>
            <span className="font-bold text-slate-200">{transaction.currency}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700/40">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-slate-200">{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">Description</span>
            <span className="text-slate-200">{transaction.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
