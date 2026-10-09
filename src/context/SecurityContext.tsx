import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  UserRole,
  UserProfile,
  SecurityControlSetting,
  ApiAuditLogEntry,
  MfaChannel,
  MfaPurpose,
  MfaChallenge,
  MfaPaymentDetails,
  LoginSessionState,
} from '../types';
import { INITIAL_USERS, SECURITY_CONTROLS_DATA } from '../data/estateData';

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 3)}***@${domain}`;
};

export const maskPhone = (phone?: string): string => {
  if (!phone) return '+••••••••••';
  const parts = phone.split(' ');
  if (parts.length > 2) {
    return `${parts[0]} ${parts[1]} •• •• ${parts[parts.length - 1]}`;
  }
  return phone.replace(/(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)(\d{3})[\s-]?(\d{4})/, '$1$2•••-$4');
};

interface SecurityContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  setUserRole: (role: UserRole) => void;
  securityControls: SecurityControlSetting[];
  toggleSecurityControl: (id: string) => void;
  canPerform: (action: string) => boolean;
  securityAlert: string | null;
  securityNotification: string | null;
  showSecurityNotification: (msg: string) => void;
  clearSecurityAlert: () => void;
  orgId: string;
  isRateLimited: boolean;
  rateLimitRemaining: number;
  triggerRateLimitSim: () => void;
  simulateRateLimitHit: () => void;
  resetRateLimit: () => void;
  apiAuditLogs: ApiAuditLogEntry[];
  logApiAction: (action: string, targetService: string, details: string, status?: 'SUCCESS' | 'BLOCKED_403') => void;

  // Multi-Factor Authentication (MFA) - Login & Payment
  isLoginMfaEnforced: boolean;
  isPaymentMfaEnforced: boolean;
  setIsLoginMfaEnforced: (active: boolean) => void;
  setIsPaymentMfaEnforced: (active: boolean) => void;
  loginSession: LoginSessionState;
  activeMfaChallenge: MfaChallenge | null;
  isMfaModalOpen: boolean;
  mfaSimulatedIncomingCode: string | null;
  openMfaChallenge: (options: {
    purpose: MfaPurpose;
    channel?: MfaChannel;
    user?: UserProfile;
    paymentDetails?: MfaPaymentDetails;
    onVerified?: (challenge: MfaChallenge) => void;
  }) => MfaChallenge;
  verifyMfaCode: (code: string) => { success: boolean; message: string; challenge?: MfaChallenge };
  resendMfaCode: (channel?: MfaChannel) => { success: boolean; message: string; challenge?: MfaChallenge };
  switchMfaChannel: (channel: MfaChannel) => void;
  closeMfaModal: () => void;
  lockSession: () => void;
  unlockSession: () => void;
  isSessionLocked: boolean;
  clearSimulatedCode: () => void;
}

const INITIAL_API_AUDIT_LOGS: ApiAuditLogEntry[] = [
  {
    id: 'api-log-0',
    timestamp: '2026-09-23 11:05:42 UTC',
    actor: 'Fobellah N. (Super Admin)',
    action: 'POLICY_VERIFY',
    targetService: 'Tenant Scoping Kernel',
    details: 'Automated 24h multi-tenant data isolation integrity check passed with zero leaks.',
    ipAddress: '197.234.219.42 (Whitelisted)',
    status: 'SUCCESS',
  },
  {
    id: 'api-log-0b',
    timestamp: '2026-09-22 17:30:15 UTC',
    actor: 'P. Mensah (Property Manager)',
    action: 'ACCESS_ATTEMPT_DENIED',
    targetService: 'KMS Key Configuration',
    details: 'Blocked: Property Manager attempted restricted KMS configuration write.',
    ipAddress: '102.176.65.18',
    status: 'BLOCKED_403',
  },
  {
    id: 'api-log-1',
    timestamp: '2026-09-21 14:22:10 UTC',
    actor: 'Fobellah N. (Super Admin)',
    action: 'ROTATED_SECRET',
    targetService: 'MTN MoMo API (CFA)',
    details: 'Cryptographic API key rotated; HMAC-SHA256 signature salt refreshed',
    ipAddress: '197.234.219.42 (Whitelisted)',
    status: 'SUCCESS',
  },
  {
    id: 'api-log-2',
    timestamp: '2026-09-21 13:58:05 UTC',
    actor: 'Fobellah N. (Super Admin)',
    action: 'ENDPOINT_CONFIG',
    targetService: 'Orange Money API Gateway',
    details: 'Updated live webhook destination URL to https://api.sunriseholdings.com/webhooks/om',
    ipAddress: '197.234.219.42 (Whitelisted)',
    status: 'SUCCESS',
  },
  {
    id: 'api-log-3',
    timestamp: '2026-09-21 12:15:30 UTC',
    actor: 'P. Mensah (Property Manager)',
    action: 'MUTATE_API_CONFIG_ATTEMPT',
    targetService: 'Visa / Stripe API',
    details: 'Blocked: Non-Super-Admin attempted to modify live API credential. 403 Forbidden emitted.',
    ipAddress: '102.176.65.18',
    status: 'BLOCKED_403',
  },
  {
    id: 'api-log-4',
    timestamp: '2026-09-20 18:40:11 UTC',
    actor: 'Fobellah N. (Super Admin)',
    action: 'RATE_LIMIT_UPDATE',
    targetService: 'System API Gateway',
    details: 'Token bucket replenishment rate set to 120 req/min; burst capacity 150',
    ipAddress: '197.234.219.42 (Whitelisted)',
    status: 'SUCCESS',
  },
  {
    id: 'api-log-5',
    timestamp: '2026-09-14 09:10:00 UTC',
    actor: 'Fobellah N. (Super Admin)',
    action: 'GATEWAY_UPGRADE',
    targetService: 'CamerPay / Ecobank Integration',
    details: 'Updated TLS cipher suites to require TLS 1.3 only; disabled legacy TLS 1.2',
    ipAddress: '197.234.219.42 (Whitelisted)',
    status: 'SUCCESS',
  },
  {
    id: 'api-log-6',
    timestamp: '2026-08-30 16:20:00 UTC',
    actor: 'Security Kernel',
    action: 'CERT_RENEWED',
    targetService: 'api.sunriseholdings.com Wildcard SSL',
    details: 'Automated Let’s Encrypt 90-day certificate renewal executed without downtime',
    ipAddress: '127.0.0.1 (Internal System)',
    status: 'SUCCESS',
  },
];

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<UserRole>('super_admin');
  const [securityControls, setSecurityControls] = useState<SecurityControlSetting[]>(SECURITY_CONTROLS_DATA);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(120);
  const [apiAuditLogs, setApiAuditLogs] = useState<ApiAuditLogEntry[]>(INITIAL_API_AUDIT_LOGS);
  const orgId = 'org_sunrise_tx_9012';

  // Session & MFA states
  const [loginSession, setLoginSession] = useState<LoginSessionState>({
    isAuthenticated: true,
    isMfaVerified: true,
    verifiedChannel: 'phone',
    lastMfaVerifiedAt: '2026-10-09 11:20 UTC',
    sessionToken: 'sess_sec_9918a7b3c2e1',
    trustedDevice: true,
    isLocked: false,
  });

  const [activeMfaChallenge, setActiveMfaChallenge] = useState<MfaChallenge | null>(null);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaSuccessCallback, setMfaSuccessCallback] = useState<((challenge: MfaChallenge) => void) | null>(null);
  const [mfaSimulatedIncomingCode, setMfaSimulatedIncomingCode] = useState<string | null>(null);

  const currentUser = INITIAL_USERS.find((u) => u.role === activeRole) || INITIAL_USERS[0];

  const isLoginMfaEnforced = securityControls.find((c) => c.id === 'sec-mfa-login')?.active ?? true;
  const isPaymentMfaEnforced = securityControls.find((c) => c.id === 'sec-mfa-payment')?.active ?? true;

  const setIsLoginMfaEnforced = (active: boolean) => {
    setSecurityControls((prev) =>
      prev.map((c) => (c.id === 'sec-mfa-login' ? { ...c, active } : c))
    );
    showSecurityNotification(`Login MFA policy ${active ? 'ENFORCED (NIST SP 800-63B)' : 'DISABLED'}.`);
  };

  const setIsPaymentMfaEnforced = (active: boolean) => {
    setSecurityControls((prev) =>
      prev.map((c) => (c.id === 'sec-mfa-payment' ? { ...c, active } : c))
    );
    showSecurityNotification(`Payment MFA policy (PSD2 SCA / 3DS 2.2) ${active ? 'ENFORCED' : 'DISABLED'}.`);
  };

  const showSecurityNotification = (msg: string) => {
    setSecurityAlert(msg);
    setTimeout(() => {
      setSecurityAlert((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const clearSecurityAlert = () => setSecurityAlert(null);

  const logApiAction = (
    action: string,
    targetService: string,
    details: string,
    status: 'SUCCESS' | 'BLOCKED_403' = 'SUCCESS'
  ) => {
    const newEntry: ApiAuditLogEntry = {
      id: `api-log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: `${currentUser.name} (${currentUser.roleTitle})`,
      action,
      targetService,
      details,
      ipAddress: '197.234.219.42 (Whitelisted)',
      status,
    };
    setApiAuditLogs((prev) => [newEntry, ...prev]);
  };

  const setActiveRole = (role: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role);
    // If Login MFA is enforced and switching to a high privilege role or tenant, issue prompt
    if (isLoginMfaEnforced && (role === 'super_admin' || role === 'admin' || role === 'owner')) {
      openMfaChallenge({
        purpose: 'login',
        channel: targetUser?.mfaPreferredChannel || 'phone',
        user: targetUser || currentUser,
        onVerified: () => {
          setActiveRoleState(role);
          setLoginSession((prev) => ({
            ...prev,
            isAuthenticated: true,
            isMfaVerified: true,
            verifiedChannel: targetUser?.mfaPreferredChannel || 'phone',
            lastMfaVerifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
            isLocked: false,
          }));
          showSecurityNotification(`Authenticated as ${targetUser?.name || role}. RBAC policies re-evaluated with verified MFA.`);
        },
      });
      return;
    }

    setActiveRoleState(role);
    showSecurityNotification(`Switched role context to: ${targetUser?.roleTitle || role} (${role}). RBAC policies re-evaluated.`);
  };

  const setUserRole = setActiveRole;

  const toggleSecurityControl = (id: string) => {
    setSecurityControls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  // Generate 6-digit verification code
  const generateRandomOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  // Open MFA Challenge
  const openMfaChallenge = ({
    purpose,
    channel,
    user = currentUser,
    paymentDetails,
    onVerified,
  }: {
    purpose: MfaPurpose;
    channel?: MfaChannel;
    user?: UserProfile;
    paymentDetails?: MfaPaymentDetails;
    onVerified?: (challenge: MfaChallenge) => void;
  }): MfaChallenge => {
    const selectedChannel: MfaChannel =
      channel || user.mfaPreferredChannel || (purpose === 'payment' ? 'phone' : 'email');
    
    const destinationRaw =
      selectedChannel === 'email'
        ? user.email
        : user.phoneNumber || '+237 677 41 89 20';

    const destinationMasked =
      selectedChannel === 'email'
        ? maskEmail(destinationRaw)
        : maskPhone(destinationRaw);

    const otpCode = generateRandomOtp();

    const challenge: MfaChallenge = {
      id: `mfa-chal-${Date.now()}`,
      purpose,
      channel: selectedChannel,
      destinationMasked,
      destinationRaw,
      code: otpCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
      attempts: 0,
      maxAttempts: 3,
      paymentDetails,
      verified: false,
      user,
    };

    setActiveMfaChallenge(challenge);
    setIsMfaModalOpen(true);
    setMfaSuccessCallback(() => onVerified || null);
    setMfaSimulatedIncomingCode(otpCode);

    logApiAction(
      purpose === 'login' ? 'MFA_LOGIN_CHALLENGE_ISSUED' : 'MFA_PAYMENT_CHALLENGE_ISSUED',
      selectedChannel === 'email' ? 'Transactional Email Hub (SMTP/TLS)' : 'SMS Carrier Direct Gateway',
      `6-digit OTP challenge dispatched to ${destinationMasked} for ${purpose.toUpperCase()} authorization.`
    );

    showSecurityNotification(
      `[MFA Gateway] 6-digit OTP code dispatched via ${selectedChannel.toUpperCase()} to ${destinationMasked}.`
    );

    return challenge;
  };

  // Switch Delivery Channel
  const switchMfaChannel = (newChannel: MfaChannel) => {
    if (!activeMfaChallenge) return;
    const user = activeMfaChallenge.user || currentUser;
    const destinationRaw =
      newChannel === 'email'
        ? user.email
        : user.phoneNumber || '+237 677 41 89 20';

    const destinationMasked =
      newChannel === 'email'
        ? maskEmail(destinationRaw)
        : maskPhone(destinationRaw);

    const newCode = generateRandomOtp();

    const updated: MfaChallenge = {
      ...activeMfaChallenge,
      channel: newChannel,
      destinationRaw,
      destinationMasked,
      code: newCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    };

    setActiveMfaChallenge(updated);
    setMfaSimulatedIncomingCode(newCode);

    logApiAction(
      'MFA_CHANNEL_SWITCHED',
      newChannel === 'email' ? 'Email Dispatcher' : 'SMS Push Service',
      `Switched OTP delivery channel to ${newChannel.toUpperCase()} (${destinationMasked}). Code regenerated.`
    );

    showSecurityNotification(`Switched MFA channel to ${newChannel.toUpperCase()}: code resent to ${destinationMasked}.`);
  };

  // Resend code
  const resendMfaCode = (channel?: MfaChannel): { success: boolean; message: string; challenge?: MfaChallenge } => {
    if (!activeMfaChallenge) {
      return { success: false, message: 'No active MFA challenge found.' };
    }

    const selectedChannel = channel || activeMfaChallenge.channel;
    const user = activeMfaChallenge.user || currentUser;
    const destinationRaw =
      selectedChannel === 'email'
        ? user.email
        : user.phoneNumber || '+237 677 41 89 20';

    const destinationMasked =
      selectedChannel === 'email'
        ? maskEmail(destinationRaw)
        : maskPhone(destinationRaw);

    const newCode = generateRandomOtp();

    const updated: MfaChallenge = {
      ...activeMfaChallenge,
      channel: selectedChannel,
      destinationRaw,
      destinationMasked,
      code: newCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    };

    setActiveMfaChallenge(updated);
    setMfaSimulatedIncomingCode(newCode);

    logApiAction(
      'MFA_CODE_RESENT',
      selectedChannel === 'email' ? 'Transactional Email Hub' : 'Carrier SMS Gateway',
      `Fresh OTP token re-issued to ${destinationMasked}. Prior challenge invalidated.`
    );

    showSecurityNotification(`New 6-digit OTP code dispatched to ${destinationMasked}.`);

    return { success: true, message: `New code sent to ${destinationMasked}`, challenge: updated };
  };

  // Verify code
  const verifyMfaCode = (code: string): { success: boolean; message: string; challenge?: MfaChallenge } => {
    if (!activeMfaChallenge) {
      return { success: false, message: 'No active challenge found. Please initiate authentication.' };
    }

    if (Date.now() > activeMfaChallenge.expiresAt) {
      logApiAction(
        'MFA_CHALLENGE_EXPIRED',
        'Authentication Kernel',
        `Attempted verification of expired challenge ${activeMfaChallenge.id}.`,
        'BLOCKED_403'
      );
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (activeMfaChallenge.attempts >= activeMfaChallenge.maxAttempts) {
      logApiAction(
        'MFA_CHALLENGE_LOCKED',
        'Authentication Kernel',
        `Maximum attempt threshold (${activeMfaChallenge.maxAttempts}) exceeded for challenge ${activeMfaChallenge.id}.`,
        'BLOCKED_403'
      );
      return { success: false, message: 'Too many incorrect attempts. Please request a new code.' };
    }

    const cleanedInput = code.trim().replace(/\s+/g, '');
    const cleanedTarget = activeMfaChallenge.code.trim();

    if (cleanedInput !== cleanedTarget) {
      const nextAttempts = activeMfaChallenge.attempts + 1;
      setActiveMfaChallenge((prev) => (prev ? { ...prev, attempts: nextAttempts } : null));

      logApiAction(
        'MFA_VERIFICATION_FAILED',
        'Authentication Kernel',
        `Incorrect code input (${nextAttempts}/${activeMfaChallenge.maxAttempts}) for ${activeMfaChallenge.purpose.toUpperCase()} challenge.`,
        'BLOCKED_403'
      );

      return {
        success: false,
        message: `Invalid code. ${activeMfaChallenge.maxAttempts - nextAttempts} attempt(s) remaining.`,
      };
    }

    // Success!
    const verifiedChallenge: MfaChallenge = {
      ...activeMfaChallenge,
      verified: true,
    };

    setActiveMfaChallenge(verifiedChallenge);

    if (verifiedChallenge.purpose === 'login') {
      setLoginSession((prev) => ({
        ...prev,
        isAuthenticated: true,
        isMfaVerified: true,
        verifiedChannel: verifiedChallenge.channel,
        lastMfaVerifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        isLocked: false,
      }));

      logApiAction(
        'MFA_LOGIN_SUCCESS',
        'Zero-Trust Auth Kernel',
        `User ${verifiedChallenge.user?.name || currentUser.name} successfully authenticated via ${verifiedChallenge.channel.toUpperCase()} MFA (${verifiedChallenge.destinationMasked}). Session token issued.`
      );

      showSecurityNotification(`Login MFA Verified: Welcome back, ${verifiedChallenge.user?.name || currentUser.name}!`);
    } else {
      logApiAction(
        'MFA_PAYMENT_SUCCESS',
        'PSD2 SCA Engine',
        `Payment authorization verified via ${verifiedChallenge.channel.toUpperCase()} MFA (${verifiedChallenge.destinationMasked}) for ${verifiedChallenge.paymentDetails?.amount || ''} ${verifiedChallenge.paymentDetails?.currency || ''}. HMAC signature stamped.`
      );

      showSecurityNotification(
        `Payment Multi-Factor Authentication Approved: ${verifiedChallenge.paymentDetails?.amount || ''} ${verifiedChallenge.paymentDetails?.currency || ''} authorized via ${verifiedChallenge.channel.toUpperCase()}.`
      );
    }

    // Fire callback
    if (mfaSuccessCallback) {
      mfaSuccessCallback(verifiedChallenge);
    }

    return {
      success: true,
      message: 'Multi-Factor Authentication verified successfully!',
      challenge: verifiedChallenge,
    };
  };

  const closeMfaModal = () => {
    setIsMfaModalOpen(false);
    setActiveMfaChallenge(null);
    setMfaSimulatedIncomingCode(null);
  };

  const lockSession = () => {
    setLoginSession((prev) => ({
      ...prev,
      isLocked: true,
    }));
    logApiAction('SESSION_LOCKED', 'Identity Provider', `Session locked by user ${currentUser.name}. Screen secured.`);
    showSecurityNotification('Security Lock engaged. Re-authentication via Multi-Factor Authentication required.');
  };

  const unlockSession = () => {
    openMfaChallenge({
      purpose: 'login',
      channel: currentUser.mfaPreferredChannel || 'phone',
      user: currentUser,
      onVerified: () => {
        setLoginSession((prev) => ({
          ...prev,
          isLocked: false,
          isMfaVerified: true,
        }));
        showSecurityNotification('Session unlocked: Multi-Factor Authentication verified.');
      },
    });
  };

  const clearSimulatedCode = () => {
    setMfaSimulatedIncomingCode(null);
  };

  const canPerform = (action: string): boolean => {
    // If session is locked, block all write actions
    if (loginSession.isLocked) return false;

    switch (action) {
      case 'api.edit':
      case 'api.rotate_key':
      case 'api.configure_webhooks':
      case 'api.manage_endpoints':
      case 'gateways.configure_api':
      case 'integrations.rotate_key':
      case 'rates.edit':
        // STRICT REQUIREMENT: Only Super Admin can edit API configurations
        return activeRole === 'super_admin';
      case 'plugin.manage':
      case 'plugin.mesomb_edit':
      case 'plugin.mesomb_settings':
        // STRICT REQUIREMENT: Only Admin and Super Admin can manage and edit MeSomb plugin settings
        return activeRole === 'super_admin' || activeRole === 'admin';
      case 'finance.refund':
        return activeRole === 'super_admin' || activeRole === 'owner' || activeRole === 'accountant';
      case 'finance.export':
        return activeRole === 'super_admin' || activeRole === 'owner' || activeRole === 'accountant';
      case 'maintenance.assign':
      case 'maintenance.approve_quote':
      case 'maintenance.close':
        return activeRole === 'super_admin' || activeRole === 'owner' || activeRole === 'property_manager';
      case 'documents.owner_only':
        return activeRole === 'super_admin' || activeRole === 'owner';
      case 'documents.restricted':
        return activeRole === 'super_admin' || activeRole === 'owner' || activeRole === 'property_manager';
      case 'members.invite':
        return activeRole === 'super_admin' || activeRole === 'owner' || activeRole === 'property_manager';
      case 'members.remove':
        return activeRole === 'super_admin' || activeRole === 'owner';
      case 'properties.create':
        return activeRole === 'super_admin' || activeRole === 'owner' || activeRole === 'property_manager';
      default:
        return activeRole !== 'read_only';
    }
  };

  const triggerRateLimitSim = () => {
    setIsRateLimited(true);
    setRateLimitRemaining(0);
    showSecurityNotification('429 Too Many Requests (Rate limit 120/min exceeded). Retry-After: 15s');
    setTimeout(() => {
      setIsRateLimited(false);
      setRateLimitRemaining(120);
    }, 8000);
  };

  const simulateRateLimitHit = () => {
    setRateLimitRemaining((prev) => {
      const next = Math.max(0, prev - 25);
      if (next === 0) {
        setIsRateLimited(true);
        showSecurityNotification('HTTP 429 Too Many Requests: Rate limiter token bucket depleted (0/120). Retry-After: 15s');
        setTimeout(() => {
          setIsRateLimited(false);
          setRateLimitRemaining(120);
        }, 8000);
      } else {
        showSecurityNotification(`25 API requests processed. Rate limiter token bucket: ${next}/120 remaining.`);
      }
      return next;
    });
  };

  const resetRateLimit = () => {
    setRateLimitRemaining(120);
    setIsRateLimited(false);
    showSecurityNotification('Token bucket replenished: 120 tokens restored.');
  };

  return (
    <SecurityContext.Provider
      value={{
        currentUser,
        activeRole,
        setActiveRole,
        setUserRole,
        securityControls,
        toggleSecurityControl,
        canPerform,
        securityAlert,
        securityNotification: securityAlert,
        showSecurityNotification,
        clearSecurityAlert,
        orgId,
        isRateLimited,
        rateLimitRemaining,
        triggerRateLimitSim,
        simulateRateLimitHit,
        resetRateLimit,
        apiAuditLogs,
        logApiAction,

        // MFA
        isLoginMfaEnforced,
        isPaymentMfaEnforced,
        setIsLoginMfaEnforced,
        setIsPaymentMfaEnforced,
        loginSession,
        activeMfaChallenge,
        isMfaModalOpen,
        mfaSimulatedIncomingCode,
        openMfaChallenge,
        verifyMfaCode,
        resendMfaCode,
        switchMfaChannel,
        closeMfaModal,
        lockSession,
        unlockSession,
        isSessionLocked: loginSession.isLocked,
        clearSimulatedCode,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

