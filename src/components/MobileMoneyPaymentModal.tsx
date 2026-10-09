import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Coins,
  FileCheck,
  Check,
  Copy,
  Download,
  Eye,
  Key,
  Building2,
  User,
  Zap,
  Lock,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useReceipts } from '../context/ReceiptsContext';
import { useSecurity } from '../context/SecurityContext';
import {
  detectMeSombOperator,
  formatCameroonPhone,
  executeMeSombPayment,
  MeSombService,
} from '../utils/mesombGatewayUtils';
import { PaymentReceipt, GatewayIdentifier } from '../types';

interface MobileMoneyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGateway?: 'mtn_momo' | 'orange_money' | 'mesomb';
  initialTenantName?: string;
  initialUnit?: string;
  initialAmountUSD?: number;
  onPaymentCompleted?: (receipt: PaymentReceipt) => void;
}

const PRESET_TENANTS = [
  {
    name: 'Jordan Avery',
    unit: 'Unit 4B',
    property: 'Oak Residence',
    phoneMtn: '677 41 89 20',
    phoneOrange: '694 22 10 55',
    rentUsd: 1450,
  },
  {
    name: 'Marcus Vance',
    unit: 'Unit 2A',
    property: 'Maple Court',
    phoneMtn: '682 90 33 11',
    phoneOrange: '699 15 44 82',
    rentUsd: 1200,
  },
  {
    name: 'Elena Rostova',
    unit: 'Unit 10C',
    property: 'Pine Hill',
    phoneMtn: '671 22 88 40',
    phoneOrange: '655 80 12 99',
    rentUsd: 1600,
  },
];

