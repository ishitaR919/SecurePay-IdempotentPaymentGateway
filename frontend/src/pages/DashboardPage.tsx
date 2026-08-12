import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { transactionApi } from '../api/transactionApi';
import type { Account, TransactionHistoryItem } from '../types';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, RefreshCw, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const accountsRes = await accountApi.getAccounts(0, 10);
      setAccounts(accountsRes.content);

      if (accountsRes.content.length > 0) {
        const primaryAccount = accountsRes.content[0];
        const txRes = await transactionApi.getAccountTransactions(primaryAccount.id, { page: 0, size: 5 });
        setRecentTransactions(txRes.content);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  return (
    <div className="space-y-8 animate-pulse-slow-none">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your bank accounts and idempotency activity</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2.5 bg-[#0f1422] hover:bg-[#1e293b]/60 text-slate-300 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[#1e293b]/40"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            Refresh
          </button>
          <Link
            to="/send-money"
            className="px-4 py-2.5 premium-btn text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            Transfer Funds
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card rounded-2xl p-6 relative overflow-hidden glow-indigo">
          <div className="absolute right-4 top-4 p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Net Balance</p>
          <h2 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-indigo-400/80 mt-3 font-medium">Across {accounts.length} active account(s)</p>
        </div>

        <div className="premium-card rounded-2xl p-6 relative overflow-hidden glow-emerald">
          <div className="absolute right-4 top-4 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Account Balance</p>
          <h2 className="text-3xl font-extrabold text-emerald-400 mt-3 tracking-tight">
            ₹{(accounts[0]?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-500 mt-3 truncate font-medium">{accounts[0]?.name || 'No account created'}</p>
        </div>

        <div className="premium-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent Activity Count</p>
          <h2 className="text-3xl font-extrabold text-white mt-3 tracking-tight">{recentTransactions.length}</h2>
          <p className="text-xs text-slate-500 mt-3 font-medium">Latest executed ledger entries</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accounts List */}
        <div className="premium-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              Your Bank Accounts
            </h3>
            <Link
              to="/accounts"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 bg-[#090d16]/60 rounded-xl border border-[#1e293b]/30 p-6">
              <p className="text-slate-400 text-sm mb-4">No bank accounts found.</p>
              <Link
                to="/accounts"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Account
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-[#0b0e17]/80 hover:bg-[#121724] border border-[#1e293b]/35 rounded-xl p-4 flex justify-between items-center transition-all duration-200"
                >
                  <div>
                    <p className="font-bold text-slate-200 text-sm">{acc.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 select-all">ID: {acc.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-100 text-base">
                      ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="inline-block text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/15 mt-1.5 font-mono">
                      {acc.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="premium-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              Recent Ledger Entries
            </h3>
            <Link
              to="/transactions"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
            >
              Full History
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading transactions...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 bg-[#090d16]/60 rounded-xl border border-[#1e293b]/30 p-6 text-slate-400 text-sm">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="bg-[#0b0e17]/80 hover:bg-[#121724] border border-[#1e293b]/35 rounded-xl p-4 flex justify-between items-center transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        tx.type === 'CREDIT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm">{tx.type}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-extrabold text-sm ${
                        tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}₹
                      {tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Bal: ₹{tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
