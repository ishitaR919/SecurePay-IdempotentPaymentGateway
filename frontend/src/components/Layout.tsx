import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Send,
  History,
  Cpu,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Bank Accounts', path: '/accounts', icon: Wallet },
    { label: 'Transfer Funds', path: '/send-money', icon: Send },
    { label: 'Ledger Audit', path: '/transactions', icon: History },
    { label: 'Idempotency Simulator', path: '/idempotency-simulator', icon: Cpu },
  ];

  return (
    <div className="flex min-h-screen bg-[#070913] text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d1222] border-r border-[#1e293b]/50 flex flex-col justify-between p-5 relative z-10">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-4 border-b border-[#1e293b]/40 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-wider font-mono">SecurePay</h1>
              <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">IDEMPOTENCY ENGINE</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="border-t border-[#1e293b]/40 pt-5">
          <div className="flex items-center gap-3 px-2 py-2 mb-4 bg-slate-900/40 rounded-xl border border-[#1e293b]/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm border border-indigo-400/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate leading-snug">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200 font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-[#0a0e1c] to-[#070913]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
