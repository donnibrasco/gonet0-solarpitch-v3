import React, { useState } from 'react';
import {
  Building2,
  Palette,
  Globe,
  DollarSign,
  ShieldCheck,
  Save,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Tenant } from '../../types';

interface SettingsViewProps {
  tenant: Tenant;
  onUpdateTenant: (updated: Tenant) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ tenant, onUpdateTenant }) => {
  const [name, setName] = useState(tenant.name);
  const [tagline, setTagline] = useState(tenant.tagline);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor);
  const [accentColor, setAccentColor] = useState(tenant.accentColor);
  const [customDomain, setCustomDomain] = useState(tenant.customDomain || '');
  const [phone, setPhone] = useState(tenant.phone);
  const [email, setEmail] = useState(tenant.email);
  const [region, setRegion] = useState(tenant.region);
  const [gstRate, setGstRate] = useState(tenant.defaultGSTRate);
  const [solarClub, setSolarClub] = useState(tenant.solarClubTariffSupport);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Tenant = {
      ...tenant,
      name,
      tagline,
      primaryColor,
      accentColor,
      customDomain,
      phone,
      email,
      region,
      defaultGSTRate: gstRate,
      solarClubTariffSupport: solarClub,
    };
    onUpdateTenant(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto text-xs">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Company & White-Label Settings
        </h1>
        <p className="text-slate-500 mt-0.5">
          Configure multi-tenant branding, custom domain, default sales tax rates, and regional utility club settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Brand Identity & Corporate Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Trade Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Operating Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* White-Label Theme & Colors */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>Theme Colors & Visual Accents</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Brand Dark Navy</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Electric Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional & Tax Engine */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Jurisdiction Tax & Utility Club Features</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Default GST Rate (Alberta = 0.05 / 5%)
              </label>
              <input
                type="number"
                step="0.01"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Custom Domain (CNAME / White-label)
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="portal.yourcompany.ca"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={solarClub}
              onChange={(e) => setSolarClub(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-slate-800 font-medium">
              Enable Alberta Solar Club high-export season tariff simulator on customer proposals
            </span>
          </label>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedToast ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Workspace settings updated!</span>
            </div>
          ) : (
            <span className="text-slate-400">Settings apply across all proposals for this tenant.</span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Tenant Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
