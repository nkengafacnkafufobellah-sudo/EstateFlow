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
import { MfaVerificationModal } from './components/MfaVerificationModal';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import { INITIAL_NOTIFICATIONS, INITIAL_ORG } from './data/estateData';
import { SystemNotification } from './types';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('command-center');
  const [targetMaintenanceId, setTargetMaintenanceId] = useState<string>('MR-2481');
  const [openAddPropertyDirectly, setOpenAddPropertyDirectly] = useState(false);
  const [globalMobileMoneyOpen, setGlobalMobileMoneyOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  const {
    securityNotification,
    rateLimitRemaining,
    isRateLimited,
    showSecurityNotification,
    currentUser,
    isSessionLocked,
    unlockSession,
  } = useSecurity();
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

      {/* Global Multi-Factor Authentication Modal (Login & Payment MFA) */}
      <MfaVerificationModal />

      {/* Zero-Trust Session Lock Screen Overlay */}
      {isSessionLocked && (
        <div className="fixed inset-0 z-40 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-stone-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8 text-amber-800" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Workstation Session Locked</h2>
              <p className="text-xs text-stone-500 mt-1">
                Zero-Trust security lock engaged. Multi-Factor Authentication verification required to resume session.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${currentUser.avatarColor}`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-stone-900 truncate">{currentUser.name}</div>
                <div className="text-[11px] text-amber-800 font-mono font-medium">{currentUser.roleTitle}</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  Verified delivery: {currentUser.mfaPreferredChannel === 'phone' ? currentUser.phoneNumber : currentUser.email}
                </div>
              </div>
            </div>

            <button
              onClick={unlockSession}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock with MFA (Email or Phone SMS)</span>
            </button>

            <p className="text-[11px] text-stone-400">
              6-digit cryptographic verification code will be sent to your verified device.
            </p>
          </div>
        </div>
      )}

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
