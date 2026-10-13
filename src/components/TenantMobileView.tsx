import React, { useState } from 'react';
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  User,
  Bell,
  CheckCircle2,
  Lock,
  Camera,
  ChevronRight,
  Plus,
  ShieldCheck,
  Smartphone,
  Send,
  Coins,
  ArrowRight,
  Download,
  Eye,
  FileCheck,
  Printer,
  Edit2,
  Settings,
  Mail,
  Phone,
  Save,
  Globe,
  X,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { useReceipts } from '../context/ReceiptsContext';
import { SupportedCurrency, PaymentReceipt } from '../types';
import { MobileMoneyPaymentModal } from './MobileMoneyPaymentModal';

export const TenantMobileView: React.FC = () => {
  const { showSecurityNotification, isPaymentMfaEnforced, openMfaChallenge, currentUser } = useSecurity();
  const {
    activeCurrency,
    currencies,
    formatAmount,
    convertAmount,
    gateways,
    simulateRoutePayment,
  } = useCurrency();

  const [activeTab, setActiveTab] = useState<'home' | 'payments' | 'requests' | 'docs' | 'profile'>('home');
  const [tenantCurrency, setTenantCurrency] = useState<SupportedCurrency>(activeCurrency);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [mobileMoneyModalOpen, setMobileMoneyModalOpen] = useState(false);
  const [paymentSuccessInfo, setPaymentSuccessInfo] = useState<{
    reference: string;
    gatewayName: string;
    amountFormatted: string;
    feeFormatted: string;
  } | null>(null);

  const {
    receipts,
    getReceiptsForTenant,
    openReceiptPreview,
    downloadReceipt,
    verifyReconciliationEntry,
  } = useReceipts();

  // Fetch verified receipts for Jordan Avery
  const tenantReceipts = getReceiptsForTenant('Jordan Avery', 'Unit 4B');

  // Request form state
  const [category, setCategory] = useState<'Plumbing' | 'Electrical' | 'Appliance' | 'Other'>('Plumbing');
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'Urgent'>('Normal');
  const [requestDesc, setRequestDesc] = useState("Kitchen faucet drips continuously; handle won't fully close.");
  const [photosCount, setPhotosCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([
    { id: 'MR-1042', title: 'Faucet leak', status: 'In progress' },
    { id: 'MR-0987', title: 'Door lock', status: 'Completed' },
  ]);

  // Profile & App Settings state for mobile tenant
  const [tenantProfile, setTenantProfile] = useState({
    name: 'Jordan Avery',
    email: 'jordan.avery@mail.com',
    phone: '+237 670 12 34 56',
    unit: 'Unit 4B',
    property: 'Oak Residence',
    emergencyContact: '+237 699 88 77 66 (Eric Avery - Brother)',
    preferredMfa: 'phone' as 'phone' | 'email',
  });

  const [editProfileDraft, setEditProfileDraft] = useState({ ...tenantProfile });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Tenant App Settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rentReminderDays, setRentReminderDays] = useState(3);
  const [appLanguage, setAppLanguage] = useState<'en' | 'fr'>('en');
  const [rentPaid, setRentPaid] = useState(false);

  const baseRentUSD = 1450.0;
  const currentRentFormatted = formatAmount(baseRentUSD, tenantCurrency);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newReq = {
        id: `MR-${Math.floor(1050 + Math.random() * 50)}`,
        title: `${category} request`,
        status: 'In progress',
      };
      setMyRequests((prev) => [newReq, ...prev]);
      showSecurityNotification(`Request ${newReq.id} submitted privately to Oak Residence maintenance team.`);
      setRequestDesc('');
    }, 800);
  };

  const handleSelectCurrency = (cur: SupportedCurrency) => {
    setTenantCurrency(cur);
    if (cur === 'CFA') {
      setSelectedGatewayId('mtn_momo');
    } else if (cur === 'EUR' || cur === 'GBP') {
      setSelectedGatewayId('bank_transfer');
    } else {
      setSelectedGatewayId('card');
    }
  };

  const executeTenantPayRent = () => {
    setIsProcessingPayment(true);
    const convertedDue = convertAmount(baseRentUSD, 'USD', tenantCurrency);
    const result = simulateRoutePayment(convertedDue, tenantCurrency, selectedGatewayId as any);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setRentPaid(true);
      const gwName = result.gateway?.name || 'Selected Gateway';
      const refId = `SET-${tenantCurrency}-${Math.floor(100000 + Math.random() * 900000)}`;
      setPaymentSuccessInfo({
        reference: refId,
        gatewayName: gwName,
        amountFormatted: formatAmount(baseRentUSD, tenantCurrency),
        feeFormatted: `${currencies[tenantCurrency].symbol} ${result.fee.toLocaleString()}`,
      });

      // Verify reconciliation and generate PDF payment receipt
      const receipt = verifyReconciliationEntry('txn-1', 'Tenant Portal (Jordan Avery)');

      showSecurityNotification(
        `Rent payment of ${formatAmount(baseRentUSD, tenantCurrency)} confirmed! Official PDF receipt #${receipt?.receiptNumber || 'RC-2026-0412'} generated and available in your portal.`
      );
    }, 1000);
  };

  const handlePayRent = () => {
    if (selectedGatewayId === 'mtn_momo' || selectedGatewayId === 'orange_money' || tenantCurrency === 'CFA') {
      setMobileMoneyModalOpen(true);
      return;
    }

    if (isPaymentMfaEnforced) {
      const convertedDue = convertAmount(baseRentUSD, 'USD', tenantCurrency);
      openMfaChallenge({
        purpose: 'payment',
        channel: 'phone',
        user: currentUser,
        paymentDetails: {
          amount: Math.round(convertedDue),
          currency: tenantCurrency,
          payee: 'Sunrise Holdings LLC (Rent Account)',
          gateway: gateways[selectedGatewayId as any]?.name || 'Card / Bank Direct',
          unit: 'Unit 4B',
          tenantName: 'Jordan Avery',
          riskLevel: 'LOW',
        },
        onVerified: () => {
          executeTenantPayRent();
        },
      });
      return;
    }

    executeTenantPayRent();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
          EstateFlow · Tenant App · 06 / 08 · Sep 20, 2026
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
          Tenant Mobile Experience
        </h1>
        <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
          A touch-first app for tenants like Jordan Avery in Unit 4B, Oak Residence — five bottom tabs, one rent-due card, and every lease task reachable in two taps.
        </p>
      </div>

      {/* 4 Callout Bullets from Page 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-2xs text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Five-tab shell</span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            Home, Payments, Requests, Documents, and Profile tabs keep navigation flat; active tab highlighted in amber with unread alerts.
          </p>
        </div>

        <div className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-2xs text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Rent-due card</span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            $1,450.00 due September 30 with a six-day countdown and a single Pay Rent CTA that jumps straight to the payment sheet.
          </p>
        </div>

        <div className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-2xs text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px]">3</span>
            <span>Two-tap maintenance</span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            Category and priority chips, description field, and photo upload submit request MR-1042-style tickets without a desktop.
          </p>
        </div>

        <div className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-2xs text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px]">4</span>
            <span>Private by default</span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            Documents, receipts, and settings are scoped to the signed-in tenant only — landlord inboxes and vendor workflows live in separate apps.
          </p>
        </div>
      </div>

      {/* Main Dual-Sided Layout: Equal Balanced View Sections on Both Sides (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start py-4">
        {/* Left Column (50% Equal Section): Touch-First Smartphone Simulator */}
        <div className="flex justify-center">
        <div className="w-full max-w-[380px] bg-stone-900 rounded-[40px] p-3 shadow-2xl border-4 border-stone-800">
          {/* Inner Phone Screen */}
          <div className="bg-[#FAF9F6] rounded-[32px] overflow-hidden flex flex-col h-[650px] relative text-stone-900">
            {/* Top Status Bar */}
            <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono font-semibold text-stone-700 bg-transparent z-10">
              <span>9:41</span>
              <div className="flex items-center space-x-1.5 text-[10px]">
                <span>▮▮▮</span>
                <span>⌁</span>
              </div>
            </div>

            {/* Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 pt-1 space-y-4">
              {/* Currency Bar Inside Mobile View */}
              <div className="bg-stone-100/90 p-1.5 rounded-xl flex items-center justify-between border border-stone-200">
                <span className="text-[10px] font-bold text-stone-500 uppercase flex items-center space-x-1">
                  <Coins className="w-3 h-3 text-amber-700" />
                  <span>Currency:</span>
                </span>
                <div className="flex space-x-1">
                  {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((cur) => (
                    <button
                      key={cur}
                      onClick={() => handleSelectCurrency(cur)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                        tenantCurrency === cur
                          ? 'bg-amber-700 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900 bg-white/70'
                      }`}
                    >
                      {currencies[cur].symbol} {cur}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: HOME */}
              {activeTab === 'home' && (
                <div className="space-y-4">
                  {/* Greeting */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-stone-900">
                        Hi, Jordan 👋
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Unit 4B · Oak Residence
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {currencies[tenantCurrency].flag} {tenantCurrency}
                    </span>
                  </div>

                  {/* Rent Due Card */}
                  <div className="bg-[#B45309] text-white p-4 rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-100 uppercase tracking-wider">
                      <span>Rent due</span>
                      <span className="text-[11px] font-mono lowercase bg-amber-900/60 px-2 py-0.5 rounded">
                        {rentPaid ? 'Paid' : 'Due Sep 30 · 6 days left'}
                      </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                      {rentPaid ? '0.00 ' + currencies[tenantCurrency].symbol : currentRentFormatted}
                    </div>

                    {paymentSuccessInfo && rentPaid ? (
                      <div className="p-2.5 bg-amber-950/40 rounded-xl border border-amber-400/30 text-xs space-y-1">
                        <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid via {paymentSuccessInfo.gatewayName}</span>
                        </div>
                        <div className="text-[10px] text-amber-200/80 font-mono">
                          Ref: {paymentSuccessInfo.reference} · Fee: {paymentSuccessInfo.feeFormatted}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Gateway Selector for Mobile Pay */}
                        <div className="bg-amber-950/40 p-2 rounded-xl text-[11px] space-y-1">
                          <div className="text-amber-200 font-medium flex justify-between">
                            <span>Route via:</span>
                            <span className="font-mono text-[10px] text-amber-300">
                              {gateways.filter((g) => g.active).length} gateways active
                            </span>
                          </div>
                          <select
                            value={selectedGatewayId}
                            onChange={(e) => setSelectedGatewayId(e.target.value)}
                            className="w-full bg-amber-900/80 text-white rounded-lg px-2 py-1 text-xs border border-amber-700/50 focus:outline-none"
                          >
                            {tenantCurrency === 'CFA' ? (
                              <>
                                <option value="mtn_momo">MTN Mobile Money (MoMo)</option>
                                <option value="orange_money">Orange Money (OM)</option>
                                <option value="camerpay">CamerPay Aggregator</option>
                                <option value="elyonpay">ElyonPay Gateway</option>
                                <option value="card">Visa / Mastercard</option>
                              </>
                            ) : tenantCurrency === 'EUR' ? (
                              <>
                                <option value="bank_transfer">SEPA Direct Debit / Transfer</option>
                                <option value="card">Credit / Debit Card</option>
                                <option value="paypal">PayPal</option>
                                <option value="apple_pay">Apple Pay</option>
                              </>
                            ) : tenantCurrency === 'GBP' ? (
                              <>
                                <option value="bank_transfer">BACS / Faster Payments</option>
                                <option value="card">UK Card (Visa/Mastercard)</option>
                                <option value="apple_pay">Apple Pay</option>
                              </>
                            ) : (
                              <>
                                <option value="card">Card (•••• 4821)</option>
                                <option value="bank_transfer">ACH Bank Transfer</option>
                                <option value="apple_pay">Apple Pay</option>
                                <option value="google_pay">Google Pay</option>
                              </>
                            )}
                          </select>
                        </div>

                        <button
                          onClick={handlePayRent}
                          disabled={rentPaid || isProcessingPayment}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center space-x-2 ${
                            rentPaid
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-white text-amber-900 hover:bg-amber-50'
                          }`}
                        >
                          {isProcessingPayment ? (
                            <span>Routing to Gateway...</span>
                          ) : rentPaid ? (
                            <span>✓ Rent Paid for September</span>
                          ) : selectedGatewayId === 'mtn_momo' ? (
                            <span>📱 Pay with MTN MoMo (*126#)</span>
                          ) : selectedGatewayId === 'orange_money' ? (
                            <span>📱 Pay with Orange Money (#150#)</span>
                          ) : (
                            <span>Pay Rent ({currentRentFormatted})</span>
                          )}
                        </button>

                        {/* View PDF Receipt Button on successful payment */}
                        {rentPaid && tenantReceipts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => openReceiptPreview(tenantReceipts[0])}
                            className="w-full py-2 bg-amber-950/70 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-amber-600/40"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>View Verified PDF Receipt (#{tenantReceipts[0].receiptNumber})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lease Summary */}
                  <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900">Lease</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <div className="text-xs text-stone-600">
                      Sep 1, 2025 – Aug 31, 2026
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      12 months · {currentRentFormatted}/mo
                    </div>
                  </div>

                  {/* Notifications in App */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Notifications
                    </div>
                    <div className="p-2.5 bg-white border border-stone-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-start space-x-2">
                        <Wrench className="w-4 h-4 text-amber-700 mt-0.5" />
                        <div>
                          <div className="font-semibold text-stone-900">
                            Request MR-1042 updated
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Kitchen faucet · In progress
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-stone-100 pt-2 flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-stone-900">
                            Lease renewal notice
                          </div>
                          <div className="text-[11px] text-stone-500">
                            2 documents to review
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Quick actions
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <button
                        onClick={() => setActiveTab('payments')}
                        className="p-2 bg-white border border-stone-200 rounded-xl hover:border-amber-400 font-medium text-amber-900"
                      >
                        Pay rent
                      </button>
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="p-2 bg-white border border-stone-200 rounded-xl hover:border-amber-400 font-medium"
                      >
                        New request
                      </button>
                      <button
                        onClick={() => setActiveTab('docs')}
                        className="p-2 bg-white border border-stone-200 rounded-xl hover:border-amber-400 font-medium"
                      >
                        Documents
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="text-base font-extrabold text-stone-900">Payments & Gateways</div>

                  {/* Active Currency Summary */}
                  <div className="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-2">
                    <div className="text-xs text-stone-500">Selected Payment Method & Gateway</div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-900">
                      <span>
                        {tenantCurrency === 'CFA'
                          ? 'MTN MoMo •••• 3190'
                          : tenantCurrency === 'EUR'
                          ? 'SEPA IBAN •••• 9012'
                          : tenantCurrency === 'GBP'
                          ? 'BACS Sort 40-22 •••• 4419'
                          : 'VISA •••• 4821'}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Autopay scheduled for 1st of every month in {tenantCurrency}.
                    </div>
                  </div>

                  {/* Cameroon Mobile Money Direct Pay (MTN MoMo & Orange Money) */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Smartphone className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-extrabold text-stone-900">
                          Cameroon Mobile Money (MoMo & OM)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono">
                        Instant USSD
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Pay rent directly with MTN Mobile Money (*126#) or Orange Money (#150#) from your registered phone.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTenantCurrency('CFA');
                          setSelectedGatewayId('mtn_momo');
                          setMobileMoneyModalOpen(true);
                        }}
                        className="py-2 px-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition-colors"
                      >
                        <span>🟡 Pay MTN MoMo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTenantCurrency('CFA');
                          setSelectedGatewayId('orange_money');
                          setMobileMoneyModalOpen(true);
                        }}
                        className="py-2 px-2 bg-[#FF7900] hover:bg-[#e06b00] text-white rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition-colors"
                      >
                        <span>🟠 Pay Orange Money</span>
                      </button>
                    </div>
                  </div>

                  {/* Landlord Payment Router simulation in app */}
                  <div className="p-3.5 bg-[#FFFDF8] border border-amber-200 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-amber-900 flex items-center justify-between">
                      <span>Supported Currencies</span>
                      <span className="text-[10px] font-mono text-amber-700">EUR · USD · GBP · CFA</span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Jordan Avery can pay in any of the 4 supported currencies. Payments are routed through the landlord's activated gateways.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                      <div className="p-2 bg-white rounded-lg border border-stone-100">
                        <div className="text-stone-400">Monthly Rent:</div>
                        <div className="font-bold text-stone-900">{currentRentFormatted}</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-stone-100">
                        <div className="text-stone-400">Landlord Net:</div>
                        <div className="font-bold text-emerald-700">
                          {formatAmount(baseRentUSD * 0.985, tenantCurrency)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-stone-900">
                        Official Rent Receipts ({tenantReceipts.length})
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>HMAC Sealed</span>
                      </span>
                    </div>

                    {tenantReceipts.length > 0 ? (
                      tenantReceipts.map((rcpt) => (
                        <div
                          key={rcpt.id}
                          className="p-3 bg-white border border-stone-200 rounded-xl space-y-1.5 text-xs shadow-2xs hover:border-amber-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 flex items-center space-x-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>#{rcpt.receiptNumber}</span>
                            </span>
                            <span className="font-mono font-bold text-amber-900">
                              {rcpt.currency === 'CFA'
                                ? `${Math.round(rcpt.amountPaid).toLocaleString()} FCFA`
                                : `${rcpt.currency} ${rcpt.amountPaid.toFixed(2)}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                            <span>{rcpt.issuedAt}</span>
                            <span className="text-emerald-700 font-medium">✓ Verified & Reconciled</span>
                          </div>

                          <div className="pt-1.5 border-t border-stone-100 flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => openReceiptPreview(rcpt)}
                              className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-stone-600" />
                              <span>View PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadReceipt(rcpt)}
                              className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-white border border-stone-200 rounded-xl text-center text-xs text-stone-500">
                        No receipts generated yet. Pay rent to receive your verified PDF receipt.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: REQUESTS (Two-Tap Maintenance) */}
              {activeTab === 'requests' && (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <div className="text-base font-extrabold text-stone-900">
                      New maintenance request
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Unit 4B · Oak Residence
                    </div>
                  </div>

                  {/* Category Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Category
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['Plumbing', 'Electrical', 'Appliance', 'Other'] as const).map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            category === cat
                              ? 'bg-amber-700 text-white font-bold'
                              : 'bg-white border border-stone-200 text-stone-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Priority
                    </div>
                    <div className="flex space-x-1.5">
                      {(['Low', 'Normal', 'Urgent'] as const).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            priority === p
                              ? 'bg-stone-900 text-white border-stone-900 font-bold'
                              : 'bg-white border-stone-200 text-stone-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="space-y-1">
                    <textarea
                      rows={3}
                      value={requestDesc}
                      onChange={(e) => setRequestDesc(e.target.value)}
                      placeholder="Describe the issue..."
                      className="w-full p-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  {/* Add photos */}
                  <div
                    onClick={() => setPhotosCount((c) => Math.min(4, c + 1))}
                    className="p-2.5 border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-600 bg-white cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Camera className="w-4 h-4 text-stone-400" />
                    <span>+ Add photos ({photosCount}/4 attached)</span>
                  </div>

                  <p className="text-[10px] text-stone-500 italic">
                    Requests go privately to the Oak Residence maintenance team. You'll get status updates here.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting || !requestDesc}
                    className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit request'}
                  </button>

                  {/* My requests list */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      My requests
                    </div>
                    {myRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2 bg-white border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-900">
                          {req.id} · {req.title}
                        </span>
                        <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </form>
              )}

              {/* TAB 4: DOCS */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-base font-extrabold text-stone-900">Private Documents</div>
                    <div className="text-[11px] text-stone-500">Unit 4B · Oak Residence</div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-white border border-stone-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-900">Lease agreement 2025–26</div>
                        <div className="text-[10px] text-stone-400">PDF · signed Aug 28 · 1.4 MB</div>
                      </div>
                      <span className="text-amber-800 font-semibold cursor-pointer hover:underline">View</span>
                    </div>

                    <div className="p-3 bg-white border border-stone-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-900">Renter's insurance policy</div>
                        <div className="text-[10px] text-stone-400">Expires Jan 15, 2026 · Verified</div>
                      </div>
                      <span className="text-emerald-700 font-semibold">Active</span>
                    </div>
                  </div>

                  {/* Verified Rent Receipts Section */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Official Payment Receipts ({tenantReceipts.length})
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">PDF Generated</span>
                    </div>

                    {tenantReceipts.length > 0 ? (
                      <div className="space-y-2">
                        {tenantReceipts.map((rcpt) => (
                          <div
                            key={rcpt.id}
                            className="p-3 bg-white border border-stone-200 rounded-xl text-xs space-y-2 hover:border-amber-300 transition-colors shadow-2xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Receipt #{rcpt.receiptNumber}</span>
                                </div>
                                <div className="text-[10px] text-stone-400 mt-0.5">
                                  {rcpt.issuedAt} · {rcpt.paymentMethod}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-stone-900 text-xs">
                                {rcpt.currency === 'CFA'
                                  ? `${Math.round(rcpt.amountPaid).toLocaleString()} FCFA`
                                  : `${rcpt.currency} ${rcpt.amountPaid.toFixed(2)}`}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                              <span className="text-emerald-700 font-medium text-[10px]">
                                ✓ Verified by {rcpt.verifiedBy.split(' ')[0]}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => openReceiptPreview(rcpt)}
                                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[10px] transition-colors flex items-center space-x-1"
                                >
                                  <Eye className="w-3 h-3 text-stone-500" />
                                  <span>Preview</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadReceipt(rcpt)}
                                  className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-800 text-white font-bold text-[10px] transition-colors flex items-center space-x-1 shadow-2xs"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-stone-200 rounded-xl text-center text-xs text-stone-500">
                        No payment receipts yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PROFILE & SETTINGS */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-stone-900">Profile & Settings</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {tenantProfile.unit} · {tenantProfile.property}
                      </div>
                    </div>
                    {!isEditingProfile && (
                      <button
                        onClick={() => {
                          setEditProfileDraft({ ...tenantProfile });
                          setIsEditingProfile(true);
                        }}
                        className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold flex items-center space-x-1 hover:bg-amber-100 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-amber-700" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* Profile Card / In-place Edit Form */}
                  {isEditingProfile ? (
                    <div className="p-3.5 bg-white border border-amber-400 rounded-2xl shadow-xs space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <span className="font-bold text-stone-900 flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit Tenant Profile</span>
                        </span>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Full Name</label>
                          <input
                            type="text"
                            value={editProfileDraft.name}
                            onChange={(e) => setEditProfileDraft({ ...editProfileDraft, name: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Email Address</label>
                          <input
                            type="email"
                            value={editProfileDraft.email}
                            onChange={(e) => setEditProfileDraft({ ...editProfileDraft, email: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Phone Number (MFA OTP & MoMo)</label>
                          <input
                            type="text"
                            value={editProfileDraft.phone}
                            onChange={(e) => setEditProfileDraft({ ...editProfileDraft, phone: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Emergency Contact</label>
                          <input
                            type="text"
                            value={editProfileDraft.emergencyContact}
                            onChange={(e) => setEditProfileDraft({ ...editProfileDraft, emergencyContact: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Payment MFA Channel</label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setEditProfileDraft({ ...editProfileDraft, preferredMfa: 'phone' })}
                              className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition-all ${
                                editProfileDraft.preferredMfa === 'phone'
                                  ? 'bg-amber-50 border-amber-500 text-amber-900'
                                  : 'bg-stone-50 border-stone-200 text-stone-600'
                              }`}
                            >
                              SMS Phone OTP
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditProfileDraft({ ...editProfileDraft, preferredMfa: 'email' })}
                              className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition-all ${
                                editProfileDraft.preferredMfa === 'email'
                                  ? 'bg-amber-50 border-amber-500 text-amber-900'
                                  : 'bg-stone-50 border-stone-200 text-stone-600'
                              }`}
                            >
                              Email Code
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            setTenantProfile({ ...editProfileDraft });
                            setIsEditingProfile(false);
                            showSecurityNotification('Mobile Profile updated: Contact & OTP preferences saved.');
                          }}
                          className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-2xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-2 bg-stone-100 text-stone-700 rounded-xl font-medium text-xs hover:bg-stone-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-2.5 text-xs">
                      <div className="flex items-center space-x-3 pb-2 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                          {tenantProfile.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-stone-900 text-sm truncate">{tenantProfile.name}</div>
                          <div className="text-[11px] text-stone-500 font-mono truncate">{tenantProfile.email}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-stone-700">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Phone:</span>
                          <span className="font-mono font-bold text-stone-900">{tenantProfile.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Lease:</span>
                          <span className="font-semibold text-stone-900">{tenantProfile.property} · {tenantProfile.unit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Emergency:</span>
                          <span className="text-[11px] text-stone-600 truncate max-w-[170px]">{tenantProfile.emergencyContact}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                          <span className="text-stone-500">Payment MFA:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] font-mono">
                            {tenantProfile.preferredMfa === 'phone' ? 'Phone SMS OTP' : 'Email Code'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Card */}
                  <div className="p-3 bg-white border border-stone-200 rounded-2xl space-y-1.5 text-xs shadow-2xs">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Default Payment Method
                    </div>
                    <div className="flex items-center justify-between font-mono font-bold text-stone-900">
                      <span>•••• 4821 (Visa Gold)</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold">Active</span>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Autopay on the 1st · Mobile Money or Card fallback
                    </div>
                  </div>

                  {/* App Settings Card */}
                  <div className="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-3 text-xs shadow-2xs">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Mobile App Settings</span>
                      <Settings className="w-3.5 h-3.5 text-stone-400" />
                    </div>

                    {/* Preferred Currency Selector */}
                    <div>
                      <div className="text-[11px] font-bold text-stone-700 mb-1">Display Currency</div>
                      <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px] font-bold">
                        {(['USD', 'EUR', 'GBP', 'XAF'] as SupportedCurrency[]).map((cur) => (
                          <button
                            key={cur}
                            type="button"
                            onClick={() => {
                              handleSelectCurrency(cur);
                              showSecurityNotification(`Mobile currency set to ${cur}. Rent display updated.`);
                            }}
                            className={`py-1.5 rounded-lg border transition-all text-center ${
                              tenantCurrency === cur
                                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {cur}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="font-medium text-stone-700">App Language</span>
                      <div className="flex items-center space-x-1 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => setAppLanguage('en')}
                          className={`px-2 py-0.5 rounded ${appLanguage === 'en' ? 'bg-stone-900 text-white font-bold' : 'text-stone-500'}`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppLanguage('fr')}
                          className={`px-2 py-0.5 rounded ${appLanguage === 'fr' ? 'bg-stone-900 text-white font-bold' : 'text-stone-500'}`}
                        >
                          FR
                        </button>
                      </div>
                    </div>

                    {/* Push Notifications Toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <div>
                        <span className="font-medium text-stone-800">Push Notifications</span>
                        <div className="text-[10px] text-stone-500">Maintenance & payment alerts</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPushEnabled(!pushEnabled);
                          showSecurityNotification(`Push notifications ${!pushEnabled ? 'enabled' : 'muted'}.`);
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          pushEnabled ? 'bg-amber-700' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            pushEnabled ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* SMS Alerts Toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <div>
                        <span className="font-medium text-stone-800">SMS Alerts</span>
                        <div className="text-[10px] text-stone-500">Critical lease & security SMS</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSmsAlerts(!smsAlerts);
                          showSecurityNotification(`SMS alerts ${!smsAlerts ? 'enabled' : 'disabled'}.`);
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          smsAlerts ? 'bg-amber-700' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            smsAlerts ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Rent Reminders & Lead Days */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <div>
                        <span className="font-medium text-stone-800">Rent Reminders</span>
                        <div className="text-[10px] text-stone-500">Notification before due date</div>
                      </div>
                      <select
                        value={rentReminderDays}
                        onChange={(e) => {
                          setRentReminderDays(Number(e.target.value));
                          showSecurityNotification(`Rent reminder set to ${e.target.value} days before due date.`);
                        }}
                        className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-bold text-amber-900 text-[11px]"
                      >
                        <option value={1}>1 day before</option>
                        <option value={3}>3 days before</option>
                        <option value={5}>5 days before</option>
                        <option value={7}>7 days before</option>
                      </select>
                    </div>

                    {/* Face ID / Biometrics */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <div>
                        <span className="font-medium text-stone-800">Biometric Unlock</span>
                        <div className="text-[10px] text-stone-500">Face ID / Fingerprint simulation</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFaceIdEnabled(!faceIdEnabled);
                          showSecurityNotification(`Biometric unlock ${!faceIdEnabled ? 'activated' : 'deactivated'}.`);
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          faceIdEnabled ? 'bg-amber-700' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            faceIdEnabled ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Audible Sound Chimes */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <div>
                        <span className="font-medium text-stone-800">Audible Chimes</span>
                        <div className="text-[10px] text-stone-500">Sound on payment confirmation</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSoundEnabled(!soundEnabled);
                          showSecurityNotification(`Sound chimes ${!soundEnabled ? 'on' : 'muted'}.`);
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          soundEnabled ? 'bg-amber-700' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            soundEnabled ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 5-Tab Navigation Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-3 py-2 flex items-center justify-between text-[10px] font-semibold text-stone-500">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center flex-1 py-1 ${
                  activeTab === 'home' ? 'text-amber-800 font-bold' : 'hover:text-stone-900'
                }`}
              >
                <Home className="w-4 h-4 mb-0.5" />
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`flex flex-col items-center flex-1 py-1 ${
                  activeTab === 'payments' ? 'text-amber-800 font-bold' : 'hover:text-stone-900'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-0.5" />
                <span>Payments</span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`flex flex-col items-center flex-1 py-1 relative ${
                  activeTab === 'requests' ? 'text-amber-800 font-bold' : 'hover:text-stone-900'
                }`}
              >
                <Wrench className="w-4 h-4 mb-0.5" />
                <span>Requests</span>
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full absolute top-1 right-3"></span>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`flex flex-col items-center flex-1 py-1 ${
                  activeTab === 'docs' ? 'text-amber-800 font-bold' : 'hover:text-stone-900'
                }`}
              >
                <FileText className="w-4 h-4 mb-0.5" />
                <span>Docs</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center flex-1 py-1 ${
                  activeTab === 'profile' ? 'text-amber-800 font-bold' : 'hover:text-stone-900'
                }`}
              >
                <User className="w-4 h-4 mb-0.5" />
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Right Column (50% Equal Section): Resident Account & Lease Intelligence Console */}
        <div className="space-y-6">
          {/* Lease Overview Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  4B
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-stone-900">Unit 4B · Oak Residence</h2>
                  <p className="text-xs text-stone-500 font-mono">Tenant: Jordan Avery · Active Lease</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Current · In Good Standing
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="text-[10px] text-stone-500 font-bold uppercase font-mono">Monthly Rent</div>
                <div className="text-base font-black text-stone-900 font-mono mt-0.5">$1,450.00</div>
                <div className="text-[10px] text-stone-500">Due 1st of month</div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="text-[10px] text-stone-500 font-bold uppercase font-mono">Escrow Deposit</div>
                <div className="text-base font-black text-amber-900 font-mono mt-0.5">$1,450.00</div>
                <div className="text-[10px] text-emerald-700 font-medium">+2.85% APY yield</div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-stone-500 font-bold uppercase font-mono">Lease Expiry</div>
                <div className="text-base font-black text-stone-900 font-mono mt-0.5">Dec 31, 2026</div>
                <div className="text-[10px] text-stone-500">3 months remaining</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Statutory Escrow Segregation Notice:</span> Your security deposit is held in a segregated client trust account under statutory regulations earning 2.85% annual yield with zero landlord commingling.
              </div>
            </div>
          </div>

          {/* Quick Payment Dispatch Center */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">Direct Payment Gateways</h2>
              <span className="text-xs text-stone-400 font-mono">Zero Fee</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedGatewayId('mtn_momo');
                  setMobileMoneyModalOpen(true);
                }}
                className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FFCC00]"></span>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-amber-900">MTN Mobile Money</span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">*126# USSD Push Notification</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setSelectedGatewayId('orange_money');
                  setMobileMoneyModalOpen(true);
                }}
                className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF7900]"></span>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-amber-900">Orange Money</span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">#150# USSD Fast Approval</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Verified HMAC Receipts Archive */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-bold text-stone-900">Tamper-Evident Receipts</h2>
                <p className="text-xs text-stone-500">Cryptographically sealed PDF downloads</p>
              </div>
              <span className="text-xs font-bold text-amber-800 font-mono">{tenantReceipts.length} Issued</span>
            </div>

            <div className="space-y-2.5">
              {tenantReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="p-3 rounded-xl border border-stone-100 hover:border-amber-300 bg-stone-50/60 transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-stone-900 font-mono flex items-center space-x-2">
                      <span>{receipt.receiptNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Verified</span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      {receipt.issuedAt} · {receipt.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-black font-mono text-stone-900">
                      ${receipt.amountPaid.toFixed(2)}
                    </span>
                    <button
                      onClick={() => openReceiptPreview(receipt)}
                      className="p-1.5 rounded-lg bg-white border border-stone-200 hover:border-amber-400 text-stone-700 hover:text-amber-900 transition-colors shadow-2xs cursor-pointer"
                      title="Preview receipt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => downloadReceipt(receipt)}
                      className="p-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors shadow-2xs cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cameroon Mobile Money Payment Modal for Tenant */}
      <MobileMoneyPaymentModal
        isOpen={mobileMoneyModalOpen}
        onClose={() => setMobileMoneyModalOpen(false)}
        initialGateway={selectedGatewayId === 'orange_money' ? 'orange_money' : 'mtn_momo'}
        initialTenantName="Jordan Avery"
        initialUnit="Unit 4B"
        initialAmountUSD={baseRentUSD}
        onPaymentCompleted={(receipt) => {
          setRentPaid(true);
          setPaymentSuccessInfo({
            reference: receipt.gatewayRef,
            gatewayName: receipt.paymentMethod,
            amountFormatted: `${receipt.amountPaid.toLocaleString()} ${receipt.currency}`,
            feeFormatted: 'Fee: 0 XAF (Absorbed by Landlord)',
          });
        }}
      />
    </div>
  );
};
