import React from 'react';
import { ShieldCheck, UserCheck, Plus, Mail, Phone, Lock } from 'lucide-react';
import { User, Tenant, UserRole } from '../../types';
import { INITIAL_USERS } from '../../data/mockData';

interface TeamViewProps {
  tenant: Tenant;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ tenant, currentUser, onSwitchRole }) => {
  const users = INITIAL_USERS;

  const permissionsMatrix: { role: UserRole; desc: string; access: string[] }[] = [
    {
      role: 'Super Admin',
      desc: 'Platform owner across all white-label installer tenants.',
      access: ['All Tenants', 'Billing & Licensing', 'Global Catalog', 'User Management'],
    },
    {
      role: 'Company Admin',
      desc: 'Full administrative control over this company workspace.',
      access: ['Pricing Engine', 'Catalog Editing', 'Proposals & CRM', 'Team Roles'],
    },
    {
      role: 'Solar Designer',
      desc: 'Designs roof planes, module layouts, and production calculations.',
      access: ['Roof Designer', 'Production Simulation', 'Shading Analysis'],
    },
    {
      role: 'Sales Representative',
      desc: 'Generates client proposals, negotiates financing, closes contracts.',
      access: ['Customer CRM', 'Proposal Presentation', 'Contract E-Signature'],
    },
    {
      role: 'Installer',
      desc: 'Field access for on-site structural attic inspection and array build.',
      access: ['CAD Single-Lines', 'Permit Packages', 'Inspection Checklists'],
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Team Members & Access Control (RBAC)
          </h1>
          <p className="text-slate-500 mt-0.5">
            Role-based permissions enforcement for sales representatives, solar engineers, and administrators.
          </p>
        </div>
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={u.avatarUrl}
                alt={u.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{u.name}</h3>
                <div className="text-emerald-700 font-medium text-[11px]">{u.role}</div>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-600 text-[11px] pt-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{u.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{u.phone}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Workspace: {tenant.name}</span>
              <button
                onClick={() => onSwitchRole(u.role)}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Act as {u.role.split(' ')[0]}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Workspace RBAC Permission Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissionsMatrix.map((p) => (
            <div key={p.role} className="p-4 border border-slate-100 bg-slate-50/70 rounded-xl space-y-2">
              <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>{p.role}</span>
                {currentUser.role === p.role && (
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{p.desc}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {p.access.map((acc) => (
                  <span
                    key={acc}
                    className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                  >
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
