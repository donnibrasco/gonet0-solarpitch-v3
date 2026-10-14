import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Percent,
  Calculator,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Tag,
  Save,
} from 'lucide-react';
import { PricingAdder, FinanceOption, Tenant, Proposal } from '../../types';
import { PRICING_ADDERS, FINANCE_OPTIONS } from '../../data/mockData';
import { calculateLoanAmortization, calculatePricingBreakdown } from '../../utils/solarMath';

interface PricingFinancingViewProps {
  tenant: Tenant;
  currentProposal: Proposal;
  onUpdateProposalPricing: (updatedProposal: Proposal) => void;
}

export const PricingFinancingView: React.FC<PricingFinancingViewProps> = ({
  tenant,
  currentProposal,
  onUpdateProposalPricing,
}) => {
  const [addersList, setAddersList] = useState<PricingAdder[]>(PRICING_ADDERS);
  const [selectedAdders, setSelectedAdders] = useState<string[]>(
    currentProposal.customAddersSelected || []
  );
  const [basePricePerWatt, setBasePricePerWatt] = useState<number>(2.24);
  const [gstRate, setGstRate] = useState<number>(tenant.defaultGSTRate || 0.05);
  const [activeFinanceTab, setActiveFinanceTab] = useState<'pricing' | 'financing'>('pricing');

  // Interactive Financing Calculator State
  const [simLoanAmount, setSimLoanAmount] = useState<number>(10600.12);
  const [simDownPayment, setSimDownPayment] = useState<number>(0);
  const [simApr, setSimApr] = useState<number>(7.99);
  const [simTermMonths, setSimTermMonths] = useState<number>(180);
  const [simDealerFee, setSimDealerFee] = useState<number>(0);

  const loanResults = calculateLoanAmortization(
    simLoanAmount,
    simDownPayment,
    simApr,
    simTermMonths,
    simDealerFee
  );

  const handleToggleAdder = (adderId: string) => {
    let next: string[];
    if (selectedAdders.includes(adderId)) {
      next = selectedAdders.filter((id) => id !== adderId);
    } else {
      next = [...selectedAdders, adderId];
    }
    setSelectedAdders(next);

    const activeAddersObjects = addersList.filter((a) => next.includes(a.id));
    const newPricing = calculatePricingBreakdown(
      currentProposal.design.dcSystemSizeKw,
      currentProposal.design.panelCount,
      210,
      310,
      5,
      245,
      365,
      activeAddersObjects,
      undefined,
      gstRate
    );

    onUpdateProposalPricing({
      ...currentProposal,
      customAddersSelected: next,
      pricing: newPricing,
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pricing & Financing Engine
          </h1>
          <p className="text-slate-500 mt-0.5">
            Configure wholesale equipment margins, customer price-per-watt thresholds, installation adders, and loan amortization formulas.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveFinanceTab('pricing')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
              activeFinanceTab === 'pricing'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cost & Adders Breakdown
          </button>
          <button
            onClick={() => setActiveFinanceTab('financing')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
              activeFinanceTab === 'financing'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Financing & Loan Products
          </button>
        </div>
      </div>

      {activeFinanceTab === 'pricing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Real-time Pricing Formula & Margins */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              Active Proposal Price Structure ({currentProposal.title})
            </h2>

            {/* Price Per Watt Benchmark */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600 font-medium">Selling Price / Watt DC</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  ${currentProposal.pricing.pricePerWattDc} / W
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>System DC Rating</span>
                <span className="font-mono">{currentProposal.design.dcSystemSizeKw * 1000} Watts</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Jurisdiction Tax</span>
                <span className="font-mono">Alberta GST (5%)</span>
              </div>
            </div>

            {/* Financial Direct Cost vs Retail Table */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Wholesale Bill-of-Materials vs Retail
              </span>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Solar Modules (Wholesale Direct)</span>
                  <span className="font-mono">${currentProposal.pricing.modulesCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Inverters & Microinverters</span>
                  <span className="font-mono">${currentProposal.pricing.invertersCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Racking & Flashings</span>
                  <span className="font-mono">${currentProposal.pricing.rackingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Balance of System & Electrical Wire</span>
                  <span className="font-mono">${currentProposal.pricing.bosElectricalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Installation Labor</span>
                  <span className="font-mono">${currentProposal.pricing.laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Permits & Engineering Stamps</span>
                  <span className="font-mono">${currentProposal.pricing.permitsAndEngineeringCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-900 font-semibold">
                  <span>Total Direct Cost (COGS)</span>
                  <span className="font-mono">${currentProposal.pricing.totalDirectCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Profit Margin & Customer Price Card */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-emerald-950">Customer Selling Price (Pre-Tax)</span>
                <span className="text-xl font-bold font-mono text-emerald-900">
                  ${currentProposal.pricing.netPreTaxPrice.toFixed(2)} CAD
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-800">
                <span>Alberta GST (5%)</span>
                <span className="font-mono">${currentProposal.pricing.gstAmount.toFixed(2)} CAD</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-emerald-200">
                <span>Total Customer Price (Tax Included)</span>
                <span className="font-mono text-emerald-800 text-sm">
                  ${currentProposal.pricing.totalCustomerPrice.toFixed(2)} CAD
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 pt-1">
                <span>Gross Margin / Profit</span>
                <span className="font-mono font-bold">
                  ${currentProposal.pricing.grossProfit.toFixed(2)} ({currentProposal.pricing.grossMarginPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Adders Catalog & Selection */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Custom Scope & Installation Adders</h2>
                <p className="text-[11px] text-slate-500">
                  Click to include or remove adders from the current proposal estimate.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {addersList.map((adder) => {
                const isChecked = selectedAdders.includes(adder.id);
                return (
                  <div
                    key={adder.id}
                    onClick={() => handleToggleAdder(adder.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{adder.name}</div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {adder.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                            <span>Category: {adder.category}</span>
                            <span>·</span>
                            <span>Unit: {adder.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold font-mono text-sm text-slate-900">
                          +${adder.retailPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Wholesale: ${adder.wholesaleCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* FINANCING PRODUCTS & AMORTIZATION CALCULATOR */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Amortization Calculator */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Loan Amortization Simulator
            </h2>
            <p className="text-slate-500 text-[11px]">
              Calculates exact monthly repayments, dealer fees, and total lifetime interest based on Canada standard mortgage/loan amortization formulas.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <span className="text-[11px] text-slate-600 font-medium block mb-1">
                  System Cash Investment ($ CAD)
                </span>
                <input
                  type="number"
                  value={simLoanAmount}
                  onChange={(e) => setSimLoanAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-medium block mb-1">
                  Customer Down Payment ($ CAD)
                </span>
                <input
                  type="number"
                  value={simDownPayment}
                  onChange={(e) => setSimDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-600 font-medium block mb-1">
                    Annual APR (%)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={simApr}
                    onChange={(e) => setSimApr(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 font-medium block mb-1">
                    Term (Months)
                  </span>
                  <select
                    value={simTermMonths}
                    onChange={(e) => setSimTermMonths(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-900 font-medium"
                  >
                    <option value={60}>60 mo (5 Yrs)</option>
                    <option value={120}>120 mo (10 Yrs - Greener Homes)</option>
                    <option value={180}>180 mo (15 Yrs - Financeit)</option>
                    <option value={240}>240 mo (20 Yrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-600 font-medium block mb-1">
                  Dealer Fee (%)
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={simDealerFee}
                  onChange={(e) => setSimDealerFee(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 mt-4 shadow-sm">
              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">
                Calculated Payment Result
              </span>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                ${loanResults.monthlyPayment.toFixed(2)} CAD <span className="text-xs text-slate-300 font-normal">/ month</span>
              </div>
              <div className="text-[11px] text-slate-300 flex justify-between pt-1 border-t border-slate-800">
                <span>Total Principal Financed:</span>
                <span className="font-mono font-bold">${loanResults.financedPrincipal.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-300 flex justify-between">
                <span>Total Interest Paid:</span>
                <span className="font-mono">${loanResults.totalInterest.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-300 flex justify-between">
                <span>Total Lifetime Repayment:</span>
                <span className="font-mono font-bold">${loanResults.totalRepayment.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right: Integrated Financing Products Table */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Configured Financing Partners & Products
            </h2>

            <div className="space-y-3">
              {FINANCE_OPTIONS.map((opt) => (
                <div key={opt.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{opt.name}</h3>
                      <div className="text-[11px] text-slate-500 font-mono">{opt.provider}</div>
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-700">
                      {opt.type === 'cash' ? '0% APR' : `${opt.interestRate}% APR · ${opt.termMonths}m`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
