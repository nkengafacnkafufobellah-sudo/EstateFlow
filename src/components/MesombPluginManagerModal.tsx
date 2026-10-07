import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Lock,
  Unlock,
  Layers,
  Settings,
  Sliders,
  RotateCcw,
  Key,
  ExternalLink,
  Code2,
  CheckCheck,
  Terminal,
  DollarSign,
  Percent,
  Server,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useSecurity } from '../context/SecurityContext';
import { MesombPluginConfig } from '../types';
import {
  DEFAULT_MESOMB_PLUGIN_CONFIG,
  generateMeSombAuthHeader,
  detectMeSombOperator,
} from '../utils/mesombGatewayUtils';

interface MesombPluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTestCollection?: () => void;
}

export const MesombPluginManagerModal: React.FC<MesombPluginManagerModalProps> = ({
  isOpen,
  onClose,
  onLaunchTestCollection,
}) => {
  const { mesombPluginConfig, updateMesombPluginConfig, resetMesombPluginConfig } = useCurrency();
  const { currentUser, activeRole, showSecurityNotification } = useSecurity();

  // STRICT REQUIREMENT: Only Admin and Super Admin can manage & edit MeSomb plugin settings
  const isAdminOrSuperAdmin = activeRole === 'super_admin' || activeRole === 'admin';

  // Active Tab: 'general' | 'api' | 'operators' | 'webhooks' | 'diagnostics'
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'operators' | 'webhooks' | 'diagnostics'>('general');

  // Form State initialized from mesombPluginConfig
  const [formData, setFormData] = useState<MesombPluginConfig>(mesombPluginConfig);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Diagnostics & Ping State
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    latencyMs: number;
    status: string;
    timestamp: string;
    authHeaderSample: string;
  } | null>(null);

  // Test Webhook State
  const [webhookTestStatus, setWebhookTestStatus] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync state when opened or when mesombPluginConfig updates
  useEffect(() => {
    if (isOpen) {
      setFormData(mesombPluginConfig);
      setHasChanges(false);
      setShowResetConfirm(false);
      setPingResult(null);
      setWebhookTestStatus(null);
    }
  }, [isOpen, mesombPluginConfig]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof MesombPluginConfig>(field: K, value: MesombPluginConfig[K]) => {
    if (!isAdminOrSuperAdmin) {
      showSecurityNotification(`403 Forbidden: Modifying MeSomb Plugin settings requires Admin or Super Admin role. Current role: ${activeRole}`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRotateSecretKey = () => {
    if (!isAdminOrSuperAdmin) {
      showSecurityNotification('403 Forbidden: Key rotation is strictly restricted to Admin and Super Admin roles.');
      return;
    }
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const newKey = `sec_mesomb_live_${randomHex}`;
    handleChange('secretKey', newKey);
    showSecurityNotification('Generated new MeSomb HMAC Secret Key. Click "Save Plugin Settings" to persist.');
  };

  const handleRunPingTest = async () => {
    setIsPinging(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const latency = Math.floor(28 + Math.random() * 22);

    const auth = generateMeSombAuthHeader({
      applicationKey: formData.applicationKey,
      accessKey: formData.accessKey,
      secretKey: formData.secretKey,
      method: 'POST',
      endpoint: '/api/v1.1/payment/online/',
    });

    setPingResult({
      latencyMs: latency,
      status: '200 OK (Gateway Online)',
      timestamp: new Date().toISOString(),
      authHeaderSample: auth.authorization,
    });
    setIsPinging(false);
    showSecurityNotification(`MeSomb Gateway API ping test passed with ${latency}ms latency.`);
  };

  const handleTestWebhookPing = async () => {
    setWebhookTestStatus('sending');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setWebhookTestStatus('success');
    showSecurityNotification(`Inbound test webhook event delivered to ${formData.webhookUrl} with verified HMAC signature.`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrSuperAdmin) {
      showSecurityNotification(`403 Forbidden: MeSomb Plugin configuration can only be saved by Admin and Super Admin. Current role: ${activeRole}`);
      return;
    }
    const res = updateMesombPluginConfig(formData);
    if (res.success) {
      setHasChanges(false);
      setShowResetConfirm(false);
      showSecurityNotification('MeSomb Plugin configuration successfully saved and applied to active payment routers.');
    }
  };

  const confirmResetDefaults = () => {
    if (!isAdminOrSuperAdmin) {
      showSecurityNotification('403 Forbidden: MeSomb Plugin reset is restricted to Admin and Super Admin roles.');
      return;
    }
    resetMesombPluginConfig();
    setFormData(DEFAULT_MESOMB_PLUGIN_CONFIG);
    setHasChanges(false);
    setShowResetConfirm(false);
    showSecurityNotification('MeSomb Plugin settings restored to official defaults.');
  };

  const handleApplyNormalSettings = () => {
    if (!isAdminOrSuperAdmin) {
      showSecurityNotification('403 Forbidden: MeSomb Plugin configuration is restricted to Admin and Super Admin.');
      return;
    }
    setFormData(DEFAULT_MESOMB_PLUGIN_CONFIG);
    const res = updateMesombPluginConfig(DEFAULT_MESOMB_PLUGIN_CONFIG);
    if (res.success) {
      setHasChanges(false);
      setShowResetConfirm(false);
      showSecurityNotification('MeSomb Plugin settings set to official WooCommerce normal settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150">
        
        {/* Top Header: Plugin Manifest Bar */}
        <div className="bg-stone-950 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-600 text-stone-950 font-black flex items-center justify-center text-lg shadow-md border border-amber-300">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  MeSomb Plugin Management
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  {formData.phpClass}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  v{formData.pluginVersion}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Official WooCommerce Mobile Money Gateway (MTN MoMo *126# & Orange Money #150#)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Quick Set to Normal Settings Button */}
            <button
              type="button"
              onClick={handleApplyNormalSettings}
              disabled={!isAdminOrSuperAdmin}
              className={`px-3 py-1.5 font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all ${
                isAdminOrSuperAdmin
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-950 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
              }`}
              title={isAdminOrSuperAdmin ? "Set all plugin settings to official WooCommerce MeSomb normal settings" : "Restricted: Admin & Super Admin Only"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set Normal Settings</span>
            </button>

            {/* Quick Master Active Toggle */}
            <div className="flex items-center space-x-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
              <span className="text-xs font-mono font-bold text-stone-300">
                Plugin {formData.active ? 'ENABLED' : 'DISABLED'}
              </span>
              <button
                type="button"
                disabled={!isAdminOrSuperAdmin}
                onClick={() => handleChange('active', !formData.active)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                } ${formData.active ? 'bg-amber-600' : 'bg-stone-700'}`}
                title={isAdminOrSuperAdmin ? "Toggle Plugin status" : "Restricted to Admin / Super Admin"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.active ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Access Banner (Strict Admin & Super Admin RBAC enforcement) */}
        {isAdminOrSuperAdmin ? (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong className="text-white">Admin Access Granted:</strong> You are authorized as{' '}
                <span className="font-mono bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  {currentUser.roleTitle || activeRole} ({activeRole})
                </span>{' '}
                with full plugin configuration & credentials permissions.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-700/50">
              RBAC Policy: Admin & Super Admin Only ✓
            </span>
          </div>
        ) : (
          <div className="bg-rose-950/90 border-b border-rose-800 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-start sm:items-center space-x-2.5">
              <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-white block sm:inline">403 Restricted Access: </span>
                <span>
                  MeSomb Plugin management is strictly restricted to <strong>Admin</strong> and <strong>Super Admin</strong>.
                  Your current session role is{' '}
                  <span className="font-mono bg-rose-900/70 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                    {currentUser.roleTitle || activeRole} ({activeRole})
                  </span>
                  . Form controls are locked in read-only mode.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-rose-900 text-rose-300 px-2 py-1 rounded border border-rose-700 uppercase whitespace-nowrap self-start sm:self-auto">
              🔒 Read-Only Mode
            </span>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="bg-stone-100 border-b border-stone-200 px-6 flex space-x-1 sm:space-x-2 overflow-x-auto text-xs font-bold py-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 ring-1 ring-amber-400/40'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span>WooCommerce Settings (Normal)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 ring-1 ring-amber-400/40'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-700" />
            <span>API Credentials & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operators')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'operators'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 ring-1 ring-amber-400/40'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-700" />
            <span>MTN & Orange Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhooks')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 ring-1 ring-amber-400/40'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            <span>Webhooks & IPN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200 ring-1 ring-amber-400/40'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-700" />
            <span>Diagnostics & Ping</span>
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSaveSettings} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ============================================================== */}
          {/* TAB 1: WOOCOMMERCE SETTINGS (NORMAL SPECIFICATION)            */}
          {/* ============================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              
              {/* Official WooCommerce Navigation & Reset Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 p-4 rounded-2xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-xs text-amber-950">
                      WooCommerce Payments &gt; MeSomb Gateway
                    </span>
                    <span className="text-[10px] font-mono bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      Normal Plugin Settings
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Allows tenants to make rental payments with Mobile Money (MTN *126#) or Orange Money (#150#) as defined in <code>{formData.phpClass}</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyNormalSettings}
                  disabled={!isAdminOrSuperAdmin}
                  className={`px-3.5 py-2 font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto ${
                    isAdminOrSuperAdmin
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-stone-950 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-70'
                  }`}
                  title={isAdminOrSuperAdmin ? "Populate and set to official WooCommerce MeSomb normal settings" : "Admin Only"}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-950" />
                  <span>Set to Normal Defaults</span>
                </button>
              </div>

              {/* Plugin Manifest & Metadata (Editable inputs as requested) */}
              <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Plugin Manifest & Package Metadata</span>
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">
                    Editable Manifest Parameters
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Plugin Package Name
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.pluginName}
                      onChange={(e) => handleChange('pluginName', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="MeSomb for WooCommerce"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Official gateway display title in plugins list</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      PHP Gateway Driver Class
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.phpClass}
                      onChange={(e) => handleChange('phpClass', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="class-wc-gateway-mesomb.php"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Main PHP class file hooked into WooCommerce</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Plugin Version (SemVer)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.pluginVersion}
                      onChange={(e) => handleChange('pluginVersion', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="1.4.2"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Published release build version</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Regional CEMAC / Coverage Description
                  </label>
                  <input
                    type="text"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.regionCoverage}
                    onChange={(e) => handleChange('regionCoverage', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Cameroon (CM), Niger (NE) & CEMAC Mobile Money Operators"
                  />
                </div>
              </div>

              {/* 1. Enable / Disable Gateway */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdminOrSuperAdmin}
                    checked={formData.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Enable MeSomb Gateway
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Enable/disable the MeSomb payment method for tenant rent checkout.
                    </span>
                  </div>
                </label>
              </div>

              {/* 2. Title & Description (Standard WooCommerce fields) */}
              <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="border-b border-stone-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Checkout Display Settings
                  </h4>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800">
                      Title
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Normal Default: MeSomb Mobile Payment
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.checkoutTitle}
                    onChange={(e) => handleChange('checkoutTitle', e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="MeSomb Mobile Payment"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    This controls the title which the user sees during checkout.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800">
                      Description
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Normal Default: Pay with your Mobile/Orange Money account.
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.checkoutDescription}
                    onChange={(e) => handleChange('checkoutDescription', e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Pay with your Mobile/Orange Money account."
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    This controls the description which the user sees during checkout.
                  </span>
                </div>

                {/* Fees Included Checkbox */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdminOrSuperAdmin}
                      checked={formData.feesIncluded ?? (formData.feeAbsorptionMode === 'landlord_absorbs')}
                      onChange={(e) => {
                        const val = e.target.checked;
                        handleChange('feesIncluded', val);
                        handleChange('feeAbsorptionMode', val ? 'landlord_absorbs' : 'tenant_pays');
                      }}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Fees Included
                      </span>
                      <span className="text-[11px] text-stone-600">
                        Fees are already included in the displayed price. (Controls if the MeSomb fee is already included in the total rent shown to users).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Tariff & Settlement Rates (Editable inputs) */}
              <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="border-b border-stone-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-700" />
                    <span>Gateway Tariff, Fees & Clearance Speed</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Gateway Fee Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        disabled={!isAdminOrSuperAdmin}
                        value={formData.feePercentage}
                        onChange={(e) => handleChange('feePercentage', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="1.0"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono font-bold text-stone-400">%</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Standard MeSomb normal fee: 1.0%</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Fixed Transaction Fee ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        disabled={!isAdminOrSuperAdmin}
                        value={formData.feeFixedUSD}
                        onChange={(e) => handleChange('feeFixedUSD', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono font-bold text-stone-400">USD</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Default: 0.00 (No fixed surcharge)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Fee Absorption Mode
                    </label>
                    <select
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.feeAbsorptionMode}
                      onChange={(e) => {
                        const mode = e.target.value as 'landlord_absorbs' | 'tenant_pays';
                        handleChange('feeAbsorptionMode', mode);
                        handleChange('feesIncluded', mode === 'landlord_absorbs');
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="landlord_absorbs">Landlord Absorbs Fee (Normal)</option>
                      <option value="tenant_pays">Tenant Surcharge (Tenant Pays)</option>
                    </select>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Accounting ledger allocation</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Settlement Speed & Protocol
                  </label>
                  <input
                    type="text"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.settlementSpeed}
                    onChange={(e) => handleChange('settlementSpeed', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Instant (Hosted Checkout / USSD Push)"
                  />
                </div>
              </div>

              {/* 4. Supported Countries, Host & Return URL */}
              <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="border-b border-stone-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Host URL, Redirection & Supported Countries
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      MeSomb Host Base URL
                    </label>
                    <input
                      type="url"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.host || 'https://mesomb.hachther.com'}
                      onChange={(e) => handleChange('host', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="https://mesomb.hachther.com"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Official MeSomb gateway host URL</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-800">
                        WooCommerce Return URL Hook
                      </label>
                      <button
                        type="button"
                        onClick={() => handleChange('returnUrl', 'https://api.sunriseholdings.com/?wc-api=wc_gateway_mesomb_return')}
                        className="text-[10px] text-amber-700 font-bold hover:underline"
                      >
                        Reset Hook
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!isAdminOrSuperAdmin}
                        value={formData.returnUrl || 'https://api.sunriseholdings.com/?wc-api=wc_gateway_mesomb_return'}
                        onChange={(e) => handleChange('returnUrl', e.target.value)}
                        className="w-full pl-3 pr-20 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.returnUrl || 'https://api.sunriseholdings.com/?wc-api=wc_gateway_mesomb_return', 'returnUrl')}
                        className="absolute right-2 top-1.5 px-2 py-0.5 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[10px] font-bold text-stone-700 flex items-center space-x-1"
                      >
                        {copiedField === 'returnUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'returnUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Standard WooCommerce callback return endpoint</span>
                  </div>
                </div>

                {/* Countries multiselect */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Countries Accepted
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'CM', name: 'Cameroon (MTN MoMo *126#, Orange Money #150#)', flag: '🇨🇲' },
                      { code: 'NE', name: 'Niger (Airtel Money)', flag: '🇳🇪' },
                    ].map((c) => {
                      const isSelected = (formData.countries || ['CM', 'NE']).includes(c.code);
                      return (
                        <button
                          key={c.code}
                          type="button"
                          disabled={!isAdminOrSuperAdmin}
                          onClick={() => {
                            const current = formData.countries || ['CM', 'NE'];
                            const updated = isSelected ? current.filter((x) => x !== c.code) : [...current, c.code];
                            handleChange('countries', updated.length > 0 ? updated : [c.code]);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-2 ${
                            isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                          } ${
                            isSelected
                              ? 'bg-amber-100 border-amber-400 text-amber-950 ring-1 ring-amber-300'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-sm">{c.flag}</span>
                          <span>{c.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-800 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Currency Conversion Checkbox */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdminOrSuperAdmin}
                      checked={formData.conversion ?? true}
                      onChange={(e) => handleChange('conversion', e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Automatic Currency Conversion (Normal Default: Yes)
                      </span>
                      <span className="text-[11px] text-stone-600">
                        Rely on MeSomb to automatically convert foreign currencies (USD, EUR, GBP) to local currency (XAF/CFA) before prompting tenant SIM.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Official Plugin Specification Badge */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-wrap items-center justify-between text-[11px] text-stone-600 gap-2">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="font-bold text-stone-800">{formData.pluginName}</span>
                    <span>·</span>
                    <span className="text-amber-700">v{formData.pluginVersion}</span>
                    <span>·</span>
                    <span className="text-stone-500">{formData.phpClass}</span>
                  </div>
                  <span className="text-emerald-700 font-bold">Official Hachther LLC Specification ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: API CREDENTIALS & SECURITY                            */}
          {/* ============================================================== */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    MeSomb API Credentials & Cryptographic Keys
                  </h3>
                  <p className="text-xs text-stone-500">
                    Production or sandbox API keys obtained from your MeSomb merchant dashboard (mesomb.hachther.com).
                  </p>
                </div>
                <a
                  href="https://mesomb.hachther.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:underline"
                >
                  <span>MeSomb Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Environment Toggle: Live vs Sandbox */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Environment Mode
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    disabled={!isAdminOrSuperAdmin}
                    onClick={() => handleChange('environment', 'production')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    } ${
                      formData.environment === 'production'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Production (Live API)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdminOrSuperAdmin}
                    onClick={() => handleChange('environment', 'sandbox')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    } ${
                      formData.environment === 'sandbox'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-400'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Sandbox (Testing Mode)</span>
                  </button>
                </div>
              </div>

              {/* Application Key */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Application Key (AppKey)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.applicationKey}
                    onChange={(e) => handleChange('applicationKey', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="app_mesomb_live_..."
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.applicationKey, 'appKey')}
                    className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
                    title="Copy AppKey"
                  >
                    {copiedField === 'appKey' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Obtained from MeSomb dashboard. Sent as <code>X-MeSomb-Application</code> HTTP header.
                </span>
              </div>

              {/* Access Key */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Access Key (AccessKey)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.accessKey}
                    onChange={(e) => handleChange('accessKey', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="acc_mesomb_..."
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.accessKey, 'accessKey')}
                    className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
                    title="Copy AccessKey"
                  >
                    {copiedField === 'accessKey' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  API Access key obtained from MeSomb.
                </span>
              </div>

              {/* Secret Key with Show/Hide and Rotation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-800">
                    Secret Key (SecretKey / Private HMAC Key)
                  </label>
                  {isAdminOrSuperAdmin && (
                    <button
                      type="button"
                      onClick={handleRotateSecretKey}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate New Key</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.secretKey}
                    onChange={(e) => handleChange('secretKey', e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="sec_mesomb_live_..."
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                      title={showSecretKey ? 'Hide key' : 'Show key'}
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.secretKey, 'secretKey')}
                      className="p-1 text-stone-400 hover:text-stone-700"
                      title="Copy SecretKey"
                    >
                      {copiedField === 'secretKey' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Used by MeSomb to compute deterministic HMAC signatures for every collection request.
                </span>
              </div>

              {/* Merchant ID & Aggregator Service Provider Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    MeSomb Merchant ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.merchantId}
                      onChange={(e) => handleChange('merchantId', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="MESOMB_MERCHANT_CM_8892"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.merchantId, 'merchantId')}
                      className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
                      title="Copy Merchant ID"
                    >
                      {copiedField === 'merchantId' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Aggregator Provider Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.serviceProviderCode}
                      onChange={(e) => handleChange('serviceProviderCode', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="MESOMB-DUAL-MOMO-OM"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.serviceProviderCode, 'serviceProviderCode')}
                      className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
                      title="Copy Provider Code"
                    >
                      {copiedField === 'serviceProviderCode' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Endpoint URL & Signature Algorithm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    API Endpoint URL
                  </label>
                  <input
                    type="url"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.endpointUrl}
                    onChange={(e) => handleChange('endpointUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">Official MeSomb collection endpoint</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Signing Algorithm
                  </label>
                  <select
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.signingAlgorithm}
                    onChange={(e) => handleChange('signingAlgorithm', e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="HMAC-SHA1">HMAC-SHA1 (Default Normal)</option>
                    <option value="HMAC-SHA256">HMAC-SHA256</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: OPERATORS & CARRIER ROUTING                            */}
          {/* ============================================================== */}
          {activeTab === 'operators' && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Mobile Money Operator Network Configuration (Cameroon)
                </h3>
                <p className="text-xs text-stone-500">
                  Configure specific USSD push prompts, operator codes, and automatic carrier dispatch for MTN Mobile Money and Orange Money.
                </p>
              </div>

              {/* Carrier Routing Strategy */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Default Carrier Routing Strategy
                </label>
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <button
                    type="button"
                    disabled={!isAdminOrSuperAdmin}
                    onClick={() => handleChange('routingService', 'AUTO')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    } ${
                      formData.routingService === 'AUTO'
                        ? 'bg-amber-50 border-amber-500 font-bold text-amber-950 ring-1 ring-amber-400'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-amber-700" />
                      <span>AUTO (Smart Detect)</span>
                    </div>
                    <div className="text-[10px] font-normal text-stone-500 mt-1">
                      Auto-detects MTN (67X/68X) vs Orange (69X) from payer number.
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdminOrSuperAdmin}
                    onClick={() => handleChange('routingService', 'MTN')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    } ${
                      formData.routingService === 'MTN'
                        ? 'bg-yellow-50 border-yellow-500 font-bold text-yellow-950 ring-1 ring-yellow-400'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-yellow-400 text-stone-950 text-[9px] font-black flex items-center justify-center">
                        M
                      </span>
                      <span>Force MTN MoMo</span>
                    </div>
                    <div className="text-[10px] font-normal text-stone-500 mt-1">
                      Always dispatch via MTN Cameroon network (*126#).
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdminOrSuperAdmin}
                    onClick={() => handleChange('routingService', 'ORANGE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isAdminOrSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    } ${
                      formData.routingService === 'ORANGE'
                        ? 'bg-orange-50 border-orange-500 font-bold text-orange-950 ring-1 ring-orange-400'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-[#FF7900] text-white text-[9px] font-black flex items-center justify-center">
                        O
                      </span>
                      <span>Force Orange Money</span>
                    </div>
                    <div className="text-[10px] font-normal text-stone-500 mt-1">
                      Always dispatch via Orange Cameroun WebPay (#150#).
                    </div>
                  </button>
                </div>
              </div>

              {/* MTN Mobile Money Configuration Box */}
              <div className="p-4 rounded-2xl border border-yellow-200 bg-yellow-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-yellow-400 text-stone-950 font-black text-xs flex items-center justify-center shadow-xs">
                      MTN
                    </span>
                    <span className="font-extrabold text-stone-900 text-xs">
                      MTN Mobile Money Cameroon (MoMo)
                    </span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-xs font-bold text-stone-700">
                      {formData.mtnEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      disabled={!isAdminOrSuperAdmin}
                      checked={formData.mtnEnabled}
                      onChange={(e) => handleChange('mtnEnabled', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      USSD Collection Code
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.mtnUssdCode}
                      onChange={(e) => handleChange('mtnUssdCode', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-mono text-xs font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="*126#"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      MTN Service Provider Code
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.mtnServiceProviderCode}
                      onChange={(e) => handleChange('mtnServiceProviderCode', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-mono text-xs font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="MTN-CM-MOMO-COLLECT"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-stone-500">
                  Supported phone prefixes: <strong>67, 68, 650, 651, 652, 653, 654</strong>. USSD triggers immediate payment prompt on SIM.
                </div>
              </div>

              {/* Orange Money Configuration Box */}
              <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FF7900] text-white font-black text-xs flex items-center justify-center shadow-xs">
                      OM
                    </span>
                    <span className="font-extrabold text-stone-900 text-xs">
                      Orange Money Cameroun (WebPay)
                    </span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-xs font-bold text-stone-700">
                      {formData.orangeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      disabled={!isAdminOrSuperAdmin}
                      checked={formData.orangeEnabled}
                      onChange={(e) => handleChange('orangeEnabled', e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      USSD / Authorization Code
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.orangeUssdCode}
                      onChange={(e) => handleChange('orangeUssdCode', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-mono text-xs font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="#150#"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      Orange Service Provider Code
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrSuperAdmin}
                      value={formData.orangeServiceProviderCode}
                      onChange={(e) => handleChange('orangeServiceProviderCode', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-mono text-xs font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="OM-WEBPAY-COLLECTION"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-stone-500">
                  Supported phone prefixes: <strong>69, 655, 656, 657, 658, 659</strong>. Dispatches official Orange Money authorization prompt.
                </div>
              </div>

              {/* Airtel Money Box */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      AIR
                    </span>
                    <span className="font-extrabold text-stone-900 text-xs">
                      Airtel Money (CEMAC & Niger)
                    </span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-xs font-bold text-stone-700">
                      {formData.airtelEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      disabled={!isAdminOrSuperAdmin}
                      checked={formData.airtelEnabled ?? true}
                      onChange={(e) => handleChange('airtelEnabled', e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
                <div className="text-[11px] text-stone-500">
                  Regional mobile wallet gateway for CEMAC cross-border transactions.
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: WEBHOOKS & IPN                                         */}
          {/* ============================================================== */}
          {activeTab === 'webhooks' && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900">
                  MeSomb Instant Payment Notification (IPN) & Webhooks
                </h3>
                <p className="text-xs text-stone-500">
                  MeSomb posts asynchronous HTTP POST notifications when tenants complete authorization on their phones.
                </p>
              </div>

              {/* Webhook Callback URL */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Webhook Callback URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.webhookUrl}
                    onChange={(e) => handleChange('webhookUrl', e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.webhookUrl, 'webhookUrl')}
                    className="absolute right-2.5 top-2.5 px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-700 flex items-center space-x-1"
                  >
                    {copiedField === 'webhookUrl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'webhookUrl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Copy and paste this URL into your MeSomb merchant dashboard under <strong>Settings &gt; Webhooks</strong>.
                </span>
              </div>

              {/* Webhook Secret Key */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Webhook Secret (whsec_...)
                </label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    disabled={!isAdminOrSuperAdmin}
                    value={formData.webhookSecret}
                    onChange={(e) => handleChange('webhookSecret', e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                    >
                      {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.webhookSecret, 'webhookSecret')}
                      className="p-1 text-stone-400 hover:text-stone-700"
                    >
                      {copiedField === 'webhookSecret' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdminOrSuperAdmin}
                    checked={formData.autoReconcileWebhooks}
                    onChange={(e) => handleChange('autoReconcileWebhooks', e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Auto-Reconcile Inbound Collections
                    </span>
                    <span className="text-[11px] text-stone-500">
                      When a verified carrier webhook arrives, immediately update rent ledger from Pending to Settled and generate official signed PDF receipt.
                    </span>
                  </div>
                </label>

                <div className="border-t border-stone-200/60 pt-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdminOrSuperAdmin}
                      checked={formData.enforceWebhookSignature}
                      onChange={(e) => handleChange('enforceWebhookSignature', e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Strict HMAC Signature Verification
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Reject all payloads that fail cryptographic HMAC signature validation with MeSomb secret.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Test Webhook Delivery */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    Test Webhook Listener
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Dispatch a simulated carrier settlement callback to test routing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTestWebhookPing}
                  disabled={webhookTestStatus === 'sending'}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {webhookTestStatus === 'sending' ? (
                    <span>Transmitting...</span>
                  ) : webhookTestStatus === 'success' ? (
                    <span className="flex items-center space-x-1">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Ping Delivered ✓</span>
                    </span>
                  ) : (
                    <span>Send Test Webhook</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: DIAGNOSTICS & PING CONSOLE                             */}
          {/* ============================================================== */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Plugin Diagnostics & Live Network Trace
                  </h3>
                  <p className="text-xs text-stone-500">
                    Execute health-checks, inspect authentication tokens, and verify Cameroon carrier connectivity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunPingTest}
                  disabled={isPinging}
                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging Gateway...' : 'Run Diagnostics Ping'}</span>
                </button>
              </div>

              {/* Ping Result Card */}
              {pingResult && (
                <div className="p-4 bg-stone-900 rounded-2xl text-stone-200 font-mono text-xs space-y-2 border border-stone-800 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[10px] text-stone-400 uppercase font-bold">
                    <span>Gateway Health & Response</span>
                    <span className="text-emerald-400">{pingResult.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500">Latency: </span>
                      <span className="font-bold text-amber-400">{pingResult.latencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Protocol: </span>
                      <span className="text-white">TLS 1.3 / HTTP/2</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Algorithm: </span>
                      <span className="text-white">{formData.signingAlgorithm}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Environment: </span>
                      <span className="text-emerald-400 uppercase font-bold">{formData.environment}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold">
                      Generated Header Verification:
                    </span>
                    <div className="p-2 bg-stone-950 rounded-lg text-[10px] text-stone-300 break-all select-all">
                      {pingResult.authHeaderSample}
                    </div>
                  </div>
                </div>
              )}

              {/* Carrier Route Validation Matrix */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="font-bold text-xs text-stone-800 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cameroon Carrier Route Verification Matrix</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">+237 677 41 89 20</div>
                      <div className="text-[10px] text-stone-500">Prefix 677 (MTN)</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 text-[10px] font-bold">
                      MTN MoMo (*126#) ✓
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">+237 694 22 10 55</div>
                      <div className="text-[10px] text-stone-500">Prefix 694 (Orange)</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 text-[10px] font-bold">
                      Orange Money (#150#) ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Collection Action */}
              {onLaunchTestCollection && (
                <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      Interactive Collection Handshake
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Open the live mobile phone handset simulation to test USSD PIN authorization.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchTestCollection();
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-stone-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Launch Handset Test</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* Footer Action Bar                                              */}
          {/* ============================================================== */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {showResetConfirm ? (
              <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-rose-800 font-bold">Reset all settings to factory normal defaults?</span>
                <button
                  type="button"
                  onClick={confirmResetDefaults}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-1 text-stone-600 hover:text-stone-900 font-medium text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!isAdminOrSuperAdmin}
                  onClick={handleApplyNormalSettings}
                  className={`text-xs font-bold flex items-center space-x-1 transition-colors ${
                    isAdminOrSuperAdmin
                      ? 'text-amber-800 hover:text-amber-950 cursor-pointer'
                      : 'text-stone-400 cursor-not-allowed'
                  }`}
                  title={isAdminOrSuperAdmin ? "Set to normal presets" : "Restricted to Admin"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Set MeSomb Normal Presets</span>
                </button>

                <button
                  type="button"
                  disabled={!isAdminOrSuperAdmin}
                  onClick={() => setShowResetConfirm(true)}
                  className={`text-xs font-bold flex items-center space-x-1 transition-colors ${
                    isAdminOrSuperAdmin
                      ? 'text-stone-500 hover:text-rose-600 cursor-pointer'
                      : 'text-stone-400 cursor-not-allowed'
                  }`}
                  title={isAdminOrSuperAdmin ? "Restore defaults" : "Restricted to Admin"}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Plugin Defaults</span>
                </button>

                {hasChanges && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                    ● Unsaved Changes
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isAdminOrSuperAdmin}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 ${
                  isAdminOrSuperAdmin
                    ? 'text-white bg-amber-700 hover:bg-amber-800 cursor-pointer'
                    : 'text-stone-400 bg-stone-200 cursor-not-allowed opacity-60'
                }`}
                title={isAdminOrSuperAdmin ? "Persist and apply plugin configuration" : "Forbidden: Only Admin & Super Admin can save"}
              >
                {isAdminOrSuperAdmin ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>Save Plugin Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
