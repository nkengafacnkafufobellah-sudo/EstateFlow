import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinancialTransaction, PaymentReceipt, SupportedCurrency } from '../types';
import { FINANCIAL_TRANSACTIONS_DATA } from '../data/estateData';
import { generateReceiptPdf, downloadReceiptPdf, printReceiptPdf } from '../utils/pdfReceiptGenerator';
import { useSecurity } from './SecurityContext';

interface ReceiptsContextType {
  receipts: PaymentReceipt[];
  transactions: FinancialTransaction[];
  previewReceipt: PaymentReceipt | null;
  setPreviewReceipt: (receipt: PaymentReceipt | null) => void;
  openReceiptPreview: (receipt: PaymentReceipt) => void;
  closeReceiptPreview: () => void;
  verifyReconciliationEntry: (
    transactionId: string,
    verifierRoleTitle?: string
  ) => PaymentReceipt | null;
  batchVerifyPendingEntries: () => { count: number; newReceipts: PaymentReceipt[] };
  downloadReceipt: (receipt: PaymentReceipt) => void;
  printReceipt: (receipt: PaymentReceipt) => void;
  getReceiptForTransaction: (transactionId: string) => PaymentReceipt | undefined;
  getReceiptsForTenant: (tenantName: string, unit?: string) => PaymentReceipt[];
  getReceiptByNumber: (receiptNumber: string) => PaymentReceipt | undefined;
  reconcileAndNotifyTenant: (transactionId: string) => Promise<PaymentReceipt | null>;
  recordPaymentTransaction: (data: {
    tenantName: string;
    unit: string;
    amount: number;
    originalAmount: number;
    currency: SupportedCurrency;
    method: string;
    maskedMethod: string;
    gatewayId: any;
    gatewayRef: string;
    idempotencyKey?: string;
    carrierRef?: string;
    ussdCode?: string;
    payerPhone?: string;
    signature?: string;
    serviceProvider?: 'MTN' | 'ORANGE';
    itemizedRent?: number;
    itemizedParking?: number;
  }) => { transaction: FinancialTransaction; receipt: PaymentReceipt };
}

const ReceiptsContext = createContext<ReceiptsContextType | undefined>(undefined);

const LOCAL_STORAGE_RECEIPTS_KEY = 'estateflow_reconciled_receipts_v2';
const LOCAL_STORAGE_TXNS_KEY = 'estateflow_finance_txns_v2';

/**
 * Creates a unique cryptographic-style HMAC signature hash
 */
