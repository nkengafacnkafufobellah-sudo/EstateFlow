import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  User,
  ArrowRight,
  X,
  CheckCircle2,
  Building2,
  HardHat,
  Users,
  CreditCard,
  Crown,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { UserRole, UserProfile } from '../types';
import { NavigationTab } from './Navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole, targetTab: NavigationTab) => void;
}

export const getTargetTabForRole = (role: UserRole): NavigationTab => {
  switch (role) {
    case 'super_admin':
      return 'super-admin';
    case 'owner':
      return 'properties';
    case 'admin':
      return 'admin';
    case 'property_manager':
      return 'properties';
    case 'tenant':
      return 'tenant-app';
    case 'vendor':
      return 'vendor-workbench';
    case 'accountant':
      return 'finance';
    case 'read_only':
      return 'command-center';
    default:
      return 'command-center';
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { users, currentUser, setActiveRole, showSecurityNotification, logApiAction } = useSecurity();
  const [selectedUser, setSelectedUser] = useState<UserProfile>(users[0]);
  const [activeTab, setActiveTab] = useState<'persona' | 'credentials'>('persona');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handlePersonaLogin = (user: UserProfile) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setActiveRole(user.role);
      const targetTab = getTargetTabForRole(user.role);
      logApiAction(
        'LOGIN_SUCCESS',
        'Identity Provider',
        `User ${user.name} (${user.role}) authenticated via Persona Quick Login. Routed to ${targetTab}.`
      );
      showSecurityNotification(`Signed in as ${user.name} (${user.roleTitle}) — Redirected to ${targetTab}.`);
      setIsAuthenticating(false);
      onLoginSuccess(user.role, targetTab);
    }, 400);
  };

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      // Find matching user or fallback to selected user
      const matchedUser =
        users.find((u) => u.email.toLowerCase() === emailInput.trim().toLowerCase()) || selectedUser;
      setActiveRole(matchedUser.role);
      const targetTab = getTargetTabForRole(matchedUser.role);
      logApiAction(
        'LOGIN_SUCCESS',
        'Identity Provider',
        `User ${matchedUser.name} (${matchedUser.role}) authenticated via credential form. Routed to ${targetTab}.`
      );
      showSecurityNotification(`Authenticated: Welcome ${matchedUser.name}! Routed directly to your platform.`);
      setIsAuthenticating(false);
      onLoginSuccess(matchedUser.role, targetTab);
    }, 600);
  };

  const getRoleBadgeIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-3.5 h-3.5 text-rose-600" />;
      case 'owner':
        return <Building2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'property_manager':
        return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case 'tenant':
        return <Smartphone className="w-3.5 h-3.5 text-violet-600" />;
      case 'vendor':
        return <HardHat className="w-3.5 h-3.5 text-amber-600" />;
      case 'accountant':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white mx-auto flex items-center justify-center font-bold text-lg shadow-md mb-2">
            EF
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            EstateFlow Platform Access
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Choose your persona below to sign in directly to your role's dedicated operating platform.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'persona'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Direct Persona Login (Instant)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Email & Password Sign In
          </button>
        </div>

        {/* TAB 1: PERSONA DIRECT LOGIN */}
        {activeTab === 'persona' ? (
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-1">
              Select User & Platform Destination:
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {users.map((user) => {
                const targetTab = getTargetTabForRole(user.role);
                const isSelected = selectedUser.id === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handlePersonaLogin(user)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-400 shadow-2xs'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${user.avatarColor}`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-900 flex items-center space-x-1.5 truncate">
                          <span>{user.name}</span>
                          {getRoleBadgeIcon(user.role)}
                        </div>
                        <div className="text-[11px] text-amber-800 font-medium truncate">
                          {user.roleTitle}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono truncate">
                          Routes to: <strong className="text-stone-700">{targetTab}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pl-2">
                      <span className="text-[11px] font-bold text-amber-800 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                        <span>Enter</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* TAB 2: CREDENTIALS SIGN IN */
          <form onSubmit={handleCredentialSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. superadmin@sunriseholdings.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600 text-stone-900"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600 text-stone-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center space-x-2 cursor-pointer text-stone-600">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded text-amber-700 focus:ring-amber-600"
                />
                <span>Remember this workstation (30 days)</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setEmailInput('superadmin@sunriseholdings.com');
                  showSecurityNotification('Auto-filled Super Admin credentials.');
                }}
                className="text-amber-800 font-bold hover:underline cursor-pointer"
              >
                Auto-fill Demo
              </button>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAuthenticating ? 'Authenticating...' : 'Sign In to Platform'}</span>
            </button>
          </form>
        )}

        {/* Security badge footer */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Zero-Trust RBAC & PSD2 SCA Protected</span>
          </span>
          <span>EstateFlow Kernel 2026</span>
        </div>
      </div>
    </div>
  );
};
