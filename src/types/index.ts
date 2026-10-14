// Core TypeScript definitions for SolarPitch

export type UserRole =
  | 'Super Admin'
  | 'Company Admin'
  | 'Proposal Manager'
  | 'Solar Designer'
  | 'Sales Manager'
  | 'Sales Representative'
  | 'Appointment Setter'
  | 'Installer'
  | 'Accounting';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  region: string; // e.g. "Alberta, Canada"
  defaultGSTRate: number; // e.g. 0.05
  defaultCurrency: string;
  customDomain?: string;
  solarClubTariffSupport: boolean;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
}

export type PipelineStage =
  | 'Lead Created'
  | 'Bill Uploaded'
  | 'Design in Progress'
  | 'Proposal Ready'
  | 'Proposal Sent'
  | 'Proposal Viewed'
  | 'Contract Signed'
  | 'Installation Scheduled'
  | 'Closed Lost';

export interface Customer {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  city: string;
  province: string;
  postalCode: string;
  utilityProvider: string;
  annualConsumptionKWh: number;
  monthlyAverageKWh: number;
  currentMonthlyCost: number;
  propertyType: 'Detached Single Family' | 'Bungalow' | 'Two-Storey' | 'Duplex' | 'Commercial';
  roofType: 'Asphalt Shingle' | 'Standing Seam Metal' | 'Concrete Tile' | 'Flat EPDM';
  assignedRepId: string;
  leadSource: 'Website Inquiry' | 'Canvassing' | 'Referral' | 'Home Show' | 'Partner';
  pipelineStage: PipelineStage;
  createdAt: string;
  notes: string[];
  billExtracted?: boolean;
}

export interface SolarPanelModel {
  id: string;
  tenantId: string;
  manufacturer: string;
  model: string;
  ratedWatts: number;
  widthM: number;
  lengthM: number;
  efficiency: number; // e.g. 21.8%
  cellType: string;
  warrantyYears: number;
  wholesaleCost: number;
  retailPrice: number;
  active: boolean;
  isExample: boolean;
}

export interface InverterModel {
  id: string;
  tenantId: string;
  type: 'Microinverter' | 'String Inverter' | 'Hybrid Inverter';
  manufacturer: string;
  model: string;
  ratedWattsAc: number;
  maxDcInputWatts: number;
  efficiency: number; // e.g. 97.5%
  warrantyYears: number;
  wholesaleCost: number;
  retailPrice: number;
  channels: number; // e.g. 2 panels per APsystems DS3 microinverter
  active: boolean;
  isExample: boolean;
}

export interface PricingAdder {
  id: string;
  tenantId: string;
  name: string;
  category: 'Electrical' | 'Roof & Structural' | 'Site & Ground' | 'Permits & Admin' | 'Battery';
  unit: 'per_system' | 'per_watt' | 'per_panel' | 'per_foot';
  wholesaleCost: number;
  retailPrice: number;
  defaultSelected?: boolean;
  description: string;
}

export interface FinanceOption {
  id: string;
  name: string;
  provider: string;
  termMonths: number;
  interestRate: number; // e.g. 7.99%
  dealerFeePercent: number; // e.g. 0% or 12%
  promoPeriodMonths?: number;
  promoInterestRate?: number;
  minDownPaymentPercent: number;
  type: 'cash' | 'standard_loan' | 'low_rate_loan' | 'deferred_interest';
  description: string;
}

export interface PlacedPanel {
  id: string;
  planeId: string;
  x: number; // canvas coordinates (relative to roof origin in meters or px)
  y: number;
  orientation: 'portrait' | 'landscape';
  rotationDeg: number;
  isValid: boolean; // collision & setback check
}

export interface RoofPlane {
  id: string;
  name: string;
  pitchDeg: number; // e.g. 25 deg (5/12 pitch is ~22.6 deg)
  azimuthDeg: number; // 180 = South, 90 = East, 270 = West
  shadingPercent: number; // 0 - 100%
  setbackMeters: number; // e.g. 0.45m
  surfaceAreaM2?: number; // Actual roof plane surface area in m² (from Google Solar API)
  surfaceAreaSqFt?: number; // Actual surface area in sq ft
  usableAreaM2?: number; // Usable area after setbacks
  maxPanels?: number; // Maximum physical module capacity
  cardinal?: string; // South, West, East, North
  polygonPoints: { x: number; y: number }[]; // in canvas coordinate space
}

export interface SolarDesign {
  id: string;
  proposalId: string;
  panelModelId: string;
  inverterModelId: string;
  roofPlanes: RoofPlane[];
  panels: PlacedPanel[];
  panelCount: number;
  dcSystemSizeKw: number;
  dcAcRatio: number;
  estimatedAnnualKwh: number;
  specificYieldKwhPerKw: number;
  consumptionOffsetPercent: number;
  totalRoofAreaM2?: number; // Total roof surface area from Google Solar API
  simulationProvider: 'NREL PVWatts (Validated)' | 'Canadian Solar Insolation Model' | 'Google Solar API';
  satelliteImageUrl?: string;
}

export interface PricingBreakdown {
  modulesCost: number;
  invertersCost: number;
  rackingCost: number;
  bosElectricalCost: number;
  laborCost: number;
  permitsAndEngineeringCost: number;
  addersCost: number;
  totalDirectCost: number;
  baseRetailPrice: number;
  addersRetailPrice: number;
  subtotalRetailPrice: number;
  appliedDiscount: number;
  netPreTaxPrice: number;
  gstAmount: number;
  totalCustomerPrice: number;
  pricePerWattDc: number;
  grossProfit: number;
  grossMarginPercent: number;
}

export interface Proposal {
  id: string;
  tenantId: string;
  customerId: string;
  proposalNumber: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Design in Progress' | 'Pricing Review' | 'Ready' | 'Sent' | 'Viewed' | 'Accepted' | 'Signed' | 'Cancelled';
  assignedRepId: string;
  design: SolarDesign;
  pricing: PricingBreakdown;
  selectedFinanceOptionId: string;
  downPaymentAmount: number;
  customAddersSelected: string[];
  monthlySolarSavingsEst: number;
  twentyFiveYearSavingsEst: number;
  simplePaybackYears: number;
  solarClubBenefitAnnual: number;
  customerViewedAt?: string;
  signedAt?: string;
  signedByName?: string;
  signatureDataUrl?: string;
}

export interface BillExtractionResult {
  customerName: string;
  serviceAddress: string;
  utilityProvider: string;
  accountNumber?: string;
  billingPeriod: string;
  kwhUsage: number;
  energyCharges: number;
  deliveryDistributionCharges: number;
  transmissionCharges: number;
  fixedAdminFees: number;
  localAccessFees: number;
  rateRiders: number;
  gstAmount: number;
  totalAmountDue: number;
  monthlyAverageKwh: number;
  annualProjectedKwh: number;
  blendedRatePerKwh: number;
  variableRatePerKwh: number;
  fixedCostMonthly: number;
  confidenceScores: Record<string, 'high' | 'medium' | 'low'>;
  monthlyHistory: { month: string; kwh: number; cost: number }[];
  rawText?: string;
}
