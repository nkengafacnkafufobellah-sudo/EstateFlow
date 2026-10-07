export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'property_manager'
  | 'accountant'
  | 'read_only'
  | 'tenant'
  | 'vendor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  roleScope: string;
  mfa: 'Enforced' | 'Pending' | 'Disabled';
  lastActive: string;
  avatarColor: string;
}

export interface RevenueMetricPoint {
  month: string;
  billed: number;
  collected: number;
}

export interface UrgentMaintenanceAlert {
  id: string;
  title: string;
  property: string;
  unit: string;
  priority: 'URGENT' | 'HIGH' | 'SCHEDULED' | 'MED' | 'LOW';
  status: string;
}

export interface LeaseExpirationNotice {
  id: string;
  unit: string;
  property: string;
  tenantName: string;
  expiryDate: string;
  daysRemaining: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  type: 'payment' | 'vendor' | 'lease' | 'security';
  unread: boolean;
}

export interface PropertyRecord {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: 'Multi-family' | 'Single-family' | 'Commercial';
  unitsTotal: number;
  unitsOccupied: number;
  occupancyPercent: number;
  status: 'Healthy' | 'Watch' | 'Action needed';
  openWorkOrders: number;
  unitsInTurnover: number;
  nextLeaseStart: string;
  documents: {
    name: string;
    size: string;
    date: string;
    verified: boolean;
  }[];
  maintenanceSummary: {
    inProgress: string;
    awaitingApproval: string;
  };
}

export interface TenantDocument {
  id: string;
  name: string;
  date: string;
  accessLevel: 'Owner only' | 'Restricted' | 'Shared';
  isLocked: boolean;
  size?: string;
}

export interface TenantCommLog {
  id: string;
  channel: 'Email' | 'Call' | 'SMS';
  subject: string;
  date: string;
}

export interface TenantRecord {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  unit: string;
  leaseEnd: string;
  rentStatus: 'Current' | 'Due soon' | 'Past due' | 'Renewal open';
  balance: number;
  monthlyRent: number;
  nextDueDate: string;
  autopay: boolean;
  leaseTermMonths: number;
  daysElapsed: number;
  daysRemaining: number;
  moveInDate: string;
  q1CheckinDate: string;
  inspectionDate: string;
  todayDate: string;
  renewalDate: string;
  documents: TenantDocument[];
  communicationHistory: TenantCommLog[];
}

export type MaintenanceStage =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Approval'
  | 'Completed'
  | 'Closed';

export interface MaintenanceActivity {
  id: string;
  date: string;
  time: string;
  description: string;
  author: string;
}

export interface MaintenanceRequestRecord {
  id: string;
  code: string;
  title: string;
  property: string;
  unit: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  status: MaintenanceStage;
  slaLabel: string;
  slaRemainingMinutes: number; // positive = left, negative = breached
  slaBreached: boolean;
  reportedBy: string;
  reportedVia: string;
  vendorAssigned?: string;
  quoteAmount?: number;
  quoteBreakdown?: string;
  quoteStatus?: 'Pending' | 'Approved' | 'Rejected';
  attachments: {
    name: string;
    type: 'IMG' | 'PDF';
    url?: string;
  }[];
  activityHistory: MaintenanceActivity[];
  completionConfirmation?: {
    vendorPhotosCount: number;
    resolvedDate: string;
    closed: boolean;
    tenantNotified: boolean;
  };
}

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'CFA';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  rateAgainstUSD: number;
  decimals: number;
  formatTemplate: string;
}

export type GatewayIdentifier =
  | 'mesomb'
  | 'mtn_momo'
  | 'orange_money'
  | 'express_union'
  | 'gimac_pay'
  | 'camerpay'
  | 'afriland_sara'
  | 'uba_cameroon'
  | 'campost_yoban'
  | 'ecobank_cameroon'
  | 'elyonpay'
  | 'visa'
  | 'mastercard'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer';

export interface GatewayApiConfig {
  endpointUrl: string;
  environment: 'production' | 'sandbox';
  apiKeyPublic: string;
  apiKeySecretMasked: string;
  webhookUrl: string;
  webhookSecretMasked: string;
  lastRotated: string;
  lastPingMs: number;
  status: 'connected' | 'degraded' | 'disabled';
  // MeSomb Unified Gateway specific fields (MTN MoMo & Orange Money)
  applicationKey?: string;
  accessKey?: string;
  secretKeyMasked?: string;
  mesombService?: 'MTN' | 'ORANGE' | 'AUTO';
  // Cameroon & merchant provider specific fields
  merchantId?: string;
  ussdCode?: string;
  serviceProviderCode?: string;
  operatorNetwork?: string;
  cameroonRegionCoverage?: string;
}

export interface LandlordGatewayConfig {
  id: GatewayIdentifier;
  name: string;
  phpClass: string; // e.g. MTNMomoGateway.php from framework Page 5
  active: boolean;
  category: 'mobile_money' | 'card' | 'digital_wallet' | 'bank_transfer';
  supportedCurrencies: SupportedCurrency[];
  feePercentage: number;
  feeFixedUSD: number;
  settlementSpeed: string;
  description: string;
  badge?: string;
  iconName: string;
  countries: string[];
  isCameroonMethod?: boolean;
  cameroonUssd?: string;
  apiConfig?: GatewayApiConfig;
}

