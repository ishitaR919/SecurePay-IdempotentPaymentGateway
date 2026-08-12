import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { transactionApi } from '../api/transactionApi';
import type { Account, TransactionHistoryItem } from '../types';
import { History, Filter, Search, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransactionHistoryPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    accountApi.getAccounts().then((res) => {
      setAccounts(res.content);
      if (res.content.length > 0) {
        setSelectedAccountId(res.content[0].id);
      }
    });
  }, []);

  const fetchTransactions = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await transactionApi.getAccountTransactions(selectedAccountId, {
        type: filterType,
        page,
        size: 10,
        sortProperty: 'createdAt',
        sortDirection: 'desc',
      });
      setTransactions(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedAccountId, filterType, page]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <p className="text-slate-400 text-sm">Audit log of all ledger debits and credits</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-1 min-w-[280px]">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (₹{acc.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Type Filter</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(0);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="ALL">All Transactions</option>
              <option value="CREDIT">CREDIT Only</option>
              <option value="DEBIT">DEBIT Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No transactions matching filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Transaction ID</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Balance After</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-indigo-300">{tx.transactionId}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          tx.type === 'CREDIT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-4 px-6 font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-300">
                      ₹{tx.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/transactions/${tx.transactionId}`}
                        className="text-xs font-medium text-indigo-400 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="bg-slate-900/60 border-t border-slate-700/60 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Page <strong className="text-slate-200">{page + 1}</strong> of <strong className="text-slate-200">{totalPages || 1}</strong>
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
