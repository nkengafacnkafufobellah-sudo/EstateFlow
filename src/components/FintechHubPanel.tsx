import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Building2,
  Lock,
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Settings,
  Scale,
  Users,
  Percent,
  Sliders,
  DollarSign,
  Download,
  Info,
  Eye,
  EyeOff,
  Plus,
  FileText,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  SupportedCurrency,
  VirtualCardRecord,
  RnplAdvanceRecord,
  EscrowDisputeRecord,
} from '../types';
import {
  INITIAL_FINTECH_WALLETS,
  INITIAL_ESCROW_DEPOSITS,
  INITIAL_SPLIT_PAYMENTS,
  INITIAL_VIRTUAL_CARDS,
  INITIAL_RNPL_ADVANCES,
  INITIAL_ESCROW_DISPUTES,
  FINTECH_RISK_RULES,
  FintechRiskRule,
} from '../data/fintechData';

interface FintechHubPanelProps {
  onOpenMobileMoneyModal?: () => void;
  onOpenMesombPluginModal?: () => void;
}

export const FintechHubPanel: React.FC<FintechHubPanelProps> = ({
  onOpenMobileMoneyModal,
  onOpenMesombPluginModal,
}) => {
  const { showSecurityNotification, canPerform, activeRole, openMfaChallenge, currentUser } = useSecurity();
  const { activeCurrency, formatAmount, convertAmount } = useCurrency();

  const [activeFintechTab, setActiveFintechTab] = useState<
    'treasury' | 'escrow' | 'cards' | 'rnpl' | 'split-payments' | 'fx-desk' | 'settings'
  >('treasury');

  const [wallets, setWallets] = useState(INITIAL_FINTECH_WALLETS);
  const [escrows, setEscrows] = useState(INITIAL_ESCROW_DEPOSITS);
  const [virtualCards, setVirtualCards] = useState<VirtualCardRecord[]>(INITIAL_VIRTUAL_CARDS);
  const [rnplAdvances, setRnplAdvances] = useState<RnplAdvanceRecord[]>(INITIAL_RNPL_ADVANCES);
  const [escrowDisputes, setEscrowDisputes] = useState<EscrowDisputeRecord[]>(INITIAL_ESCROW_DISPUTES);
  const [riskRules, setRiskRules] = useState<FintechRiskRule[]>(FINTECH_RISK_RULES);

  // FX Desk State
  const [fxFromCurrency, setFxFromCurrency] = useState<SupportedCurrency>('USD');
  const [fxToCurrency, setFxToCurrency] = useState<SupportedCurrency>('CFA');
  const [fxFromAmount, setFxFromAmount] = useState<number>(5000);
  const [isConverting, setIsConverting] = useState(false);

  // Escrow Claim / Release Modal State
  const [selectedEscrowToRelease, setSelectedEscrowToRelease] = useState<string | null>(null);
  const [isNewDisputeModalOpen, setIsNewDisputeModalOpen] = useState(false);
  const [disputeEscrowId, setDisputeEscrowId] = useState('esc-101');
  const [disputeAmount, setDisputeAmount] = useState(250);
  const [disputeReason, setDisputeReason] = useState('Broken kitchen cabinet hinge & repainting');

  // Wallet Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState(INITIAL_FINTECH_WALLETS[0].id);
  const [transferToWallet, setTransferToWallet] = useState(INITIAL_FINTECH_WALLETS[3].id);
  const [transferAmount, setTransferAmount] = useState(2500);
  const [transferMemo, setTransferMemo] = useState('Operating liquidity replenishment for vendor payouts');

  // Virtual Card State
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [isIssueCardModalOpen, setIsIssueCardModalOpen] = useState(false);
  const [newCardHolder, setNewCardHolder] = useState('J. Keller (Superintendent)');
  const [newCardRole, setNewCardRole] = useState('Building Maintenance');
  const [newCardBrand, setNewCardBrand] = useState<'Mastercard' | 'Visa'>('Mastercard');
  const [newCardLimit, setNewCardLimit] = useState(2500);
  const [newCardPurpose, setNewCardPurpose] = useState('Plumbing, hardware supplies, and emergency turnover parts');

  // New Advance Modal State
  const [isNewAdvanceModalOpen, setIsNewAdvanceModalOpen] = useState(false);
  const [advanceTenantName, setAdvanceTenantName] = useState('L. Herrera');
  const [advanceUnit, setAdvanceUnit] = useState('Unit 2A');
  const [advanceProperty, setAdvanceProperty] = useState('Maple Court');
  const [advanceAmount, setAdvanceAmount] = useState(650);

  // Settings State
  const [payoutSchedule, setPayoutSchedule] = useState<'instant' | 'daily' | 'weekly'>('daily');
  const [mfaThresholdUSD, setMfaThresholdUSD] = useState<number>(1000);
  const [platformTakeRate, setPlatformTakeRate] = useState<number>(2.5);
  const [gatewayRoutingPriority, setGatewayRoutingPriority] = useState<'smart_fallback' | 'mesomb_primary' | 'stripe_primary'>('smart_fallback');
  const [webhookEndpoint, setWebhookEndpoint] = useState('https://api.sunriseholdings.com/v1/fintech/webhooks');
  const [autoReconcileThresholdMinutes, setAutoReconcileThresholdMinutes] = useState(15);

  const calculateFxQuote = () => {
    // Interbank rates relative to USD: USD:1, EUR: 0.92, GBP: 0.79, CFA: 605.0
    const ratesInUSD: Record<SupportedCurrency, number> = {
      USD: 1.0,
      EUR: 1 / 0.92,
      GBP: 1 / 0.79,
      CFA: 1 / 605.0,
    };
    const amountInUSD = fxFromAmount * ratesInUSD[fxFromCurrency];
    const targetRate = ratesInUSD[fxToCurrency];
    return Math.round((amountInUSD / targetRate) * 100) / 100;
  };

  const handleExecuteFxConversion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConverting(true);
    setTimeout(() => {
      setIsConverting(false);
      const converted = calculateFxQuote();
      showSecurityNotification(
        `Interbank FX Swap settled: ${fxFromAmount.toLocaleString()} ${fxFromCurrency} converted to ${converted.toLocaleString()} ${fxToCurrency} with zero spread.`
      );
    }, 900);
  };

  const handleReleaseEscrow = (escrowId: string) => {
    setEscrows((prev) =>
      prev.map((esc) =>
        esc.id === escrowId ? { ...esc, status: 'REFUNDED' as const } : esc
      )
    );
    showSecurityNotification(
      `Tenant Security Deposit released back to tenant account with accrued interest. Statutory Escrow Trust Certificate stamped.`
    );
    setSelectedEscrowToRelease(null);
  };

  const handleFileDisputeClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEscrow = escrows.find((e) => e.id === disputeEscrowId);
    const newDispute: EscrowDisputeRecord = {
      id: `disp-${Date.now()}`,
      escrowId: disputeEscrowId,
      tenantName: targetEscrow?.tenantName || 'Tenant',
      property: targetEscrow?.property || 'Portfolio Property',
      unit: targetEscrow?.unit || 'Unit',
      claimedDeductionUSD: disputeAmount,
      reason: disputeReason,
      evidenceDocs: ['Itemized_Repair_Invoice.pdf', 'Move_Out_Damage_Photos.pdf'],
      status: 'OPEN_DISPUTE',
      filedDate: new Date().toISOString().slice(0, 10),
    };
    setEscrowDisputes((prev) => [newDispute, ...prev]);
    setIsNewDisputeModalOpen(false);
    showSecurityNotification(
      `Escrow statutory claim of $${disputeAmount} filed against ${targetEscrow?.tenantName}'s deposit. Tenant notified with 14-day statutory response window.`
    );
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFromWallet === transferToWallet) {
      showSecurityNotification('Error: Source and Destination wallets must be different.');
      return;
    }
    const source = wallets.find((w) => w.id === transferFromWallet);
    const target = wallets.find((w) => w.id === transferToWallet);
    if (!source || !target) return;

    if (source.availableBalance < transferAmount) {
      showSecurityNotification(`Error: Insufficient available balance in ${source.name}.`);
      return;
    }

    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === transferFromWallet) {
          return {
            ...w,
            balance: w.balance - transferAmount,
            availableBalance: w.availableBalance - transferAmount,
          };
        }
        if (w.id === transferToWallet) {
          return {
            ...w,
            balance: w.balance + transferAmount,
            availableBalance: w.availableBalance + transferAmount,
          };
        }
        return w;
      })
    );

    setIsTransferModalOpen(false);
    showSecurityNotification(
      `Inter-wallet treasury transfer of $${transferAmount.toLocaleString()} from ${source.name} to ${target.name} confirmed. Memo: "${transferMemo}"`
    );
  };

  const handleToggleCardFreeze = (cardId: string) => {
    setVirtualCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const nextStatus = c.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
          showSecurityNotification(
            `Virtual Card •••• ${c.lastFour} (${c.cardHolderName}) status changed to ${nextStatus}. Instant merchant authorization lock applied.`
          );
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleRevealCardPan = (card: VirtualCardRecord) => {
    openMfaChallenge({
      purpose: 'payment',
      paymentDetails: {
        amount: 0,
        currency: 'USD',
        payee: 'Card Security Tokenizer',
        gateway: 'PCI DSS HSM Vault',
        description: `Reveal Virtual Card PAN and CVV for ${card.cardHolderName}`,
      },
      onVerified: () => {
        setRevealedCardId(card.id);
        showSecurityNotification(
          `PCI-DSS Token Unlocked: Full virtual card number & CVV revealed for 60 seconds.`
        );
        setTimeout(() => {
          setRevealedCardId((curr) => (curr === card.id ? null : curr));
        }, 60000);
      },
    });
  };

  const handleIssueNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: VirtualCardRecord = {
      id: `vc-${Date.now()}`,
      cardHolderName: newCardHolder,
      role: newCardRole,
      brand: newCardBrand,
      lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
      expMonth: '10',
      expYear: '29',
      cvvMasked: '•••',
      monthlyLimitUSD: newCardLimit,
      spentCurrentMonthUSD: 0,
      status: 'ACTIVE',
      allowedCategories: ['Hardware Supplies', 'Building Materials', 'Contractor Equipment'],
      purpose: newCardPurpose,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setVirtualCards((prev) => [newCard, ...prev]);
    setIsIssueCardModalOpen(false);
    showSecurityNotification(
      `New virtual ${newCardBrand} issued to ${newCardHolder} with a $${newCardLimit.toLocaleString()} monthly limit. Real-time merchant restrictions activated.`
    );
  };

  const handleApproveAdvance = (advId: string) => {
    setRnplAdvances((prev) =>
      prev.map((a) => (a.id === advId ? { ...a, status: 'ACTIVE' as const } : a))
    );
    showSecurityNotification(
      `Tenant rent bridge advance authorized. Liquidity disbursed instantly to tenant rent account; repayment scheduled on next MoMo/payroll sweep.`
    );
  };

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const newAdv: RnplAdvanceRecord = {
      id: `rnpl-${Date.now()}`,
      tenantName: advanceTenantName,
      property: advanceProperty,
      unit: advanceUnit,
      advanceAmountUSD: advanceAmount,
      approvedDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-11-15',
      status: 'ACTIVE',
      creditScoreBoost: '+15 pts Experian Boost',
      aprPercent: 0,
      repaymentMethod: 'Automatic Debit on Payroll Day',
    };
    setRnplAdvances((prev) => [newAdv, ...prev]);
    setIsNewAdvanceModalOpen(false);
    showSecurityNotification(
      `Rent-Now-Pay-Later 0% APR bridge advance of $${advanceAmount} approved for ${advanceTenantName}. Experian Bureau reporting registered.`
    );
  };

  const handleToggleRiskRule = (ruleId: string) => {
    if (!canPerform('api.edit')) {
      showSecurityNotification('Access Denied: Only Super Admin can modify Fintech Risk & Compliance policies.');
      return;
    }
    setRiskRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
    showSecurityNotification('Fintech AML/Risk policy updated and synchronized with compliance engine.');
  };

  const handleSaveFintechSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showSecurityNotification(
      `Fintech Settings Saved: Payout Schedule set to ${payoutSchedule.toUpperCase()}, Step-Up MFA threshold at $${mfaThresholdUSD}, Gateway Priority: ${gatewayRoutingPriority.toUpperCase()}.`
    );
  };

  // Aggregate stats
  const totalOperatingUSD = wallets
    .filter((w) => w.currency === 'USD')
    .reduce((sum, w) => sum + w.balance, 0);
  const totalEscrowUSD = escrows
    .filter((e) => e.status === 'HELD_IN_TRUST')
    .reduce((sum, e) => sum + e.depositAmount, 0);
  const totalEscrowInterest = escrows.reduce((sum, e) => sum + e.accruedInterest, 0);
  const totalCardSpendUSD = virtualCards.reduce((sum, c) => sum + c.spentCurrentMonthUSD, 0);
  const totalCardLimitUSD = virtualCards.reduce((sum, c) => sum + c.monthlyLimitUSD, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-700" />
            <span>EstateFlow Fintech · Treasury, Multi-Currency Escrow & Virtual Cards</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 mt-1">
            Fintech Operations & Treasury Management
          </h2>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            Unified multi-currency corporate treasury wallets, segregated tenant security deposit escrow yields, virtual expense cards, Rent-Now-Pay-Later micro-advances, and automated multi-rail payment routing.
          </p>
        </div>

        {/* Global Quick Rails Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Transfer Liquidity</span>
          </button>

          {onOpenMobileMoneyModal && (
            <button
              onClick={onOpenMobileMoneyModal}
              className="px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-700" />
              <span>Collect Mobile Money (USSD)</span>
            </button>
          )}

          {onOpenMesombPluginModal && (
            <button
              onClick={onOpenMesombPluginModal}
              className="px-3 py-2 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-stone-500" />
              <span>MeSomb Rails Config</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Ribbon: Treasury & Escrow Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Corporate Operating Liquidity</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
              Multi-Currency
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            ${totalOperatingUSD.toLocaleString()}<span className="text-xs font-sans font-normal text-stone-400">.00</span>
          </div>
          <div className="text-[11px] text-stone-600 flex items-center justify-between">
            <span>+114.25M XAF Afriland Clearing</span>
            <span className="text-emerald-700 font-bold">Active</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Statutory Deposit Escrow</span>
            <span className="p-1 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
              2.85% APY Yield
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-900">
            ${totalEscrowUSD.toLocaleString()}<span className="text-xs font-sans font-normal text-stone-400">.00</span>
          </div>
          <div className="text-[11px] text-stone-600 flex items-center justify-between">
            <span>100% Segregated Trust</span>
            <span className="text-emerald-700 font-mono font-bold">+${totalEscrowInterest.toFixed(2)} YTD</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Virtual Maintenance Cards</span>
            <span className="text-[10px] font-mono text-stone-500 font-bold">
              {virtualCards.filter((c) => c.status === 'ACTIVE').length} Active
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            ${totalCardSpendUSD.toLocaleString()}<span className="text-xs font-sans font-normal text-stone-400"> / ${totalCardLimitUSD.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-stone-600">
            Hardware & contractor supplies limit
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>RNPL Tenant Advances</span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-800 font-mono text-[10px] font-bold">
              0% APR Facility
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-900">
            $2,130<span className="text-xs font-sans font-normal text-stone-400">.00</span>
          </div>
          <div className="text-[11px] text-stone-600">
            Experian Credit Reporting Boost active
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1.5 bg-stone-100 p-1.5 rounded-2xl text-xs font-bold shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveFintechTab('treasury')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'treasury'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-amber-700" />
          <span>Treasury & Virtual Wallets</span>
        </button>

        <button
          onClick={() => setActiveFintechTab('escrow')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'escrow'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-blue-700" />
          <span>Security Deposit Escrow Trust</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-900 font-mono">
            {escrows.length} Units
          </span>
        </button>

        <button
          onClick={() => setActiveFintechTab('cards')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'cards'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-rose-700" />
          <span>Virtual Expense Cards</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-900 font-mono">
            {virtualCards.length} Cards
          </span>
        </button>

        <button
          onClick={() => setActiveFintechTab('rnpl')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'rnpl'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Rent Advances & RNPL</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-mono">
            0% APR
          </span>
        </button>

        <button
          onClick={() => setActiveFintechTab('split-payments')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'split-payments'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-700" />
          <span>Split Rent & Co-Signers</span>
        </button>

        <button
          onClick={() => setActiveFintechTab('fx-desk')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'fx-desk'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
          <span>Cross-Border FX Desk</span>
        </button>

        <button
          onClick={() => setActiveFintechTab('settings')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeFintechTab === 'settings'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-stone-700" />
          <span>Fintech Risk & Settings</span>
        </button>
      </div>

      {/* TAB 1: TREASURY & VIRTUAL WALLETS */}
      {activeFintechTab === 'treasury' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Portfolio Treasury Wallets</h3>
              <p className="text-xs text-stone-500">Real-time banking accounts, trust vaults, and mobile clearing pools.</p>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Transfer Between Wallets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-5 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-3.5 hover:border-amber-400 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                      {wallet.type.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 mt-1">{wallet.name}</h3>
                    <p className="text-xs text-stone-500">{wallet.institutionName}</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Settled Balance" />
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="text-[10px] text-stone-500 font-medium">Available Balance</div>
                  <div className="text-xl font-extrabold font-mono text-stone-900">
                    {wallet.currency === 'CFA'
                      ? `${wallet.balance.toLocaleString()} FCFA`
                      : wallet.currency === 'EUR'
                      ? `€${wallet.balance.toLocaleString()}`
                      : `$${wallet.balance.toLocaleString()}`}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    Account: {wallet.accountNumberMasked}
                  </div>
                </div>

                {wallet.yieldApy && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex items-center justify-between text-blue-900 font-mono">
                    <span>Accruing Yield: {wallet.yieldApy}% APY</span>
                    {wallet.interestAccruedYtd && <span>+${wallet.interestAccruedYtd.toFixed(2)} YTD</span>}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                  <span>Last reconciled:</span>
                  <span className="font-mono text-stone-700">{wallet.lastSettledAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY DEPOSIT ESCROW TRUST */}
      {activeFintechTab === 'escrow' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start justify-between gap-4 text-xs text-blue-950">
            <div className="flex items-start space-x-3">
              <Landmark className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-blue-900">Statutory Escrow Compliance Mandate</div>
                <p className="mt-0.5 text-blue-800">
                  All tenant security deposits are held in a segregated, non-commingled statutory trust account accruing interest under Property Code guidelines. Funds are protected against operating liabilities and require dual-key verification to release.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNewDisputeModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-900 hover:bg-blue-100 rounded-xl font-bold flex-shrink-0 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>File Damage Deduction Claim</span>
            </button>
          </div>

          {/* Active Escrows Table */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                Active Tenant Security Deposits Held in Trust
              </h3>
              <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                FDIC / OHADA Protected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold font-mono">
                    <th className="pb-2">Tenant & Unit</th>
                    <th className="pb-2">Property</th>
                    <th className="pb-2">Original Deposit</th>
                    <th className="pb-2">Accrued Interest</th>
                    <th className="pb-2">Held Since</th>
                    <th className="pb-2">Escrow Trust Ref</th>
                    <th className="pb-2 text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {escrows.map((esc) => (
                    <tr key={esc.id} className="hover:bg-stone-50/70">
                      <td className="py-3">
                        <div className="font-bold text-stone-900">{esc.tenantName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{esc.unit}</div>
                      </td>
                      <td className="py-3 font-medium text-stone-700">{esc.property}</td>
                      <td className="py-3 font-mono font-bold text-stone-900">${esc.depositAmount.toLocaleString()}</td>
                      <td className="py-3 font-mono text-emerald-700 font-semibold">+${esc.accruedInterest.toFixed(2)}</td>
                      <td className="py-3 font-mono text-stone-500">{esc.heldSince}</td>
                      <td className="py-3 font-mono text-stone-600">{esc.bankEscrowRef}</td>
                      <td className="py-3 text-right">
                        {esc.status === 'HELD_IN_TRUST' ? (
                          <button
                            onClick={() => handleReleaseEscrow(esc.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            Release Deposit
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                            Refunded ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Escrow Disputes & Claims Section */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Statutory Damage Claims & Deductions ({escrowDisputes.length})
                </h3>
                <p className="text-xs text-stone-500">Move-out condition inspection claims filed against held deposits with proof.</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                14-Day Statutory Window
              </span>
            </div>

            <div className="space-y-3">
              {escrowDisputes.map((disp) => (
                <div
                  key={disp.id}
                  className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900">{disp.tenantName} · {disp.property} ({disp.unit})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                        {disp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-stone-600">{disp.reason}</p>
                    <div className="text-[11px] text-stone-500 flex items-center space-x-2">
                      <span>Evidence: {disp.evidenceDocs.join(', ')}</span>
                      <span>• Filed: {disp.filedDate}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-sm text-rose-700">
                      -${disp.claimedDeductionUSD.toFixed(2)} USD
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">Awaiting inspection signoff</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VIRTUAL EXPENSE CARDS */}
      {activeFintechTab === 'cards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Virtual Corporate Cards & Expense Controls</h3>
              <p className="text-xs text-stone-500">Issue instant virtual cards with MCC category locks for superintendents and maintenance contractors.</p>
            </div>
            <button
              onClick={() => setIsIssueCardModalOpen(true)}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Virtual Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {virtualCards.map((card) => {
              const isRevealed = revealedCardId === card.id;
              const spendPercentage = Math.round((card.spentCurrentMonthUSD / card.monthlyLimitUSD) * 100);

              return (
                <div
                  key={card.id}
                  className="bg-white border border-stone-200 rounded-3xl p-5 shadow-2xs space-y-4 hover:border-rose-300 transition-all"
                >
                  {/* Card Visual Graphic */}
                  <div
                    className={`rounded-2xl p-5 text-white shadow-md relative overflow-hidden ${
                      card.status === 'FROZEN'
                        ? 'bg-gradient-to-br from-stone-700 to-stone-900 opacity-80'
                        : card.brand === 'Mastercard'
                        ? 'bg-gradient-to-br from-rose-900 via-rose-800 to-amber-900'
                        : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-80">
                        ESTATEFLOW CORPORATE
                      </span>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white/20">
                        {card.brand}
                      </span>
                    </div>

                    <div className="mt-5 space-y-1">
                      <div className="text-[10px] opacity-75 font-mono">VIRTUAL CARD NUMBER</div>
                      <div className="font-mono text-base font-bold tracking-wider">
                        {isRevealed
                          ? `4281 9021 3418 ${card.lastFour}`
                          : `•••• •••• •••• ${card.lastFour}`}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-[9px] opacity-75">CARDHOLDER</div>
                        <div className="font-bold truncate max-w-[150px]">{card.cardHolderName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] opacity-75">EXPIRES / CVV</div>
                        <div>
                          {card.expMonth}/{card.expYear} · {isRevealed ? '749' : card.cvvMasked}
                        </div>
                      </div>
                    </div>

                    {card.status === 'FROZEN' && (
                      <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-2xs flex items-center justify-center font-bold text-xs uppercase tracking-wider text-rose-300">
                        <Lock className="w-4 h-4 mr-1.5" /> Card Frozen
                      </div>
                    )}
                  </div>

                  {/* Monthly Spend Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Monthly Spend Limit</span>
                      <span className="font-mono font-bold text-stone-900">
                        ${card.spentCurrentMonthUSD.toLocaleString()} / ${card.monthlyLimitUSD.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, spendPercentage)}%` }}
                        className={`h-full rounded-full ${
                          spendPercentage >= 100
                            ? 'bg-rose-600'
                            : spendPercentage >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Allowed MCC Categories */}
                  <div className="space-y-1 text-xs">
                    <div className="text-[11px] font-semibold text-stone-600">Category Controls (MCC Lock):</div>
                    <div className="flex flex-wrap gap-1">
                      {card.allowedCategories.map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Freeze & Reveal */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCardFreeze(card.id)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        card.status === 'ACTIVE'
                          ? 'border-stone-300 text-stone-700 hover:bg-stone-50'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {card.status === 'ACTIVE' ? 'Freeze Card' : 'Unfreeze Card'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRevealCardPan(card)}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title="Reveal 16-digit PAN & CVV via Step-up MFA"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-stone-600" /> : <Eye className="w-3.5 h-3.5 text-stone-600" />}
                      <span>{isRevealed ? 'Hide Details' : 'Reveal Details (MFA)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RENT ADVANCES & RNPL */}
      {activeFintechTab === 'rnpl' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl flex items-start justify-between gap-4 text-xs text-amber-950">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-amber-900">Rent-Now-Pay-Later (RNPL) Micro-Advance Facility</div>
                <p className="mt-0.5 text-amber-800">
                  Zero-interest (0% APR) 14-day emergency bridge advances for verified tenants. Automated repayment deductions are synced with tenant payroll cycles or Mobile Money accounts, with on-time reporting to Experian & Equifax credit bureaus.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNewAdvanceModalOpen(true)}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold flex-shrink-0 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New Rent Advance</span>
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                Active Tenant Rent Advances ({rnplAdvances.length})
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                0.00% APR Statutory Free Facility
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold font-mono">
                    <th className="pb-2">Tenant & Unit</th>
                    <th className="pb-2">Property</th>
                    <th className="pb-2">Advance Amount</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2">Credit Reporting</th>
                    <th className="pb-2">Repayment Rail</th>
                    <th className="pb-2 text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rnplAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-stone-50/70">
                      <td className="py-3">
                        <div className="font-bold text-stone-900">{adv.tenantName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{adv.unit}</div>
                      </td>
                      <td className="py-3 font-medium text-stone-700">{adv.property}</td>
                      <td className="py-3 font-mono font-bold text-stone-900">${adv.advanceAmountUSD.toLocaleString()}</td>
                      <td className="py-3 font-mono text-stone-600">{adv.dueDate}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px]">
                          {adv.creditScoreBoost}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-stone-600 text-[11px]">{adv.repaymentMethod}</td>
                      <td className="py-3 text-right">
                        {adv.status === 'IN_REVIEW' ? (
                          <button
                            onClick={() => handleApproveAdvance(adv.id)}
                            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Approve Advance
                          </button>
                        ) : adv.status === 'SETTLED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                            Repaid ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold font-mono">
                            Active (Auto-Debit Pending)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SPLIT RENT PAYMENTS & CO-SIGNERS */}
      {activeFintechTab === 'split-payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {INITIAL_SPLIT_PAYMENTS.map((split) => (
              <div
                key={split.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{split.property} · {split.unit}</h3>
                    <div className="text-xs text-stone-500">Total Monthly Rent: ${split.totalRentUSD.toLocaleString()}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 font-mono">
                    Roommate Split
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-stone-600">Tenant Contributors Breakdown:</div>
                  {split.contributors.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">{c.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {c.percentage}% share · via {c.paymentRail.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-stone-900">${c.amountUSD}</div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                            c.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {split.coSignerBackupEnabled && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Automated Co-Signer Protection Active</span>
                    </div>
                    <div className="text-emerald-800 text-[11px]">
                      Co-Signer: <strong>{split.coSignerName}</strong> ({split.coSignerContact}). If roommate share defaults past the 3rd, automated secondary ACH trigger executes.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: FX DESK */}
      {activeFintechTab === 'fx-desk' && (
        <div className="space-y-6">
          <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-purple-700" />
                <span>Interbank Currency Exchange & Liquidity Desk</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Execute cross-border currency transfers between USD, EUR, GBP, and Central African CFA (XAF) with real-time interbank conversion rates.
              </p>
            </div>

            <form onSubmit={handleExecuteFxConversion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Source Currency</label>
                  <select
                    value={fxFromCurrency}
                    onChange={(e) => setFxFromCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  >
                    <option value="USD">USD ($) · US Dollar</option>
                    <option value="EUR">EUR (€) · Euro</option>
                    <option value="GBP">GBP (£) · British Pound</option>
                    <option value="CFA">CFA (FCFA) · Central African CFA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Currency</label>
                  <select
                    value={fxToCurrency}
                    onChange={(e) => setFxToCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  >
                    <option value="CFA">CFA (FCFA) · Central African CFA</option>
                    <option value="USD">USD ($) · US Dollar</option>
                    <option value="EUR">EUR (€) · Euro</option>
                    <option value="GBP">GBP (£) · British Pound</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Transfer Amount</label>
                <input
                  type="number"
                  value={fxFromAmount}
                  onChange={(e) => setFxFromAmount(Number(e.target.value))}
                  min={1}
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900 text-sm"
                />
              </div>

              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div className="text-[11px] text-purple-900 font-semibold flex items-center justify-between">
                  <span>Calculated Settlement Quote:</span>
                  <span className="font-mono text-sm font-extrabold text-purple-950">
                    {calculateFxQuote().toLocaleString()} {fxToCurrency}
                  </span>
                </div>
                <div className="text-[10px] text-purple-800 flex justify-between border-t border-purple-200/60 pt-1 font-mono">
                  <span>Interbank Spread Fee: $0.00 (Zero markup)</span>
                  <span>Execution: Instant Clearing</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isConverting}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isConverting ? (
                  <span>Executing Interbank Transfer...</span>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Authorize & Settle FX Swap</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: FINTECH RISK & COMPLIANCE SETTINGS */}
      {activeFintechTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveFintechSettings} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-amber-700" />
                <span>Fintech Governance, Anti-Money Laundering & Payment Rules</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure real-time automated fraud velocity shields, step-up MFA thresholds, and settlement policies across the property portfolio.
              </p>
            </div>

            {/* Risk Rules List */}
            <div className="space-y-3">
              {riskRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900">{rule.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-200 text-stone-700">
                        {rule.category}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px]">{rule.description}</p>
                    <div className="text-[10px] font-mono text-amber-800 font-bold">
                      Rule Boundary: {rule.threshold}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleRiskRule(rule.id)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      rule.active ? 'bg-amber-700' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        rule.active ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Detailed Operational Controls Grid */}
            <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Automated Payout Schedule</label>
                <select
                  value={payoutSchedule}
                  onChange={(e) => setPayoutSchedule(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-900"
                >
                  <option value="instant">Instant Disbursement (Real-time)</option>
                  <option value="daily">Daily Settlement (18:00 UTC)</option>
                  <option value="weekly">Weekly Net 7</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Payment Step-Up MFA Ceiling</label>
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-stone-500">$</span>
                  <input
                    type="number"
                    value={mfaThresholdUSD}
                    onChange={(e) => setMfaThresholdUSD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Platform Processing Take-Rate</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={platformTakeRate}
                    onChange={(e) => setPlatformTakeRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  />
                  <span className="font-mono text-stone-500">%</span>
                </div>
              </div>
            </div>

            {/* Gateway Priority & Webhook Endpoint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Payment Rail Routing Priority</label>
                <select
                  value={gatewayRoutingPriority}
                  onChange={(e) => setGatewayRoutingPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-900"
                >
                  <option value="smart_fallback">Smart Fallback (MeSomb for CEMAC/XAF, Stripe for USD/EUR)</option>
                  <option value="mesomb_primary">MeSomb Gateway Priority (MTN & Orange)</option>
                  <option value="stripe_primary">Stripe Treasury Global Cards</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Fintech Webhook Notification URL</label>
                <input
                  type="url"
                  value={webhookEndpoint}
                  onChange={(e) => setWebhookEndpoint(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Save Fintech & Compliance Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: Inter-wallet Fund Transfer */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-amber-700" />
                <h3 className="font-extrabold text-base text-stone-900">Inter-Wallet Treasury Transfer</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">From Source Wallet</label>
                <select
                  value={transferFromWallet}
                  onChange={(e) => setTransferFromWallet(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-stone-50 font-medium"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency} - Available: ${w.availableBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">To Destination Wallet</label>
                <select
                  value={transferToWallet}
                  onChange={(e) => setTransferToWallet(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-stone-50 font-medium"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Transfer Amount (USD)</label>
                <input
                  type="number"
                  min={1}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Transfer Reason / Audit Memo</label>
                <input
                  type="text"
                  value={transferMemo}
                  onChange={(e) => setTransferMemo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 border border-stone-200">
                Transfers within the same organization settle with 0% platform fee and are logged to the cryptographic API audit trail.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Confirm & Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Virtual Card */}
      {isIssueCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-rose-700" />
                <h3 className="font-extrabold text-base text-stone-900">Issue New Virtual Expense Card</h3>
              </div>
              <button
                onClick={() => setIsIssueCardModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueNewCard} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={newCardHolder}
                  onChange={(e) => setNewCardHolder(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Role / Assigned To</label>
                  <input
                    type="text"
                    value={newCardRole}
                    onChange={(e) => setNewCardRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Card Brand</label>
                  <select
                    value={newCardBrand}
                    onChange={(e) => setNewCardBrand(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-stone-50 font-bold"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Monthly Spending Limit (USD)</label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={newCardLimit}
                  onChange={(e) => setNewCardLimit(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Business Purpose / Restrictions</label>
                <input
                  type="text"
                  value={newCardPurpose}
                  onChange={(e) => setNewCardPurpose(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsIssueCardModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Issue Card Instantly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: File Damage Deduction Claim */}
      {isNewDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-stone-900">File Escrow Damage Claim</h3>
              </div>
              <button
                onClick={() => setIsNewDisputeModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileDisputeClaim} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Select Tenant Deposit in Escrow</label>
                <select
                  value={disputeEscrowId}
                  onChange={(e) => setDisputeEscrowId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-stone-50 font-medium"
                >
                  {escrows.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.tenantName} - {e.property} ({e.unit}) - Held: ${e.depositAmount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Claimed Deduction Amount (USD)</label>
                <input
                  type="number"
                  min={1}
                  value={disputeAmount}
                  onChange={(e) => setDisputeAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Damage Description & Invoice Details</label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200">
                Statutory requirement: Photos and repair estimates must be furnished to tenant within 30 days of lease termination.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewDisputeModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Statutory Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Issue RNPL Advance */}
      {isNewAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-stone-900">Authorize RNPL Rent Advance</h3>
              </div>
              <button
                onClick={() => setIsNewAdvanceModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Tenant Name</label>
                <input
                  type="text"
                  value={advanceTenantName}
                  onChange={(e) => setAdvanceTenantName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Property</label>
                  <input
                    type="text"
                    value={advanceProperty}
                    onChange={(e) => setAdvanceProperty(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Unit</label>
                  <input
                    type="text"
                    value={advanceUnit}
                    onChange={(e) => setAdvanceUnit(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Bridge Advance Amount (USD)</label>
                <input
                  type="number"
                  min={100}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 border border-emerald-200">
                0.00% APR interest free. Auto-debit scheduled for tenant's next payroll or Mobile Money deposit date.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewAdvanceModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Authorize 0% Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
