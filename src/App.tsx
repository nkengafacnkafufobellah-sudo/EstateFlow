import React, { useState } from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ReceiptsProvider, useReceipts } from './context/ReceiptsContext';
import { Header } from './components/Header';
import { Navigation, NavigationTab } from './components/Navigation';
import { CommandCenter } from './components/CommandCenter';
import { PropertiesManager } from './components/PropertiesManager';
import { TenantsManager } from './components/TenantsManager';
import { MaintenanceWorkflow } from './components/MaintenanceWorkflow';
import { FinanceReconciliation } from './components/FinanceReconciliation';
import { TenantMobileView } from './components/TenantMobileView';
import { VendorWorkbenchView } from './components/VendorWorkbenchView';
import { SecurityAuditPanel } from './components/SecurityAuditPanel';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import { MobileMoneyPaymentModal } from './components/MobileMoneyPaymentModal';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { INITIAL_NOTIFICATIONS, INITIAL_ORG } from './data/estateData';
import { SystemNotification } from './types';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('command-center');
  const [targetMaintenanceId, setTargetMaintenanceId] = useState<string>('MR-2481');
  const [openAddPropertyDirectly, setOpenAddPropertyDirectly] = useState(false);
  const [globalMobileMoneyOpen, setGlobalMobileMoneyOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  const { securityNotification, rateLimitRemaining, isRateLimited, showSecurityNotification } = useSecurity();
  const { previewReceipt, closeReceiptPreview } = useReceipts();

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleOpenQuickAction = (actionType: 'property' | 'payment' | 'request' | 'invite' | 'momo') => {
    if (actionType === 'property') {
      setOpenAddPropertyDirectly(true);
      setActiveTab('properties');
    } else if (actionType === 'payment') {
      setActiveTab('finance');
    } else if (actionType === 'momo') {
      setGlobalMobileMoneyOpen(true);
    } else if (actionType === 'request') {
      setActiveTab('maintenance');
    } else if (actionType === 'invite') {
      setActiveTab('admin');
      showSecurityNotification('Organization member invitation console opened.');
    }
  };

  const handleSelectMaintenanceTicket = (ticketId: string) => {
    setTargetMaintenanceId(ticketId);
    setActiveTab('maintenance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Rate limit warning banner if triggered */}
      {isRateLimited && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center space-x-2 shadow-md sticky top-0 z-50">
          <AlertCircle className="w-4 h-4 text-white" />
          <span>
            HTTP 429 Too Many Requests: Token bucket depleted ({rateLimitRemaining}/120). Rate limiting active at API Gateway.
          </span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onOpenQuickAction={handleOpenQuickAction}
        onOpenSecurityModal={() => setActiveTab('admin')}
      />

      {/* Main Tab Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab: NavigationTab) => {
          setActiveTab(tab);
          setOpenAddPropertyDirectly(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        urgentMaintenanceCount={3}
        unresolvedFinanceCount={2}
      />

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'command-center' && (
          <CommandCenter
            onNavigateTab={(tab: NavigationTab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectMaintenanceTicket={handleSelectMaintenanceTicket}
            onOpenQuickAction={handleOpenQuickAction}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesManager
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            initialOpenAdd={openAddPropertyDirectly}
          />
        )}

        {activeTab === 'tenants' && <TenantsManager />}

        {activeTab === 'maintenance' && (
          <MaintenanceWorkflow initialSelectedId={targetMaintenanceId} />
        )}

        {activeTab === 'finance' && <FinanceReconciliation />}

        {activeTab === 'tenant-app' && <TenantMobileView />}

        {activeTab === 'vendor-workbench' && <VendorWorkbenchView />}

        {activeTab === 'admin' && <SecurityAuditPanel />}

        {activeTab === 'super-admin' && <SuperAdminDashboard />}
      </main>

      {/* Global Receipt Preview Modal */}
      {previewReceipt && (
        <ReceiptPreviewModal
          receipt={previewReceipt}
          onClose={closeReceiptPreview}
        />
      )}

      {/* Global Mobile Money Payment Modal */}
      <MobileMoneyPaymentModal
        isOpen={globalMobileMoneyOpen}
        onClose={() => setGlobalMobileMoneyOpen(false)}
        initialGateway="mtn_momo"
        initialTenantName="Jordan Avery"
        initialUnit="Unit 4B"
        initialAmountUSD={1450}
      />

      {/* Global Security Toast Notification */}
      {securityNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 flex items-start space-x-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-amber-300">Security Architecture Event</div>
            <div className="text-stone-200 mt-0.5 leading-snug">{securityNotification}</div>
          </div>
        </div>
      )}

      {/* Architectural Platform Footer — Matches 8-Page Specification */}
      <footer className="border-t border-stone-200 bg-[#FAF8F5] py-4 mt-12 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-medium text-stone-700">Signed in as Fobellah N. · Owner role</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-500">{INITIAL_ORG.name}</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px] text-stone-500">
            <span className="font-bold text-stone-700">FOBELLAH NKENGAFAC NKAFU</span>
            <span>·</span>
            <span>Sep 20, 2026</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 font-mono text-[11px]">
              EstateFlow · Page {
                activeTab === 'command-center' ? 1 :
                activeTab === 'properties' ? 2 :
                activeTab === 'tenants' ? 3 :
                activeTab === 'maintenance' ? 4 :
                activeTab === 'finance' ? 5 :
                activeTab === 'tenant-app' ? 6 :
                activeTab === 'vendor-workbench' ? 7 : 8
              } of 8
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SecurityProvider>
      <CurrencyProvider>
        <ReceiptsProvider>
          <AppContent />
        </ReceiptsProvider>
      </CurrencyProvider>
    </SecurityProvider>
  );
}
