import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  X,
  ExternalLink,
  Coins,
  Building,
  User,
  Key,
  Calendar,
} from 'lucide-react';
import { PaymentReceipt } from '../types';
import { useReceipts } from '../context/ReceiptsContext';

interface ReceiptPreviewModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
  viewerRole?: 'property_manager' | 'tenant' | 'accountant' | 'owner';
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  receipt,
  onClose,
  viewerRole = 'property_manager',
}) => {
  const { downloadReceipt, printReceipt } = useReceipts();
  const [copiedHash, setCopiedHash] = useState(false);
  const [showIntegrityDetails, setShowIntegrityDetails] = useState(false);

  if (!receipt) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(receipt.verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatCurrency = (amount: number, cur: string) => {
    if (cur === 'CFA') return `${Math.round(amount).toLocaleString()} FCFA`;
    if (cur === 'EUR') return `€${amount.toFixed(2)}`;
    if (cur === 'GBP') return `£${amount.toFixed(2)}`;
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Header */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  Payment Receipt #{receipt.receiptNumber}
                </h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Reconciled</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono">
                {receipt.tenantName} · {receipt.unit} ({receipt.propertyName})
              </p>
            </div>
          </div>

          {/* Quick Actions (Print, Download, Close) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => printReceipt(receipt)}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors text-xs flex items-center space-x-1.5 px-2.5"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={() => downloadReceipt(receipt)}
              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors text-xs font-bold flex items-center space-x-1.5 px-3 shadow-xs"
              title="Download PDF Receipt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body (Paper Document Look) */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#FAF8F5] text-stone-800 text-xs">
          {/* Paper Container */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-stone-200 space-y-6 relative overflow-hidden">
            {/* Top decorative gold bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-900" />

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <div className="font-extrabold text-xl tracking-tight text-stone-900">
                  ESTATEFLOW
                </div>
                <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider mt-0.5">
                  Official Rent Settlement & Reconciliation Certificate
                </div>
                <div className="text-stone-500 text-[11px] mt-1">
                  Oak Residence Property Management LLC<br />
                  1204 Oak St, Austin, TX 78702 · finance@estateflow.internal
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-md text-xs">
                  ✓ VERIFIED & RECONCILED
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Receipt: <span className="font-bold text-stone-900">{receipt.receiptNumber}</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  Issued: {receipt.issuedAt}
                </div>
              </div>
            </div>

            {/* Two-Column Metadata Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Leased Premises */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                <div className="font-bold text-stone-900 text-xs flex items-center space-x-1.5 text-amber-950">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tenant & Premises</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Tenant:</span>
                    <span className="font-bold text-stone-900">{receipt.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Unit / Residence:</span>
                    <span className="font-semibold text-stone-900">{receipt.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Property:</span>
                    <span className="font-semibold text-stone-900">{receipt.propertyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Location:</span>
                    <span className="text-stone-700">{receipt.propertyAddress}</span>
                  </div>
                </div>
              </div>

              {/* Audit & Gateway Info */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                <div className="font-bold text-stone-900 text-xs flex items-center space-x-1.5 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Reconciliation Audit</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Verified Date:</span>
                    <span className="font-medium text-stone-900">{receipt.verifiedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Verified By:</span>
                    <span className="font-bold text-emerald-700">{receipt.verifiedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Gateway Channel:</span>
                    <span className="font-medium text-stone-900">
                      {receipt.paymentMethod} ({receipt.maskedMethod})
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-500">Gateway Ref:</span>
                    <span className="text-stone-700 truncate max-w-[140px]">{receipt.gatewayRef}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Charges Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Amount ({receipt.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  <tr>
                    <td className="py-2.5 px-3 text-stone-900 font-semibold">
                      Monthly Rent — {receipt.unit} ({receipt.propertyName})
                    </td>
                    <td className="py-2.5 px-3 text-stone-500">Base Lease</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(receipt.breakdown.rent, receipt.currency)}
                    </td>
                  </tr>

                  {receipt.breakdown.parking > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-stone-900">
                        Assigned Parking Stall P2
                      </td>
                      <td className="py-2 px-3 text-stone-500">Ancillary</td>
                      <td className="py-2 px-3 text-right font-mono text-stone-900">
                        {formatCurrency(receipt.breakdown.parking, receipt.currency)}
                      </td>
                    </tr>
                  )}

                  {receipt.breakdown.utility && receipt.breakdown.utility > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-stone-900">
                        Utilities Surcharge (Water/Refuse)
                      </td>
                      <td className="py-2 px-3 text-stone-500">Utilities</td>
                      <td className="py-2 px-3 text-right font-mono text-stone-900">
                        {formatCurrency(receipt.breakdown.utility, receipt.currency)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Payout Summary Row */}
              <div className="bg-amber-50/80 p-3.5 border-t border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-amber-950 block">Total Reconciled Rent Settlement</span>
                  <span className="text-[10px] text-amber-800">
                    Settled in {receipt.currency} via {receipt.paymentMethod}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-base text-amber-950">
                    {formatCurrency(receipt.amountPaid, receipt.currency)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    ✓ Balance Paid in Full
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Currency Callout if not USD */}
            {receipt.currency !== 'USD' && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Coins className="w-3.5 h-3.5 text-teal-700" />
                  <span>Multi-Currency Reconciliation Exchange Rate</span>
                </div>
                <p className="text-stone-600">
                  Payment converted at locked exchange rate:{' '}
                  <strong>
                    1 USD = {receipt.exchangeRateUsed?.toLocaleString()} {receipt.currency}
                  </strong>
                  . Base lease liability: <strong>${receipt.baseAmountUSD.toFixed(2)} USD</strong>.
                </p>
              </div>
            )}

            {/* Cryptographic Verification & HMAC Hash */}
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-800 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  <span>Cryptographic Proof & Idempotency Seal</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-[10px] transition-colors"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-stone-500" />
                      <span>Copy HMAC</span>
                    </>
                  )}
                </button>
              </div>

              <div className="font-mono text-[10px] text-stone-600 bg-white p-2 rounded border border-stone-200 break-all select-all">
                {receipt.verificationHash}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] text-stone-500 pt-0.5">
                <span>Idempotency Key: <code className="font-mono text-stone-700">{receipt.idempotencyKey.slice(0, 16)}…</code></span>
                <span>SOC 2 Type II Auto-Generated Verification</span>
              </div>
            </div>

            {/* Document Footer Signoff */}
            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-stone-500">
              <div>
                <p className="font-medium text-stone-800">
                  EstateFlow Financial Operations System
                </p>
                <p className="text-[10px]">
                  Electronic certificate valid without manual signature · Generated automatically upon verification.
                </p>
              </div>

              <div className="text-right font-mono text-[10px]">
                <div className="text-emerald-700 font-bold">● RECONCILIATION VERIFIED</div>
                <div>Status: Settled & Archived</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white px-5 py-3 border-t border-stone-200 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center space-x-2 text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Accessible to both Property Manager & Tenant</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => printReceipt(receipt)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 font-medium text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => downloadReceipt(receipt)}
              className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 font-bold text-white transition-colors shadow-xs inline-flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
