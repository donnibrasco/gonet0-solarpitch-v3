import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  DollarSign,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  FileCheck,
  Printer,
  Share2,
  Check,
  ArrowRight,
  TrendingDown,
  Building,
  HelpCircle,
  Clock,
  Sparkles,
  MapPin,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Tenant, Proposal, Customer, SolarPanelModel, InverterModel } from '../../types';
import { SOLAR_PANELS, INVERTERS, FINANCE_OPTIONS } from '../../data/mockData';
import {
  calculateAlbertaSolarFinancials,
  calculate25YearProjection,
  calculateLoanAmortization,
} from '../../utils/solarMath';
import { geocodeClientAddress, fetchMapsApiKey, GeocodedLocation } from '../../services/api';
import { GoogleRoofMap } from '../maps/GoogleRoofMap';

interface InteractiveCustomerProposalProps {
  proposal: Proposal;
  customer: Customer;
  tenant: Tenant;
  onClose?: () => void;
  onSignProposal?: (signatureName: string, signatureDataUrl: string) => void;
}

export const InteractiveCustomerProposal: React.FC<InteractiveCustomerProposalProps> = ({
  proposal,
  customer,
  tenant,
  onClose,
  onSignProposal,
}) => {
  // Google Maps State
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCAC5qrohFUDXHBNj8zyrcmqvSmGCjJFOc'
  );
  const [propertyCoords, setPropertyCoords] = useState<{ lat: number; lng: number }>({
    lat: 51.0903,
    lng: -114.1067,
  });
  const [heroViewMode, setHeroViewMode] = useState<'satellite' | 'render'>('satellite');

  useEffect(() => {
    fetchMapsApiKey().then((k) => {
      if (k) setMapsApiKey(k);
    });
    const addr = `${customer.propertyAddress}, ${customer.city}, ${customer.province}`;
    geocodeClientAddress(addr).then((res) => {
      if (res.success && res.location) {
        setPropertyCoords({ lat: res.location.lat, lng: res.location.lng });
      }
    });
  }, [customer.propertyAddress, customer.city, customer.province]);
  // Financing selection state
  const [selectedFinOptionId, setSelectedFinOptionId] = useState<string>(
    proposal.selectedFinanceOptionId || 'fin-greener-homes'
  );
  const [downPayment, setDownPayment] = useState<number>(proposal.downPaymentAmount || 0);

  // E-signature state
  const [signerName, setSignerName] = useState<string>(customer.fullName || 'Alex Morgan');
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);
  const [isSigned, setIsSigned] = useState<boolean>(Boolean(proposal.signedAt));
  const [signedTimestamp, setSignedTimestamp] = useState<string>(
    proposal.signedAt || ''
  );
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Drawing signature pad ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  const panelModel =
    SOLAR_PANELS.find((p) => p.id === proposal.design.panelModelId) || SOLAR_PANELS[0];
  const inverterModel =
    INVERTERS.find((i) => i.id === proposal.design.inverterModelId) || INVERTERS[0];
  const selectedFinOption =
    FINANCE_OPTIONS.find((f) => f.id === selectedFinOptionId) || FINANCE_OPTIONS[0];

  // Pricing values (Alex Morgan: $10,095.35 + $504.77 GST = $10,600.12)
  const preTaxPrice = proposal.pricing.netPreTaxPrice || 10095.35;
  const gstAmount = Number((preTaxPrice * 0.05).toFixed(2));
  const totalCustomerPrice = Number((preTaxPrice + gstAmount).toFixed(2));

  // Alberta Solar Club Tariff & Bill savings
  const financials = calculateAlbertaSolarFinancials(
    proposal.design.estimatedAnnualKwh,
    customer.annualConsumptionKWh
  );

  // 25-Year Long-term Wealth & Savings projection
  const longTerm = calculate25YearProjection(financials.annualSavings, totalCustomerPrice);

  // Amortized financing breakdown
  const financingCalc = calculateLoanAmortization(
    totalCustomerPrice,
    downPayment,
    selectedFinOption.interestRate,
    selectedFinOption.termMonths,
    selectedFinOption.dealerFeePercent
  );

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawnSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawnSignature(false);
    }
  };

  const handleExecuteContract = () => {
    if (!agreementChecked || !signerName) return;
    const dataUrl = canvasRef.current?.toDataURL() || '';
    const nowIso = new Date().toISOString();
    setIsSigned(true);
    setSignedTimestamp(nowIso);
    if (onSignProposal) {
      onSignProposal(signerName, dataUrl);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5 flex items-center justify-between z-30 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: tenant.accentColor }}
          >
            ☀
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">{tenant.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">Proposal #{proposal.proposalNumber}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Exit to Dashboard
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareCopied ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Save as PDF</span>
          </button>

          <a
            href="#accept-proposal"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSigned ? 'Contract Signed' : 'Sign Proposal'}</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* SECTION A: HERO */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold tracking-wide uppercase">
                <Sun className="w-4 h-4 text-emerald-600" />
                <span>Custom Residential Solar Proposal</span>
                <span aria-hidden="true">·</span>
                <span>Calgary, Alberta</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Solar Power Engineered for <br />
                <span className="text-emerald-600">{customer.fullName}</span>
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                Prepared specifically for <strong className="text-slate-800">{customer.propertyAddress}, {customer.city}, {customer.province}</strong>.
                Harness high-efficiency solar generation to lock in predictable clean energy, eliminate rising utility rate volatility, and monetize Alberta Solar Club summer export credits.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>Utility: {customer.utilityProvider}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Prepared: October 2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>25-Year Equipment Warranties</span>
                </div>
              </div>
            </div>

            {/* Aerial Solar Mockup & Live Google Maps Satellite */}
            <div className="md:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md aspect-4/3 group bg-slate-900">
                {heroViewMode === 'satellite' ? (
                  <div className="w-full h-full relative">
                    <GoogleRoofMap
                      apiKey={mapsApiKey}
                      center={propertyCoords}
                      zoom={20}
                      mapTypeId="satellite"
                      interactive={true}
                    />
                    {/* Roof overlay indicator */}
                    <div className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1.5 border border-slate-700">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span className="font-semibold truncate max-w-[170px]">{customer.propertyAddress}</span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-white">
                      <div className="bg-slate-900/90 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-emerald-400 font-bold border border-slate-700">
                        {proposal.design.panelCount} × {panelModel.ratedWatts}W ({proposal.design.dcSystemSizeKw} kW DC)
                      </div>
                      <div className="bg-slate-900/90 backdrop-blur px-2 py-1 rounded text-[9px] text-slate-300 font-mono border border-slate-700">
                        Google Maps Satellite
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src="https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"
                      alt="Solar Array Design"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                      <div className="text-xs font-mono text-emerald-400 font-bold">
                        {proposal.design.panelCount} × {panelModel.ratedWatts}W Modules Installed
                      </div>
                      <div className="text-sm font-bold">
                        {proposal.design.dcSystemSizeKw.toFixed(1)} kW DC System Architecture
                      </div>
                    </div>
                  </>
                )}

                {/* Satellite vs Render toggle in top-right */}
                <div className="absolute top-2.5 right-2.5 z-10 flex bg-slate-900/90 backdrop-blur rounded p-0.5 border border-slate-700">
                  <button
                    onClick={() => setHeroViewMode('satellite')}
                    className={`px-2 py-0.5 text-[9px] rounded font-semibold transition-colors ${
                      heroViewMode === 'satellite' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => setHeroViewMode('render')}
                    className={`px-2 py-0.5 text-[9px] rounded font-semibold transition-colors ${
                      heroViewMode === 'render' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Render
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: SOLAR SYSTEM SUMMARY STATS */}
        <section className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            System Sizing & Performance Metrics
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 mb-1">DC System Size</div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {proposal.design.dcSystemSizeKw.toFixed(1)} kW
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {proposal.design.panelCount} × {panelModel.ratedWatts}W {panelModel.manufacturer}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 mb-1">Estimated Annual Production</div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {proposal.design.estimatedAnnualKwh.toLocaleString()} kWh
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Calgary insolation model
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 mb-1">Household Energy Offset</div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {proposal.design.consumptionOffsetPercent}%
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Net-Zero Electricity Capable
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 mb-1">Inverter Architecture</div>
              <div className="text-lg font-bold text-slate-900 truncate">
                {inverterModel.manufacturer}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {inverterModel.type} ({inverterModel.warrantyYears}-yr warranty)
              </div>
            </div>
          </div>
        </section>

        {/* SECTION C: YOUR ENERGY FUTURE (PRODUCTION VS CONSUMPTION) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Monthly Generation vs. Household Consumption</h2>
              <p className="text-xs text-slate-500 mt-1">
                Comparison of Alex Morgan's historical electricity consumption against modeled solar generation in Calgary.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
                <span>Solar Generation (kWh)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-300 rounded-xs"></span>
                <span>Home Consumption (kWh)</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financials.monthlyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} kWh`, name === 'genKwh' ? 'Solar Generation' : 'Home Consumption']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="genKwh" fill="#10b981" radius={[4, 4, 0, 0]} name="genKwh" />
                <Bar dataKey="usedKwh" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="usedKwh" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alberta Solar Club Tariff Callout */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-950">
                Alberta Solar Club High-Export Rate Advantage Included
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                In Alberta's competitive power market, micro-generators can switch to a high export tariff (typically ~30¢/kWh) during spring and summer months (April–September) when this system generates surplus power, netting an estimated <strong className="text-emerald-950">${financials.totalExportCreditsAnnual.toFixed(0)}/year</strong> in surplus export credits to wipe out winter heating electricity costs.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION D: FINANCIAL SAVINGS & 25-YEAR OUTLOOK */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">25-Year Cumulative Savings & Return on Investment</h2>
              <p className="text-xs text-slate-500 mt-1">
                Modeled at conservative 4.5% annual utility rate inflation and 0.5% module degradation.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Estimated 25-Year Value</div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                ${longTerm.cumulative25YearSavings.toLocaleString()} CAD
              </div>
            </div>
          </div>

          {/* Area Chart for Cumulative Savings */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={longTerm.yearlyProjections} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickFormatter={(y) => `Yr ${y}`} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()} CAD`, 'Cumulative Net Savings']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cumulativeSavings" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#savingsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">First-Year Modeled Savings</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                ${financials.annualSavings.toFixed(2)} CAD
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Average ${financials.averageMonthlySavings.toFixed(2)} / month</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Simple Payback Period</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {proposal.simplePaybackYears} Years
              </div>
              <div className="text-[11px] text-slate-500 mt-1">System pays for itself in ~7.4 yrs</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">25-Year Net ROI</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                +{longTerm.roiPercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Cash return on invested capital</div>
            </div>
          </div>
        </section>

        {/* SECTION E: EQUIPMENT SPECIFICATIONS */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Tier-1 Hardware Specifications</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solar Modules Card */}
            <div className="p-6 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-emerald-600 uppercase font-bold">Solar Modules</div>
                  <h3 className="text-base font-bold text-slate-900">{panelModel.manufacturer} {panelModel.model}</h3>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-emerald-600 text-sm">
                  {panelModel.ratedWatts}W
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Rated Module Wattage</span>
                  <span className="font-mono font-semibold text-slate-900">{panelModel.ratedWatts} Watts</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Cell Architecture</span>
                  <span className="font-medium text-slate-900">{panelModel.cellType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Module Conversion Efficiency</span>
                  <span className="font-mono font-semibold text-slate-900">{panelModel.efficiency}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Manufacturer Warranty</span>
                  <span className="font-semibold text-emerald-600">{panelModel.warrantyYears}-Year Linear Power Warranty</span>
                </div>
              </div>
            </div>

            {/* Inverter Card */}
            <div className="p-6 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-blue-600 uppercase font-bold">Inverter System</div>
                  <h3 className="text-base font-bold text-slate-900">{inverterModel.manufacturer} {inverterModel.model}</h3>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-blue-600 text-sm">
                  {inverterModel.ratedWattsAc}W
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Inverter Type</span>
                  <span className="font-medium text-slate-900">{inverterModel.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Peak Efficiency</span>
                  <span className="font-mono font-semibold text-slate-900">{inverterModel.efficiency}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Module-Level Monitoring</span>
                  <span className="font-medium text-emerald-600">Yes (Wi-Fi & Zigbee Smartphone App)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Manufacturer Warranty</span>
                  <span className="font-semibold text-slate-900">{inverterModel.warrantyYears}-Year Full Replacement</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION F: PURCHASE & FINANCING OPTIONS */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase & Financing Comparison</h2>
              <p className="text-xs text-slate-500 mt-1">
                Compare direct cash purchase against Canadian interest-free and term loans.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">System Investment (Pre-Tax)</span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                ${preTaxPrice.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD
              </div>
              <div className="text-[11px] text-slate-500">
                + Alberta 5% GST: ${gstAmount.toFixed(2)} CAD · Total: ${totalCustomerPrice.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Financing Products Selectable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FINANCE_OPTIONS.filter((f) => f.id !== 'fin-low-promo-20yr').map((opt) => {
              const isSelected = selectedFinOptionId === opt.id;
              const isCash = opt.type === 'cash';
              const isGreener = opt.id === 'fin-greener-homes';

              let paymentLabel = '';
              if (isCash) paymentLabel = 'Full Cash Milestone';
              else if (isGreener) {
                // 10-year interest-free loan on $10,600.12 = ~$88.33/mo
                const mo = Math.round(totalCustomerPrice / 120);
                paymentLabel = `~$${mo} / month (0% Interest)`;
              } else {
                // 15-year 7.99% loan
                const c = calculateLoanAmortization(totalCustomerPrice, 0, opt.interestRate, opt.termMonths);
                paymentLabel = `~$${Math.round(c.monthlyPayment)} / month`;
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedFinOptionId(opt.id)}
                  className={`text-left p-5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {isGreener && (
                    <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Most Popular in Canada
                    </span>
                  )}
                  <div className="font-bold text-sm text-slate-900 mb-1">{opt.name}</div>
                  <div className="text-xs text-slate-500 mb-3">{opt.provider}</div>
                  <div className="text-lg font-bold font-mono text-emerald-700">{paymentLabel}</div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">{opt.description}</p>
                </button>
              );
            })}
          </div>

          {/* Detailed Financing Breakdown for Active Option */}
          {selectedFinOption.type !== 'cash' && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Custom Down Payment & Monthly Schedule:
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  Estimated Payment: ${financingCalc.monthlyPayment.toFixed(2)} CAD / month
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Financed Principal</span>
                  <div className="font-mono font-bold text-slate-900">${financingCalc.financedPrincipal.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Loan Term</span>
                  <div className="font-mono font-bold text-slate-900">{selectedFinOption.termMonths} Months ({selectedFinOption.termMonths / 12} Yrs)</div>
                </div>
                <div>
                  <span className="text-slate-500">Fixed APR</span>
                  <div className="font-mono font-bold text-slate-900">{selectedFinOption.interestRate}%</div>
                </div>
                <div>
                  <span className="text-slate-500">Total Interest over Term</span>
                  <div className="font-mono font-bold text-slate-900">${financingCalc.totalInterest.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION G: INSTALLATION PROCESS ROADMAP */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Your 6-Step Installation Journey</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Site Assessment', desc: 'Attic structural inspection and 100A/200A electrical panel verification.' },
              { step: '02', title: 'Engineering CAD', desc: 'Single-line electrical diagram stamped by a licensed Alberta P.Eng engineer.' },
              { step: '03', title: 'City & Utility Permits', desc: 'Development/building permit with City of Calgary + ENMAX microgen application.' },
              { step: '04', title: 'Array Installation', desc: 'Clean 1-day installation of flashings, rails, microinverters, and LONGi panels.' },
              { step: '05', title: 'City Electrical Inspection', desc: 'City safety codes officer signs off on installation compliance.' },
              { step: '06', title: 'Bi-Directional Meter & Turn-On', desc: 'ENMAX installs the smart bi-directional meter. Turn on your clean energy!' },
            ].map((s) => (
              <div key={s.step} className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1.5">
                <div className="text-[11px] font-mono font-bold text-emerald-600">{s.step}</div>
                <div className="text-sm font-bold text-slate-900">{s.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION H: ACCEPT PROPOSAL & E-SIGNATURE */}
        <section id="accept-proposal" className="bg-white rounded-2xl border-2 border-emerald-500/40 p-8 sm:p-10 shadow-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review & Execute Installation Agreement</h2>
              <p className="text-xs text-slate-500">
                Secure electronic agreement between {customer.fullName} and {tenant.name}.
              </p>
            </div>
          </div>

          {isSigned ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-6 h-6 stroke-3" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">Proposal Accepted & Digitally Signed!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Signer: <strong>{signerName}</strong> · Executed on {new Date(signedTimestamp).toLocaleDateString('en-CA')} at {new Date(signedTimestamp).toLocaleTimeString()}.
                Your project manager at {tenant.name} will contact you within 1 business day for site scheduling.
              </p>
              <div className="text-[11px] font-mono text-emerald-700">
                Verification Hash: SHA256-NET0-{proposal.id.slice(0, 8).toUpperCase()} (Simulation)
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Contract Terms Table */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Client Property:</span>
                  <span className="text-slate-900">{customer.propertyAddress}, Calgary, AB</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Contracted Solar System:</span>
                  <span className="text-slate-900">{proposal.design.panelCount} × {panelModel.ratedWatts}W Modules ({proposal.design.dcSystemSizeKw} kW DC)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Agreed Pre-Tax Total:</span>
                  <span className="text-slate-900 font-mono font-bold">${preTaxPrice.toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Alberta GST (5%):</span>
                  <span className="text-slate-900 font-mono">${gstAmount.toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 text-slate-900">
                  <span>Total Agreement Price:</span>
                  <span className="text-emerald-700 font-mono">${totalCustomerPrice.toFixed(2)} CAD</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  I confirm that I am the legal owner of the property listed above. I agree to the installation scope, equipment warranty terms, and authorize {tenant.name} to submit electrical micro-generation and municipal building permit applications on my behalf.
                </span>
              </label>

              {/* Signer Full Name Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Signer Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Enter full legal name"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Digital Signature Pad
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Clear
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={80}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-20 border border-slate-300 rounded-md bg-slate-50/50 cursor-crosshair touch-none"
                  />
                </div>
              </div>

              {/* Submit Execution Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!agreementChecked || !signerName.trim()}
                  onClick={handleExecuteContract}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    agreementChecked && signerName.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Agreement & Submit Electronic Signature</span>
                </button>
                <div className="text-center text-[11px] text-slate-400 mt-2">
                  Demo Environment: Simulated e-signature execution for testing sales workflow without live third-party billing.
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
