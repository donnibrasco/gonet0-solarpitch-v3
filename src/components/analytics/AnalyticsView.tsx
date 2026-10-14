import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Tenant, Proposal, Customer } from '../../types';

interface AnalyticsViewProps {
  tenant: Tenant;
  proposals: Proposal[];
  customers: Customer[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tenant, proposals, customers }) => {
  // Conversion Funnel Data
  const funnelStages = [
    { stage: '1. Lead Registered', count: customers.length, color: '#64748b' },
    { stage: '2. Bill Audited', count: customers.filter((c) => c.billExtracted).length, color: '#38bdf8' },
    { stage: '3. Proposal Created', count: proposals.length, color: '#0284c7' },
    { stage: '4. Proposal Viewed', count: proposals.filter((p) => p.customerViewedAt || p.status === 'Ready').length, color: '#10b981' },
    { stage: '5. Contract Executed', count: proposals.filter((p) => p.status === 'Signed').length + 1, color: '#059669' },
  ];

  // Sales Leaderboard
  const reps = [
    { name: 'Devon Miller', proposals: 7, signed: 3, kw: 36.5, winRate: '42.8%' },
    { name: 'Elena Rostova', proposals: 5, signed: 2, kw: 28.0, winRate: '40.0%' },
    { name: 'Marcus Vance', proposals: 4, signed: 2, kw: 22.5, winRate: '50.0%' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sales & Engineering Analytics
        </h1>
        <p className="text-slate-500 mt-0.5">
          Pipeline conversion velocity, rep leaderboard, and system sizing performance for {tenant.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversion Funnel */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Pipeline Stage Conversion Funnel</h2>
          <div className="space-y-3 pt-2">
            {funnelStages.map((st) => (
              <div key={st.stage} className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-700">
                  <span>{st.stage}</span>
                  <span className="font-mono font-bold text-slate-900">{st.count} accounts</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(15, (st.count / Math.max(1, customers.length)) * 100)}%`,
                      backgroundColor: st.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rep Leaderboard */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Sales Representative Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold">
                  <th className="pb-2">Sales Rep</th>
                  <th className="pb-2">Proposals</th>
                  <th className="pb-2">Closed kW</th>
                  <th className="pb-2 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reps.map((r, i) => (
                  <tr key={r.name} className="hover:bg-slate-50">
                    <td className="py-2.5 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-[10px] font-mono flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span>{r.name}</span>
                    </td>
                    <td className="py-2.5 font-mono">{r.proposals} ({r.signed} signed)</td>
                    <td className="py-2.5 font-mono font-bold text-slate-800">{r.kw} kW</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                      {r.winRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
