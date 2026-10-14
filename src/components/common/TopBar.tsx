import React from 'react';
import {
  Search,
  Plus,
  FileUp,
  Building2,
  ChevronDown,
  UserCheck,
  Compass,
} from 'lucide-react';
import { Tenant, User, UserRole } from '../../types';

interface TopBarProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenBillUpload: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewProposal: () => void;
  onNavigateToDesigner: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  currentUser,
  onRoleChange,
  onOpenBillUpload,
  onOpenNewCustomer,
  onOpenNewProposal,
  onNavigateToDesigner,
}) => {
  const [showTenantDropdown, setShowTenantDropdown] = React.useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);

  const roles: UserRole[] = [
    'Super Admin',
    'Company Admin',
    'Proposal Manager',
    'Solar Designer',
    'Sales Representative',
    'Installer',
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 z-10 shrink-0">
      {/* Left Area: Multi-Tenant & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        {/* Tenant Switcher dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTenantDropdown(!showTenantDropdown);
              setShowRoleDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[140px]">{currentTenant.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showTenantDropdown && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch White-Label Tenant
              </div>
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTenant(t);
                    setShowTenantDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    t.id === currentTenant.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.region}</div>
                  </div>
                  {t.id === currentTenant.id && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals, customers, addresses, or serial numbers..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Right Area: Role Selector & Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowTenantDropdown(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium">{currentUser.role}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Simulate RBAC Role
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    onRoleChange(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${
                    currentUser.role === r ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action: Upload Bill */}
        <button
          onClick={onOpenBillUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs"
        >
          <FileUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Upload Bill</span>
        </button>

        {/* Action: Solar Designer */}
        <button
          onClick={onNavigateToDesigner}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Designer</span>
        </button>

        {/* Action: New Customer */}
        <button
          onClick={onOpenNewCustomer}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-slate-600" />
          <span>Add Lead</span>
        </button>

        {/* Primary Action: New Proposal */}
        <button
          onClick={onOpenNewProposal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>New Proposal</span>
        </button>
      </div>
    </header>
  );
};
