import React, { useState } from 'react';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PROPOSALS,
} from './data/mockData';
import { Tenant, User, Customer, Proposal, UserRole, BillExtractionResult } from './types';
import { Sidebar, NavItemKey } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { OverviewView } from './components/dashboard/OverviewView';
import { CustomersView } from './components/customers/CustomersView';
import { ProposalsView } from './components/proposals/ProposalsView';
import { SolarDesigner } from './components/designer/SolarDesigner';
import { PricingFinancingView } from './components/pricing/PricingFinancingView';
import { ContractsView } from './components/contracts/ContractsView';
import { ProductCatalogView } from './components/products/ProductCatalogView';
import { TeamView } from './components/team/TeamView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { InteractiveCustomerProposal } from './components/proposal/InteractiveCustomerProposal';
import { BillExtractionModal } from './components/bill/BillExtractionModal';
import { AutomatedTestsModal } from './components/tests/AutomatedTestsModal';
import { AiAssistantDrawer } from './components/ai/AiAssistantDrawer';

export default function App() {
  // Tenant and User State
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [currentTenant, setCurrentTenant] = useState<Tenant>(INITIAL_TENANTS[0]);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

  // Core Data State
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);

  // Active Navigation & View State
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [activeProposalId, setActiveProposalId] = useState<string>('prop-alex-morgan');

  // Modals & Overlay States
  const [showCustomerProposalView, setShowCustomerProposalView] = useState<boolean>(false);
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [showTestsModal, setShowTestsModal] = useState<boolean>(false);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);

  // Active Proposal and Customer lookups
  const activeProposal = proposals.find((p) => p.id === activeProposalId) || proposals[0];
  const activeCustomer = customers.find((c) => c.id === activeProposal.customerId) || customers[0];

  // Handlers
  const handleSelectTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  const handleUpdateProposal = (updated: Proposal) => {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdateTenant = (updated: Tenant) => {
    setCurrentTenant(updated);
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleDuplicateProposal = (propId: string) => {
    const source = proposals.find((p) => p.id === propId);
    if (!source) return;
    const duplicated: Proposal = {
      ...source,
      id: `prop-${Date.now()}`,
      proposalNumber: `NET0-2026-${Math.floor(1050 + Math.random() * 50)}`,
      title: `${source.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProposals((prev) => [duplicated, ...prev]);
  };

  const handleUpdateProposalStatus = (propId: string, status: Proposal['status']) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status, updatedAt: new Date().toISOString() } : p))
    );
  };

  const handleSaveBillToCustomer = (extracted: BillExtractionResult) => {
    // Update active customer with extracted billing metrics
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === activeCustomer.id
          ? {
              ...c,
              fullName: extracted.customerName || c.fullName,
              propertyAddress: extracted.serviceAddress || c.propertyAddress,
              utilityProvider: extracted.utilityProvider || c.utilityProvider,
              annualConsumptionKWh: extracted.annualProjectedKwh || c.annualConsumptionKWh,
              monthlyAverageKWh: extracted.monthlyAverageKwh || c.monthlyAverageKWh,
              currentMonthlyCost: extracted.totalAmountDue || c.currentMonthlyCost,
              billExtracted: true,
            }
          : c
      )
    );
  };

  const handleSignProposal = (signatureName: string, signatureDataUrl: string) => {
    const updated: Proposal = {
      ...activeProposal,
      status: 'Signed',
      signedAt: new Date().toISOString(),
      signedByName: signatureName,
      signatureDataUrl,
    };
    handleUpdateProposal(updated);
    // Also update customer stage
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === activeCustomer.id ? { ...c, pipelineStage: 'Contract Signed' } : c
      )
    );
  };

  // If in interactive customer proposal presentation mode:
  if (showCustomerProposalView) {
    return (
      <InteractiveCustomerProposal
        proposal={activeProposal}
        customer={activeCustomer}
        tenant={currentTenant}
        onClose={() => setShowCustomerProposalView(false)}
        onSignProposal={handleSignProposal}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        tenant={currentTenant}
        currentUser={currentUser}
        onOpenTestsModal={() => setShowTestsModal(true)}
        onOpenCustomerProposal={() => setShowCustomerProposalView(true)}
        onOpenAiDrawer={() => setShowAiDrawer(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Bar */}
        <TopBar
          tenants={tenants}
          currentTenant={currentTenant}
          onSelectTenant={handleSelectTenant}
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          onOpenBillUpload={() => setShowBillModal(true)}
          onOpenNewCustomer={() => setCurrentTab('customers')}
          onOpenNewProposal={() => setCurrentTab('designer')}
          onNavigateToDesigner={() => setCurrentTab('designer')}
        />

        {/* View Switcher based on currentTab */}
        <div className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewView
              tenant={currentTenant}
              proposals={proposals}
              customers={customers}
              onNavigate={setCurrentTab}
              onOpenCustomerProposal={() => setShowCustomerProposalView(true)}
              onOpenBillUpload={() => setShowBillModal(true)}
              onOpenNewCustomer={() => setCurrentTab('customers')}
              onOpenNewProposal={() => setCurrentTab('designer')}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              proposals={proposals}
              onAddCustomer={handleAddCustomer}
              onOpenCustomerProposal={() => setShowCustomerProposalView(true)}
              onOpenBillUpload={() => setShowBillModal(true)}
            />
          )}

          {currentTab === 'proposals' && (
            <ProposalsView
              proposals={proposals}
              customers={customers}
              tenant={currentTenant}
              onOpenCustomerProposal={() => setShowCustomerProposalView(true)}
              onNavigateToDesigner={(propId?: string) => {
                if (propId) setActiveProposalId(propId);
                setCurrentTab('designer');
              }}
              onDuplicateProposal={handleDuplicateProposal}
              onUpdateStatus={handleUpdateProposalStatus}
            />
          )}

          {currentTab === 'designer' && (
            <SolarDesigner
              proposal={activeProposal}
              customer={activeCustomer}
              customers={customers}
              onUpdateProposal={handleUpdateProposal}
              onOpenCustomerProposal={() => setShowCustomerProposalView(true)}
            />
          )}

          {currentTab === 'pricing' && (
            <PricingFinancingView
              tenant={currentTenant}
              currentProposal={activeProposal}
              onUpdateProposalPricing={handleUpdateProposal}
            />
          )}

          {currentTab === 'contracts' && (
            <ContractsView
              proposals={proposals}
              customers={customers}
              tenant={currentTenant}
              onOpenCustomerProposal={() => setShowCustomerProposalView(true)}
            />
          )}

          {currentTab === 'products' && (
            <ProductCatalogView tenant={currentTenant} />
          )}

          {currentTab === 'team' && (
            <TeamView
              tenant={currentTenant}
              currentUser={currentUser}
              onSwitchRole={handleRoleChange}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              tenant={currentTenant}
              proposals={proposals}
              customers={customers}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              tenant={currentTenant}
              onUpdateTenant={handleUpdateTenant}
            />
          )}
        </div>
      </div>

      {/* Modals & Overlays */}
      <BillExtractionModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        onSaveToCustomer={handleSaveBillToCustomer}
      />

      <AutomatedTestsModal
        isOpen={showTestsModal}
        onClose={() => setShowTestsModal(false)}
      />

      <AiAssistantDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        proposal={activeProposal}
        customer={activeCustomer}
      />
    </div>
  );
}
