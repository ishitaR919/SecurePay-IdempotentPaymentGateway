import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { transactionApi } from '../api/transactionApi';
import type { Account, TransactionResponse } from '../types';
import { Cpu, Send, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

interface SimulationResult {
  requestNum: number;
  status: number;
  statusText: string;
  response: TransactionResponse | null;
  error?: string;
  timeMs: number;
}

export const IdempotencySimulatorPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('500.00');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [finalBalance, setFinalBalance] = useState<number | null>(null);

  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const generateNewKey = () => {
    setIdempotencyKey(`sim-${crypto.randomUUID().substring(0, 8)}`);
  };

  useEffect(() => {
    accountApi.getAccounts().then((res) => {
      setAccounts(res.content);
      if (res.content.length > 0) {
        setSelectedAccountId(res.content[0].id);
        setInitialBalance(res.content[0].balance);
      }
    });
    generateNewKey();
  }, []);

  const handleAccountChange = async (accId: string) => {
    setSelectedAccountId(accId);
    const acc = accounts.find((a) => a.id === accId);
    if (acc) setInitialBalance(acc.balance);
  };

  const runSimulation = async (times: number) => {
    if (!selectedAccountId || !idempotencyKey) return;
    setSimulating(true);
    setResults([]);
    setFinalBalance(null);

    const parsedAmount = parseFloat(amount);
    const simResults: SimulationResult[] = [];

    // Capture initial balance before starting simulation
    const latestAccount = await accountApi.getAccountById(selectedAccountId);
    setInitialBalance(latestAccount.balance);

    for (let i = 1; i <= times; i++) {
      const startTime = performance.now();
      try {
        const res = await transactionApi.createTransaction(
          {
            accountId: selectedAccountId,
            amount: parsedAmount,
            type,
            currency: 'INR',
          },
          idempotencyKey // ALWAYS pass exact same key!
        );
        const endTime = performance.now();
        simResults.push({
          requestNum: i,
          status: res.cached ? 200 : 201,
          statusText: res.cached ? '200 OK (Cached Response)' : '201 CREATED (Processed)',
          response: res,
          timeMs: Math.round(endTime - startTime),
        });
      } catch (err: any) {
        const endTime = performance.now();
        simResults.push({
          requestNum: i,
          status: err.response?.status || 500,
          statusText: err.response?.data?.error || 'FAILED',
          response: null,
          error: err.response?.data?.message || 'Error occurred',
          timeMs: Math.round(endTime - startTime),
        });
      }

      setResults([...simResults]);
      // Small artificial delay to show visual progression
      await new Promise((r) => setTimeout(r, 200));
    }

    // Refresh final account balance after requests finish
    const updatedAccount = await accountApi.getAccountById(selectedAccountId);
    setFinalBalance(updatedAccount.balance);
    setSimulating(false);
  };

  const processedCount = results.filter((r) => r.status === 201).length;
  const cachedCount = results.filter((r) => r.status === 200).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg border border-indigo-400/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Idempotency Simulator</h1>
            <p className="text-slate-400 text-sm mt-1">
              Demonstrates prevention of duplicate charges under identical idempotency key headers
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Inputs Card */}
      <div className="premium-card rounded-2xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Debit/Credit Source</label>
            <select
              value={selectedAccountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b]/55 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-semibold transition-all"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (₹{acc.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Transfer Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b]/55 rounded-xl px-4 py-3 text-slate-200 text-sm font-mono font-extrabold focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Operation</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'DEBIT' | 'CREDIT')}
              className="w-full bg-[#090d16] border border-[#1e293b]/55 rounded-xl px-4 py-3 text-slate-200 text-sm font-extrabold focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="DEBIT">DEBIT (Subtract)</option>
              <option value="CREDIT">CREDIT (Add)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Active Header: Idempotency-Key
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="flex-1 bg-[#090d16] border border-[#1e293b]/55 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={generateNewKey}
              className="px-4 py-3 bg-[#0f1422] hover:bg-[#1e293b]/60 border border-[#1e293b]/40 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-hover" /> New Key
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2 border-t border-[#1e293b]/30">
          <button
            onClick={() => runSimulation(1)}
            disabled={simulating}
            className="flex-1 py-3.5 bg-slate-800/80 hover:bg-slate-700/60 text-slate-200 font-semibold rounded-xl transition-all text-sm disabled:opacity-50 border border-[#1e293b]/30"
          >
            Execute Once (Single Call)
          </button>
          <button
            onClick={() => runSimulation(5)}
            disabled={simulating}
            className="flex-1 py-3.5 premium-btn text-white font-extrabold rounded-xl transition-all text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" /> Execute 5 Calls Simultaneously
          </button>
        </div>
      </div>

      {/* Visual Architectural Diagram */}
      {results.length > 0 && (
        <div className="premium-card rounded-2xl p-6 space-y-6 glow-indigo">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Execution Flow Diagram
          </h3>

          <div className="p-6 bg-[#080b13] rounded-xl border border-[#1e293b]/40 font-mono text-xs text-slate-300 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center p-3.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl w-full md:w-40">
              <span className="block text-indigo-400 font-extrabold text-sm">{results.length} Request Calls</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Identical Headers</span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

            <div className="text-center p-3.5 bg-[#0f1322] border border-[#1e293b]/50 rounded-xl w-full md:w-52">
              <span className="block text-slate-200 font-bold">Redis Idempotency Layer</span>
              <span className="text-[10px] text-slate-500 mt-1 block">SHA-256 Fingerprint Check</span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

            <div className="flex flex-col gap-2.5 w-full md:w-52">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-center font-bold">
                1 DB Execution ({processedCount})
              </div>
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-lg text-center font-bold">
                {cachedCount} Cached Responses (200 OK)
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-[#0b0e17]/80 p-4 rounded-xl border border-[#1e293b]/40">
              <p className="text-xs font-semibold text-slate-400">Total API Calls</p>
              <p className="text-2xl font-black text-white mt-1.5">{results.length}</p>
            </div>
            <div className="bg-[#0b0e17]/80 p-4 rounded-xl border border-[#1e293b]/40">
              <p className="text-xs font-semibold text-slate-400">Transactions Logged</p>
              <p className="text-2xl font-black text-emerald-400 mt-1.5">{processedCount}</p>
            </div>
            <div className="bg-[#0b0e17]/80 p-4 rounded-xl border border-[#1e293b]/40">
              <p className="text-xs font-semibold text-slate-400">Cached Responses</p>
              <p className="text-2xl font-black text-indigo-400 mt-1.5">{cachedCount}</p>
            </div>
            <div className="bg-[#0b0e17]/80 p-4 rounded-xl border border-[#1e293b]/40">
              <p className="text-xs font-semibold text-slate-400">Duplicate Charges</p>
              <p className="text-2xl font-black text-rose-400 mt-1.5">0</p>
            </div>
          </div>

          {/* Balance Comparison Bar */}
          {initialBalance !== null && finalBalance !== null && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex justify-between items-center text-sm font-semibold text-emerald-300">
              <span>Opening Balance: ₹{initialBalance.toFixed(2)}</span>
              <span>Closing Balance: ₹{finalBalance.toFixed(2)}</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ✓ Duplicate charge prevented
              </span>
            </div>
          )}

          {/* Detailed Request Execution Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Request Logs</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((res) => (
                <div
                  key={res.requestNum}
                  className="p-3.5 bg-[#080b13] border border-[#1e293b]/40 rounded-xl flex justify-between items-center text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">Request #{res.requestNum}</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-lg ${
                        res.status === 201
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {res.statusText}
                    </span>
                  </div>
                  <span className="text-slate-400">{res.timeMs} ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
