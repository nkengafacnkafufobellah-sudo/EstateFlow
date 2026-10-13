# EstateFlow — Property & Security Operations Platform

**EstateFlow** is an enterprise-grade property operations, tenant portal, maintenance workflow, and financial reconciliation system built with strict least-privilege Role-Based Access Control (RBAC), multi-factor authentication (MFA) for logins and payments, automated PDF receipting, recurring payment autopay tracking, and real-time security access auditing.

---

## Table of Contents

- [Overview & Core Value](#overview--core-value)
- [Key Features & System Capabilities](#key-features--system-capabilities)
  - [1. Multi-Factor Authentication (MFA) for Login & Payment](#1-multi-factor-authentication-mfa-for-login--payment)
  - [2. Access Logs & Security Audit Panel](#2-access-logs--security-audit-panel)
  - [3. Financial Reconciliation & Recurring Payment History](#3-financial-reconciliation--recurring-payment-history)
  - [4. Payment Gateways & MeSomb Mobile Money](#4-payment-gateways--mesomb-mobile-money)
  - [5. Automated PDF Receipts & Archival](#5-automated-pdf-receipts--archival)
  - [6. Maintenance Workflow & Vendor Workbench](#6-maintenance-workflow--vendor-workbench)
  - [7. Tenant Mobile Portal](#7-tenant-mobile-portal)
  - [8. Role-Based Access Control (RBAC) & Governance](#8-role-based-access-control-rbac--governance)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Data Models & Types](#data-models--types)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build & Linting](#production-build--linting)
- [Environment Variables](#environment-variables)
- [Security & Compliance Highlights](#security--compliance-highlights)

---

## Overview & Core Value

EstateFlow bridges the gap between daily real-estate management operations and rigorous financial-grade security standards. It serves multi-tenant real estate holding companies, residential property managers, commercial asset teams, service vendors, and tenants through unified, role-tailored workspaces.

### Target Personas & User Roles
| Role | Identifier | Responsibilities & Scope |
| :--- | :--- | :--- |
| **Super Administrator** | `super_admin` | Global system governance, master tenant isolation, API integrations, global security controls, audit logs. |
| **Property Manager / Admin** | `admin` | Portfolio oversight, unit allocations, tenant agreements, financial reconciliations, payment gateway setups. |
| **Leasing Agent** | `agent` | Tenant vetting, lease drafting, unit tours, occupancy tracking. |
| **Maintenance Coordinator** | `maintenance` | Work order triage, vendor scheduling, priority SLAs, maintenance calendar. |
| **Tenant** | `tenant` | Mobile-first portal, lease details, maintenance issue reporting, rent payment with step-up MFA. |
| **External Vendor / Contractor**| `vendor` | Vendor workbench, ticket acceptance, time logging, proof-of-work documentation. |

---

## Key Features & System Capabilities

### 1. Multi-Factor Authentication (MFA) for Login & Payment

Multi-Factor Authentication is deeply integrated into both authentication and financial transaction paths:

- **Dual-Channel Delivery**:
  - **Email Verification**: Sends time-based 6-digit OTP codes to the user's registered corporate or personal email.
  - **Phone / SMS Verification**: Sends time-based 6-digit OTP codes to registered mobile numbers formatted for international standards (e.g., E.164, Mobile Money SIM numbers).
- **Login MFA Challenge**:
  - Enforced when switching into privileged roles (`super_admin`, `admin`, `maintenance`).
  - Guards session elevation and administrative workspaces.
  - Interactive test modal with live countdown timers, channel toggling, and quick-fill simulator helpers.
- **Payment MFA (PSD2 SCA / 3D Secure Step-Up)**:
  - High-value rent payments, utility bills, and manual collections trigger mandatory multi-factor authentication before payment authorization.
  - Displays transparent transaction details (amount, recipient, gateway, unit, purpose).
  - Verifies payment intent to prevent unauthorized account debits or fraud.
  - Automatically records `PAYMENT_MFA_CHALLENGE` and `PAYMENT_MFA_SUCCESS` events in the immutable audit log.

### 2. Access Logs & Security Audit Panel

Located under the **Security Audit** workspace (`SecurityAuditPanel.tsx`), the **Access Logs** component (`AccessLogs.tsx`) provides granular administrative oversight:

- **Event Telemetry**:
  - Tracks user ID, timestamp, event type (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `MFA_CHALLENGE`, `MFA_VERIFIED`, `PAYMENT_MFA_CHALLENGE`, `PAYMENT_MFA_SUCCESS`, `SESSION_REFRESH`, `SUSPICIOUS_GEO_HOP`, `LOGOUT`).
  - IP Address recording with Geolocation metadata (City, Country flag, ISP/ASN).
  - Client device fingerprint (browser engine, operating system, platform).
  - Risk assessment status (`LOW`, `ELEVATED`, `CRITICAL`).
- **Filtering & Pagination**:
  - Search by user ID, email, IP, or location.
  - Filter by event type, risk severity, and date range (`SecurityDateRangePicker.tsx`).
  - Clean pagination with configurable rows-per-page.
- **Export & Audit Reporting**:
  - Generates comprehensive PDF Security Audit Reports (`auditReportGenerator.ts`) containing executive summaries, policy posture, and incident logs.

### 3. Financial Reconciliation, Recurring Autopay & Fintech Hub

The **Payments & Finance** module (`FinanceReconciliation.tsx` & `FintechHubPanel.tsx`) serves as the comprehensive enterprise financial operating system:

- **Fintech Operations & Treasury Hub (`FintechHubPanel.tsx`)**:
  - **Multi-Currency Treasury Wallets**:
    - Real-time balances across USD Operating Treasury, Central Africa Afriland/MeSomb Clearing Pool (114.25M CFA), Statutory Escrow Vault, European EUR Reserve, and Vendor Payout Reserves.
    - Inter-wallet instant fund transfers with zero internal fees and cryptographic audit logging.
  - **Statutory Security Deposit Escrow Trust**:
    - Segregated, non-commingled trust accounts yielding 2.85% APY interest.
    - Statutory damage deduction claim filing with itemized repair invoices and damage photo documentation.
    - One-click escrow refund release with accrued interest calculations.
  - **Virtual Corporate Expense Cards & MCC Controls**:
    - Instant issuance of virtual Mastercard and Visa cards for property managers and key contractors (e.g. AquaFix, VoltCraft).
    - Category locking (Merchant Category Code restrictions: Hardware, plumbing supplies, HVAC parts only).
    - Monthly spending limits and live utilization meters.
    - One-click instant card freeze / unfreeze.
    - Masked PAN and CVV security with Step-Up MFA authorization required to reveal numbers.
  - **Rent-Now-Pay-Later (RNPL) Micro-Advance Facility**:
    - Zero-interest (0% APR) 14-day emergency bridge advances for verified tenants.
    - Synchronized with tenant payroll or Mobile Money collection cycles.
    - Automatic credit bureau positive reporting (+12 to +19 pts Experian / Equifax).
  - **Split Rent Payments & Co-Signer Protection**:
    - Roommate proportional rent split allocations across diverse payment rails (Card, ACH, MTN MoMo, Orange Money).
    - Automated secondary co-signer guarantee trigger if roommate share lapses past the grace window.
  - **Cross-Border Interbank FX Conversion Desk**:
    - Live currency swap quote calculation between USD, EUR, GBP, and CFA Franc.
    - Zero-spread interbank transfer simulator with instant clearing.
  - **Fintech Governance, Risk Rules & Settings**:
    - Configurable automated payout schedules (Instant, Daily at 18:00 UTC, Weekly Net 7).
    - PSD2 Step-Up MFA threshold slider (enforces OTP verification for transactions over $1,000 / 500k CFA).
    - Platform processing take-rate percentage slider (0% to 5%).
    - Payment rail routing priorities (Smart Fallback, MeSomb Priority, Stripe Global).
    - Real-time Anti-Money Laundering (AML) velocity fraud shields and disbursement dual-approval policies.

- **Live Rent Ledger & Autopay History**:
  - Real-time status of all active leases, amounts due, settled payments, overdue arrears, and collection channels.
  - **Recurring Payment History (`RecurringPaymentHistory.tsx`)**: Auto-debit mandates, payment frequencies (Monthly, Quarterly, Bi-Weekly), and failure retry queues.
  - **Reconciliation KPI Ribbon**: Settled & Reconciled total sums, pending webhook counts, and automated PDF receipts issued.

### 4. Properties & Units Manager — Pictures, Submitter Verification & Privileged Approval

The **Properties & Units** workspace (`PropertiesManager.tsx`) provides end-to-end asset lifecycle governance:

- **Architectural Imagery & Picture Presets**:
  - High-resolution architectural photography presets (Palais de Bonanjo Luxury Residence, Executive Townhouse Estate, Oak Modern Residence, Suburban Palm Villa, Metropolitan Commercial Tower).
  - Custom image URL support and live preview thumbnail rendered during property creation.
- **Comprehensive Asset Metadata**:
  - Cadastral Parcel ID (e.g., `CAD-LT-DLA-5102-X`).
  - Estimated Asset Valuation in USD/CFA.
  - Year Built, total unit count, and occupancy tracking.
  - Infrastructure & Amenities checklist (24/7 Security CCTV, Solar Generator Backup, High-Speed Fiber, Smart Locks, Underground Parking, EV Charging).
- **Submitter Identity & Legal Asset Verification**:
  - Mandatory submitter ID credentials (National ID Card, International Passport, or Driver License) with document number.
  - Document attachments for Submitter ID Scan (`.pdf`) and Cadastral Title Deed / Land Certificate (`.pdf`).
  - Notary seal reference and municipal registry audit reference.
  - Legal attestation declaration affirming physical on-site survey and unencumbered title authenticity.
- **Privileged Approval Workflow (Super Admin & Owner Exclusive)**:
  - **Least-Privilege RBAC Boundary**: Newly added properties by property managers enter a `PENDING_APPROVAL` queue.
  - **Super Admin & Portfolio Owner Privilege**: Only users holding the `super_admin` or `owner` role hold the authority to inspect credentials and grant final legal approval.
  - **Document Inspection Modal**: Review submitter ID card scan, title deed documents, and cadastral references.
  - **Cryptographic Seal Generation**: Approved assets receive a digital compliance hash (`#CERT-AUTH-...`), status changes to `Healthy`, and operations unlock.
  - **Non-Privileged Guard**: Other roles (property managers, accountants, agents) see an informative lock banner indicating that only Super Admin or Portfolio Owner accounts can approve newly submitted properties.

### 5. Payment Gateways & MeSomb Mobile Money

Integrated payment rail orchestration (`PaymentGatewaysManager.tsx` & `MesombPluginManagerModal.tsx`):

- **Supported Payment Rails**:
  - **MeSomb Mobile Money (MTN MoMo & Orange Money)**: Cameroon & Central/West Africa regional leader with USSD push verification.
  - **Stripe & Credit Cards**: Visa, Mastercard, American Express.
  - **Digital Wallets**: Apple Pay, Google Pay, PayPal.
  - **Direct Wire**: ACH / SEPA Bank Transfer.
- **MeSomb Plugin Manager**:
  - Default payment gateway configuration for mobile collections.
  - Secret key, application key, and service pin management restricted to administrators.
  - Webhook URL simulation and live test transactions.

### 6. Automated PDF Receipts & Archival

- **Automated Generation (`pdfReceiptGenerator.ts`)**:
  - Generates official, tamper-evident payment receipts via `jspdf`.
  - Includes receipt number, property address, tenant details, payment timestamp, gateway transaction hash, breakdown of rent/service/tax, and security authorization stamp.
- **Receipts Archive (`ReceiptsContext.tsx`)**:
  - In-app preview modal (`ReceiptPreviewModal.tsx`) with PDF download and email dispatch simulation.
  - Verified receipt lookup linking both ledger items and recurring history entries.

### 7. Maintenance Workflow & Vendor Workbench

- **Maintenance Workflow (`MaintenanceWorkflow.tsx`)**:
  - Kanban and list views of incoming maintenance requests.
  - Categorization (Plumbing, Electrical, HVAC, Structural, Appliance).
  - Priority SLA badges (Emergency, High, Medium, Low) and cost tracking.
- **Maintenance Calendar (`MaintenanceCalendar.tsx`)**:
  - Timeline view of scheduled maintenance visits, inspections, and contractor visits.
- **Vendor Workbench & Performance (`VendorWorkbenchView.tsx` & `VendorPerformanceView.tsx`)**:
  - Specialized view for external service providers with a smartphone dispatch simulator and live payout summaries.
  - Guided 4-step job progression (Accepted, On Site via GPS check-in, In Progress, Evidence & Complete).
  - Mandatory photo proof and receipt attachments blocking invoice submissions until satisfied.
  - **Vendor Performance Analytics View (Recharts)**:
    - **Response Time Latency Visualization**: `AreaChart` and `LineChart` tracking initial acknowledgment latency against contractual 30-minute SLA limits and emergency <15m thresholds.
    - **Resolution Rate & Volume Distribution**: `ComposedChart` and `BarChart` tracking percentage of work orders resolved within contractual SLA windows (98.4%) against the 95% Gold SLA threshold, plus first-time fix rates (94.6%).
    - **Trade Category Benchmarking**: Multi-trade comparative diagnostics across Plumbing, HVAC, Electrical, Locksmith, and Appliances.
    - **Vendor Directory Scorecards**: Performance badges, SLA compliance tiers, active/closed counts, and tenant satisfaction ratings (4.92/5.0).

### 8. Tenant Mobile Portal

Responsive, mobile-optimized experience for residents (`TenantMobileView.tsx`):

- View current lease term, monthly rent amount, and payment due date.
- Submit maintenance work orders with photo attachment simulation.
- Quick "Pay Rent" action with built-in Step-Up MFA (email/SMS code verification).
- Access receipt archive and lease agreement documents.
- **Mobile Profile & Settings Tab**:
  - Edit tenant full name, email, mobile phone number (for SMS MFA & MoMo receipts), and emergency escalation contact.
  - Configure mobile app settings: display currency (USD, EUR, GBP, XAF), app language (EN/FR), rent reminder notifications (1, 3, 5, 7 days before due date), SMS alerts, Biometric/Face ID unlock, and audible payment confirmation chimes.

### 9. Role-Based Access Control (RBAC) & Governance

- Role switcher in the top navigation header for testing and role simulation.
- Contextual workspace navigation: buttons and actions automatically adapt or hide according to active permissions.
- Centralized security rules and policies managed in `SecurityContext.tsx`.

### 9. Profile Editing & Application Settings Across Both Platforms

EstateFlow provides unified profile management and system preference configuration across both desktop and mobile environments:

- **Desktop Platform (`ProfileSettingsModal.tsx` & `Header.tsx`)**:
  - Accessible via the top navigation header and user persona dropdown.
  - **My Profile Tab**: Edit full name, email address, SMS MFA phone number, role title, emergency contact, avatar color themes, and preferred MFA delivery channel (Phone SMS vs Email OTP).
  - **App Settings Tab**: Configure platform display currency (USD, EUR, GBP, XAF), system language (English / Français), ISO/regional date formats, timezone anchors, zero-trust inactivity auto-lock timers (5m, 15m, 30m, 60m), biometric unlock simulation, and alert notification channels (email, SMS, sound chimes).
- **Mobile Platform (`TenantMobileView.tsx` & `VendorWorkbenchView.tsx`)**:
  - **Tenant Mobile Portal**: Dedicated Profile & Settings tab with in-place profile editor, multi-currency rent converter, language toggle, rent reminder lead-time selectors, and Face ID security toggle.
  - **Vendor Mobile Workbench**: Dedicated Contractor Profile editor updating company name, lead technician, dispatch contact phone, payout channel (Bank Wire vs MTN MoMo vs Orange Money), dispatch push alerts, loud emergency SLA chime, and GPS auto check-in.

---

## Architecture & Tech Stack

```
   ┌────────────────────────────────────────────────────────┐
   │                       EstateFlow                       │
   │               (React 19 + TypeScript + Vite)           │
   └────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       ▼                       ▼                        ▼
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│  Security    │       │   Receipts   │         │   Currency   │
│   Context    │       │   Context    │         │   Context    │
│ (RBAC & MFA) │       │ (PDF & State)│         │(Multi-FX/XAF)│
└──────────────┘       └──────────────┘         └──────────────┘
       │                       │                        │
       ▼                       ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│                     Application Views                        │
├────────────────────────────────┬─────────────────────────────┤
│ • CommandCenter (Ops Hub)      │ • SecurityAuditPanel        │
│ • PropertiesManager (Units)    │   - AccessLogs (Geolocation)│
│ • TenantsManager (Leases)      │   - MfaVerificationModal    │
│ • MaintenanceWorkflow          │ • SuperAdminDashboard       │
│ • VendorWorkbenchView          │ • TenantMobileView (Portal) │
│ • FinanceReconciliation        │ • PaymentGatewaysManager    │
│   - RecurringPaymentHistory    │ • MesombPluginManagerModal  │
└────────────────────────────────┴─────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │            Utilities & PDF Engine            │
        │  • pdfReceiptGenerator (jsPDF)               │
        │  • auditReportGenerator (Security Reports)   │
        │  • financeCsvExporter (Accounting CSVs)      │
        │  • mesombGatewayUtils (Mobile Money Rails)   │
        └──────────────────────────────────────────────┘
```

- **Frontend Core**: React 19, TypeScript, Vite 8, Recharts
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Animation**: Motion (`motion/react`)
- **Document Generation**: jsPDF
- **Backend / Dev Proxy**: Express & Node.js

---

## Project Directory Structure

```
.
├── index.html                     # HTML5 entry point with SEO & OpenGraph tags
├── metadata.json                  # AI Studio applet specifications & permissions
├── package.json                   # Dependencies & NPM build scripts
├── tsconfig.json                  # TypeScript compiler options
├── vite.config.ts                 # Vite bundler configuration
├── public/                        # Static assets & icons
└── src/
    ├── App.tsx                    # Root layout, role routing, and view switching
    ├── main.tsx                   # React root mount point
    ├── index.css                  # Global styles & Tailwind CSS v4 import
    ├── types.ts                   # Core TypeScript interfaces & types
    ├── context/
    │   ├── SecurityContext.tsx    # RBAC, MFA state, active user, access events
    │   ├── ReceiptsContext.tsx    # Payment receipts store, verification, dispatch
    │   └── CurrencyContext.tsx    # Currency switching (XAF, USD, EUR, GBP)
    ├── components/
    │   ├── AccessLogs.tsx                 # Paginated system access events & geo log
    │   ├── CommandCenter.tsx              # Operations hub, KPI metrics, rapid actions
    │   ├── FinanceCsvExportModal.tsx      # Configurable financial reconciliation export
    │   ├── FinanceReconciliation.tsx      # Ledger, receipts, autopay & gateway hub
    │   ├── Header.tsx                     # Top navigation, role switcher, notifications
    │   ├── MaintenanceCalendar.tsx        # Scheduled repairs & inspection calendar
    │   ├── MaintenanceWorkflow.tsx        # Work order triage, kanban & SLA tracking
    │   ├── MesombPluginManagerModal.tsx   # MeSomb Mobile Money credentials & settings
    │   ├── MfaVerificationModal.tsx       # MFA challenge for login & payment step-up
    │   ├── MobileMoneyPaymentModal.tsx    # USSD payment terminal & MFA step-up execution
    │   ├── Navigation.tsx                 # Primary sidebar navigation
    │   ├── PaymentGatewaysManager.tsx     # Payment rail configuration & credentials
    │   ├── ProfileSettingsModal.tsx       # User profile editing & application preferences modal
    │   ├── PropertiesManager.tsx          # Property portfolio & unit inventory
    │   ├── ReceiptPreviewModal.tsx        # Interactive PDF receipt preview & downloader
    │   ├── RecurringPaymentHistory.tsx    # Recurring autopay mandates & collection history
    │   ├── SecurityAuditPanel.tsx         # Security posture, access logs, PDF audit report
    │   ├── SecurityDateRangePicker.tsx    # Date filter component for security logs
    │   ├── SuperAdminDashboard.tsx        # Master tenant & platform governance view
    │   ├── TenantMobileView.tsx           # Resident mobile portal with rent payment
    │   ├── TenantsManager.tsx             # Tenant lease roster & communication tools
    │   ├── VendorPerformanceView.tsx      # Recharts visualizations of response & resolution rates
    │   └── VendorWorkbenchView.tsx        # Contractor ticket workflow, dispatch & billing logs
    ├── data/
    │   ├── accessLogsData.ts              # Initial system access events & geo samples
    │   ├── estateData.ts                  # Seed properties, tenants, users, work orders
    │   ├── recurringPaymentsData.ts       # Autopay mandates & historical collection runs
    │   └── vendorPerformanceData.ts       # Vendor SLAs, latency trends & trade benchmarks
    └── utils/
        ├── auditReportGenerator.ts        # jsPDF compliance security report export
        ├── dateFilterUtils.ts             # Date comparison and filtering helpers
        ├── financeCsvExporter.ts          # RFC-compliant CSV transaction generator
        ├── mesombGatewayUtils.ts          # Mobile Money fee calculators & payload helpers
        └── pdfReceiptGenerator.ts         # Official payment receipt PDF generator
```

---

## Data Models & Types

Key data models defined in `src/types.ts`:

### UserProfile & Security
```typescript
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  roleTitle: string;
  roleScope: string;
  mfa: 'Enforced' | 'Pending' | 'Disabled';
  mfaPreferredChannel?: MfaChannel; // 'email' | 'phone'
  lastActive: string;
  avatarColor: string;
}

export type MfaChannel = 'email' | 'phone';
export type MfaPurpose = 'login' | 'payment';

export interface MfaPaymentDetails {
  amount: number;
  currency: string;
  payee: string;
  gateway: string;
  unit?: string;
  tenantName?: string;
  reference?: string;
}
```

### System Access Event & Telemetry
```typescript
export interface SystemAccessEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  eventType: AccessEventType;
  status: AccessEventStatus;
  ipAddress: string;
  location: {
    city: string;
    country: string;
    countryCode: string;
    region?: string;
  };
  deviceFingerprint: {
    browser: string;
    os: string;
    deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Server';
  };
  authMethod: 'PASSWORD' | 'MFA_TOTP' | 'MFA_EMAIL_OTP' | 'MFA_SMS_OTP' | 'PAYMENT_MFA_EMAIL' | 'PAYMENT_MFA_SMS' | 'SSO_SAML' | 'API_TOKEN' | 'BIOMETRIC';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, string>;
}
```

### Recurring Payment Mandate & Collections
```typescript
export interface RecurringPaymentMandate {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  category: 'Rent' | 'Service Fee' | 'Parking' | 'Utilities';
  amount: number;
  currency: string;
  frequency: 'Monthly' | 'Quarterly' | 'Bi-Weekly' | 'Annually';
  gateway: GatewayIdentifier;
  accountReference: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED' | 'CANCELLED';
  nextCollectionDate: string;
  lastCollectionDate?: string;
  lastCollectionStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  totalCollected: number;
  createdAt: string;
}
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **Package Manager**: npm (v9+) or bun

### Installation
Clone the repository and install project dependencies:
```bash
npm install
```

### Development Server
Start the development server on `http://localhost:3000`:
```bash
npm run dev
```

### Production Build & Linting
Validate TypeScript compliance and generate optimized production bundles:
```bash
# Type check and lint
npm run lint

# Compile production bundle
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env` to configure optional server integrations:

```bash
# Required for optional AI-assisted lease analysis / maintenance diagnostics
GEMINI_API_KEY="your_api_key_here"

# Application host URL
APP_URL="http://localhost:3000"
```

*Note: In Google AI Studio Build runtime, environment keys are safely passed through backend proxy routes without exposing secrets to client code.*

---

## Security & Compliance Highlights

1. **Least-Privilege RBAC**:
   - Navigation routes and sensitive action handlers enforce user capability boundaries.
   - Non-admin roles cannot view or alter payment gateway credentials or security master settings.

2. **Defense-in-Depth Authentication**:
   - Administrative login elevation challenges users with multi-factor authentication.
   - Financial step-up verification requires explicit OTP confirmation prior to authorizing charges.

3. **Tamper-Evident Access Auditing**:
   - Comprehensive event logging captures client IP, geolocation, risk score, and auth method.
   - Geolocation hop detection flags suspicious cross-border logins.

4. **Zero-Pill Enterprise UI**:
   - Clean, purposeful visual hierarchy utilizing Tailwind CSS v4 design tokens.
   - High-contrast badges, accessible color coding, and responsive layouts across desktop, tablet, and mobile displays.

---

## License

Proprietary — Built for EstateFlow Property Management & Security Operations. All rights reserved.
