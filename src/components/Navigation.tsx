import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  CreditCard,
  ShieldCheck,
  Smartphone,
  HardHat,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export type NavigationTab =
  | 'command-center'
  | 'properties'
  | 'tenants'
  | 'maintenance'
  | 'finance'
  | 'tenant-app'
  | 'vendor-workbench'
  | 'admin'
  | 'super-admin';

interface NavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  urgentMaintenanceCount?: number;
  unresolvedFinanceCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  urgentMaintenanceCount = 3,
  unresolvedFinanceCount = 2,
}) => {
  const documentPages: {
    pageNumber: number;
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    subLabel: string;
  }[] = [
    {
      pageNumber: 1,
      id: 'command-center',
      label: 'Command Center',
      subLabel: 'Web Dashboard',
      icon: LayoutDashboard,
    },
    {
      pageNumber: 2,
      id: 'properties',
      label: 'Properties & Units',
      subLabel: 'Property Management',
      icon: Building2,
    },
    {
      pageNumber: 3,
      id: 'tenants',
      label: 'Tenants & Leases',
      subLabel: 'Lease Operations',
      icon: Users,
    },
    {
      pageNumber: 4,
      id: 'maintenance',
      label: 'Maintenance',
      subLabel: 'Request Workflow',
      icon: Wrench,
      badge: urgentMaintenanceCount,
    },
    {
      pageNumber: 5,
      id: 'finance',
      label: 'Payments & Finance',
      subLabel: 'Reconciliation',
      icon: CreditCard,
      badge: unresolvedFinanceCount,
    },
    {
      pageNumber: 6,
      id: 'tenant-app',
      label: 'Tenant Mobile App',
      subLabel: 'Touch Experience',
      icon: Smartphone,
    },
    {
      pageNumber: 7,
      id: 'vendor-workbench',
      label: 'Vendor Workbench',
      subLabel: 'Mobile Jobs & SLA',
      icon: HardHat,
    },
    {
      pageNumber: 8,
      id: 'admin',
      label: 'Administration & Security',
      subLabel: 'Least-Privilege RBAC',
      icon: ShieldCheck,
    },
  ];

  const currentPageIndex = documentPages.findIndex((p) => p.id === activeTab);
  const activePageNumber = currentPageIndex !== -1 ? documentPages[currentPageIndex].pageNumber : null;

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      onSelectTab(documentPages[currentPageIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < documentPages.length - 1) {
      onSelectTab(documentPages[currentPageIndex + 1].id);
    }
  };

  return (
    <nav aria-label="Main Navigation" className="bg-[#FAF8F5] border-b border-[#E8E4DC] px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-1.5 py-2">
        {/* Document Pages Stepper Ribbon (Pages 1 to 8) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-stone-200/60 text-xs">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
              <BookOpen className="w-3 h-3 text-amber-800" />
              <span>Specification Tour (8 Pages)</span>
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              FOBELLAH NKENGAFAC NKAFU · Sep 20, 2026
            </span>
          </div>

          {/* Quick Page Jumping Pills 1 to 8 + Prev/Next Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex <= 0}
              className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous document page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-0.5 bg-white p-0.5 rounded-lg border border-stone-200 shadow-2xs">
              {documentPages.map((page) => {
                const isActive = activeTab === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => onSelectTab(page.id)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all ${
                      isActive
                        ? 'bg-amber-700 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                    title={`Page ${page.pageNumber}: ${page.label} (${page.subLabel})`}
                  >
                    <span>P{page.pageNumber}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === -1 || currentPageIndex >= documentPages.length - 1}
              className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next document page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Super Admin Quick Link */}
            <button
              onClick={() => onSelectTab('super-admin')}
              className={`ml-2 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                activeTab === 'super-admin'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title="Super Admin API & infrastructure console"
            >
              <KeyRound className="w-3 h-3 inline mr-1 text-amber-500" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>

        {/* Primary Page Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {documentPages.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-amber-900/70 text-amber-100' : 'bg-stone-200/80 text-stone-600'
                }`}>
                  {tab.pageNumber}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