export const MobileMoneyPaymentModal: React.FC<MobileMoneyPaymentModalProps> = ({
  isOpen,
  onClose,
  initialGateway = 'mtn_momo',
  initialTenantName = 'Jordan Avery',
  initialUnit = 'Unit 4B',
  initialAmountUSD = 1450,
  onPaymentCompleted,
}) => {
  const { exchangeRates, formatAmount, gateways } = useCurrency();
  const { recordPaymentTransaction, openReceiptPreview, downloadReceipt } = useReceipts();
  const { showSecurityNotification, isPaymentMfaEnforced, openMfaChallenge, currentUser } = useSecurity();

  // Gateway mode: 'mtn_momo' | 'orange_money' | 'mesomb'
  const [selectedGateway, setSelectedGateway] = useState<'mtn_momo' | 'orange_money' | 'mesomb'>(initialGateway);
  const [tenantName, setTenantName] = useState(initialTenantName);
  const [unit, setUnit] = useState(initialUnit);
  const [phone, setPhone] = useState('677 41 89 20');
  const [amountUSD, setAmountUSD] = useState(initialAmountUSD);
  const [customAmountCFA, setCustomAmountCFA] = useState<number | null>(null);

  // Flow step: 'FORM' | 'USSD_PUSH' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [step, setStep] = useState<'FORM' | 'USSD_PUSH' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('FORM');
  const [pinCode, setPinCode] = useState('1234');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [completedReceipt, setCompletedReceipt] = useState<PaymentReceipt | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [carrierDetails, setCarrierDetails] = useState<{
    pk: string;
    operatorRef: string;
    channel: string;
    signature: string;
    service: string;
    authHeader: string;
  } | null>(null);

  // Sync props when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedGateway(initialGateway);
      setTenantName(initialTenantName);
      setUnit(initialUnit);
      setAmountUSD(initialAmountUSD);
      setStep('FORM');
      setCompletedReceipt(null);
      setCarrierDetails(null);
      setErrorMessage('');

      // Auto-set phone based on gateway
      if (initialGateway === 'orange_money') {
        setPhone('694 22 10 55');
      } else {
        setPhone('677 41 89 20');
      }
    }
  }, [isOpen, initialGateway, initialTenantName, initialUnit, initialAmountUSD]);

  if (!isOpen) return null;

  // Rate calculations
  const cfaRate = exchangeRates.CFA || 605;
  const calculatedCfa = customAmountCFA !== null ? customAmountCFA : Math.round(amountUSD * cfaRate);

  // Detect operator from input
  const detectedService = detectMeSombOperator(phone);

  // Fee calculation
  const feeRate = selectedGateway === 'mtn_momo' ? 0.012 : selectedGateway === 'orange_money' ? 0.015 : 0.01;
  const gatewayFee = Math.round(calculatedCfa * feeRate);
  const netLandlordSettlement = calculatedCfa - gatewayFee;

  // Active gateway config
  const mtnConfig = gateways.find((g) => g.id === 'mtn_momo');
  const orangeConfig = gateways.find((g) => g.id === 'orange_money');

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^\d\s]/g, '');
    setPhone(clean);

    // If auto-detect mode is on, adjust gateway
    const detected = detectMeSombOperator(clean);
    if (selectedGateway === 'mesomb' && detected) {
      // Keep mesomb or highlight
    }
  };

  const handleSelectPresetTenant = (t: (typeof PRESET_TENANTS)[0]) => {
    setTenantName(t.name);
    setUnit(t.unit);
    setAmountUSD(t.rentUsd);
    setCustomAmountCFA(null);
    if (selectedGateway === 'orange_money') {
      setPhone(t.phoneOrange);
    } else {
      setPhone(t.phoneMtn);
    }
  };

  const handleInitiatePush = () => {
    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length < 8) {
      setErrorMessage('Please enter a valid 9-digit Cameroon mobile phone number (e.g. 677 41 89 20).');
      return;
    }

    setErrorMessage('');
    // Move to realistic interactive USSD push simulation
    setStep('USSD_PUSH');
    showSecurityNotification(
      `[Gateway Handshake] USSD Push request prepared for +237 ${phone} via ${
        selectedGateway === 'orange_money' ? 'Orange Money (#150#)' : 'MTN MoMo (*126#)'
      }.`
    );
  };

  const executePaymentBackend = async () => {
    setStep('PROCESSING');
    setProcessingStatus('Connecting to MeSomb Payment Gateway API...');

    const resolvedService: MeSombService =
      selectedGateway === 'orange_money'
        ? 'ORANGE'
        : selectedGateway === 'mtn_momo'
        ? 'MTN'
        : detectedService || 'MTN';

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStatus(
        resolvedService === 'MTN'
          ? 'Transmitting USSD *126# prompt to MTN Cameroon Mobile Money Corporation...'
          : 'Transmitting WebPay #150# prompt to Orange Cameroun API...'
      );

      await new Promise((r) => setTimeout(r, 700));
      setProcessingStatus('Verifying cryptographic HMAC-SHA1 signature...');

      const response = await executeMeSombPayment({
        amount: calculatedCfa,
        service: resolvedService,
        payer: phone,
        currency: 'CFA',
        customerName: tenantName,
        unit: unit,
        reference: `RENT-${unit.replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
      });

      if (!response.success) {
        setErrorMessage(response.message || 'Payment was declined by carrier.');
        setStep('ERROR');
        return;
      }

      setProcessingStatus('Posting settlement to live Rent Ledger and generating official PDF receipt...');
      await new Promise((r) => setTimeout(r, 500));

      const gatewayId: GatewayIdentifier =
        resolvedService === 'MTN' ? 'mtn_momo' : 'orange_money';

      const methodName =
        resolvedService === 'MTN'
          ? 'MTN Mobile Money'
          : 'Orange Money';

      const maskedNumber = `+237 ${phone.slice(0, 3)} •••• ${phone.slice(-2)}`;

      // Record in ReceiptsContext
      const { receipt } = recordPaymentTransaction({
        tenantName,
        unit,
        amount: Math.round(calculatedCfa / cfaRate),
        originalAmount: calculatedCfa,
        currency: 'CFA',
        method: methodName,
        maskedMethod: `${methodName} (${maskedNumber})`,
        gatewayId,
        gatewayRef: response.transaction.pk,
        carrierRef: response.transaction.operatorRef,
        ussdCode: resolvedService === 'MTN' ? '*126#' : '#150#',
        payerPhone: `+237 ${phone}`,
        signature: response.transaction.signature,
        serviceProvider: resolvedService === 'MTN' ? 'MTN' : 'ORANGE',
        itemizedRent: calculatedCfa,
        itemizedParking: 0,
      });

      setCarrierDetails({
        pk: response.transaction.pk,
        operatorRef: response.transaction.operatorRef,
        channel: response.transaction.channel,
        signature: response.transaction.signature,
        service: resolvedService,
        authHeader: response.transaction.authorizationHeader,
      });

      setCompletedReceipt(receipt);
      setStep('SUCCESS');

      if (onPaymentCompleted) {
        onPaymentCompleted(receipt);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network handshake failed with carrier endpoint.');
      setStep('ERROR');
    }
  };

  const handleAuthorizeAndExecutePayment = async () => {
    if (isPaymentMfaEnforced) {
      const resolvedService: MeSombService =
        selectedGateway === 'orange_money'
          ? 'ORANGE'
          : selectedGateway === 'mtn_momo'
          ? 'MTN'
          : detectedService || 'MTN';

      openMfaChallenge({
        purpose: 'payment',
        channel: 'phone',
        user: currentUser,
        paymentDetails: {
          amount: calculatedCfa,
          currency: 'CFA',
          payee: 'Sunrise Holdings LLC (Rent Account)',
          gateway: resolvedService === 'MTN' ? 'MTN Mobile Money (*126#)' : 'Orange Money (#150#)',
          unit: unit,
          tenantName: tenantName,
          riskLevel: 'LOW',
        },
        onVerified: () => {
          executePaymentBackend();
        },
      });
      return;
    }

    executePaymentBackend();
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Mobile Money Payment Terminal
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Cameroon 🇨🇲
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Direct settlement via MTN MoMo (*126#) & Orange Money (#150#)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: PAYMENT CONFIGURATION FORM */}
          {step === 'FORM' && (
            <>
              {/* Gateway Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Select Mobile Money Operator
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* MTN MoMo */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway('mtn_momo');
                      if (phone.startsWith('69') || phone.startsWith('655')) {
                        setPhone('677 41 89 20');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedGateway === 'mtn_momo'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-yellow-400 text-stone-900 font-black text-xs flex items-center justify-center shadow-xs">
                        MTN
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                        *126#
                      </span>
                    </div>
                    <div className="mt-2 font-extrabold text-stone-900 text-xs leading-tight">
                      MTN MoMo
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Fee: 1.2% · USSD Push
                    </div>
                  </button>

                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway('orange_money');
                      if (phone.startsWith('67') || phone.startsWith('68')) {
                        setPhone('694 22 10 55');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedGateway === 'orange_money'
                        ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-[#FF7900] text-white font-black text-xs flex items-center justify-center shadow-xs">
                        OM
                      </span>
                      <span className="text-[10px] font-mono font-bold text-orange-900 bg-orange-100/80 px-1.5 py-0.5 rounded">
                        #150#
                      </span>
                    </div>
                    <div className="mt-2 font-extrabold text-stone-900 text-xs leading-tight">
                      Orange Money
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Fee: 1.5% · WebPay
                    </div>
                  </button>

                  {/* MeSomb Unified */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('mesomb')}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedGateway === 'mesomb'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        Auto
                      </span>
                    </div>
                    <div className="mt-2 font-extrabold text-stone-900 text-xs leading-tight">
                      MeSomb Dual
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Fee: 1.0% · Aggregator
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Tenant Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Payer / Tenant Selection
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_TENANTS.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => handleSelectPresetTenant(t)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        tenantName === t.name
                          ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="font-bold text-stone-900 text-xs">{t.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {t.unit} · {t.property}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payer Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Payer Name
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    placeholder="e.g. Jordan Avery"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Unit / Lease Ref
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    placeholder="e.g. Unit 4B"
                  />
                </div>
              </div>

              {/* Cameroon Phone Input with Carrier Detection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Cameroon Mobile Money Phone Number
                  </label>
                  {detectedService && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        detectedService === 'MTN'
                          ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                          : 'bg-orange-100 text-orange-900 border border-orange-300'
                      }`}
                    >
                      <span>●</span>
                      <span>
                        {detectedService === 'MTN' ? 'MTN MoMo (*126#)' : 'Orange Money (#150#)'} detected
                      </span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-stone-500">
                    🇨🇲 +237
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-20 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 tracking-wide"
                    placeholder="677 41 89 20"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                  <span>MTN: 67X, 68X, 650-654 · Orange: 69X, 655-659</span>
                  <div className="space-x-1">
                    <button
                      type="button"
                      onClick={() => setPhone('677 41 89 20')}
                      className="text-amber-800 hover:underline font-mono text-[10px]"
                    >
                      [Fill MTN]
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhone('694 22 10 55')}
                      className="text-orange-700 hover:underline font-mono text-[10px]"
                    >
                      [Fill OM]
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Amount in CFA & USD Equivalence */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                      Settlement Amount
                    </span>
                    <div className="text-2xl font-black text-amber-950 font-mono mt-0.5">
                      {calculatedCfa.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500">USD Valuation:</span>
                    <div className="font-mono font-bold text-stone-700 text-sm">
                      ${(calculatedCfa / cfaRate).toFixed(2)} USD
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">
                      @ 1 USD = {cfaRate} CFA
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      setAmountUSD(1450);
                      setCustomAmountCFA(null);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-200"
                  >
                    Full Rent (877,250 XAF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmountCFA(500000)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-stone-800 text-[11px] font-medium rounded-lg border border-amber-200"
                  >
                    500,000 XAF
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmountCFA(250000)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-stone-800 text-[11px] font-medium rounded-lg border border-amber-200"
                  >
                    250,000 XAF
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmountCFA(100000)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-stone-800 text-[11px] font-medium rounded-lg border border-amber-200"
                  >
                    100,000 XAF
                  </button>
                </div>

                {/* Fee Breakdown */}
                <div className="pt-2 border-t border-amber-200/50 flex items-center justify-between text-xs">
                  <span className="text-stone-600">
                    Carrier Gateway Fee ({(feeRate * 100).toFixed(1)}%):
                  </span>
                  <span className="font-mono text-stone-800 font-semibold">
                    -{gatewayFee.toLocaleString()} XAF
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Net Payout to Landlord:</span>
                  <span className="font-mono">
                    {netLandlordSettlement.toLocaleString()} XAF
                  </span>
                </div>
              </div>

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Initiate Button */}
              <button
                type="button"
                onClick={handleInitiatePush}
                className={`w-full py-3 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition-all ${
                  selectedGateway === 'orange_money'
                    ? 'bg-[#FF7900] hover:bg-[#e06b00]'
                    : selectedGateway === 'mesomb'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-amber-700 hover:bg-amber-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  Initiate {selectedGateway === 'orange_money' ? 'Orange Money (#150#)' : 'MTN MoMo (*126#)'} Push Collection
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </>
          )}

          {/* STEP 2: REALISTIC USSD PUSH PROMPT SIMULATION */}
          {step === 'USSD_PUSH' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-200">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>USSD Push Simulation on Tenant's Phone</span>
                </div>
                <h4 className="text-base font-bold text-stone-900">
                  Carrier Authorization Prompt Received
                </h4>
                <p className="text-xs text-stone-500">
                  The tenant receives a real-time carrier dialog on their handset screen.
                </p>
              </div>

              {/* Simulated Handset Screen Dialog */}
              <div className="bg-stone-900 rounded-3xl p-5 text-white max-w-sm mx-auto shadow-xl border-4 border-stone-800 space-y-4">
                {/* Operator Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center space-x-2">
                    {selectedGateway === 'orange_money' ? (
                      <span className="w-5 h-5 rounded bg-[#FF7900] text-white text-[10px] font-black flex items-center justify-center">
                        OM
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded bg-yellow-400 text-stone-950 text-[10px] font-black flex items-center justify-center">
                        MTN
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold">
                      {selectedGateway === 'orange_money'
                        ? 'Orange Money Cameroun (#150#)'
                        : 'MTN Mobile Money CM (*126#)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">SIM 1</span>
                </div>

                {/* Prompt Text */}
                <div className="p-3 bg-stone-800/80 rounded-xl text-xs space-y-2 font-mono">
                  <div className="text-amber-300 font-bold">
                    {selectedGateway === 'orange_money'
                      ? 'Demande de Paiement Marchand:'
                      : "Y'ello! Payment Collection Request:"}
                  </div>
                  <div className="text-stone-300 text-[11px] leading-relaxed">
                    Merchant: <strong>SUNRISE HOLDINGS LLC</strong>
                    <br />
                    Amount: <strong>{calculatedCfa.toLocaleString()} XAF</strong>
                    <br />
                    Reason: Rent Settlement ({unit})
                    <br />
                    Payer: {tenantName} (+237 {phone})
                  </div>
                </div>

                {/* PIN Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-stone-300 font-mono">
                    Enter Mobile Money PIN to Authorize:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="••••"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-400">
                    <span>Test Demo PIN: 1234</span>
                    <button
                      type="button"
                      onClick={() => setPinCode('1234')}
                      className="text-amber-400 hover:underline"
                    >
                      Autofill 1234
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('FORM')}
                    className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAuthorizeAndExecutePayment}
                    className={`py-2 px-3 text-white text-xs font-bold rounded-xl shadow-xs transition-colors ${
                      selectedGateway === 'orange_money'
                        ? 'bg-[#FF7900] hover:bg-[#e06b00]'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {isPaymentMfaEnforced ? 'Authorize & MFA OTP ✓' : 'Authorize PIN ✓'}
                  </button>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 space-y-1">
                <div className="font-bold text-stone-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Real-Time MeSomb & Payment MFA Security Protocol</span>
                </div>
                <p>
                  Upon authorization, payment is verified through {isPaymentMfaEnforced ? 'Out-of-Band Multi-Factor Authentication (Email / SMS OTP) and ' : ''}signed HMAC-SHA1 webhook before instant settlement.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING SPINNER */}
          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-700 animate-spin" />
                <Smartphone className="w-6 h-6 text-amber-800 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-stone-900 text-base">
                  Communicating with Mobile Money Gateway
                </h4>
                <p className="text-xs text-stone-600 font-mono">{processingStatus}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl text-[11px] font-mono text-stone-500 max-w-sm border border-stone-200">
                POST /api/v1.1/payment/online/
                <br />
                Authorization: MeSomb acc_mesomb_4920de8812:...
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT & VERIFICATION */}
          {step === 'SUCCESS' && completedReceipt && carrierDetails && (
            <div className="space-y-4 animate-in fade-in">
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-emerald-950 text-sm">
                      Payment Successfully Collected via {carrierDetails.service === 'MTN' ? 'MTN MoMo' : 'Orange Money'}!
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
                      SETTLED
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {calculatedCfa.toLocaleString()} FCFA received from {tenantName} for {unit}. Transaction posted to live Rent Ledger and verified PDF receipt generated.
                  </p>
                </div>
              </div>

              {/* Carrier Handshake Metadata Card */}
              <div className="p-4 bg-stone-900 rounded-2xl text-stone-200 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold border-b border-stone-800 pb-1.5">
                  <span>Carrier & MeSomb Gateway Receipt</span>
                  <span className="text-emerald-400">HMAC-SHA1 Verified ✓</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Carrier Reference:</span>
                    <div className="flex items-center space-x-1 font-bold text-amber-400">
                      <span>{carrierDetails.operatorRef}</span>
                      <button
                        onClick={() => handleCopyRef(carrierDetails.operatorRef)}
                        className="p-1 hover:text-white"
                        title="Copy reference"
                      >
                        {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">MeSomb Transaction PK:</span>
                    <span className="text-stone-300">{carrierDetails.pk}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">USSD Channel:</span>
                    <span className="text-amber-300 font-bold">{carrierDetails.channel}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Amount Collected:</span>
                    <span className="text-white font-bold">
                      {calculatedCfa.toLocaleString()} XAF (${(calculatedCfa / cfaRate).toFixed(2)} USD)
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Official Receipt #:</span>
                    <span className="text-emerald-400 font-bold">#{completedReceipt.receiptNumber}</span>
                  </div>
                </div>

                {/* Signature Preview */}
                <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400 truncate">
                  <span className="text-stone-500">Signature: </span>
                  <code>{carrierDetails.signature}</code>
                </div>
              </div>

              {/* PDF Receipt Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => openReceiptPreview(completedReceipt)}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-amber-700" />
                  <span>Preview PDF Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadReceipt(completedReceipt)}
                  className="py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF (#{completedReceipt.receiptNumber})</span>
                </button>
              </div>

              {/* Reset / Make Another */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setCompletedReceipt(null);
                  }}
                  className="text-stone-600 hover:text-stone-900 font-semibold"
                >
                  ← Make Another Mobile Money Collection
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ERROR SCREEN */}
          {step === 'ERROR' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-base">Payment Collection Failed</h4>
                <p className="text-xs text-rose-700 max-w-sm mx-auto">{errorMessage}</p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl"
                >
                  Retry Payment Collection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
