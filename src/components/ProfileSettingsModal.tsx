import React, { useState } from 'react';
import {
  X,
  User,
  Settings,
  ShieldCheck,
  Smartphone,
  Mail,
  Bell,
  Coins,
  Globe,
  Clock,
  Lock,
  Volume2,
  VolumeX,
  Check,
  RefreshCw,
  Sparkles,
  Save,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { SupportedCurrency, MfaChannel } from '../types';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'settings';
}

const AVATAR_COLORS = [
  { name: 'Amber', class: 'bg-amber-600' },
  { name: 'Emerald', class: 'bg-emerald-600' },
  { name: 'Blue', class: 'bg-blue-600' },
  { name: 'Purple', class: 'bg-purple-600' },
  { name: 'Rose', class: 'bg-rose-600' },
  { name: 'Stone', class: 'bg-stone-700' },
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const {
    currentUser,
    updateUserProfile,
    appSettings,
    updateAppSettings,
    isLoginMfaEnforced,
    setIsLoginMfaEnforced,
    isPaymentMfaEnforced,
    setIsPaymentMfaEnforced,
    showSecurityNotification,
  } = useSecurity();

  const { activeCurrency, setActiveCurrency, currencies } = useCurrency();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phoneNumber: currentUser.phoneNumber || '+237 677 41 89 20',
    roleTitle: currentUser.roleTitle,
    avatarColor: currentUser.avatarColor,
    mfaPreferredChannel: currentUser.mfaPreferredChannel || 'phone',
    emergencyContact: currentUser.emergencyContact || '+237 699 12 34 56 (HQ Duty Desk)',
  });

  // App Settings Form State
  const [settingsForm, setSettingsForm] = useState({ ...appSettings });
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  if (!isOpen) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      name: profileForm.name,
      email: profileForm.email,
      phoneNumber: profileForm.phoneNumber,
      roleTitle: profileForm.roleTitle,
      avatarColor: profileForm.avatarColor,
      mfaPreferredChannel: profileForm.mfaPreferredChannel as MfaChannel,
      emergencyContact: profileForm.emergencyContact,
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings(settingsForm);
    if (settingsForm.defaultCurrency !== activeCurrency) {
      setActiveCurrency(settingsForm.defaultCurrency);
    }
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              EF
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                User Profile & Application Settings
              </h3>
              <p className="text-xs text-stone-500">
                Manage your credentials, multi-factor preferences, and system defaults
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-stone-100 flex items-center space-x-2 bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'profile'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4 text-amber-700" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'settings'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Settings className="w-4 h-4 text-stone-600" />
            <span>App Settings</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-800 space-y-6">
          {/* TAB 1: PROFILE EDITING */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Avatar & Visual Persona Banner */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xs ${profileForm.avatarColor}`}
                  >
                    {profileForm.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{profileForm.name}</h4>
                    <p className="text-stone-500 font-mono text-[11px]">{currentUser.roleTitle}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                      Role: {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* Color Selector */}
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-stone-500 mb-1.5">Avatar Color</div>
                  <div className="flex items-center space-x-1.5">
                    {AVATAR_COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatarColor: col.class })}
                        className={`w-5 h-5 rounded-full ${col.class} transition-transform ${
                          profileForm.avatarColor === col.class ? 'ring-2 ring-stone-900 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Phone Number (SMS MFA OTP)</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    required
                    placeholder="+237 6XX XX XX XX"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">Used for Mobile Money & phone authentication challenges.</p>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Role / Job Title</label>
                  <input
                    type="text"
                    value={profileForm.roleTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* MFA Channel Selection */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-stone-900 text-xs">Preferred MFA Verification Method</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                      profileForm.mfaPreferredChannel === 'phone'
                        ? 'bg-white border-amber-500 shadow-2xs'
                        : 'bg-stone-50/50 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mfaChannel"
                      value="phone"
                      checked={profileForm.mfaPreferredChannel === 'phone'}
                      onChange={() => setProfileForm({ ...profileForm, mfaPreferredChannel: 'phone' })}
                      className="mt-0.5 text-amber-700 focus:ring-amber-600"
                    />
                    <div>
                      <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                        <span>Phone / SMS OTP</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Sends instantaneous 6-digit codes via SMS to {profileForm.phoneNumber}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                      profileForm.mfaPreferredChannel === 'email'
                        ? 'bg-white border-amber-500 shadow-2xs'
                        : 'bg-stone-50/50 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mfaChannel"
                      value="email"
                      checked={profileForm.mfaPreferredChannel === 'email'}
                      onChange={() => setProfileForm({ ...profileForm, mfaPreferredChannel: 'email' })}
                      className="mt-0.5 text-amber-700 focus:ring-amber-600"
                    />
                    <div>
                      <div className="font-bold text-stone-900 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-700" />
                        <span>Email OTP</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Sends cryptographically signed OTP codes to {profileForm.email}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Emergency Escalation Contact</label>
                <input
                  type="text"
                  value={profileForm.emergencyContact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                  placeholder="Primary supervisor or secondary number"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <span className="text-stone-500 text-[11px]">
                  Updates take effect immediately across all workspaces.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  {isSavedRecently ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                  <span>{isSavedRecently ? 'Profile Saved ✓' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: APPLICATION SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              {/* Regional & Financial Preferences */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-700" />
                  <span>Regional & Financial Defaults</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Default Currency</label>
                    <select
                      value={settingsForm.defaultCurrency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value as SupportedCurrency })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {Object.values(currencies).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">System Language</label>
                    <select
                      value={settingsForm.language}
                      onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value as 'en' | 'fr' })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="en">English (US/UK)</option>
                      <option value="fr">Français (Cameroun/France)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Date Format</label>
                    <select
                      value={settingsForm.dateFormat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, dateFormat: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security & Zero-Trust Session Controls */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-700" />
                  <span>Security & Inactivity Policy</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Inactivity Auto-Lock</label>
                    <select
                      value={settingsForm.autoLockMinutes}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoLockMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value={5}>5 minutes idle (High Security)</option>
                      <option value={15}>15 minutes idle (Standard)</option>
                      <option value={30}>30 minutes idle</option>
                      <option value={60}>60 minutes idle</option>
                      <option value={0}>Disabled (Never lock)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Timezone Anchor</label>
                    <select
                      value={settingsForm.timeZone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timeZone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="Africa/Douala (UTC+1)">Africa/Douala (UTC+1 · West Africa)</option>
                      <option value="America/New_York (UTC-5)">America/New_York (UTC-5 · Eastern)</option>
                      <option value="Europe/Paris (UTC+1)">Europe/Paris (UTC+1 · Central Europe)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                    </select>
                  </div>
                </div>

                {/* Security Toggles */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">Enforce Login MFA</div>
                      <div className="text-[11px] text-stone-500">Requires 6-digit OTP when logging into privileged roles</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isLoginMfaEnforced}
                      onChange={(e) => setIsLoginMfaEnforced(e.target.checked)}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-600"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <div>
                      <div className="font-bold text-stone-900">Enforce Payment Step-Up MFA</div>
                      <div className="text-[11px] text-stone-500">PSD2 SCA authorization before debiting rent or processing collections</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPaymentMfaEnforced}
                      onChange={(e) => setIsPaymentMfaEnforced(e.target.checked)}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-600"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <div>
                      <div className="font-bold text-stone-900">Biometric / Passkey Simulation</div>
                      <div className="text-[11px] text-stone-500">Allows Face ID / Touch ID / WebAuthn for fast unlock</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.biometricsEnabled}
                      onChange={(e) => setSettingsForm({ ...settingsForm, biometricsEnabled: e.target.checked })}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-600"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-700" />
                  <span>Notification & Alert Channels</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-stone-900">Email Notifications</span>
                      <p className="text-[10px] text-stone-500">Ledger reconciliations & receipts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.emailAlerts}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailAlerts: e.target.checked })}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-600"
                    />
                  </label>

                  <label className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-stone-900">SMS Urgent Alerts</span>
                      <p className="text-[10px] text-stone-500">Emergency work orders & breaches</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.smsAlerts}
                      onChange={(e) => setSettingsForm({ ...settingsForm, smsAlerts: e.target.checked })}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-600"
                    />
                  </label>

                  <label className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-stone-900">Audible System Chimes</span>
                      <p className="text-[10px] text-stone-500">Sound on payments & approvals</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.soundEnabled}
                      onChange={(e) => setSettingsForm({ ...settingsForm, soundEnabled: e.target.checked })}
                      className="w-4 h-4 text-amber-700 rounded focus:ring-amber-600"
                    />
                  </label>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">Rent Reminder Notice</span>
                      <p className="text-[10px] text-stone-500">Dispatched prior to 1st of month</p>
                    </div>
                    <select
                      value={settingsForm.rentReminderLeadDays}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rentReminderLeadDays: Number(e.target.value) })}
                      className="px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono font-bold text-xs"
                    >
                      <option value={1}>1 day before</option>
                      <option value={3}>3 days before</option>
                      <option value={5}>5 days before</option>
                      <option value={7}>7 days before</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsForm({ ...appSettings });
                    showSecurityNotification('Settings reset to active session values.');
                  }}
                  className="px-3 py-2 text-stone-600 hover:text-stone-900 font-semibold text-xs transition-colors"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  {isSavedRecently ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                  <span>{isSavedRecently ? 'Settings Saved ✓' : 'Save App Settings'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
