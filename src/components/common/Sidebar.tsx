import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Compass,
  DollarSign,
  FileSignature,
  Package,
  ShieldCheck,
  BarChart3,
  Settings,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Tenant, User } from '../../types';

export type NavItemKey =
  | 'overview'
  | 'customers'
  | 'proposals'
  | 'designer'
  | 'pricing'
  | 'contracts'
  | 'products'
  | 'team'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  tenant: Tenant;
  currentUser: User;
  onOpenTestsModal: () => void;
  onOpenCustomerProposal: () => void;
  onOpenAiDrawer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  tenant,
  currentUser,
  onOpenTestsModal,
  onOpenCustomerProposal,
  onOpenAiDrawer,
}) => {
  const navItems: { key: NavItemKey; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'customers', label: 'Leads & Customers', icon: Users, badge: '4' },
    { key: 'proposals', label: 'Proposals', icon: FileText, badge: '3' },
    { key: 'designer', label: 'Solar Designer', icon: Compass },
    { key: 'pricing', label: 'Pricing & Financing', icon: DollarSign },
    { key: 'contracts', label: 'Contracts', icon: FileSignature },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'team', label: 'Team', icon: ShieldCheck },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Company Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen shrink-0 z-20 select-none">
      {/* Top Branding Header */}
      <div>
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
              style={{ backgroundColor: tenant.accentColor || '#10b981' }}
            >
              ☀
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{tenant.name}</div>
              <div className="text-[11px] text-slate-500 truncate font-mono">White-Label Workspace</div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Sales & Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Launch & Footer Actions */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/70">
        {/* Interactive Customer Proposal Button */}
        <button
          onClick={onOpenCustomerProposal}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Proposal</span>
          </div>
          <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded text-emerald-100 font-mono">Alex M.</span>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAiDrawer}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>SolarPitch AI</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Gemini</span>
        </button>

        {/* Automated Tests Runner */}
        <button
          onClick={onOpenTestsModal}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-200/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verification Tests</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono font-bold">7/7 OK</span>
        </button>

        {/* Current User Card */}
        <div className="pt-2 border-t border-slate-200 flex items-center gap-2.5 px-2">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-800 truncate leading-tight">{currentUser.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
