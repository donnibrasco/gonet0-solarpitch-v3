import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Eye,
  Copy,
  Printer,
  Compass,
  CheckCircle2,
  Clock,
  Share2,
  ArrowRight,
  Send,
  MoreVertical,
  DollarSign,
  Zap,
} from 'lucide-react';
import { Proposal, Customer, Tenant } from '../../types';

interface ProposalsViewProps {
  proposals: Proposal[];
  customers: Customer[];
  tenant: Tenant;
  onOpenCustomerProposal: () => void;
  onNavigateToDesigner: (proposalId?: string) => void;
  onDuplicateProposal: (proposalId: string) => void;
  onUpdateStatus: (proposalId: string, status: Proposal['status']) => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  customers,
  tenant,
  onOpenCustomerProposal,
  onNavigateToDesigner,
  onDuplicateProposal,
  onUpdateStatus,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShareLink = (prop: Proposal) => {
    navigator.clipboard.writeText(window.location.origin + `?proposal=${prop.id}`);
    setCopiedId(prop.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Solar Proposals & Versions
          </h1>
          <p className="text-slate-500 mt-0.5">
            Manage interactive proposals, pricing reviews, version history, and client e-signatures.
          </p>
        </div>

        <button
          onClick={onOpenCustomerProposal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Launch Customer Presentation</span>
        </button>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map((prop) => {
          const cust = customers.find((c) => c.id === prop.customerId);
          const isAlexMorgan = prop.id === 'prop-alex-morgan';

          return (
            <div
              key={prop.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {prop.proposalNumber}
                  </span>
                  <select
                    value={prop.status}
                    onChange={(e) => onUpdateStatus(prop.id, e.target.value as any)}
                    className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Design in Progress">Design in Progress</option>
                    <option value="Pricing Review">Pricing Review</option>
                    <option value="Ready">Ready</option>
                    <option value="Sent">Sent</option>
                    <option value="Viewed">Viewed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Signed">Signed</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {cust?.fullName || prop.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="font-medium text-slate-700">{cust?.propertyAddress || '4218 19 St NW'}, {cust?.city || 'Calgary'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Google Maps Geocoded · Alberta, Canada
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">System Size</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {prop.design.dcSystemSizeKw} kW DC
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Annual Output</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">
                      {prop.design.estimatedAnnualKwh.toLocaleString()} kWh
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Customer Investment</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      ${prop.pricing.totalCustomerPrice.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Includes 5% GST</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Offset</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">
                      {prop.design.consumptionOffsetPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicateProposal(prop.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/50"
                    title="Duplicate Proposal"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleShareLink(prop)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/50"
                    title="Copy Share Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  {copiedId === prop.id && (
                    <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onNavigateToDesigner(prop.id)}
                    className="px-2.5 py-1 font-semibold rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3 text-blue-600" />
                    <span>Roof</span>
                  </button>

                  <button
                    onClick={onOpenCustomerProposal}
                    className="px-3 py-1 font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <span>Present</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
