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

### 3. Financial Reconciliation & Recurring Payment History

The **Finance & Reconciliation** module (`FinanceReconciliation.tsx`) serves as the core financial ledger:

- **Live Rent Ledger**: Real-time status of all active leases, amounts due, settled payments, overdue arrears, and collection channels.
- **Recurring Payment History (`RecurringPaymentHistory.tsx`)**:
  - Track automated monthly rent and service fee autopay collections.
  - Inspect recurring mandates with frequencies (Monthly, Quarterly, Bi-Weekly).
  - Audit trail of automated collection attempts, gateway references, and transaction IDs.
  - Re-attempt failed automated collections or pause/cancel active recurring mandates.
  - Direct integration into verified receipt generation.
  - New mandate enrollment modal for tenants and units.
  - Dedicated CSV export of recurring autopay logs.
- **Reconciliation KPI Ribbon**:
  - Settled & Reconciled total sums.
  - Pending Webhook & Gateway verification counts.
  - Automated PDF receipts issued.
  - Active Recurring Autopay mandates with instant sub-tab navigation.

### 4. Payment Gateways & MeSomb Mobile Money

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

### 5. Automated PDF Receipts & Archival

- **Automated Generation (`pdfReceiptGenerator.ts`)**:
  - Generates official, tamper-evident payment receipts via `jspdf`.
  - Includes receipt number, property address, tenant details, payment timestamp, gateway transaction hash, breakdown of rent/service/tax, and security authorization stamp.
- **Receipts Archive (`ReceiptsContext.tsx`)**:
  - In-app preview modal (`ReceiptPreviewModal.tsx`) with PDF download and email dispatch simulation.
  - Verified receipt lookup linking both ledger items and recurring history entries.

### 6. Maintenance Workflow & Vendor Workbench

- **Maintenance Workflow (`MaintenanceWorkflow.tsx`)**:
  - Kanban and list views of incoming maintenance requests.
  - Categorization (Plumbing, Electrical, HVAC, Structural, Appliance).
  - Priority SLA badges (Emergency, High, Medium, Low) and cost tracking.
- **Maintenance Calendar (`MaintenanceCalendar.tsx`)**:
  - Timeline view of scheduled maintenance visits, inspections, and contractor visits.
- **Vendor Workbench (`VendorWorkbenchView.tsx`)**:
  - Specialized view for external service providers.
  - Accept/decline work orders, log hours, input material expenses, and mark jobs completed.

### 7. Tenant Mobile Portal

Responsive, mobile-optimized experience for residents (`TenantMobileView.tsx`):

- View current lease term, monthly rent amount, and payment due date.
- Submit maintenance work orders with photo attachment simulation.
- Quick "Pay Rent" action with built-in Step-Up MFA (email/SMS code verification).
- Access receipt archive and lease agreement documents.

### 8. Role-Based Access Control (RBAC) & Governance

- Role switcher in the top navigation header for testing and role simulation.
- Contextual workspace navigation: buttons and actions automatically adapt or hide according to active permissions.
- Centralized security rules and policies managed in `SecurityContext.tsx`.

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

- **Frontend Core**: React 19, TypeScript, Vite 8
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
    │   ├── PropertiesManager.tsx          # Property portfolio & unit inventory
    │   ├── ReceiptPreviewModal.tsx        # Interactive PDF receipt preview & downloader
    │   ├── RecurringPaymentHistory.tsx    # Recurring autopay mandates & collection history
    │   ├── SecurityAuditPanel.tsx         # Security posture, access logs, PDF audit report
    │   ├── SecurityDateRangePicker.tsx    # Date filter component for security logs
    │   ├── SuperAdminDashboard.tsx        # Master tenant & platform governance view
    │   ├── TenantMobileView.tsx           # Resident mobile portal with rent payment
    │   ├── TenantsManager.tsx             # Tenant lease roster & communication tools
    │   └── VendorWorkbenchView.tsx        # Contractor ticket workflow & billing logs
    ├── data/
    │   ├── accessLogsData.ts              # Initial system access events & geo samples
    │   ├── estateData.ts                  # Seed properties, tenants, users, work orders
    │   └── recurringPaymentsData.ts       # Autopay mandates & historical collection runs
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
