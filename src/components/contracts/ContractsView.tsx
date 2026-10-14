import React from 'react';
import {
  FileSignature,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Shield,
  FileCheck,
  Building,
} from 'lucide-react';
import { Proposal, Customer, Tenant } from '../../types';

interface ContractsViewProps {
  proposals: Proposal[];
  customers: Customer[];
  tenant: Tenant;
  onOpenCustomerProposal: () => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  proposals,
  customers,
  tenant,
  onOpenCustomerProposal,
}) => {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Contracts & Electronic Signatures
          </h1>
          <p className="text-slate-500 mt-0.5">
            Audit trail of customer agreements, digital sign-offs, and microgeneration compliance documents.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Contract / Document</th>
              <th className="py-3 px-4">Client Property</th>
              <th className="py-3 px-4">System Scope</th>
              <th className="py-3 px-4">Agreement Value</th>
              <th className="py-3 px-4">Execution Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposals.map((prop) => {
              const cust = customers.find((c) => c.id === prop.customerId);
              const isSigned = prop.status === 'Signed' || Boolean(prop.signedAt);

              return (
                <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileSignature className="w-4 h-4 text-emerald-600" />
                      <span>Standard Solar Installation Agreement</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref #{prop.proposalNumber}-CTR · {tenant.name}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{cust?.fullName || prop.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{cust?.propertyAddress}, {cust?.city}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {prop.design.dcSystemSizeKw} kW DC ({prop.design.panelCount} panels)
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    ${prop.pricing.totalCustomerPrice.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">
                    {isSigned ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Signed ({prop.signedByName || 'Alex Morgan'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending Signature</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={onOpenCustomerProposal}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                    >
                      View & Sign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="text-slate-600 leading-relaxed text-[11px]">
          <strong>Legal & Compliance Notice:</strong> In demo mode, electronic signatures are captured with timestamp and SHA-256 verification hashes for testing without live third-party billing. For production deployment, connect Dropbox Sign (HelloSign) or DocuSign API in Company Settings.
        </div>
      </div>
    </div>
  );
};
