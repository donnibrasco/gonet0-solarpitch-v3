import React from 'react';
import {
  TrendingUp,
  FileText,
  Zap,
  DollarSign,
  Percent,
  Compass,
  FileUp,
  Plus,
  ArrowRight,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
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
import { NavItemKey } from '../common/Sidebar';

interface OverviewViewProps {
  tenant: Tenant;
  proposals: Proposal[];
  customers: Customer[];
  onNavigate: (tab: NavItemKey) => void;
  onOpenCustomerProposal: () => void;
  onOpenBillUpload: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewProposal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tenant,
  proposals,
  customers,
  onNavigate,
  onOpenCustomerProposal,
  onOpenBillUpload,
  onOpenNewCustomer,
  onOpenNewProposal,
}) => {
  // Calculated KPIs
  const totalProposalsCount = proposals.length;
  const totalKwProposed = proposals.reduce((acc, p) => acc + p.design.dcSystemSizeKw, 0);
  const totalPipelineValue = proposals.reduce((acc, p) => acc + p.pricing.totalCustomerPrice, 0);
  const avgPricePerWatt =
    totalKwProposed > 0
      ? (proposals.reduce((acc, p) => acc + p.pricing.netPreTaxPrice, 0) / (totalKwProposed * 1000)).toFixed(2)
      : '2.24';

  const signedProposals = proposals.filter((p) => p.status === 'Signed' || p.status === 'Accepted').length;
  const conversionRate = totalProposalsCount > 0 ? ((signedProposals / totalProposalsCount) * 100).toFixed(1) : '41.6';

  // Monthly sales performance chart data (Alberta Solar Season)
  const salesChartData = [
    { month: 'May', proposals: 8, kw: 42.5, revenue: 102400 },
    { month: 'Jun', proposals: 11, kw: 58.0, revenue: 139200 },
    { month: 'Jul', proposals: 14, kw: 72.5, revenue: 174000 },
    { month: 'Aug', proposals: 12, kw: 64.0, revenue: 153600 },
    { month: 'Sep', proposals: 10, kw: 52.0, revenue: 124800 },
    { month: 'Oct', proposals: totalProposalsCount, kw: totalKwProposed, revenue: totalPipelineValue },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto text-xs">
      {/* Welcome Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <span>{tenant.name}</span>
            <span aria-hidden="true">·</span>
            <span>Commercial & Residential Operations</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-600 font-semibold">{tenant.region}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales & Proposal Pipeline
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenBillUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold shadow-2xs transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Electric Bill</span>
          </button>

          <button
            onClick={() => onNavigate('designer')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold shadow-2xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Solar Designer</span>
          </button>

          <button
            onClick={onOpenCustomerProposal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Alex Morgan Proposal</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (As Required by Section 3) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* 1. Proposals Created */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Proposals Created</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{totalProposalsCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium">+3 this week</div>
        </div>

        {/* 2. Total Proposed kW */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Total System Capacity</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{totalKwProposed.toFixed(1)} kW</div>
          <div className="text-[11px] text-slate-500">~{Math.round(totalKwProposed * 1280).toLocaleString()} kWh / yr</div>
        </div>

        {/* 3. Pipeline Value */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${(totalPipelineValue / 1000).toFixed(1)}k CAD
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Gross Installed Value</div>
        </div>

        {/* 4. Average Installed Price Per Watt */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Average Price / Watt</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">${avgPricePerWatt} / W</div>
          <div className="text-[11px] text-slate-500 font-mono">Alberta benchmark</div>
        </div>

        {/* 5. Proposal-to-Sale Conversion */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Win Rate / Conversion</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{conversionRate}%</div>
          <div className="text-[11px] text-slate-500">{signedProposals} contracts executed</div>
        </div>
      </div>

      {/* Middle Row: Monthly Performance Chart & Live Demo Proposal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Performance Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Sales & Installed Capacity</h2>
              <p className="text-[11px] text-slate-500">Proposed residential solar volume across Alberta territories</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-900 rounded-xs"></span>
                <span>Installed Revenue ($k)</span>
              </div>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(v: any) => [`$${Number(v).toLocaleString()} CAD`, 'Pipeline Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Featured Seed Proposal Card: Alex Morgan */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-xl text-white shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Featured Lead Demo · Section 19
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                📍 4218 19 St NW (Google Maps)
              </span>
            </div>

            <h3 className="text-lg font-bold">Alex Morgan — 4.5 kW System</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              9 × 500W LONGi Hi-MO 6 modules with APsystems microinverters. Seeded cash price: <strong>CAD $10,095.35</strong> (+ 5% GST: $504.77). Estimated annual generation: <strong>5,763 kWh</strong> (106.7% offset).
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Annual Usage</span>
                <span className="text-sm font-bold font-mono">5,400 kWh</span>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Generation Offset</span>
                <span className="text-sm font-bold font-mono text-emerald-400">106.7%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={onOpenCustomerProposal}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Launch Interactive Proposal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('designer')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <span>Edit Roof</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Proposals & Customer Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Proposals Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Active Proposals ({proposals.length})</h2>
            <button
              onClick={() => onNavigate('proposals')}
              className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="pb-2">Proposal / Customer</th>
                  <th className="pb-2">DC Size</th>
                  <th className="pb-2">Annual Output</th>
                  <th className="pb-2">Investment</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-900">{cust?.fullName || p.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.proposalNumber}</div>
                      </td>
                      <td className="py-2.5 font-mono font-medium text-slate-800">
                        {p.design.dcSystemSizeKw} kW
                      </td>
                      <td className="py-2.5 font-mono text-emerald-700">
                        {p.design.estimatedAnnualKwh.toLocaleString()} kWh
                      </td>
                      <td className="py-2.5 font-mono text-slate-900">
                        ${p.pricing.totalCustomerPrice.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5">
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={onOpenCustomerProposal}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        >
                          Present
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customer Activity */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Customer Activity</h2>
            <button
              onClick={() => onNavigate('customers')}
              className="text-[11px] font-semibold text-emerald-600 hover:underline"
            >
              CRM ({customers.length})
            </button>
          </div>

          <div className="space-y-3">
            {customers.slice(0, 4).map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{c.fullName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{c.city}, AB</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {c.propertyAddress} · {c.utilityProvider}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-emerald-700 font-medium">{c.pipelineStage}</span>
                  <span className="text-slate-400 font-mono">{c.annualConsumptionKWh} kWh/yr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