export interface MesombPluginConfig {
  pluginName: string;
  pluginVersion: string;
  phpClass: string;
  active: boolean;
  checkoutTitle: string;
  checkoutDescription: string;
  feesIncluded?: boolean;
  conversion?: boolean;
  countries?: string[];
  returnUrl?: string;
  host?: string;
  airtelEnabled?: boolean;
  feePercentage: number;
  feeFixedUSD: number;
  feeAbsorptionMode: 'landlord_absorbs' | 'tenant_pays';
  settlementSpeed: string;
  environment: 'production' | 'sandbox';
  applicationKey: string;
  accessKey: string;
  secretKey: string;
  endpointUrl: string;
  signingAlgorithm: 'HMAC-SHA1' | 'HMAC-SHA256';
  routingService: 'AUTO' | 'MTN' | 'ORANGE';
  mtnEnabled: boolean;
  mtnUssdCode: string;
  mtnServiceProviderCode: string;
  orangeEnabled: boolean;
  orangeUssdCode: string;
  orangeServiceProviderCode: string;
  merchantId: string;
  serviceProviderCode: string;
  webhookUrl: string;
  webhookSecret: string;
  autoReconcileWebhooks: boolean;
  enforceWebhookSignature: boolean;
  regionCoverage: string;
}

export interface PaymentRoutingResult {
  allowed: boolean;
  gateway: LandlordGatewayConfig | null;
  amount: number;
  currency: SupportedCurrency;
  fee: number;
  netSettlement: number;
  settlementCurrency: SupportedCurrency;
  reason?: string;
  routeTrace: string[];
}

export interface FinancialTransaction {
  id: string;
  date: string;
  tenantName: string;
  unit: string;
  reference: string;
  amount: number; // base USD amount
  currency?: SupportedCurrency;
  originalAmount?: number;
  gatewayId?: GatewayIdentifier;
  method: string;
  maskedMethod: string;
  status: 'Settled' | 'Webhook' | 'Retry sched.' | 'Failed';
  idempotencyKey: string;
  gatewayRef: string;
  webhookStatus: string;
  webhookVerified: boolean;
  postedUtc: string;
  retries: number;
  itemizedRent: number;
  itemizedParking: number;
  receiptNumber: string;
  receiptDownloaded: boolean;
  refunded?: boolean;
  reconciled?: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  receiptId?: string;
  autoGeneratedReceipt?: boolean;
  carrierRef?: string;
  ussdCode?: string;
  payerPhone?: string;
  signature?: string;
  serviceProvider?: 'MTN' | 'ORANGE';
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  transactionId: string;
  transactionRef: string;
  issuedAt: string;
  verifiedAt: string;
  verifiedBy: string;
  tenantName: string;
  tenantEmail?: string;
  unit: string;
  propertyName: string;
  propertyAddress: string;
  amountPaid: number;
  currency: SupportedCurrency;
  baseAmountUSD: number;
  exchangeRateUsed?: number;
  paymentMethod: string;
  maskedMethod: string;
  gatewayId?: string;
  gatewayRef: string;
  idempotencyKey: string;
  carrierRef?: string;
  ussdCode?: string;
  payerPhone?: string;
  breakdown: {
    rent: number;
    parking: number;
    utility?: number;
    processingFee?: number;
  };
  verificationHash: string;
  reconciliationStatus: 'VERIFIED_SETTLED' | 'PENDING_AUDIT' | 'RECONCILED';
  pdfGenerated: boolean;
  pdfGeneratedAt: string;
  pdfBlobUrl?: string;
  downloadCount: number;
}

export interface PaymentMethodOrgConfig {
  id: string;
  methodType: 'ACH' | 'VISA' | 'MC';
  maskedNumber: string;
  tenantName: string;
  status: 'Verified' | 'Re-auth required' | '3-D Secure pending';
}

export interface VendorJob {
  id: string;
  code: string;
  title: string;
  property: string;
  unit: string;
  tenantName: string;
  urgency: 'Emergency' | 'Scheduled' | 'Routine';
  slaStatus: string;
  currentStep: 1 | 2 | 3 | 4; // 1: Accepted, 2: On site, 3: In progress, 4: Evidence & complete
  timeline: {
    acceptedTime?: string;
    gpsCheckinTime?: string;
    inProgressTime?: string;
    completedTime?: string;
  };
  evidenceAttached: string[];
  requiredEvidenceCount: number;
  laborHours: number;
  hourlyRate: number;
  partsCost: number;
  partsDescription: string;
  partsReceiptAttached: boolean;
  invoiceSubmitted: boolean;
  platformFeeRate: number;
}

export interface AuditLogItem {
  id: string;
  timestampUtc: string;
  event: string;
  actor: string;
  scope: string;
}

export interface DeviceSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  status: 'Active' | 'Revoked';
  lastActive: string;
}

export interface SecurityControlSetting {
  id: string;
  name: string;
  tagline: string;
  detail: string;
  technicalBadge: string;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  role: string;
  action: string;
  target: string;
  hash: string;
  verified: boolean;
}

export interface RbacPermission {
  permission: string;
  superAdmin?: boolean;
  owner: boolean;
  propertyManager: boolean;
  accountant: boolean;
  vendor: boolean;
}

export interface ApiAuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetService: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'BLOCKED_403';
}

export type ScheduleEventType = 'appointment' | 'inspection';
export type RecurrenceInterval = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'none';
export type EventStatus = 'scheduled' | 'in-progress' | 'completed' | 'overdue';

export interface MaintenanceScheduleEvent {
  id: string;
  title: string;
  type: ScheduleEventType;
  propertyId: string;
  propertyName: string;
  unit?: string;
  date: string; // YYYY-MM-DD
  timeWindow: string;
  vendorOrInspector: string;
  vendorContact?: string;
  recurrence: RecurrenceInterval;
  status: EventStatus;
  linkedTicketCode?: string;
  scopeOfWork: string[];
  complianceCode?: string;
  notes?: string;
  estimatedCost?: number;
}
