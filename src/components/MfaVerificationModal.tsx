import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  Lock,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { MfaChannel } from '../types';

export const MfaVerificationModal: React.FC = () => {
  const {
    activeMfaChallenge,
    isMfaModalOpen,
    verifyMfaCode,
    resendMfaCode,
    switchMfaChannel,
    closeMfaModal,
    mfaSimulatedIncomingCode,
  } = useSecurity();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 min countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset digits and timer when challenge changes
  useEffect(() => {
    if (activeMfaChallenge) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setIsSuccess(false);
      setIsVerifying(false);

      const remaining = Math.max(0, Math.floor((activeMfaChallenge.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining > 0 ? remaining : 300);

      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [activeMfaChallenge?.id, activeMfaChallenge?.channel]);

  // Countdown timers
  useEffect(() => {
    if (!isMfaModalOpen || !activeMfaChallenge) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMfaModalOpen, activeMfaChallenge]);

  if (!isMfaModalOpen || !activeMfaChallenge) return null;

  const isPayment = activeMfaChallenge.purpose === 'payment';
  const paymentDetails = activeMfaChallenge.paymentDetails;
  const currentChannel = activeMfaChallenge.channel;

  const handleDigitChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleaned = val.replace(/\D/g, '');

    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Handle paste or multiple digits
    if (cleaned.length > 1) {
      const next = [...digits];
      const slice = cleaned.slice(0, 6).split('');
      slice.forEach((char, i) => {
        if (index + i < 6) {
          next[index + i] = char;
        }
      });
      setDigits(next);
      const nextIndex = Math.min(5, index + slice.length);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = cleaned[0];
    setDigits(next);

    // Auto focus next
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleQuickFill = (codeToFill: string) => {
    const chars = codeToFill.slice(0, 6).split('');
    const next = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 6) next[idx] = c;
    });
    setDigits(next);
    setErrorMsg(null);
    inputRefs.current[5]?.focus();
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('');

    if (fullCode.length < 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    // Slight simulation delay for realistic cryptographic verification
    await new Promise((r) => setTimeout(r, 600));

    const result = verifyMfaCode(fullCode);
    setIsVerifying(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        closeMfaModal();
      }, 1100);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    const res = resendMfaCode();
    if (res.success) {
      setResendCooldown(30);
      setSecondsLeft(300);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleChannelSwitch = (targetChannel: MfaChannel) => {
    if (targetChannel === currentChannel) return;
    switchMfaChannel(targetChannel);
    setDigits(['', '', '', '', '', '']);
    setResendCooldown(15);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Top Header Banner */}
        <div
          className={`p-6 text-white ${
            isPayment
              ? 'bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900'
              : 'bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                {isPayment ? (
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                ) : (
                  <Lock className="w-6 h-6 text-amber-300" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  <KeyRound className="w-3 h-3" />
                  <span>{isPayment ? 'PSD2 SCA · 3D-Secure 2.2' : 'NIST SP 800-63B MFA'}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {isPayment ? 'Secure Payment Verification' : 'Multi-Factor Authentication'}
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {isPayment
                    ? 'Verify this high-value financial transaction via out-of-band OTP'
                    : 'Confirm your identity to authorize login and session privileges'}
                </p>
              </div>
            </div>

            <button
              onClick={closeMfaModal}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
              title="Cancel and close verification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Context Card (When Purpose is Payment) */}
          {isPayment && paymentDetails && (
            <div className="mt-4 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-medium">Authorization Amount:</span>
                <span className="text-base font-mono font-extrabold text-amber-300">
                  {paymentDetails.amount.toLocaleString()} {paymentDetails.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                <span className="text-stone-300">Channel / Payee:</span>
                <span className="font-semibold text-white truncate max-w-[240px]">
                  {paymentDetails.gateway} → {paymentDetails.payee}
                </span>
              </div>
              {paymentDetails.unit && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-300">Tenant & Unit:</span>
                  <span className="text-white font-medium">
                    {paymentDetails.tenantName || 'Resident'} ({paymentDetails.unit})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Channel Selector Switcher (Email vs SMS) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Verification Delivery Channel:
              </span>
              <span className="text-[11px] text-stone-500 font-mono">
                Expires in: <strong className="text-amber-800">{timeFormatted}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleChannelSwitch('email')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-2.5 cursor-pointer ${
                  currentChannel === 'email'
                    ? 'border-amber-700 bg-amber-50/80 ring-2 ring-amber-600/30 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                }`}
              >
                <div
                  className={`p-2 rounded-xl flex-shrink-0 ${
                    currentChannel === 'email'
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 flex items-center space-x-1">
                    <span>Email OTP</span>
                    {currentChannel === 'email' && <Check className="w-3 h-3 text-amber-700" />}
                  </div>
                  <div className="text-[11px] font-mono text-stone-600 truncate mt-0.5">
                    {currentChannel === 'email'
                      ? activeMfaChallenge.destinationMasked
                      : 'Email Inbox'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChannelSwitch('phone')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-2.5 cursor-pointer ${
                  currentChannel === 'phone'
                    ? 'border-amber-700 bg-amber-50/80 ring-2 ring-amber-600/30 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                }`}
              >
                <div
                  className={`p-2 rounded-xl flex-shrink-0 ${
                    currentChannel === 'phone'
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 flex items-center space-x-1">
                    <span>Phone SMS</span>
                    {currentChannel === 'phone' && <Check className="w-3 h-3 text-amber-700" />}
                  </div>
                  <div className="text-[11px] font-mono text-stone-600 truncate mt-0.5">
                    {currentChannel === 'phone'
                      ? activeMfaChallenge.destinationMasked
                      : 'Mobile SMS / WhatsApp'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Active Target Banner */}
          <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-stone-700">
                Code sent to{' '}
                <strong className="font-mono text-stone-900">
                  {activeMfaChallenge.destinationMasked}
                </strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              {currentChannel === 'email' ? 'SMTP TLS 1.3' : 'SMS Direct'}
            </span>
          </div>

          {/* Simulated Device Push Banner (for quick interactive testing) */}
          {mfaSimulatedIncomingCode && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300/80 text-xs text-amber-950 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div>
                  <div className="font-bold text-[11px] text-amber-900">
                    Incoming {currentChannel === 'email' ? 'Mail' : 'SMS'} Simulator:
                  </div>
                  <div className="font-mono text-xs text-stone-800">
                    Your OTP code is <strong className="text-amber-800 font-bold">{mfaSimulatedIncomingCode}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill(mfaSimulatedIncomingCode)}
                className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                title="Fill this verification code into the inputs"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* 6-Digit Verification Code Input */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                Enter 6-Digit One-Time Security Code:
              </label>

              <div className="flex items-center justify-between gap-2">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-bold rounded-2xl border transition-all focus:outline-hidden ${
                      digit
                        ? 'border-amber-700 bg-amber-50/50 text-stone-900 ring-2 ring-amber-600/20'
                        : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400'
                    } ${errorMsg ? 'border-rose-500 bg-rose-50/40' : ''}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Feedback */}
            {isSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center space-x-2.5 font-bold animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Verification Approved! Cryptographic token stamped.</span>
              </div>
            )}

            {/* Submit & Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isVerifying || isSuccess}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Checksum...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Authenticated Successfully</span>
                  </>
                ) : (
                  <>
                    <span>{isPayment ? 'Authorize & Execute Payment' : 'Verify & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full sm:w-auto py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 disabled:opacity-50 text-stone-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? '' : 'text-stone-500'}`} />
                <span>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>

          {/* Security & Compliance Footer */}
          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Trust Security Engine · 256-Bit TLS</span>
            </div>
            <div className="font-mono text-[10px] text-stone-400">
              Ref: {activeMfaChallenge.id.slice(-8)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