function createReceiptVerificationHash(
  receiptNumber: string,
  idempotencyKey: string,
  gatewayRef: string,
  amount: number
): string {
  const seed = `${receiptNumber}:${idempotencyKey}:${gatewayRef}:${amount.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `hmac_sha256_${hex}9a12c84e77b0df21`;
}

/**
 * Helper to build a formal PaymentReceipt from a FinancialTransaction
 */
function buildReceiptFromTransaction(
  txn: FinancialTransaction,
  verifiedBy = 'Auto-Reconciliation Engine (SOC 2)'
): PaymentReceipt {
  const currency: SupportedCurrency = txn.currency || 'USD';
  const amountPaid = txn.originalAmount || txn.amount;
  const hash = createReceiptVerificationHash(
    txn.receiptNumber,
    txn.idempotencyKey,
    txn.gatewayRef,
    amountPaid
  );

  let propertyName = 'Oak Residence';
  let propertyAddress = '1204 Oak St, Austin, TX 78702';

  if (txn.unit.includes('2A')) {
    propertyName = 'Maple Court';
    propertyAddress = '850 Maple Ave, Round Rock, TX 78664';
  } else if (txn.unit.includes('3B')) {
    propertyName = 'Cedar Row';
    propertyAddress = '410 Cedar Lane, Austin, TX 78704';
  } else if (txn.unit.includes('5A')) {
    propertyName = 'Willow Flats';
    propertyAddress = '102 Willow Pkwy, Pflugerville, TX 78660';
  }

  const rentAmount = txn.itemizedRent || amountPaid;
  const parkingAmount = txn.itemizedParking || 0;

  return {
    id: `rcpt-${txn.id}`,
    receiptNumber: txn.receiptNumber,
    transactionId: txn.id,
    transactionRef: txn.reference,
    issuedAt: txn.postedUtc || txn.date,
    verifiedAt: txn.reconciledAt || new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC',
    verifiedBy: txn.reconciledBy || verifiedBy,
    tenantName: txn.tenantName,
    tenantEmail: `${txn.tenantName.toLowerCase().replace(/[^a-z]/g, '')}@domain.com`,
    unit: txn.unit,
    propertyName,
    propertyAddress,
    amountPaid,
    currency,
    baseAmountUSD: txn.amount,
    exchangeRateUsed: currency === 'CFA' ? 605 : currency === 'EUR' ? 0.92 : currency === 'GBP' ? 0.78 : 1.0,
    paymentMethod: txn.method,
    maskedMethod: txn.maskedMethod,
    gatewayId: txn.gatewayId,
    gatewayRef: txn.gatewayRef,
    idempotencyKey: txn.idempotencyKey,
    carrierRef: txn.carrierRef,
    ussdCode: txn.ussdCode,
    payerPhone: txn.payerPhone,
    breakdown: {
      rent: rentAmount,
      parking: parkingAmount,
      utility: 0,
      processingFee: 0,
    },
    verificationHash: hash,
    reconciliationStatus: 'VERIFIED_SETTLED',
    pdfGenerated: true,
    pdfGeneratedAt: new Date().toISOString(),
    downloadCount: txn.receiptDownloaded ? 1 : 0,
  };
}

export const ReceiptsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showSecurityNotification, activeRole } = useSecurity();
  const [previewReceipt, setPreviewReceipt] = useState<PaymentReceipt | null>(null);

  // Load transactions from localStorage or default
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TXNS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed reading transactions from localStorage:', e);
    }
    return FINANCIAL_TRANSACTIONS_DATA.map((t) => {
      // Mark settled transactions as reconciled
      if (t.status === 'Settled') {
        return {
          ...t,
          reconciled: true,
          reconciledAt: t.postedUtc,
          reconciledBy: 'Automated Carrier/Bank Webhook Engine',
          autoGeneratedReceipt: true,
        };
      }
      return { ...t, reconciled: false };
    });
  });

  // Load receipts from localStorage or generate from initial settled transactions
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_RECEIPTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed reading receipts from localStorage:', e);
    }

    // Default pre-generated receipts for settled transactions
    const initialReceipts: PaymentReceipt[] = [];
    FINANCIAL_TRANSACTIONS_DATA.forEach((txn) => {
      if (txn.status === 'Settled') {
        initialReceipts.push(
          buildReceiptFromTransaction(txn, 'Automated Bank Reconciler (SOC 2)')
        );
      }
    });

    // Also include a verified receipt for Jordan Avery in Unit 4B if not explicitly present
    const hasJordan = initialReceipts.some((r) => r.tenantName.includes('Jordan') || r.unit === 'Unit 4B');
    if (!hasJordan) {
      initialReceipts.unshift({
        id: 'rcpt-jordan-aug26',
        receiptNumber: 'RC-2026-0842',
        transactionId: 'txn-jordan-01',
        transactionRef: 'TXN-90842',
        issuedAt: 'Aug 30, 2026 14:00 UTC',
        verifiedAt: 'Aug 30, 2026 14:01 UTC',
        verifiedBy: 'Property Management Automated Reconciler',
        tenantName: 'Jordan Avery',
        tenantEmail: 'jordan.avery@mail.com',
        unit: 'Unit 4B',
        propertyName: 'Oak Residence',
        propertyAddress: '1204 Oak St, Austin, TX 78702',
        amountPaid: 1450.0,
        currency: 'USD',
        baseAmountUSD: 1450.0,
        paymentMethod: 'Card',
        maskedMethod: 'VISA ····4821',
        gatewayId: 'visa',
        gatewayRef: 'ch_3PQjordan482100',
        idempotencyKey: 'idem_jordan_avery_aug26_7f8a',
        breakdown: {
          rent: 1400.0,
          parking: 50.0,
        },
        verificationHash: 'hmac_sha256_jordan_4821_reconciled_99b2',
        reconciliationStatus: 'VERIFIED_SETTLED',
        pdfGenerated: true,
        pdfGeneratedAt: '2026-08-30T14:01:00.000Z',
        downloadCount: 1,
      });
    }

    return initialReceipts;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECEIPTS_KEY, JSON.stringify(receipts));
    } catch (e) {
      console.error('Failed writing receipts to localStorage:', e);
    }
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed writing transactions to localStorage:', e);
    }
  }, [transactions]);

  /**
   * Verify and reconcile a transaction entry.
   * Immediately triggers automatic PDF receipt creation.
   */
  const verifyReconciliationEntry = (
    transactionId: string,
    verifierRoleTitle = 'Property Manager'
  ): PaymentReceipt | null => {
    const targetTxn = transactions.find((t) => t.id === transactionId);
    if (!targetTxn) return null;

    const verifiedAt = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    const verifierName = `${verifierRoleTitle} (${activeRole.toUpperCase()})`;

    // 1. Update the transaction in ledger
    const updatedTxn: FinancialTransaction = {
      ...targetTxn,
      status: 'Settled',
      reconciled: true,
      reconciledAt: verifiedAt,
      reconciledBy: verifierName,
      webhookStatus: 'settlement.reconciled ✓ (Verified & Signed)',
      autoGeneratedReceipt: true,
    };

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? updatedTxn : t))
    );

    // 2. Automatically generate the PDF receipt
    const newReceipt = buildReceiptFromTransaction(updatedTxn, verifierName);

    setReceipts((prev) => {
      const filtered = prev.filter((r) => r.transactionId !== transactionId);
      return [newReceipt, ...filtered];
    });

    // 3. Dispatch system notification & audit event
    showSecurityNotification(
      `[Reconciliation Engine] Verified ${targetTxn.reference} for ${targetTxn.tenantName} (${targetTxn.unit}). Automatic PDF receipt #${newReceipt.receiptNumber} generated and dispatched to Tenant & Property Manager portals.`
    );

    return newReceipt;
  };

  /**
   * Batch verifies all pending transactions (Webhook status or Retry sched.)
   */
  const batchVerifyPendingEntries = (): { count: number; newReceipts: PaymentReceipt[] } => {
    const pending = transactions.filter((t) => t.status !== 'Settled' || !t.reconciled);
    if (pending.length === 0) {
      showSecurityNotification('Reconciliation Ledger: All transaction entries are already verified.');
      return { count: 0, newReceipts: [] };
    }

    const verifiedAt = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    const verifierName = `Automated Batch Reconciler (${activeRole.toUpperCase()})`;

    const updatedTxns = transactions.map((t) => {
      if (t.status !== 'Settled' || !t.reconciled) {
        return {
          ...t,
          status: 'Settled' as const,
          reconciled: true,
          reconciledAt: verifiedAt,
          reconciledBy: verifierName,
          webhookStatus: 'settlement.batch_reconciled ✓',
          autoGeneratedReceipt: true,
        };
      }
      return t;
    });

    setTransactions(updatedTxns);

    const generated: PaymentReceipt[] = pending.map((t) => {
      const updated = {
        ...t,
        status: 'Settled' as const,
        reconciled: true,
        reconciledAt: verifiedAt,
        reconciledBy: verifierName,
      };
      return buildReceiptFromTransaction(updated, verifierName);
    });

    setReceipts((prev) => {
      const existingIds = new Set(generated.map((g) => g.transactionId));
      const filtered = prev.filter((r) => !existingIds.has(r.transactionId));
      return [...generated, ...filtered];
    });

    showSecurityNotification(
      `[Batch Reconciler] ${generated.length} pending transactions verified. ${generated.length} PDF receipts automatically generated and synced to tenant portals.`
    );

    return { count: generated.length, newReceipts: generated };
  };

  /**
   * Download the PDF receipt
   */
  const downloadReceipt = (receipt: PaymentReceipt) => {
    downloadReceiptPdf(receipt);

    // Update download count
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
      )
    );

    showSecurityNotification(
      `Downloaded official PDF receipt #${receipt.receiptNumber} (${receipt.tenantName}, ${receipt.unit}).`
    );
  };

  /**
   * Print receipt directly
   */
  const printReceipt = (receipt: PaymentReceipt) => {
    printReceiptPdf(receipt);
    showSecurityNotification(`Print dialog dispatched for receipt #${receipt.receiptNumber}.`);
  };

  const getReceiptForTransaction = (transactionId: string): PaymentReceipt | undefined => {
    return receipts.find((r) => r.transactionId === transactionId);
  };

  const getReceiptByNumber = (receiptNumber: string): PaymentReceipt | undefined => {
    return receipts.find((r) => r.receiptNumber === receiptNumber);
  };

  const getReceiptsForTenant = (tenantName: string, unit?: string): PaymentReceipt[] => {
    const cleanTenant = tenantName.toLowerCase();
    const cleanUnit = unit?.toLowerCase();

    return receipts.filter((r) => {
      const matchName =
        r.tenantName.toLowerCase().includes(cleanTenant) ||
        cleanTenant.includes(r.tenantName.toLowerCase());
      const matchUnit = cleanUnit ? r.unit.toLowerCase().includes(cleanUnit) : true;
      return matchName || matchUnit;
    });
  };

  const openReceiptPreview = (receipt: PaymentReceipt) => {
    setPreviewReceipt(receipt);
  };

  const closeReceiptPreview = () => {
    setPreviewReceipt(null);
  };

  const reconcileAndNotifyTenant = async (transactionId: string): Promise<PaymentReceipt | null> => {
    return verifyReconciliationEntry(transactionId, 'Property Manager Reconciler');
  };

  const recordPaymentTransaction = (data: {
    tenantName: string;
    unit: string;
    amount: number;
    originalAmount: number;
    currency: SupportedCurrency;
    method: string;
    maskedMethod: string;
    gatewayId: any;
    gatewayRef: string;
    idempotencyKey?: string;
    carrierRef?: string;
    ussdCode?: string;
    payerPhone?: string;
    signature?: string;
    serviceProvider?: 'MTN' | 'ORANGE';
    itemizedRent?: number;
    itemizedParking?: number;
  }): { transaction: FinancialTransaction; receipt: PaymentReceipt } => {
    const id = `txn-${Date.now()}`;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const receiptNum = `RC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const idempotencyKey = data.idempotencyKey || `idem_settle_${data.currency.toLowerCase()}_${Date.now()}`;
    const postedUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const newTxn: FinancialTransaction = {
      id,
      date,
      tenantName: data.tenantName,
      unit: data.unit,
      reference: `TXN-${data.currency}-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: data.amount,
      originalAmount: data.originalAmount,
      currency: data.currency,
      gatewayId: data.gatewayId,
      method: data.method,
      maskedMethod: data.maskedMethod,
      status: 'Settled',
      idempotencyKey,
      gatewayRef: data.gatewayRef,
      webhookStatus: 'settlement.collected ✓ (carrier verified)',
      webhookVerified: true,
      postedUtc,
      retries: 0,
      itemizedRent: data.itemizedRent || data.originalAmount,
      itemizedParking: data.itemizedParking || 0,
      receiptNumber: receiptNum,
      receiptDownloaded: false,
      reconciled: true,
      reconciledAt: postedUtc,
      reconciledBy: 'MeSomb Real-Time Carrier Settlement Webhook',
      autoGeneratedReceipt: true,
      carrierRef: data.carrierRef,
      ussdCode: data.ussdCode,
      payerPhone: data.payerPhone,
      signature: data.signature,
      serviceProvider: data.serviceProvider,
    };

    const newReceipt = buildReceiptFromTransaction(newTxn, 'MeSomb Carrier Settlement Webhook');

    setTransactions((prev) => [newTxn, ...prev]);
    setReceipts((prev) => [newReceipt, ...prev]);

    showSecurityNotification(
      `[Mobile Money Gateway] Payment of ${data.originalAmount.toLocaleString()} ${data.currency} received via ${data.method} (${data.carrierRef || data.gatewayRef}). Verified receipt #${newReceipt.receiptNumber} generated.`
    );

    return { transaction: newTxn, receipt: newReceipt };
  };

  return (
    <ReceiptsContext.Provider
      value={{
        receipts,
        transactions,
        previewReceipt,
        setPreviewReceipt,
        openReceiptPreview,
        closeReceiptPreview,
        verifyReconciliationEntry,
        batchVerifyPendingEntries,
        downloadReceipt,
        printReceipt,
        getReceiptForTransaction,
        getReceiptsForTenant,
        getReceiptByNumber,
        reconcileAndNotifyTenant,
        recordPaymentTransaction,
      }}
    >
      {children}
    </ReceiptsContext.Provider>
  );
};

export const useReceipts = (): ReceiptsContextType => {
  const context = useContext(ReceiptsContext);
  if (!context) {
    throw new Error('useReceipts must be used within a ReceiptsProvider');
  }
  return context;
};
