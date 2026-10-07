import React, { useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Cpu,
  Server,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  ExternalLink,
  Zap,
  Terminal,
  Activity,
  Copy,
  Check,
  Search,
  Sliders,
  Smartphone,
  CreditCard,
  Wallet,
  Building2,
  Coins,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { GatewayIdentifier, LandlordGatewayConfig, SupportedCurrency, GatewayApiConfig } from '../types';

export const SuperAdminDashboard: React.FC = () => {
  const {
    currentUser,
    activeRole,
    setActiveRole,
    canPerform,
    apiAuditLogs,
    isRateLimited,
    rateLimitRemaining,
    triggerRateLimitSim,
    resetRateLimit,
    showSecurityNotification,
  } = useSecurity();

  const {
    gateways,
    currencies,
    exchangeRates,
    updateExchangeRate,
    settlementCurrency,
    setSettlementCurrency,
    toggleGateway,
    updateGatewayApiConfig,
    updateGatewayDetails,
    resetGatewaysToDefault,
    rotateGatewayApiKey,
    testGatewayApiConnection,
    canEditApi,
  } = useCurrency();

  const [activeSubTab, setActiveSubTab] = useState<'gateways' | 'rates' | 'ratelimit' | 'audit'>('gateways');
  const [gatewayCategoryFilter, setGatewayCategoryFilter] = useState<'all' | 'cameroon' | 'global'>('all');
  const [selectedGatewayId, setSelectedGatewayId] = useState<GatewayIdentifier>('mtn_momo');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [testingPingId, setTestingPingId] = useState<string | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Modal editing form state (Comprehensive: General + API + Cameroon Parameters)
  const [modalTab, setModalTab] = useState<'cameroon' | 'api' | 'general'>('cameroon');
  const [modalName, setModalName] = useState('');
  const [modalPhpClass, setModalPhpClass] = useState('');
  const [modalCategory, setModalCategory] = useState<LandlordGatewayConfig['category']>('mobile_money');
  const [modalFeePercentage, setModalFeePercentage] = useState<number>(1.8);
  const [modalFeeFixedUSD, setModalFeeFixedUSD] = useState<number>(0.15);
  const [modalSettlementSpeed, setModalSettlementSpeed] = useState('Instant (USSD push)');
  const [modalDescription, setModalDescription] = useState('');
  const [modalActive, setModalActive] = useState(true);

  // API Config State
  const [modalEndpoint, setModalEndpoint] = useState('');
  const [modalEnvironment, setModalEnvironment] = useState<'production' | 'sandbox'>('production');
  const [modalWebhookUrl, setModalWebhookUrl] = useState('');
  const [modalWebhookSecret, setModalWebhookSecret] = useState('');
  const [modalPublicKey, setModalPublicKey] = useState('');

  // Cameroon Specific Parameters State
  const [modalIsCameroon, setModalIsCameroon] = useState(false);
  const [modalUssdCode, setModalUssdCode] = useState('');
  const [modalMerchantId, setModalMerchantId] = useState('');
  const [modalOperatorNetwork, setModalOperatorNetwork] = useState('');
  const [modalServiceProviderCode, setModalServiceProviderCode] = useState('');
  const [modalCameroonRegionCoverage, setModalCameroonRegionCoverage] = useState('');

  // Rate editing state
  const [tempRates, setTempRates] = useState<Record<SupportedCurrency, string>>({
    USD: '1.0',
    EUR: currencies.EUR.rateAgainstUSD.toString(),
    GBP: currencies.GBP.rateAgainstUSD.toString(),
    CFA: currencies.CFA.rateAgainstUSD.toString(),
  });

  const selectedGateway = gateways.find((g) => g.id === selectedGatewayId) || gateways[0];

  const handleOpenEditModal = (gateway: LandlordGatewayConfig) => {
    setSelectedGatewayId(gateway.id);
    const api = gateway.apiConfig;

    // General
    setModalName(gateway.name);
    setModalPhpClass(gateway.phpClass);
    setModalCategory(gateway.category);
    setModalFeePercentage(gateway.feePercentage);
    setModalFeeFixedUSD(gateway.feeFixedUSD);
    setModalSettlementSpeed(gateway.settlementSpeed);
    setModalDescription(gateway.description || '');
    setModalActive(gateway.active);

    // API
    setModalEndpoint(api?.endpointUrl || '');
    setModalEnvironment(api?.environment || 'production');
    setModalWebhookUrl(api?.webhookUrl || '');
    setModalWebhookSecret(api?.webhookSecretMasked || '');
    setModalPublicKey(api?.apiKeyPublic || '');

    // Cameroon
    const isCm = Boolean(gateway.isCameroonMethod);
    setModalIsCameroon(isCm);
    setModalUssdCode(gateway.cameroonUssd || api?.ussdCode || '');
    setModalMerchantId(api?.merchantId || '');
    setModalOperatorNetwork(api?.operatorNetwork || '');
    setModalServiceProviderCode(api?.serviceProviderCode || '');
    setModalCameroonRegionCoverage(
      api?.cameroonRegionCoverage || 'All 10 Regions: Centre, Littoral, West, North-West, South-West, North, Far-North, Adamawa, East, South'
    );

    // Default to Cameroon tab if it's a Cameroon method
    setModalTab(isCm ? 'cameroon' : 'api');
    setIsEditingModalOpen(true);
  };

  const handleSaveModalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditApi) {
      showSecurityNotification('403 Forbidden: Only Super Admin can edit API configurations.');
      return;
    }

    const res = updateGatewayDetails(selectedGatewayId, {
      name: modalName,
      phpClass: modalPhpClass,
      category: modalCategory,
      feePercentage: Number(modalFeePercentage),
      feeFixedUSD: Number(modalFeeFixedUSD),
      settlementSpeed: modalSettlementSpeed,
      description: modalDescription,
      active: modalActive,
      isCameroonMethod: modalIsCameroon,
      cameroonUssd: modalUssdCode,
      apiConfig: {
        ...(selectedGateway?.apiConfig || {
          lastRotated: 'Recently',
          lastPingMs: 38,
          status: 'connected',
          apiKeySecretMasked: 'sec_live_••••••••••••••••',
        }),
        endpointUrl: modalEndpoint,
        environment: modalEnvironment,
        webhookUrl: modalWebhookUrl,
        webhookSecretMasked: modalWebhookSecret,
        apiKeyPublic: modalPublicKey,
        merchantId: modalMerchantId,
        ussdCode: modalUssdCode,
        operatorNetwork: modalOperatorNetwork,
        serviceProviderCode: modalServiceProviderCode,
        cameroonRegionCoverage: modalCameroonRegionCoverage,
      },
    });

    if (res.success) {
      setIsEditingModalOpen(false);
    }
  };

  const handleApplyCameroonPreset = (type: 'mtn' | 'orange' | 'eu' | 'gimac' | 'bank') => {
    if (type === 'mtn') {
      setModalName('MTN Mobile Money Cameroon');
      setModalPhpClass('MTNMomoGateway.php');
      setModalCategory('mobile_money');
      setModalFeePercentage(1.8);
      setModalSettlementSpeed('Instant (USSD push)');
      setModalIsCameroon(true);
      setModalUssdCode('*126#');
      setModalMerchantId('MOMO-MERCH-882103');
      setModalOperatorNetwork('MTN Cameroon / Mobile Money Corporation');
      setModalServiceProviderCode('MTN-CM-MOMO-COLLECT');
      setModalEndpoint('https://proxy.momoapi.mtn.com/collection/v1_0');
      setModalWebhookUrl('https://api.sunriseholdings.com/v1/webhooks/mtn-momo');
    } else if (type === 'orange') {
      setModalName('Orange Money Cameroun');
      setModalPhpClass('OrangeMoneyGateway.php');
      setModalCategory('mobile_money');
      setModalFeePercentage(1.9);
      setModalSettlementSpeed('Instant (STK push)');
      setModalIsCameroon(true);
      setModalUssdCode('#150#');
      setModalMerchantId('OM-MERCH-CM-44019');
      setModalOperatorNetwork('Orange Cameroun SA');
      setModalServiceProviderCode('OM-CM-ORANGE-CASH');
      setModalEndpoint('https://api.orange.cm/orange-money-webpay/cm/v1');
      setModalWebhookUrl('https://api.sunriseholdings.com/v1/webhooks/orange-money');
    } else if (type === 'eu') {
      setModalName('Express Union Mobile Money');
      setModalPhpClass('ExpressUnionGateway.php');
      setModalCategory('mobile_money');
      setModalFeePercentage(1.5);
      setModalSettlementSpeed('Real-Time (< 60s)');
      setModalIsCameroon(true);
      setModalUssdCode('*050#');
      setModalMerchantId('EU-AGENCY-YAOUNDE-002');
      setModalOperatorNetwork('Express Union Finance SA');
      setModalServiceProviderCode('EU-CM-EXPRESS-UNION');
      setModalEndpoint('https://api.expressunion.net/v2/payment/collect');
      setModalWebhookUrl('https://api.sunriseholdings.com/v1/webhooks/express-union');
    } else if (type === 'gimac') {
      setModalName('GIMAC Pay (Central Africa)');
      setModalPhpClass('GimacPayGateway.php');
      setModalCategory('bank_transfer');
      setModalFeePercentage(1.2);
      setModalSettlementSpeed('Real-Time CEMAC Switch');
      setModalIsCameroon(true);
      setModalUssdCode('CEMAC-SWITCH');
      setModalMerchantId('GIMAC-CEMAC-BANK-99120');
      setModalOperatorNetwork('GIMAC BEAC (Regional Switch)');
      setModalServiceProviderCode('GIMAC-CEMAC-SWITCH');
      setModalEndpoint('https://switch.gimac-pay.org/api/v1/settle');
      setModalWebhookUrl('https://api.sunriseholdings.com/v1/webhooks/gimac');
    } else if (type === 'bank') {
      setModalName('Afriland First Bank (Sara Money)');
      setModalPhpClass('AfrilandSaraGateway.php');
      setModalCategory('bank_transfer');
      setModalFeePercentage(1.0);
      setModalSettlementSpeed('Instant Account Debit');
      setModalIsCameroon(true);
      setModalUssdCode('*158#');
      setModalMerchantId('RIB: 10005-02100-01234567890-44');
      setModalOperatorNetwork('Afriland First Bank Cameroon');
      setModalServiceProviderCode('AFB-CM-SARA-MONEY');
      setModalEndpoint('https://api.afrilandfirstbank.com/sara/v1/collect');
      setModalWebhookUrl('https://api.sunriseholdings.com/v1/webhooks/afriland');
    }
  };

  const handleRotateKey = (id: GatewayIdentifier) => {
    rotateGatewayApiKey(id);
  };

  const handleTestPing = async (id: GatewayIdentifier) => {
    setTestingPingId(id);
    await testGatewayApiConnection(id);
    setTestingPingId(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleSaveExchangeRate = (cur: SupportedCurrency) => {
    const val = parseFloat(tempRates[cur]);
    if (isNaN(val) || val <= 0) {
      showSecurityNotification('Invalid rate. Must be a positive number.');
      return;
    }
    updateExchangeRate(cur, val);
  };

  // If user is not super_admin, show clear access control barrier
  if (!canEditApi) {
    return (
      <div className="space-y-6">
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <Lock className="w-8 h-8 text-rose-700" />
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-200 text-rose-900 mb-3">
            HTTP 403 Forbidden · Access Denied
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Super Admin API Control Dashboard Only
          </h2>
          <p className="text-sm text-stone-600 mt-2 max-w-lg mx-auto leading-relaxed">
            API endpoints, live secrets, cryptographic key rotation, and gateway routing configurations are
            restricted strictly to the <span className="font-bold text-stone-900">Super Admin</span> role.
          </p>

          <div className="mt-6 p-4 bg-white rounded-xl border border-rose-200 text-left text-xs text-stone-600 max-w-md mx-auto space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold text-stone-800">Current Session User:</span>
              <span className="font-mono">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-stone-800">Active Role Context:</span>
              <span className="font-mono px-1.5 py-0.5 rounded bg-stone-100 text-rose-700 font-bold uppercase">
                {activeRole}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-stone-800">Required Privilege:</span>
              <span className="font-mono text-emerald-700 font-bold">super_admin</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveRole('super_admin')}
              id="switch-to-super-admin-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>Switch to Super Admin Context</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredGateways = gateways.filter((g) => {
    // Category filter
    if (gatewayCategoryFilter === 'cameroon' && !g.isCameroonMethod) return false;
    if (gatewayCategoryFilter === 'global' && g.isCameroonMethod) return false;

    const query = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(query) ||
      g.phpClass.toLowerCase().includes(query) ||
      g.category.toLowerCase().includes(query) ||
      (g.cameroonUssd && g.cameroonUssd.toLowerCase().includes(query)) ||
      (g.apiConfig?.merchantId && g.apiConfig.merchantId.toLowerCase().includes(query)) ||
      (g.apiConfig?.operatorNetwork && g.apiConfig.operatorNetwork.toLowerCase().includes(query))
    );
  });

  const cameroonCount = gateways.filter((g) => g.isCameroonMethod).length;
  const globalCount = gateways.filter((g) => !g.isCameroonMethod).length;

  return (
    <div className="space-y-6">
      {/* Top Authoritative Console Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 shadow-xl border border-stone-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 bg-rose-600/90 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-rose-400/30">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">Super Admin API Infrastructure Console</h1>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <KeyRound className="w-3 h-3 text-rose-400" />
                  <span>Exclusive Authority</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>10/10 APIs Operational</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-3xl leading-relaxed">
                Primary control plane for editing payment gateway API credentials, live endpoint webhooks,
                cryptographic HMAC rotation, multi-currency routing matrices, and API rate-limiting token buckets.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-stone-800/80 px-4 py-2.5 rounded-xl border border-stone-700/80 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Authenticated Actor</div>
              <div className="font-semibold text-white">{currentUser.name}</div>
            </div>
            <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
              SUPER_ADMIN
            </span>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center space-x-1 mt-6 border-t border-stone-700/60 pt-4 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('gateways')}
            id="super-tab-gateways"
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'gateways'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Gateway APIs ({gateways.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('rates')}
            id="super-tab-rates"
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'rates'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Exchange Rates API</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ratelimit')}
            id="super-tab-ratelimit"
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'ratelimit'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Token Bucket & Rate Limits</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            id="super-tab-audit"
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'audit'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API Mutation Audit Log ({apiAuditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: GATEWAY APIS */}
      {activeSubTab === 'gateways' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search API, USSD (*126#), switch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setGatewayCategoryFilter('all')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    gatewayCategoryFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({gateways.length})
                </button>
                <button
                  onClick={() => setGatewayCategoryFilter('cameroon')}
                  className={`px-3 py-1 rounded-md font-bold flex items-center space-x-1.5 transition-colors ${
                    gatewayCategoryFilter === 'cameroon'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-100/60'
                  }`}
                >
                  <span>🇨🇲 Cameroon Gateways ({cameroonCount})</span>
                </button>
                <button
                  onClick={() => setGatewayCategoryFilter('global')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    gatewayCategoryFilter === 'global'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Global & Cards ({globalCount})
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-stone-500 hidden sm:inline">
                <strong className="text-stone-800">{filteredGateways.length}</strong> gateways shown
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Reset all gateway configurations and Cameroon methods to default presets?')) {
                    resetGatewaysToDefault();
                  }
                }}
                className="inline-flex items-center space-x-1 text-stone-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:border-rose-300 bg-stone-50 hover:bg-rose-50 transition-colors font-medium text-xs"
                title="Reset all payment gateways including Cameroon methods to factory defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Presets</span>
              </button>
            </div>
          </div>

          {/* Grid of Gateway API Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGateways.map((g) => {
              const api = g.apiConfig;
              const isTesting = testingPingId === g.id;

              return (
                <div
                  key={g.id}
                  className={`bg-white rounded-xl border p-5 shadow-2xs hover:border-stone-400 transition-all flex flex-col justify-between ${
                    g.isCameroonMethod ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white' : 'border-stone-200'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                          g.isCameroonMethod
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}>
                          {g.category === 'mobile_money' ? (
                            <Smartphone className="w-5 h-5 text-amber-700" />
                          ) : g.category === 'card' ? (
                            <CreditCard className="w-5 h-5 text-blue-700" />
                          ) : g.category === 'digital_wallet' ? (
                            <Wallet className="w-5 h-5 text-emerald-700" />
                          ) : (
                            <Building2 className="w-5 h-5 text-stone-700" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-sm text-stone-900">{g.name}</h3>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                api?.environment === 'production'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {api?.environment || 'PROD'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-stone-500">{g.phpClass}</div>
                        </div>
                      </div>

                      {/* On/Off Switch */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-stone-500">
                          {g.active ? 'ACTIVE' : 'OFF'}
                        </span>
                        <button
                          onClick={() => toggleGateway(g.id)}
                          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            g.active ? 'bg-rose-600' : 'bg-stone-300'
                          }`}
                          role="switch"
                          aria-checked={g.active}
                          title="Toggle Gateway API"
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              g.active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Cameroon Highlight Tag */}
                    {g.isCameroonMethod && (
                      <div className="mt-3 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <span>🇨🇲 Cameroon Payment Method</span>
                          </span>
                          {g.cameroonUssd && (
                            <button
                              onClick={() => handleCopy(g.cameroonUssd || '', `ussd-${g.id}`)}
                              className="font-mono text-[11px] font-extrabold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors"
                              title="Click to copy USSD shortcut"
                            >
                              USSD: {g.cameroonUssd} {copiedKeyId === `ussd-${g.id}` ? '✓' : ''}
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-100">
                          <div>
                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
                              Switch / Operator:
                            </span>
                            <span className="font-semibold text-stone-800 truncate block">
                              {api?.operatorNetwork || 'Cameroon Telecomm / CEMAC'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
                              Merchant ID / RIB:
                            </span>
                            <span className="font-mono text-stone-700 truncate block">
                              {api?.merchantId || 'CM-MERCHANT-01'}
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-emerald-100">
                          <span>Fee: <strong>{g.feePercentage}% + ${g.feeFixedUSD}</strong></span>
                          <span>Settlement: <strong>{g.settlementSpeed}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* API Details Panel */}
                    <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                          Endpoint URL
                        </span>
                        <span className="font-mono text-stone-800 break-all text-[11px]">
                          {api?.endpointUrl || 'https://api.gateway.com/v1'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                        <div>
                          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                            Public Client ID
                          </span>
                          <span className="font-mono text-stone-700 text-[11px] truncate block">
                            {api?.apiKeyPublic || 'pub_client_000'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                            Live Latency
                          </span>
                          <span className="font-mono text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{api?.lastPingMs || 40} ms (200 OK)</span>
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-stone-200">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                          Masked API Secret
                        </span>
                        <div className="flex items-center justify-between font-mono text-[11px] text-stone-600 mt-0.5">
                          <span>{api?.apiKeySecretMasked || 'sec_live_••••••••••••••••'}</span>
                          <button
                            onClick={() => handleCopy(api?.apiKeySecretMasked || '', g.id)}
                            className="text-stone-400 hover:text-stone-600 p-0.5"
                            title="Copy masked key"
                          >
                            {copiedKeyId === g.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-stone-200">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                          Webhook Listener
                        </span>
                        <span className="font-mono text-stone-600 text-[10px] truncate block">
                          {api?.webhookUrl || 'https://api.sunriseholdings.com/v1/webhooks'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs gap-2">
                    <button
                      onClick={() => handleTestPing(g.id)}
                      disabled={isTesting}
                      className="inline-flex items-center space-x-1 text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Pinging...' : 'Ping Test'}</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRotateKey(g.id)}
                        className="inline-flex items-center space-x-1 text-rose-700 hover:text-rose-800 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 transition-colors font-medium"
                        title="Generate new cryptographic API secret"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Rotate Secret</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(g)}
                        id={`edit-api-btn-${g.id}`}
                        className={`inline-flex items-center space-x-1 text-white px-3 py-1 rounded-lg transition-colors font-semibold shadow-2xs ${
                          g.isCameroonMethod
                            ? 'bg-emerald-800 hover:bg-emerald-900'
                            : 'bg-stone-900 hover:bg-black'
                        }`}
                      >
                        <Sliders className="w-3 h-3" />
                        <span>{g.isCameroonMethod ? 'Edit Cameroon API' : 'Edit Gateway API'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: EXCHANGE RATES API */}
      {activeSubTab === 'rates' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Exchange Rates API Engine</h2>
              <p className="text-xs text-stone-500 mt-1">
                Configure platform baseline exchange rates against base USD ($1.00). Only Super Admin can adjust
                valuation rates. All changes immediately propagate to payment routing calculations and currency conversions.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-stone-400 block">Settlement Currency</span>
              <select
                value={settlementCurrency}
                onChange={(e) => setSettlementCurrency(e.target.value as SupportedCurrency)}
                className="mt-1 text-xs font-bold rounded-lg border border-stone-300 px-2.5 py-1 bg-stone-50"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CFA">CFA (FCFA - CFA Franc)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((cur) => {
              const conf = currencies[cur];
              const isBase = cur === 'USD';

              return (
                <div key={cur} className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{conf.flag}</span>
                      <div>
                        <div className="font-bold text-sm text-stone-900">{cur}</div>
                        <div className="text-[10px] text-stone-500">{conf.name}</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-stone-600">{conf.symbol}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Rate against 1 USD ($)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="any"
                        disabled={isBase}
                        value={isBase ? '1.0' : tempRates[cur]}
                        onChange={(e) =>
                          setTempRates({ ...tempRates, [cur]: e.target.value })
                        }
                        className={`w-full text-xs font-mono px-3 py-1.5 rounded-lg border ${
                          isBase
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200'
                            : 'bg-white text-stone-900 border-stone-300 focus:ring-2 focus:ring-rose-500'
                        }`}
                      />
                      {!isBase && (
                        <button
                          onClick={() => handleSaveExchangeRate(cur)}
                          className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-stone-500 pt-1 border-t border-stone-200">
                    Sample: $1,000 USD ={' '}
                    <span className="font-bold text-stone-800">
                      {(1000 * conf.rateAgainstUSD).toLocaleString()}{' '}
                      {conf.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: RATE LIMITING & TOKEN BUCKET */}
      {activeSubTab === 'ratelimit' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">API Gateway Rate Limiting & Token Bucket</h2>
              <p className="text-xs text-stone-500 mt-1">
                Protect upstream services and prevent DDoS with token-bucket rate limiting enforced at the Nginx and API gateway layer.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                isRateLimited ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isRateLimited ? 'HTTP 429 TRIGGERED' : 'GATEWAY HEALTHY'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Token Bucket Capacity
              </span>
              <div className="text-2xl font-black text-stone-900 mt-1 font-mono">120 req / min</div>
              <p className="text-[11px] text-stone-500 mt-1">
                Replenishment: 2 tokens/sec. Burst capacity: 150 requests per IP address.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Current Tokens Remaining
              </span>
              <div
                className={`text-2xl font-black mt-1 font-mono ${
                  rateLimitRemaining < 20 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {rateLimitRemaining} / 120
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Active IP: 197.234.219.42 (Whitelisted CIDR block)
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Simulate Gateway Stress
                </span>
                <p className="text-[11px] text-stone-500 mt-1">
                  Test HTTP 429 response handling and client-side retry-after header parsing.
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={triggerRateLimitSim}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Exhaust Tokens (429)
                </button>
                <button
                  onClick={resetRateLimit}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition-colors"
                >
                  Reset Bucket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: AUDIT LOG */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Immutable API Mutation Audit Trail</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Every API credential rotation, endpoint update, and unauthorized attempt is cryptographically recorded.
            </p>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 uppercase font-mono text-[10px] border-b border-stone-200">
                <tr>
                  <th className="px-4 py-2.5">Timestamp (UTC)</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Target Service</th>
                  <th className="px-4 py-2.5">Details</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {apiAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-2.5 font-semibold text-stone-900 whitespace-nowrap">{log.actor}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-800 whitespace-nowrap">{log.targetService}</td>
                    <td className="px-4 py-2.5 text-stone-600 font-sans max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GATEWAY & CAMEROON API CONFIG */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-300 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  modalIsCameroon ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}>
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-stone-900">
                      Edit {modalName || selectedGateway.name}
                    </h3>
                    {modalIsCameroon && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        🇨🇲 Cameroon Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono">{modalPhpClass || selectedGateway.phpClass}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center space-x-1 border-b border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setModalTab('cameroon')}
                className={`px-3 py-2 font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  modalTab === 'cameroon'
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>🇨🇲 Cameroon Parameters</span>
                {modalIsCameroon && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalTab('api')}
                className={`px-3 py-2 font-bold border-b-2 transition-colors ${
                  modalTab === 'api'
                    ? 'border-rose-600 text-rose-800 bg-rose-50/50'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                API Endpoints & Keys
              </button>
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`px-3 py-2 font-bold border-b-2 transition-colors ${
                  modalTab === 'general'
                    ? 'border-amber-600 text-amber-800 bg-amber-50/50'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Fees & Gateway Config
              </button>
            </div>

            <form onSubmit={handleSaveModalConfig} className="space-y-4 text-xs">
              {/* TAB 1: CAMEROON CARRIER PARAMETERS */}
              {modalTab === 'cameroon' && (
                <div className="space-y-4">
                  {/* Quick Preset Buttons */}
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900">
                        ⚡ Quick Apply Cameroon Carrier Preset:
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Click to populate official parameters</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyCameroonPreset('mtn')}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        MTN MoMo (*126#)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCameroonPreset('orange')}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        Orange Money (#150#)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCameroonPreset('eu')}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        Express Union (*050#)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCameroonPreset('gimac')}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        GIMAC CEMAC Switch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCameroonPreset('bank')}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        Afriland Sara Money
                      </button>
                    </div>
                  </div>

                  {/* Cameroon Toggle */}
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div>
                      <span className="font-bold text-stone-800 block">Cameroon Official Payment Channel</span>
                      <span className="text-[11px] text-stone-500">
                        Enable to expose this method for FCFA rent collections across Cameroon
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalIsCameroon}
                        onChange={(e) => setModalIsCameroon(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Cameroon USSD Shortcode
                      </label>
                      <input
                        type="text"
                        value={modalUssdCode}
                        onChange={(e) => setModalUssdCode(e.target.value)}
                        placeholder="*126# or #150# or *050#"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        Direct customer dial code on phone
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Merchant ID / CEMAC RIB
                      </label>
                      <input
                        type="text"
                        value={modalMerchantId}
                        onChange={(e) => setModalMerchantId(e.target.value)}
                        placeholder="MOMO-MERCH-882103 or RIB CEMAC"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        Landlord billing identifier or CEMAC RIB
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Operator Network / Financial Switch
                      </label>
                      <input
                        type="text"
                        value={modalOperatorNetwork}
                        onChange={(e) => setModalOperatorNetwork(e.target.value)}
                        placeholder="MTN Cameroon / GIMAC BEAC"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Service Provider Code
                      </label>
                      <input
                        type="text"
                        value={modalServiceProviderCode}
                        onChange={(e) => setModalServiceProviderCode(e.target.value)}
                        placeholder="MTN-CM-MOMO-COLLECT"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Cameroon Regional Coverage
                    </label>
                    <input
                      type="text"
                      value={modalCameroonRegionCoverage}
                      onChange={(e) => setModalCameroonRegionCoverage(e.target.value)}
                      placeholder="All 10 Regions: Centre, Littoral, West, North-West, South-West..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: API ENDPOINTS & KEYS */}
              {modalTab === 'api' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      Super Admin Notice: Changes to endpoints, public keys, or webhook ingress apply immediately across all landlord payment sessions.
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      API Endpoint URL
                    </label>
                    <input
                      type="url"
                      required
                      value={modalEndpoint}
                      onChange={(e) => setModalEndpoint(e.target.value)}
                      placeholder="https://api.gateway.com/v1/payments"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Environment
                      </label>
                      <select
                        value={modalEnvironment}
                        onChange={(e) => setModalEnvironment(e.target.value as 'production' | 'sandbox')}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs bg-stone-50"
                      >
                        <option value="production">Production (Live CEMAC / Global)</option>
                        <option value="sandbox">Sandbox / Testnet</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Public API Client Key
                      </label>
                      <input
                        type="text"
                        value={modalPublicKey}
                        onChange={(e) => setModalPublicKey(e.target.value)}
                        placeholder="client_pub_xxxx"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Webhook Ingress URL
                    </label>
                    <input
                      type="url"
                      required
                      value={modalWebhookUrl}
                      onChange={(e) => setModalWebhookUrl(e.target.value)}
                      placeholder="https://api.sunriseholdings.com/v1/webhooks/gateway"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Webhook Secret (HMAC Signature Salt)
                    </label>
                    <input
                      type="text"
                      value={modalWebhookSecret}
                      onChange={(e) => setModalWebhookSecret(e.target.value)}
                      placeholder="whsec_xxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                    <span className="text-[11px] text-stone-500">Security Actions:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTestPing(selectedGatewayId)}
                        disabled={testingPingId === selectedGatewayId}
                        className="px-2.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium inline-flex items-center space-x-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${testingPingId === selectedGatewayId ? 'animate-spin' : ''}`} />
                        <span>Ping Endpoint</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateKey(selectedGatewayId)}
                        className="px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium inline-flex items-center space-x-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Rotate Secret Key</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GENERAL & FEES */}
              {modalTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Gateway Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={modalName}
                        onChange={(e) => setModalName(e.target.value)}
                        placeholder="MTN Mobile Money Cameroon"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        PHP Backend Adapter Class
                      </label>
                      <input
                        type="text"
                        required
                        value={modalPhpClass}
                        onChange={(e) => setModalPhpClass(e.target.value)}
                        placeholder="MTNMomoGateway.php"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Category
                      </label>
                      <select
                        value={modalCategory}
                        onChange={(e) => setModalCategory(e.target.value as LandlordGatewayConfig['category'])}
                        className="w-full px-2.5 py-2 rounded-lg border border-stone-300 text-xs bg-stone-50"
                      >
                        <option value="mobile_money">Mobile Money</option>
                        <option value="bank_transfer">Bank Transfer / CEMAC</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="digital_wallet">Digital Wallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Fee Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        required
                        value={modalFeePercentage}
                        onChange={(e) => setModalFeePercentage(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Fixed Fee (USD / $0.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={modalFeeFixedUSD}
                        onChange={(e) => setModalFeeFixedUSD(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Settlement Speed SLA
                    </label>
                    <input
                      type="text"
                      value={modalSettlementSpeed}
                      onChange={(e) => setModalSettlementSpeed(e.target.value)}
                      placeholder="Instant (USSD push), Real-Time (< 60s), T+1 Payout"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Internal Routing Notes / Description
                    </label>
                    <textarea
                      rows={2}
                      value={modalDescription}
                      onChange={(e) => setModalDescription(e.target.value)}
                      placeholder="Notes for landlord payment router and settlement reconciliation..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div>
                      <span className="font-bold text-stone-800 block">Gateway Active Status</span>
                      <span className="text-[11px] text-stone-500">
                        When enabled, the payment router can route tenant rent payments through this method
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalActive}
                        onChange={(e) => setModalActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                <span className="text-[10px] text-stone-400">
                  Target ID: <code className="font-mono">{selectedGatewayId}</code>
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="save-api-config-modal-btn"
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-sm transition-colors inline-flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save All Gateway & API Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
