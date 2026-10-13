import React, { useState, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Users,
  HardHat,
  Smartphone,
  ArrowRight,
  Lock,
  Coins,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Zap,
  Award,
  Globe,
  Layers,
  FileCheck,
  Clock,
  Crown,
  ChevronRight,
  FileText,
  Star,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  IdCard,
  Search,
  Filter,
  MapPin,
  Calendar,
  X,
  Menu,
  Phone,
  Mail,
  HelpCircle,
  Home,
  Check,
  Send,
  MessageSquare,
} from 'lucide-react';
import { UserRole, PropertyRecord } from '../types';
import { NavigationTab } from './Navigation';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { useProperties } from '../context/PropertiesContext';
import { getTargetTabForRole } from './LoginModal';

interface LandingPageProps {
  onEnterPlatform: (role: UserRole, targetTab: NavigationTab) => void;
  onOpenLogin: () => void;
  onSelectProperty?: (propId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
  onOpenLogin,
  onSelectProperty,
}) => {
  const { users, logApiAction, showSecurityNotification } = useSecurity();
  const { formatAmount } = useCurrency();
  const { properties } = useProperties();

  // Mobile Navigation Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Embedded Login Section State
  const [loginMode, setLoginMode] = useState<'personas' | 'credentials'>('personas');
  const [emailInput, setEmailInput] = useState('superadmin@sunriseholdings.com');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Property Showcase State (Search, Filter, Detail Modal)
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'approved' | 'pending' | 'multifamily' | 'high_occupancy'>('all');
  const [previewProperty, setPreviewProperty] = useState<PropertyRecord | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string>('');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactType, setContactType] = useState<'owner' | 'tenant' | 'vendor' | 'general'>('owner');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Persona Platform Definitions
  const personaCards: {
    role: UserRole;
    userMatch: string;
    platformTitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgAccent: string;
    tag: string;
    features: string[];
  }[] = [
    {
      role: 'super_admin',
      userMatch: 'usr-0',
      platformTitle: 'Super Administrator Platform',
      description: 'Master organization governance, API gateway limits (120 req/min), MeSomb & Stripe secret keys, zero-trust secrets rotation, and immutable audit logs.',
      icon: Crown,
      accentColor: 'text-rose-700',
      bgAccent: 'bg-rose-50 border-rose-200 hover:border-rose-400',
      tag: 'Root Governance Authority',
      features: ['API Token Bucket (120/min)', 'Master Secrets Rotation', 'System Audit Trail', 'Organization RBAC'],
    },
    {
      role: 'owner',
      userMatch: 'usr-1',
      platformTitle: 'Property Owner & Principal',
      description: 'Portfolio real estate valuation, exclusive asset verification approval privilege, dividend tracking, and executive yield analytics.',
      icon: Building2,
      accentColor: 'text-amber-700',
      bgAccent: 'bg-amber-50 border-amber-200 hover:border-amber-400',
      tag: 'Exclusive Approval Privilege',
      features: ['Asset Legal Sign-Off', 'Digital Certificate Stamping', 'Valuation & Yield ROI', 'Portfolio Registry'],
    },
    {
      role: 'property_manager',
      userMatch: 'usr-2',
      platformTitle: 'Property Operations Manager',
      description: 'Asset onboarding with cadastral surveys, submitter ID Card verification, tenant intake, lease renewal workflows, and turnover scheduling.',
      icon: Users,
      accentColor: 'text-blue-700',
      bgAccent: 'bg-blue-50 border-blue-200 hover:border-blue-400',
      tag: 'Operations & Onboarding',
      features: ['Add Asset with ID Scan', 'Occupancy Radar Tracking', 'Unit Turnovers', 'Lease Renewals (30/60/90D)'],
    },
    {
      role: 'tenant',
      userMatch: 'usr-5',
      platformTitle: 'Resident Mobile App Portal',
      description: 'Touch-first resident experience: 1-tap rent payments (MTN MoMo, Orange Money, Cards, ACH), Step-Up MFA, digital repair tickets, and PDF receipts.',
      icon: Smartphone,
      accentColor: 'text-violet-700',
      bgAccent: 'bg-violet-50 border-violet-200 hover:border-violet-400',
      tag: 'Mobile Touch Portal',
      features: ['MoMo USSD Push (*126#)', 'Step-Up MFA Security', 'HMAC PDF Receipts', 'Photo Repair Requests'],
    },
    {
      role: 'vendor',
      userMatch: 'usr-6',
      platformTitle: 'Contractor Dispatch Workbench',
      description: 'Contractor mobile workbench: GPS on-site check-in, photo evidence attachment, 30m SLA timers, and automated invoice payout generation.',
      icon: HardHat,
      accentColor: 'text-amber-800',
      bgAccent: 'bg-amber-50/70 border-amber-200 hover:border-amber-400',
      tag: 'SLA Dispatch Board',
      features: ['Live GPS Check-in', 'Recharts SLA Analytics', 'Photo Evidence Upload', 'Automated Payout Logs'],
    },
    {
      role: 'accountant',
      userMatch: 'usr-3',
      platformTitle: 'Financial Controller & Treasury',
      description: 'Multi-currency ledger, statutory escrow yields (2.85% APY), cross-border FX desk (USD, EUR, GBP, CFA), and virtual expense debit cards.',
      icon: CreditCard,
      accentColor: 'text-emerald-700',
      bgAccent: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
      tag: 'Fintech & Escrow Treasury',
      features: ['Multi-Currency Treasury', '2.85% APY Escrow Trust', 'Virtual Cards & MCC Lock', 'Interbank FX Conversion'],
    },
  ];

  // Filtered Properties Computation
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const matchSearch =
        prop.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
        prop.address.toLowerCase().includes(propertySearch.toLowerCase()) ||
        prop.city.toLowerCase().includes(propertySearch.toLowerCase()) ||
        (prop.cadastralNumber && prop.cadastralNumber.toLowerCase().includes(propertySearch.toLowerCase()));

      if (!matchSearch) return false;

      if (propertyFilter === 'approved') {
        return prop.verificationStatus === 'APPROVED';
      }
      if (propertyFilter === 'pending') {
        return prop.verificationStatus === 'PENDING_APPROVAL';
      }
      if (propertyFilter === 'multifamily') {
        return prop.propertyType === 'Multi-family';
      }
      if (propertyFilter === 'high_occupancy') {
        return prop.occupancyPercent >= 90;
      }
      return true;
    });
  }, [properties, propertySearch, propertyFilter]);

  const handleDirectPersonaClick = (role: UserRole) => {
    const targetTab = getTargetTabForRole(role);
    const user = users.find((u) => u.role === role) || users[0];
    logApiAction(
      'LOGIN_SUCCESS',
      'Landing Portal Gateway',
      `User ${user.name} directly entered ${role} workspace platform (${targetTab}).`
    );
    showSecurityNotification(`Signed in as ${user.name} — Launched ${user.roleTitle} platform.`);
    onEnterPlatform(role, targetTab);
  };

  const handleFormLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const user =
        users.find((u) => u.email.toLowerCase() === emailInput.trim().toLowerCase()) ||
        users.find((u) => u.role === selectedRole) ||
        users[0];
      const targetTab = getTargetTabForRole(user.role);
      logApiAction(
        'LOGIN_SUCCESS',
        'Landing Portal Gateway',
        `User ${user.name} authenticated via login credentials. Routed to ${targetTab}.`
      );
      showSecurityNotification(`Authenticated: Welcome ${user.name}! Launched ${user.roleTitle} platform.`);
      setIsSubmitting(false);
      onEnterPlatform(user.role, targetTab);
    }, 450);
  };

  const setSampleCredential = (role: UserRole, email: string) => {
    setSelectedRole(role);
    setEmailInput(email);
    setPasswordInput('EstateFlow#2026!');
  };

  const handleOpenPropertyPreview = (prop: PropertyRecord) => {
    setPreviewProperty(prop);
    setActivePreviewImage(prop.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80');
  };

  const handleManagePropertyInPlatform = (prop: PropertyRecord) => {
    if (onSelectProperty) {
      onSelectProperty(prop.id);
    } else {
      handleDirectPersonaClick('owner');
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    showSecurityNotification(`Inquiry registered for ${contactName}. Operations team notified.`);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSubmitted(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. TOP HEADER & RESPONSIVE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#EAE6DF] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <a href="#welcome" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-extrabold text-lg shadow-xs tracking-wider group-hover:bg-amber-800 transition-colors">
              EF
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">EstateFlow</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                  Enterprise Suite
                </span>
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                Real Estate Operations & Multi-Currency Fintech
              </div>
            </div>
          </a>

          {/* Desktop Navigation Menu Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-stone-700">
            <a href="#welcome" className="hover:text-amber-800 transition-colors">
              Overview
            </a>
            <a href="#properties" className="flex items-center space-x-1.5 hover:text-amber-800 transition-colors text-amber-800 font-extrabold">
              <span>Uploaded Properties</span>
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-mono">
                {properties.length}
              </span>
            </a>
            <a href="#platforms" className="hover:text-amber-800 transition-colors">
              User Platforms
            </a>
            <a href="#fintech" className="hover:text-amber-800 transition-colors">
              Fintech & Escrow
            </a>
            <a href="#verification" className="hover:text-amber-800 transition-colors">
              Legal Cadastral
            </a>
            <a href="#testimonials" className="hover:text-amber-800 transition-colors">
              Trust & Reviews
            </a>
            <a href="#contact" className="hover:text-amber-800 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <a
              href="#login-portal"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 border border-stone-300 transition-colors cursor-pointer"
            >
              Role Sign In
            </a>
            <a
              href="#login-portal"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enter Platform</span>
            </a>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-bold text-stone-700">
              <a
                href="#welcome"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900"
              >
                Welcome & Overview
              </a>
              <a
                href="#properties"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between text-amber-800"
              >
                <span>Uploaded Properties Showcase</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-mono">
                  {properties.length}
                </span>
              </a>
              <a
                href="#platforms"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900"
              >
                Role Platforms (Admin, Owner, PM, Tenant, Vendor, Finance)
              </a>
              <a
                href="#fintech"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900"
              >
                Fintech & Escrow Treasury (USD, CFA, EUR)
              </a>
              <a
                href="#verification"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900"
              >
                Legal Cadastral & ID Verification
              </a>
              <a
                href="#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900"
              >
                Trust & Testimonials
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-amber-50 hover:text-amber-900"
              >
                Contact & Inquiries
              </a>
            </nav>
            <div className="pt-2 border-t border-stone-200 flex flex-col space-y-2">
              <a
                href="#login-portal"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Sign In to Platform
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 2. WELCOME HERO & EQUAL VIEW SECTIONS (50% SHOWCASE / 50% DIRECT LOGIN SECTION) */}
      <section
        id="welcome"
        className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-stone-200/80 bg-gradient-to-b from-[#FFFDF9] via-[#FAF8F3] to-[#F5F2EB]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Equal-Split Grid: Left 50% = Landing Welcome Showcase / Right 50% = Direct Login Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* LEFT SIDE (Equal 50% Section): Welcome Headline & Enterprise Value Proposition */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Welcome to EstateFlow — Real Estate & Property Intelligence</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-950 tracking-tight leading-[1.12]">
                  The Unified Operating Platform for{' '}
                  <span className="text-amber-800 underline decoration-amber-400 decoration-wavy decoration-2">
                    Modern Real Estate
                  </span>{' '}
                  & Multi-Currency Fintech
                </h1>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Engineered with least-privilege security: explore uploaded high-yield assets, collect resident rent via MTN MoMo and Cards, maintain statutory 2.85% APY segregated escrow trusts, and manage operations with exclusive Super Admin & Owner legal sign-offs.
                </p>

                {/* Quick Action Navigation CTAs */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href="#properties"
                    className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>View Uploaded Properties ({properties.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="#platforms"
                    className="px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold flex items-center space-x-2 border border-stone-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-800" />
                    <span>Explore 6 Role Platforms</span>
                  </a>
                </div>

                {/* Core Architecture Highlights Checklist */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 font-medium">
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/70 border border-stone-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Statutory 2.85% APY Escrow Yield</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/70 border border-stone-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">MTN MoMo (*126#) & Orange Money</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/70 border border-stone-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span className="truncate">Cadastral Legal Title Verification</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/70 border border-stone-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span className="truncate">Super Admin & Owner Approval Rights</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Metrics Ribbon (Equal 4-Box Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left pt-2">
                <div className="p-3 bg-white/90 border border-stone-200 rounded-2xl shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">Treasury</div>
                  <div className="text-lg font-black font-mono text-stone-900 mt-0.5">$1.85M+</div>
                  <div className="text-[9px] text-emerald-700 font-medium truncate">USD, CFA, EUR, GBP</div>
                </div>

                <div className="p-3 bg-white/90 border border-stone-200 rounded-2xl shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">Escrow APY</div>
                  <div className="text-lg font-black font-mono text-blue-900 mt-0.5">2.85%</div>
                  <div className="text-[9px] text-blue-700 font-medium truncate">Segregated Trust</div>
                </div>

                <div className="p-3 bg-white/90 border border-stone-200 rounded-2xl shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">Contractor SLA</div>
                  <div className="text-lg font-black font-mono text-amber-900 mt-0.5">99.2%</div>
                  <div className="text-[9px] text-amber-800 font-medium truncate">GPS Check-in Proof</div>
                </div>

                <div className="p-3 bg-white/90 border border-stone-200 rounded-2xl shadow-2xs">
                  <div className="text-[10px] font-mono uppercase text-stone-500 font-bold">Zero-Trust</div>
                  <div className="text-lg font-black font-mono text-stone-900 mt-0.5">PSD2 SCA</div>
                  <div className="text-[9px] text-emerald-700 font-medium truncate">SMS & Email MFA</div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (Equal 50% Section): Direct Login Section Taking You to Each Platform */}
            <div
              id="login-portal"
              className="bg-white border-2 border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-5 relative"
            >
              {/* Login Section Header */}
              <div className="space-y-1.5 border-b border-stone-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                      Platform Authentication
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-stone-400 font-mono">
                    Direct Persona Router
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Sign In & Enter Your Workspace
                </h2>
                <p className="text-xs text-stone-500">
                  Select your role below to launch directly into your dedicated operating platform with least-privilege permissions.
                </p>
              </div>

              {/* Mode Switch Tabs: Direct Persona Login vs Email & Password */}
              <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLoginMode('personas')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    loginMode === 'personas'
                      ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  ⚡ Direct Persona Sign-In (1-Click)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('credentials')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    loginMode === 'credentials'
                      ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Email & Password Sign In
                </button>
              </div>

              {/* TAB 1: DIRECT PERSONA SELECTION (Instant Platform Entry) */}
              {loginMode === 'personas' ? (
                <div className="space-y-2.5 max-h-[410px] overflow-y-auto pr-1">
                  {users.map((user) => {
                    const targetTab = getTargetTabForRole(user.role);

                    const getRoleBadge = (role: UserRole) => {
                      switch (role) {
                        case 'super_admin':
                          return {
                            label: 'Super Admin',
                            icon: Crown,
                            color: 'text-rose-700 bg-rose-50 border-rose-200',
                            platform: 'Super Administrator Dashboard (Gateways, Keys & Logs)',
                          };
                        case 'owner':
                          return {
                            label: 'Property Owner',
                            icon: Building2,
                            color: 'text-amber-800 bg-amber-50 border-amber-200',
                            platform: 'Property Portfolio (Exclusive Verification Approval)',
                          };
                        case 'property_manager':
                          return {
                            label: 'Property Manager',
                            icon: Users,
                            color: 'text-blue-700 bg-blue-50 border-blue-200',
                            platform: 'Operations Console (Add Property & ID Verification)',
                          };
                        case 'tenant':
                          return {
                            label: 'Resident / Tenant',
                            icon: Smartphone,
                            color: 'text-violet-700 bg-violet-50 border-violet-200',
                            platform: 'Tenant Touch Portal (MoMo *126#, Cards & Repairs)',
                          };
                        case 'vendor':
                          return {
                            label: 'Contractor',
                            icon: HardHat,
                            color: 'text-amber-900 bg-amber-50 border-amber-200',
                            platform: 'Contractor Dispatch Workbench (GPS Check-in & SLA)',
                          };
                        case 'accountant':
                          return {
                            label: 'Fintech Controller',
                            icon: CreditCard,
                            color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                            platform: 'Fintech & Escrow Hub (Multi-Currency & Virtual Cards)',
                          };
                        default:
                          return {
                            label: 'User',
                            icon: ShieldCheck,
                            color: 'text-stone-700 bg-stone-50 border-stone-200',
                            platform: 'Workspace Platform',
                          };
                      }
                    };

                    const badge = getRoleBadge(user.role);
                    const Icon = badge.icon;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleDirectPersonaClick(user.role)}
                        className="w-full p-3 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/60 hover:bg-amber-50/40 text-left flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${user.avatarColor}`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="font-extrabold text-xs text-stone-900 truncate">
                                {user.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${badge.color}`}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{badge.label}</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                              {badge.platform}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 pl-2 flex-shrink-0">
                          <span className="text-[11px] font-extrabold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200 group-hover:bg-amber-700 group-hover:text-white transition-all flex items-center space-x-1 shadow-2xs">
                            <span>Enter Platform</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* TAB 2: CREDENTIALS SIGN IN FORM */
                <form onSubmit={handleFormLoginSubmit} className="space-y-3.5 text-xs">
                  {/* Preset Quick Fill Pills */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">
                      Quick-fill role credentials:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSampleCredential('super_admin', 'superadmin@sunriseholdings.com')
                        }
                        className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Super Admin
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSampleCredential('owner', 'fobellah.principal@sunriseholdings.com')
                        }
                        className="px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Property Owner
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSampleCredential('property_manager', 'pmensah@sunriseholdings.com')
                        }
                        className="px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Operations PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleCredential('tenant', 'jordan.avery@gmail.com')}
                        className="px-2 py-1 rounded-md bg-violet-100 hover:bg-violet-200 text-violet-900 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Tenant Resident
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSampleCredential('accountant', 'schen.cpa@sunriseholdings.com')
                        }
                        className="px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Fintech Controller
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      placeholder="e.g. user@sunriseholdings.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600 text-stone-900 bg-stone-50"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-600 text-stone-900 bg-stone-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 text-[11px] pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Remember verified device (30 days)</span>
                    </label>
                    <span className="text-amber-800 font-medium">MFA Protected</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In & Enter Platform'}</span>
                  </button>
                </form>
              )}

              {/* Security Footnote */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero-Trust Enforced</span>
                </span>
                <span>FOBELLAH NKENGAFAC NKAFU</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEDICATED SECTION: UPLOADED PROPERTIES SHOWCASE (PICTURE & CONTENT) */}
      <section id="properties" className="py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Verified Asset Portfolio Registry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
                Uploaded Properties & Real Estate Portfolio
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                Explore real estate assets actively onboarded in the EstateFlow registry. Each asset features legal cadastral surveys, architectural photography, valuation benchmarks, and verified title deed registrations.
              </p>
            </div>

            {/* Quick Upload CTA or Filter Summary */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-stone-500 font-mono">
                Showing <strong>{filteredProperties.length}</strong> of {properties.length} Assets
              </span>
              <button
                onClick={() => handleDirectPersonaClick('property_manager')}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Upload New Property</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="p-4 bg-[#FAF8F5] border border-stone-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Search properties, city, cadastral ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
              {propertySearch && (
                <button
                  type="button"
                  onClick={() => setPropertySearch('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setPropertyFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  propertyFilter === 'all'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                All Assets ({properties.length})
              </button>
              <button
                type="button"
                onClick={() => setPropertyFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  propertyFilter === 'approved'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                Verified & Approved
              </button>
              <button
                type="button"
                onClick={() => setPropertyFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  propertyFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                Pending Sign-Off
              </button>
              <button
                type="button"
                onClick={() => setPropertyFilter('multifamily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  propertyFilter === 'multifamily'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                Multi-Family
              </button>
              <button
                type="button"
                onClick={() => setPropertyFilter('high_occupancy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  propertyFilter === 'high_occupancy'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                High Occupancy (&gt;90%)
              </button>
            </div>
          </div>

          {/* Properties Cards Grid: Picture and Rich Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map((prop) => {
              const displayImage =
                prop.imageUrl ||
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';

              const isPending = prop.verificationStatus === 'PENDING_APPROVAL';

              return (
                <article
                  key={prop.id}
                  className="bg-white rounded-3xl border border-stone-200 hover:border-amber-400 overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Property Image Banner with Badges */}
                    <figure className="relative h-56 sm:h-60 w-full overflow-hidden bg-stone-100 m-0">
                      <img
                        src={displayImage}
                        alt={`Photo of ${prop.name} located at ${prop.address}, ${prop.city}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent"></div>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono uppercase tracking-wider bg-stone-950/75 backdrop-blur-md text-white border border-white/20">
                          {prop.code}
                        </span>

                        {isPending ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-stone-950 border border-amber-300 flex items-center space-x-1 shadow-sm">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting Owner Approval</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white border border-emerald-400 flex items-center space-x-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified Cadastral Asset</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom Banner Info: Valuation & Property Type */}
                      <figcaption className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                        <div>
                          <div className="text-[11px] font-medium text-stone-300">Market Valuation</div>
                          <div className="text-xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                            {formatAmount(prop.valuationAmount || 1850000)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                            {prop.propertyType}
                          </span>
                          <div className="text-[10px] font-mono text-stone-300 mt-0.5">
                            Built in {prop.yearBuilt || 2022}
                          </div>
                        </div>
                      </figcaption>
                    </figure>

                    {/* Property Content Details */}
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Name & Location */}
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-stone-950 line-clamp-1 group-hover:text-amber-800 transition-colors">
                          {prop.name}
                        </h3>
                        <div className="flex items-center space-x-1 text-xs text-stone-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span className="truncate">
                            {prop.address}, {prop.city}, {prop.state} {prop.zip}
                          </span>
                        </div>
                      </div>

                      {/* Vital Specs Grid (Units, Occupancy, Cadastral Parcel) */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 text-center">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Total Units</div>
                          <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                            {prop.unitsTotal} Units
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Occupancy</div>
                          <div className={`text-sm font-black font-mono mt-0.5 ${
                            prop.occupancyPercent >= 90 ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {prop.occupancyPercent}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Cadastral</div>
                          <div className="text-[11px] font-mono font-bold text-stone-700 mt-1 truncate" title={prop.cadastralNumber || 'CAD-REG-402'}>
                            {prop.cadastralNumber ? prop.cadastralNumber.split('-').slice(-2).join('-') : 'CAD-402'}
                          </div>
                        </div>
                      </div>

                      {/* Occupancy Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium text-stone-500">
                          <span>Occupancy status</span>
                          <span className="font-mono font-bold text-stone-800">
                            {prop.unitsOccupied} / {prop.unitsTotal} Leased
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prop.occupancyPercent >= 90
                                ? 'bg-emerald-600'
                                : prop.occupancyPercent >= 75
                                ? 'bg-amber-600'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${prop.occupancyPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Amenities Chips */}
                      {prop.amenities && prop.amenities.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Amenities:</div>
                          <div className="flex flex-wrap gap-1">
                            {prop.amenities.slice(0, 3).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200/60 truncate"
                              >
                                {amenity}
                              </span>
                            ))}
                            {prop.amenities.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-500 font-mono">
                                +{prop.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Submitter & Verification Status Note */}
                      <div className="text-[11px] text-stone-500 border-t border-stone-100 pt-3 flex items-center justify-between">
                        <span className="flex items-center space-x-1 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                          <span className="truncate">
                            {prop.submittedBy ? `Added by ${prop.submittedBy.userName}` : 'Title deed certified'}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          {prop.documents ? `${prop.documents.length} legal docs` : 'Verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Action Buttons */}
                  <div className="p-5 sm:p-6 pt-0 border-t border-stone-100 mt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPropertyPreview(prop)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-600" />
                      <span>Inspect Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleManagePropertyInPlatform(prop)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Manage Asset</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
              <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No properties match your filter</h3>
              <p className="text-xs text-stone-500">
                Try resetting your search query or selecting "All Assets" to view all available real estate records.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPropertySearch('');
                  setPropertyFilter('all');
                }}
                className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                Reset Property Filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. DEDICATED PERSONA PLATFORMS SHOWCASE */}
      <section id="platforms" className="py-16 sm:py-20 bg-[#FDFBF7] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
              Dedicated Persona Platforms
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
              Tailored Platforms for Every Role in the Real Estate Lifecycle
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              Every participant operates within a tailored, least-privilege interface designed specifically for their operational mandate.
            </p>
          </div>

          {/* 6 Persona Platform Cards in Balanced Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personaCards.map((card) => {
              const Icon = card.icon;
              const matchedUser = users.find((u) => u.id === card.userMatch) || users[0];

              return (
                <div
                  key={card.role}
                  className={`bg-white border rounded-3xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-5 ${card.bgAccent}`}
                >
                  <div className="space-y-4">
                    {/* Card Top: Persona Icon & Tag */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center">
                        <Icon className={`w-6 h-6 ${card.accentColor}`} />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-white border border-stone-200 text-stone-800 shadow-2xs">
                        {card.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-extrabold text-stone-900">{card.platformTitle}</h3>
                      <div className="text-xs text-stone-500 font-mono mt-0.5">
                        Active User: <strong>{matchedUser.name}</strong>
                      </div>
                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">{card.description}</p>
                    </div>

                    {/* Feature Chips */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">
                        Workspace Capabilities:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {card.features.map((feat, i) => (
                          <div
                            key={i}
                            className="text-[11px] font-medium text-stone-700 bg-white/80 p-1.5 rounded-lg border border-stone-200/80 truncate flex items-center space-x-1"
                          >
                            <span className="text-amber-700 text-[10px]">✓</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Direct Launch Button */}
                  <button
                    onClick={() => handleDirectPersonaClick(card.role)}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs group"
                  >
                    <span>Launch {card.platformTitle.split(' ')[0]} Platform</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-amber-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FINTECH & STATUTORY ESCROW TREASURY ARCHITECTURE */}
      <section id="fintech" className="py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
              Fintech Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
              Multi-Currency Treasury & Statutory Escrow Accounting
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              Segregated client accounts, mobile money rails, interbank clearing pools, and tamper-evident payment receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Multi-Currency Fintech & Escrow */}
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                <Coins className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Multi-Currency Treasury Desk</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Operating corporate clearing pools spanning USD, EUR, GBP, and Central African CFA (XAF) via Afriland First Bank. Features statutory 2.85% APY tenant deposit segregation and virtual debit cards with merchant MCC locking.
              </p>
              <ul className="text-xs text-stone-700 space-y-2 pt-2 font-medium">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>MTN MoMo (*126#) & Orange Money (#150#)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Statutory damage claim deductions with invoice proof</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>0% APR Rent-Now-Pay-Later resident bridge loans</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Legal Asset Verification & Owner Approval */}
            <div id="verification" className="p-7 rounded-3xl bg-[#FAF8F5] border border-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-2xs">
                <FileCheck className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Cadastral Deed & ID Verification</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every property asset requires cadastral survey parcel IDs, architectural photo verification, and submitter National ID / Passport scan verification. Additions by managers remain held until signed off by Super Admin or Property Owner.
              </p>
              <ul className="text-xs text-stone-700 space-y-2 pt-2 font-medium">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>National ID scan & Cadastral deed attachment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Super Admin & Owner exclusive approval rights</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Digital compliance seal (#CERT-HMAC-...)</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Zero-Trust Security & Mobile Workbenches */}
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Zero-Trust & SLA Dispatch</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Role-based access control (RBAC) enforced with kernel session locking. Resident payments and credential modifications require Step-Up MFA (email & SMS OTP). Built-in smartphone simulators test native touch experiences.
              </p>
              <ul className="text-xs text-stone-700 space-y-2 pt-2 font-medium">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Zero-Trust auto-lock screen with biometric MFA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Contractor Recharts SLA latency & fix-rate charts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>HMAC-SHA256 tamper-evident PDF rent receipts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & CLIENT TESTIMONIALS */}
      <section id="testimonials" className="py-16 sm:py-20 bg-[#FDFBF7] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
              Proven Trust & Compliance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Trusted by Property Owners, Financial Directors & Residents
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              Real-world feedback from the participants operating within EstateFlow ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-500 space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "The cadastral legal sign-off workflow gives our investment partners total confidence. As an owner, having exclusive sign-off on uploaded assets prevents fraudulent listings."
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center">
                  FN
                </div>
                <div>
                  <div className="font-extrabold text-xs text-stone-900">Fobellah N.</div>
                  <div className="text-[10px] text-stone-500 font-medium">Principal & Portfolio Owner</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-500 space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "Paying rent through MTN Mobile Money USSD push (*126#) and getting an instant verified PDF receipt right on my phone makes living here completely stress-free."
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-violet-700 text-white font-bold text-xs flex items-center justify-center">
                  JA
                </div>
                <div>
                  <div className="font-extrabold text-xs text-stone-900">Jordan Avery</div>
                  <div className="text-[10px] text-stone-500 font-medium">Resident · Unit 4B, Oak Residence</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-500 space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "Our plumbing dispatch team loves the mobile workbench. The GPS check-in proves our arrival SLA within 30 minutes, and payouts are automatically approved."
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center">
                  AF
                </div>
                <div>
                  <div className="font-extrabold text-xs text-stone-900">AquaFix Dispatch</div>
                  <div className="text-[10px] text-stone-500 font-medium">Licensed Master Contractor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONTACT & INQUIRIES CONSOLE */}
      <section id="contact" className="py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Contact Information & Hours */}
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Get In Touch</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
                Enterprise Inquiries & Asset Onboarding
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Have questions about onboarding real estate assets, connecting statutory escrow bank accounts, or enabling MTN MoMo / Orange Money collections? Our operations team is available 24/7.
              </p>

              <div className="space-y-3 pt-2 text-xs text-stone-700">
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200">
                  <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Corporate HQ: 45 Avenue de la Marine, Bonanjo & Austin Innovation Center, TX</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200">
                  <Mail className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Direct Operations: support@sunriseholdings.com / superadmin@estateflow.io</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200">
                  <Phone className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Escrow & Dispatch Hotline: +1 (512) 555-0192 / +237 677 41 89 20</span>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-stone-900 mb-1">Send an Inquiry</h3>
              <p className="text-xs text-stone-500 mb-4">
                Fill in your details below and an operations specialist will contact you within 2 hours.
              </p>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-sm text-emerald-900">Thank You! Your inquiry has been logged.</div>
                  <p className="text-xs text-emerald-700">
                    A representative has received your ticket and will reach out shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Jean Dupont / Sarah Miller"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">I am a:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['owner', 'tenant', 'vendor', 'general'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setContactType(type)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                            contactType === type
                              ? 'bg-amber-800 text-white shadow-2xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {type === 'owner' ? 'Property Owner' : type === 'tenant' ? 'Resident' : type === 'vendor' ? 'Contractor' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Message or Cadastral Inquiry</label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry or specify which property asset you are asking about..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message to Operations</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE PROPERTY DETAIL & GALLERY MODAL */}
      {previewProperty && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 relative">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setPreviewProperty(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title & Code */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-stone-100 text-stone-800 border">
                  {previewProperty.code}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  previewProperty.verificationStatus === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {previewProperty.verificationStatus === 'APPROVED' ? 'Approved & Title Certified' : 'Pending Owner Sign-Off'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-950 mt-1">
                {previewProperty.name}
              </h2>
              <p className="text-xs text-stone-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{previewProperty.address}, {previewProperty.city}, {previewProperty.state} {previewProperty.zip}</span>
              </p>
            </div>

            {/* Main High-Res Preview Image */}
            <div className="rounded-2xl overflow-hidden h-64 sm:h-80 w-full bg-stone-100 relative">
              <img
                src={activePreviewImage}
                alt={previewProperty.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-mono font-bold">
                Valuation: {formatAmount(previewProperty.valuationAmount || 1850000)}
              </div>
            </div>

            {/* Thumbnail Gallery Bar (if multiple photos exist) */}
            {previewProperty.galleryImages && previewProperty.galleryImages.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Photo Gallery:</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[previewProperty.imageUrl || '', ...previewProperty.galleryImages].filter(Boolean).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActivePreviewImage(img)}
                      className={`h-16 w-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                        activePreviewImage === img ? 'border-amber-600 scale-102' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Metrics Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Units Total</div>
                <div className="text-base font-black font-mono text-stone-900 mt-0.5">{previewProperty.unitsTotal} Units</div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Occupied</div>
                <div className="text-base font-black font-mono text-stone-900 mt-0.5">{previewProperty.unitsOccupied} Units</div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Occupancy Rate</div>
                <div className="text-base font-black font-mono text-emerald-700 mt-0.5">{previewProperty.occupancyPercent}%</div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] font-mono uppercase text-stone-400 font-bold">Cadastral Ref</div>
                <div className="text-xs font-mono font-bold text-stone-800 mt-1 truncate" title={previewProperty.cadastralNumber}>
                  {previewProperty.cadastralNumber || 'CAD-LT-DLA'}
                </div>
              </div>
            </div>

            {/* Legal Documents Registered */}
            {previewProperty.documents && previewProperty.documents.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-800">Attached Legal & Cadastral Documents:</div>
                <div className="space-y-1.5">
                  {previewProperty.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span className="font-medium text-stone-800 truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-stone-500 font-mono flex-shrink-0">
                        <span>{doc.size}</span>
                        <span className="text-emerald-700 font-bold">✓ Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewProperty(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewProperty(null);
                  handleManagePropertyInPlatform(previewProperty);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <span>Launch in Property Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. PROFESSIONAL FOOTER WITH SEO HYPERLINKS & REGULATORY NOTICES */}
      <footer className="bg-[#FAF8F3] border-t border-stone-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-200">
            {/* Col 1: Brand Summary */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-700 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                  EF
                </div>
                <span className="font-extrabold text-lg text-stone-900 tracking-tight">EstateFlow</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Enterprise real estate operating suite with least-privilege RBAC, multi-currency escrow treasury, and African mobile money payment rails.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <div className="text-xs font-bold font-mono uppercase text-stone-700">Platform Navigation</div>
              <ul className="text-xs text-stone-600 space-y-1.5 font-medium">
                <li><a href="#welcome" className="hover:text-amber-800">Welcome & Overview</a></li>
                <li><a href="#properties" className="hover:text-amber-800">Uploaded Properties Showcase</a></li>
                <li><a href="#platforms" className="hover:text-amber-800">Role Platforms (Admin, PM, Owner)</a></li>
                <li><a href="#fintech" className="hover:text-amber-800">Multi-Currency Escrow Desk</a></li>
                <li><a href="#contact" className="hover:text-amber-800">Contact & Support</a></li>
              </ul>
            </div>

            {/* Col 3: Role Workspaces */}
            <div className="space-y-2">
              <div className="text-xs font-bold font-mono uppercase text-stone-700">Dedicated Portals</div>
              <ul className="text-xs text-stone-600 space-y-1.5 font-medium">
                <li><button onClick={() => handleDirectPersonaClick('super_admin')} className="hover:text-amber-800 text-left">Super Admin Governance</button></li>
                <li><button onClick={() => handleDirectPersonaClick('owner')} className="hover:text-amber-800 text-left">Property Owner Approval</button></li>
                <li><button onClick={() => handleDirectPersonaClick('property_manager')} className="hover:text-amber-800 text-left">Operations Property Manager</button></li>
                <li><button onClick={() => handleDirectPersonaClick('tenant')} className="hover:text-amber-800 text-left">Resident Touch Mobile App</button></li>
                <li><button onClick={() => handleDirectPersonaClick('vendor')} className="hover:text-amber-800 text-left">Contractor SLA Workbench</button></li>
              </ul>
            </div>

            {/* Col 4: Compliance & Regulatory Standards */}
            <div className="space-y-2">
              <div className="text-xs font-bold font-mono uppercase text-stone-700">Compliance & Security</div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Compliant with OHADA real estate cadastral codes, FDIC statutory escrow rules, and European PSD2 Strong Customer Authentication (SCA).
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-mono text-stone-600">
                <span className="px-2 py-0.5 rounded bg-white border border-stone-200">OHADA Certified</span>
                <span className="px-2 py-0.5 rounded bg-white border border-stone-200">2.85% APY Escrow</span>
                <span className="px-2 py-0.5 rounded bg-white border border-stone-200">Zero-Trust RBAC</span>
              </div>
            </div>
          </div>

          {/* Copyright & Author Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-500 font-mono">
            <div>
              © 2026 EstateFlow Platform · System Architecture by <strong>FOBELLAH NKENGAFAC NKAFU</strong>. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Security Whitepaper</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
