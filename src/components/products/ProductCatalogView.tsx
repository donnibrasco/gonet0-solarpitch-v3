import React, { useState } from 'react';
import {
  Package,
  Plus,
  Zap,
  ShieldCheck,
  Tag,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { SolarPanelModel, InverterModel, Tenant } from '../../types';
import { SOLAR_PANELS, INVERTERS } from '../../data/mockData';

interface ProductCatalogViewProps {
  tenant: Tenant;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({ tenant }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'inverters'>('modules');
  const [panels, setPanels] = useState<SolarPanelModel[]>(SOLAR_PANELS);
  const [inverters, setInverters] = useState<InverterModel[]>(INVERTERS);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Equipment & Product Catalog
          </h1>
          <p className="text-slate-500 mt-0.5">
            Manage approved solar modules, string and microinverters, battery energy storage, and wholesale procurement pricing.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
              activeTab === 'modules' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Solar Modules ({panels.length})
          </button>
          <button
            onClick={() => setActiveTab('inverters')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
              activeTab === 'inverters' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Inverters ({inverters.length})
          </button>
        </div>
      </div>

      {activeTab === 'modules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                    {p.manufacturer}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{p.model}</h3>
                </div>
                <span className="text-lg font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {p.ratedWatts} W
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Cell Architecture</span>
                  <span className="font-medium text-slate-900">{p.cellType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Module Efficiency</span>
                  <span className="font-mono font-bold text-slate-900">{p.efficiency}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Physical Dimensions</span>
                  <span className="font-mono">{p.lengthM}m × {p.widthM}m</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Manufacturer Warranty</span>
                  <span className="font-semibold text-emerald-700">{p.warrantyYears}-Year Linear</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Wholesale Supply Cost</span>
                  <span className="font-mono text-slate-900 font-semibold">${p.wholesaleCost.toFixed(2)} / unit</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Standard Retail Price</span>
                  <span className="font-mono text-emerald-800 font-bold">${p.retailPrice.toFixed(2)} / unit</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: Active Catalog</span>
                <span className="font-mono">CEC Approved</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inverters.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                    {inv.manufacturer}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{inv.model}</h3>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {inv.type}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Rated AC Output</span>
                  <span className="font-mono font-bold text-slate-900">{inv.ratedWattsAc} Watts AC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Max DC Input</span>
                  <span className="font-mono">{inv.maxDcInputWatts} Watts DC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Peak Efficiency</span>
                  <span className="font-mono font-bold text-slate-900">{inv.efficiency}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Warranty Period</span>
                  <span className="font-semibold text-emerald-700">{inv.warrantyYears}-Year Replacement</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Wholesale Cost</span>
                  <span className="font-mono text-slate-900 font-semibold">${inv.wholesaleCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Retail Price</span>
                  <span className="font-mono text-emerald-800 font-bold">${inv.retailPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
