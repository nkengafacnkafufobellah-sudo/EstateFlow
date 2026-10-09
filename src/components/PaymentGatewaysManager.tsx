import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Globe,
  Building2,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  DollarSign,
  Coins,
  Settings,
  Check,
  X,
  Play,
  Layers,
  FileCode2,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useSecurity } from '../context/SecurityContext';
import {
  SupportedCurrency,
  GatewayIdentifier,
  LandlordGatewayConfig,
  PaymentRoutingResult,
} from '../types';
import { MobileMoneyPaymentModal } from './MobileMoneyPaymentModal';
import { MesombPluginManagerModal } from './MesombPluginManagerModal';
import { DEFAULT_MESOMB_PLUGIN_CONFIG } from '../utils/mesombGatewayUtils';

export const PaymentGatewaysManager: React.FC = () => {
  const {
    activeCurrency,
    setActiveCurrency,
    currencies,
    exchangeRates,
    updateExchangeRate,
    settlementCurrency,
    setSettlementCurrency,
    formatAmount,
    convertAmount,
    gateways,
    toggleGateway,
    setAllGatewaysForCurrency,
    getActivatedGatewaysForCurrency,
    simulateRoutePayment,
    mesombPluginConfig,
    updateMesombPluginConfig,
  } = useCurrency();

  const {
    canPerform,
    activeRole,
    showSecurityNotification,
    isPaymentMfaEnforced,
    openMfaChallenge,
    currentUser,
  } = useSecurity();

  // STRICT REQUIREMENT: Only Admin and Super Admin can manage MeSomb plugin settings
  const isAdminOrSuperAdmin = activeRole === 'super_admin' || activeRole === 'admin';

  // Mobile Money Interactive Modal State (MTN MoMo & Orange Money)
  const [mobileMoneyModalOpen, setMobileMoneyModalOpen] = useState(false);
  const [mobileMoneyTargetGateway, setMobileMoneyTargetGateway] = useState<'mtn_momo' | 'orange_money' | 'mesomb'>('mtn_momo');

  // MeSomb Plugin Management Configuration Modal State
  const [mesombPluginModalOpen, setMesombPluginModalOpen] = useState(false);

  // Filter gateways by currency
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<'ALL' | SupportedCurrency>('ALL');
  const [editingRateCurrency, setEditingRateCurrency] = useState<SupportedCurrency | null>(null);
  const [tempRate, setTempRate] = useState<string>('');

  // Payment Router Simulator state
  const [simCurrency, setSimCurrency] = useState<SupportedCurrency>('CFA');
  const [simAmount, setSimAmount] = useState<number>(877250); // ~1,450 USD in CFA
  const [simTenant, setSimTenant] = useState<string>('Jordan Avery (Unit 4B, Oak Residence)');
  const [simPreferredGateway, setSimPreferredGateway] = useState<string>('auto');
  const [simulationResult, setSimulationResult] = useState<PaymentRoutingResult | null>(null);

  // When currency changes in simulator, adapt default amount
  const handleSimCurrencyChange = (newCur: SupportedCurrency) => {
    setSimCurrency(newCur);
    if (newCur === 'CFA') setSimAmount(877250);
    else if (newCur === 'EUR') setSimAmount(1334);
    else if (newCur === 'GBP') setSimAmount(1131);
    else setSimAmount(1450);
    setSimulationResult(null);
  };

  const handleRunSimulation = () => {
    const preferred = simPreferredGateway === 'auto' ? undefined : (simPreferredGateway as GatewayIdentifier);
    const result = simulateRoutePayment(simAmount, simCurrency, preferred);
    setSimulationResult(result);
    if (result.allowed) {
      showSecurityNotification(
        `[PaymentRouter.php] Dispatched ${simAmount.toLocaleString()} ${simCurrency} to ${result.gateway?.name} (${result.gateway?.phpClass}).`
      );
    } else {
      showSecurityNotification(`[PaymentRouter.php] Route failed: ${result.reason}`);
    }
  };

  const handleToggleGateway = (gw: LandlordGatewayConfig) => {
    if (!canPerform('finance.refund') && activeRole === 'tenant') {
      showSecurityNotification('Security Alert: Tenant role cannot modify organization payment gateway settings.');
      return;
    }
    toggleGateway(gw.id);
    showSecurityNotification(
      `Landlord Settings: ${gw.name} (${gw.phpClass}) is now ${!gw.active ? 'ACTIVATED (ON)' : 'DEACTIVATED (OFF)'}.`
    );
  };

  const handleSaveRate = (cur: SupportedCurrency) => {
    if (activeRole !== 'super_admin') {
      showSecurityNotification('403 Forbidden: API configurations and exchange rates can only be edited via the Super Admin Dashboard.');
      setEditingRateCurrency(null);
      return;
    }
    const val = parseFloat(tempRate);
    if (!isNaN(val) && val > 0) {
      updateExchangeRate(cur, val);
      showSecurityNotification(`Updated exchange rate: 1 USD = ${val} ${cur}.`);
      setEditingRateCurrency(null);
    }
  };

  const filteredGateways = gateways.filter((g) => {
    if (selectedCurrencyFilter === 'ALL') return true;
    return g.supportedCurrencies.includes(selectedCurrencyFilter);
  });

  const getGatewayIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-amber-700" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-indigo-700" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-700" />;
      case 'Wallet':
        return <Wallet className="w-5 h-5 text-sky-700" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-emerald-700" />;
      default:
        return <Coins className="w-5 h-5 text-stone-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Multi-Currency & Payment Gateway Architecture Overview */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                <Coins className="w-5 h-5 text-amber-800" />
              </span>
              <h2 className="text-xl font-bold text-stone-900">
                Multi-Currency Payment Gateways & Router
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-3xl">
              Framework-compliant Payment Gateway Architecture (Page 5) supporting <strong>Euro (€)</strong>, <strong>USD ($)</strong>, <strong>Pounds (£)</strong>, and <strong>CFA (FCFA)</strong>. The landlord activates specific gateways, and the payment router dispatches transactions exclusively through enabled methods.
            </p>
          </div>

          {/* Primary Settlement Currency Selector */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center space-x-3 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Landlord Settlement Currency
              </div>
              <div className="font-semibold text-stone-800 mt-0.5">
                Payout Account: {currencies[settlementCurrency].name}
              </div>
            </div>
            <select
              value={settlementCurrency}
              onChange={(e) => {
                const c = e.target.value as SupportedCurrency;
                setSettlementCurrency(c);
                showSecurityNotification(`Landlord primary settlement account changed to ${c}.`);
              }}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CFA">CFA (FCFA)</option>
            </select>
          </div>
        </div>

        {/* 4 Currency Tiles: Euro, USD, Pounds, CFA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((cur) => {
            const conf = currencies[cur];
            const activeCount = getActivatedGatewaysForCurrency(cur).length;
            const isSelected = activeCurrency === cur;

            return (
              <div
                key={cur}
                onClick={() => {
                  setActiveCurrency(cur);
                  showSecurityNotification(`Global app display currency switched to ${conf.name} (${conf.symbol}).`);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
                    : 'bg-stone-50/50 border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{conf.flag}</span>
                    <div>
                      <div className="font-extrabold text-stone-900 text-sm">{cur}</div>
                      <div className="text-[10px] text-stone-500">{conf.name}</div>
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-stone-800">
                    {conf.symbol}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-stone-400">Exchange Rate: </span>
                    {editingRateCurrency === cur ? (
                      <div className="flex items-center space-x-1 mt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.01"
                          value={tempRate}
                          onChange={(e) => setTempRate(e.target.value)}
                          className="w-16 px-1.5 py-0.5 bg-white border border-stone-300 rounded text-xs font-mono"
                        />
                        <button
                          onClick={() => handleSaveRate(cur)}
                          className="p-1 bg-amber-700 text-white rounded text-[10px]"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeRole !== 'super_admin') {
                            showSecurityNotification('403 Forbidden: API configurations and exchange rates can only be edited via the Super Admin Dashboard.');
                            return;
                          }
                          setEditingRateCurrency(cur);
                          setTempRate(conf.rateAgainstUSD.toString());
                        }}
                        className="font-mono font-semibold text-stone-700 hover:underline cursor-pointer"
                        title={activeRole === 'super_admin' ? "Click to edit rate" : "Restricted to Super Admin Dashboard"}
                      >
                        1 USD = {conf.rateAgainstUSD} {cur}
                      </span>
                    )}
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {activeCount} active
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cameroon Mobile Money Gateway Action Terminal */}
        <div className="pt-3 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 rounded-xl border border-amber-300/60">
          <div className="flex items-start sm:items-center space-x-3">
            <span className="p-2 bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-xs">
              🇨🇲
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-stone-900 text-sm">
                  Mobile Money Gateway Terminal (MeSomb Live API)
                </span>
                <span className="text-[10px] bg-yellow-400 text-stone-900 px-1.5 py-0.2 rounded font-bold">
                  MTN *126#
                </span>
                <span className="text-[10px] bg-[#FF7900] text-white px-1.5 py-0.2 rounded font-bold">
                  Orange #150#
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Execute real-time USSD push requests, simulate carrier PIN authorization, and auto-settle directly to the rent ledger.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setMobileMoneyTargetGateway('mtn_momo');
                setMobileMoneyModalOpen(true);
              }}
              className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Use MTN MoMo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMoneyTargetGateway('orange_money');
                setMobileMoneyModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#FF7900] hover:bg-[#e06b00] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Use Orange Money</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isAdminOrSuperAdmin) {
                  showSecurityNotification(`403 Forbidden: Setting normal presets requires Admin or Super Admin role. Current role: ${activeRole}`);
                  return;
                }
                const res = updateMesombPluginConfig(DEFAULT_MESOMB_PLUGIN_CONFIG);
                if (res.success) {
                  showSecurityNotification('MeSomb Plugin settings set to official WooCommerce normal settings.');
                }
              }}
              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center space-x-1.5 transition-colors ${
                isAdminOrSuperAdmin
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border-amber-300 cursor-pointer'
                  : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-75'
              }`}
              title={isAdminOrSuperAdmin ? "Set to official WooCommerce MeSomb normal settings" : `Restricted: Admin & Super Admin Only (Current: ${activeRole})`}
            >
              {isAdminOrSuperAdmin ? <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> : <Lock className="w-3.5 h-3.5 text-stone-400" />}
              <span>Set Normal Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setMesombPluginModalOpen(true)}
              className="px-3.5 py-2 bg-stone-950 hover:bg-stone-850 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors border border-stone-800 cursor-pointer"
              title={isAdminOrSuperAdmin ? "Manage and edit MeSomb Plugin configuration" : `MeSomb Plugin Management (Read-Only for ${activeRole})`}
            >
              {isAdminOrSuperAdmin ? <Settings className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isAdminOrSuperAdmin ? 'MeSomb Plugin Settings' : 'MeSomb Plugin (Admin Only)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column: Landlord Gateway Activation List on Left, Interactive Payment Router on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Landlord Gateway Activation Console (Page 5) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Landlord Gateway Activation Console
                </h3>
                <p className="text-xs text-stone-500">
                  Select which payment methods are active. The payment router dispatches only to active gateways.
                </p>
              </div>

              {/* Currency Filter Chips */}
              <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg text-xs">
                {(['ALL', 'USD', 'EUR', 'GBP', 'CFA'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedCurrencyFilter(filter)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                      selectedCurrencyFilter === filter
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-500 font-medium text-[11px]">Quick Activation:</span>
              <button
                onClick={() => setAllGatewaysForCurrency('CFA', true)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
              >
                Enable All CFA (MoMo, OM, CamerPay, ElyonPay)
              </button>
              <button
                onClick={() => setAllGatewaysForCurrency('EUR', true)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold border border-blue-200 transition-colors"
              >
                Enable All Euro (SEPA, Visa, PayPal)
              </button>
            </div>

            {/* 10 Gateways from Page 5 */}
            <div className="space-y-3 mt-2">
              {filteredGateways.map((gw) => (
                <div
                  key={gw.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    gw.active
                      ? 'bg-white border-stone-200 hover:border-amber-300'
                      : 'bg-stone-50/70 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-stone-100 rounded-xl flex-shrink-0">
                      {getGatewayIcon(gw.iconName)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{gw.name}</span>
                        <code className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                          {gw.phpClass}
                        </code>
                        {gw.isCameroonMethod && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            🇨🇲 Cameroon
                          </span>
                        )}
                        {gw.cameroonUssd && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200">
                            USSD: {gw.cameroonUssd}
                          </span>
                        )}
                        {gw.badge && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.2 rounded-full border border-amber-200">
                            {gw.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 leading-snug">{gw.description}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {gw.supportedCurrencies.map((c) => (
                          <span
                            key={c}
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              c === 'CFA'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : c === 'EUR'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : c === 'GBP'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {currencies[c].flag} {c}
                          </span>
                        ))}
                        <span className="text-[10px] text-stone-400">
                          • Fee: {gw.feePercentage}%
                          {gw.feeFixedUSD > 0 && ` + $${gw.feeFixedUSD}`}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          • {gw.settlementSpeed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Landlord ON / OFF Switch & Live Action (Page 5) */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {(gw.id === 'mtn_momo' || gw.id === 'orange_money' || gw.id === 'mesomb') && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMoneyTargetGateway(gw.id as any);
                            setMobileMoneyModalOpen(true);
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center space-x-1 transition-colors ${
                            gw.id === 'orange_money'
                              ? 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                          title={`Execute payment collection with ${gw.name}`}
                        >
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>Use Gateway</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMesombPluginModalOpen(true)}
                          className="px-2 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center space-x-1 border border-stone-200 transition-colors"
                          title={isAdminOrSuperAdmin ? "Edit MeSomb Plugin Settings & API Credentials" : `MeSomb Plugin Settings (Read-Only for ${activeRole})`}
                        >
                          {isAdminOrSuperAdmin ? (
                            <Settings className="w-3 h-3 text-stone-500" />
                          ) : (
                            <Lock className="w-3 h-3 text-stone-400" />
                          )}
                          <span>Plugin Config</span>
                        </button>
                      </div>
                    )}

                    <span className="text-xs font-mono font-bold text-stone-700">
                      {gw.active ? 'ACTIVE' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleGateway(gw)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        gw.active ? 'bg-amber-700' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          gw.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MeSomb Extension & Plugin Hub Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 shadow-sm border border-stone-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{mesombPluginConfig.pluginName}</h4>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                      v{mesombPluginConfig.pluginVersion}
                    </span>
                    {isAdminOrSuperAdmin ? (
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                        <span>Admin Access</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-rose-400 inline" />
                        <span>Restricted ({activeRole})</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">
                    Driver: {mesombPluginConfig.phpClass} · {mesombPluginConfig.environment === 'production' ? 'Live Production' : 'Sandbox Testing'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdminOrSuperAdmin) {
                      showSecurityNotification(`403 Forbidden: Only Admin and Super Admin can reset MeSomb plugin presets. Current role: ${activeRole}`);
                      return;
                    }
                    updateMesombPluginConfig(DEFAULT_MESOMB_PLUGIN_CONFIG);
                    showSecurityNotification('MeSomb Plugin set to official WooCommerce normal settings.');
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center space-x-1.5 transition-all ${
                    isAdminOrSuperAdmin
                      ? 'bg-stone-850 hover:bg-stone-800 text-stone-200 hover:text-white border-stone-700 cursor-pointer'
                      : 'bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed opacity-75'
                  }`}
                  title={isAdminOrSuperAdmin ? "Reset to official WooCommerce MeSomb normal settings" : `Restricted to Admin & Super Admin (Role: ${activeRole})`}
                >
                  {isAdminOrSuperAdmin ? <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-stone-500" />}
                  <span>Set Normal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMesombPluginModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:opacity-95 text-stone-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {isAdminOrSuperAdmin ? <Settings className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isAdminOrSuperAdmin ? 'Manage & Edit Plugin' : 'View Plugin (Read-Only)'}</span>
                </button>
              </div>
            </div>

            {/* Plugin Overview Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Plugin Status</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${mesombPluginConfig.active ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                  <span className="font-mono font-bold text-stone-200">
                    {mesombPluginConfig.active ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              </div>

              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Carrier Routing</span>
                <span className="font-mono font-bold text-amber-400 mt-1 block">
                  {mesombPluginConfig.routingService}
                </span>
              </div>

              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Commission & Tariff</span>
                <span className="font-mono font-bold text-stone-200 mt-1 block">
                  {mesombPluginConfig.feePercentage}% ({mesombPluginConfig.feeAbsorptionMode === 'landlord_absorbs' ? 'Landlord' : 'Tenant'})
                </span>
              </div>

              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Network Coverage</span>
                <span className="font-bold text-stone-200 mt-1 block truncate" title={mesombPluginConfig.regionCoverage}>
                  MTN *126# · Orange #150#
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-400 gap-2 border-t border-stone-800/80">
              <div className="font-mono truncate max-w-md">
                <span className="text-stone-500">API Endpoint: </span>
                <span className="text-stone-300">{mesombPluginConfig.endpointUrl}</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMoneyTargetGateway('mtn_momo');
                    setMobileMoneyModalOpen(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Test USSD Handset</span>
                </button>
                <span className="text-stone-600">•</span>
                <button
                  type="button"
                  onClick={() => setMesombPluginModalOpen(true)}
                  className="text-stone-300 hover:text-white font-medium underline"
                >
                  API Keys & Webhooks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Payment Router & Settlement Simulator (Page 5 & 10) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">
                  Payment Router & Fee Simulator
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                PaymentRouter.php
              </span>
            </div>

            <p className="text-xs text-stone-600">
              Simulate the end-to-end data flow (Page 10): test tenant rent payments across currencies and see how the gateway router evaluates active methods.
            </p>

            <div className="space-y-3 text-xs">
              {/* Currency Selector */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Payment Currency
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['USD', 'EUR', 'GBP', 'CFA'] as SupportedCurrency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleSimCurrencyChange(c)}
                      className={`py-2 px-1 rounded-xl text-center border font-bold transition-all ${
                        simCurrency === c
                          ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-base">{currencies[c].flag}</div>
                      <div className="text-[11px] mt-0.5">{c}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Amount in {simCurrency} ({currencies[simCurrency].symbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-stone-400">
                    {currencies[simCurrency].symbol}
                  </span>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono font-bold text-stone-900"
                  />
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  Equates to approximately {formatAmount(convertAmount(simAmount, simCurrency, 'USD'), 'USD')} USD
                </div>
              </div>

              {/* Gateway Selection */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tenant Target Gateway
                </label>
                <select
                  value={simPreferredGateway}
                  onChange={(e) => setSimPreferredGateway(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
                >
                  <option value="auto">Auto-Route (PaymentRouter priority)</option>
                  {gateways
                    .filter((g) => g.supportedCurrencies.includes(simCurrency))
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.active ? 'Active ON' : 'Deactivated OFF'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Run Button */}
              <button
                type="button"
                onClick={handleRunSimulation}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Gateway Route</span>
              </button>
            </div>

            {/* Simulation Results & Route Trace */}
            {simulationResult && (
              <div className="mt-4 p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="font-bold text-stone-900">Routing Decision:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simulationResult.allowed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {simulationResult.allowed ? 'DISPATCHED ✓' : 'ROUTE REJECTED ✗'}
                  </span>
                </div>

                {simulationResult.allowed && simulationResult.gateway && (
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Selected Gateway:</span>
                        <span className="font-bold text-stone-900">
                          {simulationResult.gateway.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Gateway PHP Class:</span>
                        <span className="text-amber-800 font-semibold">
                          {simulationResult.gateway.phpClass}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Payment Amount:</span>
                        <span className="font-bold text-stone-900">
                          {simulationResult.amount.toLocaleString()} {simulationResult.currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span>Gateway Fee ({simulationResult.gateway.feePercentage}%):</span>
                        <span>
                          -{simulationResult.fee.toFixed(simulationResult.currency === 'CFA' ? 0 : 2)}{' '}
                          {simulationResult.currency}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-stone-100 font-bold text-emerald-800 text-xs">
                        <span>Settlement Payout ({simulationResult.settlementCurrency}):</span>
                        <span>
                          {simulationResult.netSettlement.toLocaleString()}{' '}
                          {simulationResult.settlementCurrency}
                        </span>
                      </div>
                    </div>

                    {/* Trigger Live Mobile Money Handshake if CFA / MoMo */}
                    {(simulationResult.gateway?.id === 'mtn_momo' ||
                      simulationResult.gateway?.id === 'orange_money' ||
                      simulationResult.gateway?.id === 'mesomb' ||
                      simulationResult.currency === 'CFA') && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetGw =
                            simulationResult.gateway?.id === 'orange_money' ? 'orange_money' : 'mtn_momo';
                          setMobileMoneyTargetGateway(targetGw);
                          setMobileMoneyModalOpen(true);
                        }}
                        className="w-full mt-2 py-2.5 px-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:opacity-95 text-stone-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all"
                      >
                        <Smartphone className="w-4 h-4 text-stone-950" />
                        <span>
                          Launch Live USSD Collection ({simulationResult.gateway?.id === 'orange_money' ? 'Orange #150#' : 'MTN *126#'})
                        </span>
                      </button>
                    )}

                    {/* Step-up Payment MFA Verification Button */}
                    <button
                      type="button"
                      onClick={() =>
                        openMfaChallenge({
                          purpose: 'payment',
                          channel: 'phone',
                          user: currentUser,
                          paymentDetails: {
                            amount: simulationResult.amount,
                            currency: simulationResult.currency,
                            gateway: simulationResult.gateway?.name || 'Payment Router',
                            payee: 'Sunrise Holdings LLC',
                            riskLevel: 'LOW',
                          },
                        })
                      }
                      className="w-full mt-2 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border border-stone-700"
                      title="Trigger PSD2 SCA Multi-Factor Authentication step-up challenge"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Test Payment MFA Step-Up (Email / SMS)</span>
                    </button>
                  </div>
                )}

                {/* PHP Route Trace Log */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Execution Trace (routes/api.php → PaymentRouter.php)
                  </div>
                  <div className="p-2.5 bg-stone-900 text-stone-200 font-mono text-[10px] rounded-lg space-y-1 max-h-36 overflow-y-auto">
                    {simulationResult.routeTrace.map((line, idx) => (
                      <div key={idx} className="leading-tight">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Architecture Callout: Framework Contracts (Page 5) */}
          <div className="p-4 bg-stone-100 border border-stone-200 rounded-2xl text-xs space-y-2 text-stone-700">
            <div className="font-bold text-stone-900 flex items-center space-x-1.5">
              <FileCode2 className="w-4 h-4 text-amber-700" />
              <span>Payment Gateway Interface Contract</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Every gateway implements <code>PaymentGatewayInterface.php</code>:
            </p>
            <div className="p-2 bg-white rounded border border-stone-200 font-mono text-[10px] text-stone-800 space-y-0.5">
              <div>interface PaymentGatewayInterface {'{'}</div>
              <div className="pl-4">public function charge(PaymentRequest $req): PaymentResponse;</div>
              <div className="pl-4">public function refund(string $gatewayRef, float $amount): RefundResponse;</div>
              <div className="pl-4">public function verifyWebhook(array $payload, string $sig): bool;</div>
              <div>{'}'}</div>
            </div>
            <div className="text-[10px] text-stone-500 font-mono pt-1">
              Supports CFA (MTN MoMo, Orange Money, CamerPay, ElyonPay), EUR (SEPA), GBP (BACS), and USD (ACH).
            </div>
          </div>
        </div>
      </div>

      {/* Cameroon Mobile Money Payment Terminal Modal (MTN MoMo & Orange Money) */}
      <MobileMoneyPaymentModal
        isOpen={mobileMoneyModalOpen}
        onClose={() => setMobileMoneyModalOpen(false)}
        initialGateway={mobileMoneyTargetGateway}
        initialTenantName="Jordan Avery"
        initialUnit="Unit 4B"
        initialAmountUSD={1450}
      />

      {/* MeSomb Plugin Management Configuration Modal */}
      <MesombPluginManagerModal
        isOpen={mesombPluginModalOpen}
        onClose={() => setMesombPluginModalOpen(false)}
        onLaunchTestCollection={() => {
          setMobileMoneyTargetGateway('mtn_momo');
          setMobileMoneyModalOpen(true);
        }}
      />
    </div>
  );
};
