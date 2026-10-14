import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  FileUp,
  ArrowRight,
  X,
  Check,
  Building,
} from 'lucide-react';
import { Customer, PipelineStage, Proposal } from '../../types';

interface CustomersViewProps {
  customers: Customer[];
  proposals: Proposal[];
  onAddCustomer: (customer: Customer) => void;
  onOpenCustomerProposal: () => void;
  onOpenBillUpload: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  proposals,
  onAddCustomer,
  onOpenCustomerProposal,
  onOpenBillUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Customer Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Calgary');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newUtility, setNewUtility] = useState('ENMAX Power / EasyMax');
  const [newMonthlyCost, setNewMonthlyCost] = useState('140');
  const [newUsageKWh, setNewUsageKWh] = useState('6000');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage =
      selectedStageFilter === 'all' || c.pipelineStage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newAddress) return;

    const annual = Number(newUsageKWh) || 6000;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      tenantId: 'tenant-net0',
      fullName: newFullName,
      email: newEmail || 'customer@example.ca',
      phone: newPhone || '+1 (403) 555-0100',
      propertyAddress: newAddress,
      city: newCity,
      province: 'Alberta',
      postalCode: newPostalCode || 'T2P 1A1',
      utilityProvider: newUtility,
      annualConsumptionKWh: annual,
      monthlyAverageKWh: Math.round(annual / 12),
      currentMonthlyCost: Number(newMonthlyCost) || 140,
      propertyType: 'Detached Single Family',
      roofType: 'Asphalt Shingle',
      assignedRepId: 'user-devon',
      leadSource: 'Website Inquiry',
      pipelineStage: 'Lead Created',
      createdAt: new Date().toISOString(),
      notes: ['Lead registered into SolarPitch CRM.'],
      billExtracted: false,
    };

    onAddCustomer(newCust);
    setShowNewModal(false);
    setSelectedCustomer(newCust);
    // Reset form
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewAddress('');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Leads & Customer Management
          </h1>
          <p className="text-slate-500 mt-0.5">
            Track homeowner properties, energy consumption profiles, and proposal pipeline stages across Alberta.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenBillUpload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold shadow-2xs transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Electric Bill</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, address, or city..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-[11px] text-slate-400">Stage:</span>
          {['all', 'Proposal Ready', 'Design in Progress', 'Proposal Sent', 'Contract Signed'].map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStageFilter(stage)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors border ${
                selectedStageFilter === stage
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {stage === 'all' ? 'All Leads' : stage}
            </button>
          ))}
        </div>
      </div>

      {/* Customer CRM Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Customer Name & Contact</th>
              <th className="py-3 px-4">Property Address</th>
              <th className="py-3 px-4">Utility Provider</th>
              <th className="py-3 px-4">Annual Usage</th>
              <th className="py-3 px-4">Monthly Cost</th>
              <th className="py-3 px-4">Pipeline Stage</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map((cust) => (
              <tr
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 text-xs">{cust.fullName}</div>
                  <div className="text-[11px] text-slate-500">{cust.email} · {cust.phone}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-slate-800 font-medium">{cust.propertyAddress}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{cust.city}, {cust.province} {cust.postalCode}</div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  <div className="font-medium">{cust.utilityProvider}</div>
                  <div className="text-[10px] text-slate-400">{cust.propertyType}</div>
                </td>
                <td className="py-3 px-4 font-mono font-medium text-slate-900">
                  {cust.annualConsumptionKWh.toLocaleString()} kWh
                </td>
                <td className="py-3 px-4 font-mono font-medium text-slate-900">
                  ${cust.currentMonthlyCost.toFixed(2)} / mo
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                      cust.pipelineStage === 'Contract Signed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cust.pipelineStage === 'Proposal Ready'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cust.pipelineStage}
                  </span>
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelectedCustomer(cust);
                      onOpenCustomerProposal();
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                  >
                    Proposal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedCustomer.fullName}</h2>
                <div className="text-slate-500 text-xs">
                  {selectedCustomer.propertyAddress}, {selectedCustomer.city}, {selectedCustomer.province}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Key Energy Profile */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500">Annual Usage</span>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {selectedCustomer.annualConsumptionKWh.toLocaleString()} kWh
                  </div>
                  <span className="text-[10px] text-slate-400">~{selectedCustomer.monthlyAverageKWh} kWh / mo</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500">Current Monthly Bill</span>
                  <div className="text-base font-bold font-mono text-slate-900">
                    ${selectedCustomer.currentMonthlyCost.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Utility: {selectedCustomer.utilityProvider}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500">Roof & Property Type</span>
                  <div className="text-base font-bold text-slate-900 truncate">
                    {selectedCustomer.roofType}
                  </div>
                  <span className="text-[10px] text-slate-400">{selectedCustomer.propertyType}</span>
                </div>
              </div>

              {/* Notes & Activity Log */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                  Site Notes & Audit Log
                </span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  {selectedCustomer.notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposal Link */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-950 text-xs">Interactive Customer Proposal Ready</div>
                  <div className="text-[11px] text-emerald-800">
                    4.5 kW DC System · 5,763 kWh estimated generation · 106.7% offset
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    onOpenCustomerProposal();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md shadow-xs transition-colors"
                >
                  View Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New Customer Lead</h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Homeowner Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jordan@example.ca"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(403) 555-0199"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Property Street Address *</label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 724 14 Ave SW"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    placeholder="T2R 0N8"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Utility Provider</label>
                  <select
                    value={newUtility}
                    onChange={(e) => setNewUtility(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="ENMAX Power / EasyMax">ENMAX Power / EasyMax</option>
                    <option value="EPCOR Energy Alberta">EPCOR Energy Alberta</option>
                    <option value="ATCO Energy">ATCO Energy</option>
                    <option value="Direct Energy">Direct Energy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Annual Usage (kWh)</label>
                  <input
                    type="number"
                    value={newUsageKWh}
                    onChange={(e) => setNewUsageKWh(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-slate-800 transition-colors"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
