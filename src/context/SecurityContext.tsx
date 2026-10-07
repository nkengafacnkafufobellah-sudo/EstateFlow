import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, UserProfile, SecurityControlSetting, ApiAuditLogEntry } from '../types';
import { INITIAL_USERS, SECURITY_CONTROLS_DATA } from '../data/estateData';

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

  const currentUser = INITIAL_USERS.find((u) => u.role === activeRole) || INITIAL_USERS[0];

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    const user = INITIAL_USERS.find((u) => u.role === role);
    showSecurityNotification(`Switched role context to: ${user?.roleTitle || role} (${role}). RBAC policies re-evaluated.`);
  };

  const setUserRole = setActiveRole;

  const toggleSecurityControl = (id: string) => {
    setSecurityControls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
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

  const canPerform = (action: string): boolean => {
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
