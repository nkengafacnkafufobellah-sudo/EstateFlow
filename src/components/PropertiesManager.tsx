import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  FileText,
  Wrench,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Camera,
  Check,
  FileCheck,
  IdCard,
  User,
  Award,
  Lock,
  Eye,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  HelpCircle,
  DollarSign,
  Tag,
  Share2,
} from 'lucide-react';
import { PropertyRecord, PropertyAssetVerification, PropertyApprovalDetails } from '../types';
import { PROPERTIES_DATA } from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';
import { useCurrency } from '../context/CurrencyContext';
import { useProperties } from '../context/PropertiesContext';

interface PropertiesManagerProps {
  onNavigateToMaintenance: () => void;
  initialOpenAdd?: boolean;
}

const PRESET_PROPERTY_IMAGES = [
  {
    name: 'Palais de Bonanjo Luxury Residence',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
    type: 'Multi-family',
  },
  {
    name: 'Executive Townhouse Estate',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    type: 'Multi-family',
  },
  {
    name: 'Oak Modern Residence',
    url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1000&q=80',
    type: 'Multi-family',
  },
  {
    name: 'Suburban Palm Villa',
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1000&q=80',
    type: 'Single-family',
  },
  {
    name: 'Metropolitan Commercial Tower',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    type: 'Commercial',
  },
];

const AVAILABLE_AMENITIES = [
  '24/7 Security CCTV',
  'Solar Generator Backup',
  'Fiber High-Speed Internet',
  'Elevator',
  'Underground Parking',
  'Swimming Pool',
  'Fitness Studio',
  'Smart Access Keyless Locks',
  'Concierge Reception',
  'EV Vehicle Charging',
];

export const PropertiesManager: React.FC<PropertiesManagerProps> = ({
  onNavigateToMaintenance,
  initialOpenAdd = false,
}) => {
  const { canPerform, showSecurityNotification, activeRole, currentUser, logApiAction } = useSecurity();
  const { activeCurrency, formatAmount, convertAmount } = useCurrency();
  const isSuperAdminOrOwner = activeRole === 'super_admin' || activeRole === 'owner';

  const { properties, setProperties } = useProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'approved' | 'multifamily' | 'under90'>('all');
  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(properties[0] || null);
  const [showMobileCardMode, setShowMobileCardMode] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);

  // Add Property Slide-in Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(initialOpenAdd);
  const [addStepState, setAddStepState] = useState<1 | 2 | 3 | 4>(1);
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropCity, setNewPropCity] = useState('Douala');
  const [newPropState, setNewPropState] = useState('LT');
  const [newPropZip, setNewPropZip] = useState('BP 1284');
  const [newPropType, setNewPropType] = useState<'Multi-family' | 'Single-family' | 'Commercial'>('Multi-family');
  const [newPropUnits, setNewPropUnits] = useState('16');
  const [newPropValuation, setNewPropValuation] = useState<number>(1850000);
  const [newPropCadastral, setNewPropCadastral] = useState('CAD-LT-DLA-5102-X');
  const [newPropYearBuilt, setNewPropYearBuilt] = useState<number>(2024);
  const [newPropSelectedImage, setNewPropSelectedImage] = useState<string>(PRESET_PROPERTY_IMAGES[0].url);
  const [newPropCustomImageUrl, setNewPropCustomImageUrl] = useState('');
  const [newPropAmenities, setNewPropAmenities] = useState<string[]>([
    '24/7 Security CCTV',
    'Solar Generator Backup',
    'Fiber High-Speed Internet',
    'Underground Parking',
  ]);

  // Submitter Identity & Document Verification State
  const [submitterIdType, setSubmitterIdType] = useState<'National ID Card' | 'Passport' | 'Driver License'>('National ID Card');
  const [submitterIdNumber, setSubmitterIdNumber] = useState('CM-LT-2024-91823-X');
  const [submitterIdDocName, setSubmitterIdDocName] = useState('National_ID_Card_Verified_Scan.pdf');
  const [submitterTitleDeedDocName, setSubmitterTitleDeedDocName] = useState('Cadastral_Land_Title_Deed_Vol88.pdf');
  const [submitterNotaryRef, setSubmitterNotaryRef] = useState('NOTARY-REP-CM-88219');
  const [submitterVerificationNote, setSubmitterVerificationNote] = useState(
    'Asset surveyed on-site. Cadastral registry matches municipal records. ID Card and notarized mandate verified authentic.'
  );
  const [submitterAttestationAccepted, setSubmitterAttestationAccepted] = useState(true);
  const [directSelfApproveByOwner, setDirectSelfApproveByOwner] = useState(isSuperAdminOrOwner);

  const [unitError, setUnitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Approval Modal States for Super Admin and Owner
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [propertyToApprove, setPropertyToApprove] = useState<PropertyRecord | null>(null);
  const [approvalNote, setApprovalNote] = useState('Approved by Portfolio Principal after comprehensive ID & title deed audit.');
  const [isApproving, setIsApproving] = useState(false);

  // Document Inspection Modal State
  const [inspectingDoc, setInspectingDoc] = useState<{ title: string; type: string; documentName: string; number?: string; details?: string } | null>(null);

  // Pending count
  const pendingCount = properties.filter((p) => p.verificationStatus === 'PENDING_APPROVAL').length;
  const approvedCount = properties.filter((p) => p.verificationStatus === 'APPROVED').length;

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'pending') return p.verificationStatus === 'PENDING_APPROVAL';
    if (filterType === 'approved') return p.verificationStatus === 'APPROVED';
    if (filterType === 'under90') return p.occupancyPercent < 90;
    if (filterType === 'multifamily') return p.propertyType === 'Multi-family';
    return true;
  });

  const handleOpenAddDrawer = () => {
    if (!canPerform('properties.create')) {
      showSecurityNotification('Access Denied: Least-privilege policy requires "owner" or "property_manager" role to register properties.');
      return;
    }
    setAddStepState(1);
    setNewPropName('');
    setNewPropAddress('');
    setNewPropUnits('16');
    setUnitError(null);
    setDirectSelfApproveByOwner(isSuperAdminOrOwner);
    setIsAddDrawerOpen(true);
  };

  const handleUnitChange = (val: string) => {
    setNewPropUnits(val);
    if (!val) {
      setUnitError(null);
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num < 1 || num > 500 || !Number.isInteger(num)) {
      setUnitError('Enter a whole number between 1 and 500.');
      setAddStepState(2);
    } else {
      setUnitError(null);
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    setNewPropAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSimulateAddProperty = (overrideName?: string, overrideUnits?: number) => {
    const name = overrideName || newPropName || 'Palais des Fleurs Residence';
    const units = overrideUnits || Number(newPropUnits) || 16;
    const finalImage = newPropCustomImageUrl.trim() || newPropSelectedImage;

    setIsSaving(true);
    setAddStepState(3);

    setTimeout(() => {
      setIsSaving(false);
      setAddStepState(4);

      const verificationInfo: PropertyAssetVerification = {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        idCardType: submitterIdType,
        idCardNumber: submitterIdNumber,
        idCardDocumentName: submitterIdDocName,
        titleDeedDocName: submitterTitleDeedDocName,
        notarySealReference: submitterNotaryRef,
        proofOfOwnershipDocName: 'Certified_Legal_Mandate_Power_Of_Attorney.pdf',
        verificationNote: submitterVerificationNote,
      };

      // Determine verification status
      const shouldAutoApprove = isSuperAdminOrOwner && directSelfApproveByOwner;
      const verificationStatus: 'APPROVED' | 'PENDING_APPROVAL' = shouldAutoApprove
        ? 'APPROVED'
        : 'PENDING_APPROVAL';

      const approvalDetails: PropertyApprovalDetails | undefined = shouldAutoApprove
        ? {
            approvedBy: currentUser.name,
            approvedByRole: activeRole as 'super_admin' | 'owner',
            approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
            approvalNote: 'Directly verified and self-authorized by Portfolio Principal / Super Admin.',
            certificateHash: `CERT-AUTH-${Date.now().toString(36).toUpperCase()}`,
          }
        : undefined;

      const newRecord: PropertyRecord = {
        id: `prp-${Date.now()}`,
        code: `PRP-0${Math.floor(250 + Math.random() * 50)}`,
        name: name,
        address: newPropAddress || '88 Avenue de la Concorde',
        city: newPropCity,
        state: newPropState,
        zip: newPropZip,
        propertyType: newPropType,
        unitsTotal: units,
        unitsOccupied: shouldAutoApprove ? Math.round(units * 0.85) : 0,
        occupancyPercent: shouldAutoApprove ? 85 : 0,
        status: shouldAutoApprove ? 'Healthy' : 'Watch',
        openWorkOrders: 0,
        unitsInTurnover: 0,
        nextLeaseStart: 'Dec 01',
        imageUrl: finalImage,
        galleryImages: [
          finalImage,
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        ],
        cadastralNumber: newPropCadastral,
        valuationAmount: newPropValuation,
        yearBuilt: newPropYearBuilt,
        amenities: newPropAmenities,
        verificationStatus: verificationStatus,
        submittedBy: verificationInfo,
        approvalDetails: approvalDetails,
        documents: [
          { name: submitterTitleDeedDocName, size: '3.4 MB', date: 'Oct 2026', verified: true },
          { name: submitterIdDocName, size: '1.2 MB', date: 'Oct 2026', verified: true },
          { name: 'Cadastral Survey Certificate.pdf', size: '2.1 MB', date: 'Oct 2026', verified: true },
        ],
        maintenanceSummary: {
          inProgress: 'Initial move-in preparation',
          awaitingApproval: 'None',
        },
      };

      setProperties((prev) => [newRecord, ...prev]);
      setHighlightedPropertyId(newRecord.id);
      setSelectedProperty(newRecord);

      logApiAction(
        'PROPERTY_REGISTERED',
        'Cadastral Registry Subsystem',
        `Property "${name}" submitted by ${currentUser.name} with ${submitterIdType} (${submitterIdNumber}). Status: ${verificationStatus}.`
      );

      setTimeout(() => {
        setIsAddDrawerOpen(false);
        if (verificationStatus === 'APPROVED') {
          showSecurityNotification(
            `"${name}" registered and directly approved by ${currentUser.name} (${activeRole}) with digital seal.`
          );
        } else {
          showSecurityNotification(
            `"${name}" submitted with verified ID Card & Title Deed! Awaiting Super Admin or Owner approval.`
          );
        }
      }, 1400);
    }, 1200);
  };

  const handleOpenApprovalModal = (prop: PropertyRecord) => {
    if (!isSuperAdminOrOwner) {
      showSecurityNotification('Access Denied: Only Super Admin and Owner hold privilege to approve real estate assets.');
      return;
    }
    setPropertyToApprove(prop);
    setApprovalNote(`Approved by ${currentUser.name} (${activeRole}) after validating Cadastral Deed & ID.`);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyToApprove) return;

    setIsApproving(true);
    setTimeout(() => {
      const certHash = `CERT-AUTH-${Date.now().toString(36).toUpperCase()}-LEGAL`;
      const updatedDetails: PropertyApprovalDetails = {
        approvedBy: currentUser.name,
        approvedByRole: activeRole as 'super_admin' | 'owner',
        approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        approvalNote: approvalNote,
        certificateHash: certHash,
      };

      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === propertyToApprove.id) {
            return {
              ...p,
              verificationStatus: 'APPROVED' as const,
              status: 'Healthy' as const,
              approvalDetails: updatedDetails,
            };
          }
          return p;
        })
      );

      if (selectedProperty?.id === propertyToApprove.id) {
        setSelectedProperty((curr) =>
          curr ? { ...curr, verificationStatus: 'APPROVED', status: 'Healthy', approvalDetails: updatedDetails } : curr
        );
      }

      logApiAction(
        'PROPERTY_LEGAL_APPROVED',
        'Portfolio Governance Engine',
        `Property "${propertyToApprove.name}" (${propertyToApprove.code}) approved by ${currentUser.name} (${activeRole}). Cert: #${certHash}`
      );

      setIsApproving(false);
      setIsApprovalModalOpen(false);
      showSecurityNotification(
        `✓ "${propertyToApprove.name}" officially approved by ${currentUser.name} (${activeRole})! Stamped certificate #${certHash} registered.`
      );
    }, 800);
  };

  const handleRejectProperty = (prop: PropertyRecord) => {
    if (!isSuperAdminOrOwner) return;
    setProperties((prev) =>
      prev.map((p) =>
        p.id === prop.id ? { ...p, verificationStatus: 'REJECTED' as const, status: 'Action needed' as const } : p
      )
    );
    if (selectedProperty?.id === prop.id) {
      setSelectedProperty((curr) => (curr ? { ...curr, verificationStatus: 'REJECTED', status: 'Action needed' } : curr));
    }
    showSecurityNotification(`Property "${prop.name}" rejected. Submitter notified to provide amended cadastral documents.`);
    setIsApprovalModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-2">
            <span>EstateFlow · Property & Unit Management</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-[10px] flex items-center space-x-1 animate-pulse">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>{pendingCount} Awaiting Verification Approval</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Properties, Units, and Portfolio Records
          </h1>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            Portfolio asset registry with high-resolution imagery, cadastral surveys, submitter ID Card verification, and <strong>Super Admin & Owner exclusive approval governance</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Reflow Simulation Switcher */}
          <button
            onClick={() => setShowMobileCardMode(!showMobileCardMode)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showMobileCardMode
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title="Demonstrate mobile reflow into tappable cards (<760px)"
          >
            {showMobileCardMode ? 'Desktop Table' : 'Mobile Cards (<760px)'}
          </button>

          {/* Add Property Button */}
          <button
            id="open-add-property-drawer-btn"
            onClick={handleOpenAddDrawer}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Equal Balanced View Sections on Both Sides (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Col: Search, Filters, Properties List / Cards */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by property name, code (PRP-), or city..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 bg-stone-50/50"
              />
            </div>

            {/* Filter Pills with Pending Count Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  All ({properties.length})
                </button>

                <button
                  onClick={() => setFilterType('pending')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    filterType === 'pending'
                      ? 'bg-amber-700 text-white font-semibold'
                      : pendingCount > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Pending Approval</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-800 text-white font-mono">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setFilterType('approved')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    filterType === 'approved'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Approved ({approvedCount})</span>
                </button>

                <button
                  onClick={() => setFilterType('multifamily')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    filterType === 'multifamily'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Multi-family
                </button>

                <button
                  onClick={() => setFilterType('under90')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    filterType === 'under90'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Under 90% occupancy
                </button>
              </div>
            </div>

            {/* Desktop Table View or Mobile Card View */}
            {!showMobileCardMode ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                    <tr>
                      <th className="py-2.5 px-3">Property Asset</th>
                      <th className="py-2.5 px-3 text-center">Units</th>
                      <th className="py-2.5 px-3">Occupancy</th>
                      <th className="py-2.5 px-3">Verification & Status</th>
                      <th className="py-2.5 px-3 text-center">Open Wk. Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProperties.map((prop) => {
                      const isSelected = selectedProperty?.id === prop.id;
                      const isHighlighted = highlightedPropertyId === prop.id;
                      const isPending = prop.verificationStatus === 'PENDING_APPROVAL';

                      return (
                        <tr
                          key={prop.id}
                          onClick={() => setSelectedProperty(prop)}
                          className={`cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-amber-100/70 ring-1 ring-amber-400'
                              : isSelected
                              ? 'bg-amber-50/60 font-medium'
                              : 'hover:bg-stone-50'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-3">
                              {prop.imageUrl ? (
                                <img
                                  src={prop.imageUrl}
                                  alt={prop.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200 shadow-2xs flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
                                  <Building2 className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-stone-900 truncate max-w-[180px]">{prop.name}</div>
                                <div className="text-[11px] text-stone-500 font-mono">
                                  {prop.code} · {prop.city}, {prop.state}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-stone-800">
                            {prop.unitsTotal}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-stone-900">
                                {prop.occupancyPercent}%
                              </span>
                              <div className="w-14 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  style={{ width: `${prop.occupancyPercent}%` }}
                                  className={`h-full rounded-full ${
                                    prop.occupancyPercent >= 90 ? 'bg-amber-600' : 'bg-rose-500'
                                  }`}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              {isPending ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-amber-50 text-amber-900 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Pending Approval</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                  <span>Approved & Active</span>
                                </span>
                              )}
                              <div className="text-[10px] text-stone-400 font-mono">{prop.status}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                              {prop.openWorkOrders}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Mobile Card Reflow Mode (<760px) */
              <div className="mt-4 space-y-3">
                {filteredProperties.map((prop) => (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedProperty?.id === prop.id
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        {prop.imageUrl ? (
                          <img
                            src={prop.imageUrl}
                            alt={prop.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-stone-900">{prop.name}</div>
                          <div className="text-xs text-stone-500 font-mono">
                            {prop.code} · {prop.city}, {prop.state}
                          </div>
                        </div>
                      </div>

                      {prop.verificationStatus === 'PENDING_APPROVAL' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Pending Approval</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Approved</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-stone-100 font-medium">
                      <span className="text-stone-800">
                        <strong>{prop.unitsTotal} units</strong> · {prop.occupancyPercent}% occupied
                      </span>
                      <span className="text-amber-800 font-semibold">{prop.openWorkOrders} open work orders</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Property Detail with Verification & Approval */}
        <div className="space-y-4">
          {/* Selected Property Detail View */}
          {selectedProperty ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              {/* Property Hero Image Banner */}
              {selectedProperty.imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-stone-200 h-44 shadow-2xs group">
                  <img
                    src={selectedProperty.imageUrl}
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="text-[10px] font-mono tracking-wider uppercase text-amber-300 font-bold">
                        {selectedProperty.code} · {selectedProperty.propertyType}
                      </div>
                      <h2 className="text-lg font-extrabold text-white leading-tight drop-shadow-sm">
                        {selectedProperty.name}
                      </h2>
                      <div className="text-[11px] text-stone-200 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{selectedProperty.address}, {selectedProperty.city}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono shadow-xs ${
                        selectedProperty.verificationStatus === 'PENDING_APPROVAL'
                          ? 'bg-amber-500 text-stone-950 animate-pulse'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {selectedProperty.verificationStatus === 'PENDING_APPROVAL'
                        ? 'Pending Approval'
                        : 'Approved ✓'}
                    </span>
                  </div>
                </div>
              )}

              {/* PRIVILEGED APPROVAL / VERIFICATION BANNER */}
              {selectedProperty.verificationStatus === 'PENDING_APPROVAL' && (
                <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-amber-950 flex items-center space-x-1.5">
                        <span>Awaiting Legal Verification & Approval</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                          Owner / Super Admin Only
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 mt-0.5">
                        Added by <strong>{selectedProperty.submittedBy?.userName || 'Property Manager'}</strong> ({selectedProperty.submittedBy?.userRole || 'Staff'}) with verified {selectedProperty.submittedBy?.idCardType || 'National ID Card'}.
                      </p>
                    </div>
                  </div>

                  {/* Submitter verification details snippet */}
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-stone-800 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Submitter ID Card:</span>
                      <span className="font-bold">{selectedProperty.submittedBy?.idCardNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Attached ID Scan:</span>
                      <button
                        onClick={() =>
                          setInspectingDoc({
                            title: 'Submitter ID Card Scan',
                            type: selectedProperty.submittedBy?.idCardType || 'National ID Card',
                            documentName: selectedProperty.submittedBy?.idCardDocumentName || 'ID_Card_Verified.pdf',
                            number: selectedProperty.submittedBy?.idCardNumber,
                            details: `Issued to: ${selectedProperty.submittedBy?.userName}. Verified authentic.`,
                          })
                        }
                        className="text-amber-800 font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>{selectedProperty.submittedBy?.idCardDocumentName}</span>
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Cadastral Title Deed:</span>
                      <span className="font-bold">{selectedProperty.submittedBy?.titleDeedDocName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Notary Reference:</span>
                      <span>{selectedProperty.submittedBy?.notarySealReference || 'Verified'}</span>
                    </div>
                  </div>

                  {/* PRIVILEGE CHECK: Super Admin and Owner can Approve; other roles see explanation */}
                  {isSuperAdminOrOwner ? (
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenApprovalModal(selectedProperty)}
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Review Documents & Approve Property</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectProperty(selectedProperty)}
                        className="py-2 px-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-stone-500 flex-shrink-0" />
                      <span>
                        Privilege restricted: Only <strong>Super Admin</strong> or <strong>Owner</strong> can sign off on asset approval.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* APPROVED BADGE */}
              {selectedProperty.verificationStatus === 'APPROVED' && selectedProperty.approvalDetails && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">✓ Approved & Verified Asset</div>
                    <div className="text-emerald-900">
                      Approved by <strong>{selectedProperty.approvalDetails.approvedBy}</strong> ({selectedProperty.approvalDetails.approvedByRole}) on {selectedProperty.approvalDetails.approvedAt}.
                    </div>
                    <div className="text-[10px] font-mono text-emerald-800 mt-0.5">
                      Certificate Seal: #{selectedProperty.approvalDetails.certificateHash}
                    </div>
                  </div>
                </div>
              )}

              {/* 4 Metric Boxes */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-lg font-extrabold text-stone-900 font-mono">
                    {selectedProperty.unitsOccupied} / {selectedProperty.unitsTotal}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Units occupied</div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-lg font-extrabold text-amber-800 font-mono">
                    {selectedProperty.openWorkOrders}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Open work orders</div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-lg font-extrabold text-stone-900 font-mono">
                    {selectedProperty.unitsInTurnover}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Unit in turnover</div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-sm font-bold text-stone-900 font-mono mt-1">
                    {selectedProperty.nextLeaseStart}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Next lease start</div>
                </div>
              </div>

              {/* Cadastral & Valuation Specs */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-500">Cadastral Parcel:</span>
                  <span className="font-bold text-stone-900">{selectedProperty.cadastralNumber || 'CAD-LT-DLA-4029-B'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Estimated Valuation:</span>
                  <span className="font-bold text-stone-900">
                    ${(selectedProperty.valuationAmount || 1850000).toLocaleString()} USD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Year Built:</span>
                  <span className="font-bold text-stone-900">{selectedProperty.yearBuilt || 2024}</span>
                </div>
              </div>

              {/* Amenities */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-stone-900 mb-1.5">Amenities & Infrastructure</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProperty.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <div className="text-xs font-bold text-stone-900 mb-2">Legal & Cadastral Documents</div>
                <div className="space-y-1.5">
                  {selectedProperty.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="font-medium text-stone-800 truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-stone-400 whitespace-nowrap">
                          {doc.size} · {doc.date}
                        </span>
                        <button
                          onClick={() =>
                            setInspectingDoc({
                              title: doc.name,
                              type: 'Title & Legal Document',
                              documentName: doc.name,
                              details: `Verified cadastral file for ${selectedProperty.name}. Size: ${doc.size}. Stamped valid.`,
                            })
                          }
                          className="text-amber-700 hover:text-amber-900 p-0.5"
                          title="View document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance Summary */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-stone-900 mb-1.5">
                  <span>Maintenance summary</span>
                  <button
                    onClick={onNavigateToMaintenance}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-normal hover:underline cursor-pointer"
                  >
                    View inbox →
                  </button>
                </div>
                <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 space-y-1">
                  <div>
                    • <strong>In progress:</strong> {selectedProperty.maintenanceSummary.inProgress}
                  </div>
                  <div>
                    • <strong>Awaiting approval:</strong> {selectedProperty.maintenanceSummary.awaitingApproval}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
              Select a property row to view complete legal details and pictures.
            </div>
          )}
        </div>
      </div>

      {/* Slide-in Add Property Drawer (Validated Flow + Pictures + Submitter ID Verification) */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Add Property & Verify Asset</h2>
                  <p className="text-xs text-stone-500">
                    Registration with picture selection, cadastral title deed, and submitter ID verification
                  </p>
                </div>
                <button
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section 1: Property Picture & Architectural Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Property Picture & Imagery</span>
                  </label>
                  <span className="text-[10px] text-stone-500">Click preset or enter custom URL</span>
                </div>

                {/* Preset Thumbnails */}
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_PROPERTY_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewPropSelectedImage(preset.url);
                        setNewPropCustomImageUrl('');
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer ${
                        newPropSelectedImage === preset.url && !newPropCustomImageUrl
                          ? 'border-amber-600 ring-2 ring-amber-400/50 scale-102'
                          : 'border-stone-200 hover:border-stone-400 opacity-80 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      {newPropSelectedImage === preset.url && !newPropCustomImageUrl && (
                        <div className="absolute top-1 right-1 bg-amber-600 text-white rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom URL Input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste custom image URL (https://...)"
                    value={newPropCustomImageUrl}
                    onChange={(e) => setNewPropCustomImageUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                {/* Picture Preview */}
                <div className="relative rounded-xl overflow-hidden h-32 border border-stone-200 shadow-2xs">
                  <img
                    src={newPropCustomImageUrl.trim() || newPropSelectedImage}
                    alt="Property Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-stone-950/70 text-white text-[10px] font-mono">
                    Live Preview
                  </div>
                </div>
              </div>

              {/* Section 2: Core Asset Information */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <div className="text-xs font-bold text-stone-900 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  <span>Asset Metadata & Units</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800">
                    Property name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cedar Row Annex"
                    value={newPropName}
                    onChange={(e) => setNewPropName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800">
                    Street address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 414 Cedar Lane, Bonanjo"
                    value={newPropAddress}
                    onChange={(e) => setNewPropAddress(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">City</label>
                    <input
                      type="text"
                      value={newPropCity}
                      onChange={(e) => setNewPropCity(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800">State / Region</label>
                    <input
                      type="text"
                      value={newPropState}
                      onChange={(e) => setNewPropState(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Postal Code</label>
                    <input
                      type="text"
                      value={newPropZip}
                      onChange={(e) => setNewPropZip(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Property type</label>
                    <select
                      value={newPropType}
                      onChange={(e) => setNewPropType(e.target.value as any)}
                      className="mt-1 w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                    >
                      <option>Multi-family</option>
                      <option>Single-family</option>
                      <option>Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800">
                      Unit count <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 16"
                      value={newPropUnits}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className={`mt-1 w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                        unitError
                          ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500'
                          : 'border-stone-300 focus:ring-amber-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Cadastral Parcel Number</label>
                    <input
                      type="text"
                      value={newPropCadastral}
                      onChange={(e) => setNewPropCadastral(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Estimated Valuation (USD)</label>
                    <input
                      type="number"
                      value={newPropValuation}
                      onChange={(e) => setNewPropValuation(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Amenities Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">Amenities & Facilities</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AVAILABLE_AMENITIES.map((amenity) => {
                      const isChecked = newPropAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => handleToggleAmenity(amenity)}
                          className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <span className="truncate">{amenity}</span>
                          {isChecked && <Check className="w-3 h-3 text-amber-700 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Submitter Identity & Document Verification */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-900 flex items-center space-x-1.5">
                    <IdCard className="w-4 h-4 text-amber-700" />
                    <span>Submitter Identity & Legal Verification</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200">
                    Mandatory Anti-Fraud Audit
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Person Adding Asset:</span>
                    <span className="font-bold text-stone-900">{currentUser.name} ({currentUser.roleTitle})</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                    <span>Contact:</span>
                    <span>{currentUser.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">
                      ID Document Type <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={submitterIdType}
                      onChange={(e) => setSubmitterIdType(e.target.value as any)}
                      className="mt-1 w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                    >
                      <option>National ID Card</option>
                      <option>Passport</option>
                      <option>Driver License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800">
                      ID Card Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={submitterIdNumber}
                      onChange={(e) => setSubmitterIdNumber(e.target.value)}
                      placeholder="e.g. CM-LT-2024-91823-X"
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">ID Document File Scan</label>
                    <input
                      type="text"
                      value={submitterIdDocName}
                      onChange={(e) => setSubmitterIdDocName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Notary Seal Reference</label>
                    <input
                      type="text"
                      value={submitterNotaryRef}
                      onChange={(e) => setSubmitterNotaryRef(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800">Title Deed / Land Certificate Document</label>
                  <input
                    type="text"
                    value={submitterTitleDeedDocName}
                    onChange={(e) => setSubmitterTitleDeedDocName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                </div>

                {/* Attestation Checkbox */}
                <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
                  <label className="flex items-start space-x-2 text-xs text-amber-950 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={submitterAttestationAccepted}
                      onChange={(e) => setSubmitterAttestationAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-amber-700 focus:ring-amber-600"
                    />
                    <span>
                      <strong>Legal Attestation:</strong> I verify that I have physically surveyed this asset, that the cadastral boundaries match municipal registries, and that the attached ID Card and Title Deed documents are legally authentic.
                    </span>
                  </label>
                </div>

                {/* Privilege Self-Approval for Owner / Super Admin */}
                {isSuperAdminOrOwner && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                    <label className="flex items-center space-x-2 text-xs text-emerald-950 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={directSelfApproveByOwner}
                        onChange={(e) => setDirectSelfApproveByOwner(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span>
                        Portfolio Principal Privilege: Directly approve and activate this asset into live operations without pending approval queue.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 mt-6 border-t border-stone-200 flex items-center justify-between">
              <div className="text-[11px] text-stone-500">
                {!isSuperAdminOrOwner || !directSelfApproveByOwner ? (
                  <span>Will be routed to Super Admin / Owner approval queue.</span>
                ) : (
                  <span>Will be immediately published as Verified & Approved.</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    !newPropName ||
                    !newPropAddress ||
                    !newPropUnits ||
                    Boolean(unitError) ||
                    !submitterIdNumber ||
                    !submitterAttestationAccepted ||
                    isSaving
                  }
                  onClick={() => handleSimulateAddProperty()}
                  className={`px-5 py-2 text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer ${
                    !newPropName ||
                    !newPropAddress ||
                    !newPropUnits ||
                    Boolean(unitError) ||
                    !submitterIdNumber ||
                    !submitterAttestationAccepted ||
                    isSaving
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-amber-700 text-white hover:bg-amber-800 shadow-xs'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <span>Submit & Verify Asset</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIVILEGED APPROVAL MODAL (SUPER ADMIN & OWNER PRIVILEGE) */}
      {isApprovalModalOpen && propertyToApprove && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Privileged Asset Approval</h3>
                  <p className="text-xs text-stone-500">Authorized by {currentUser.name} ({activeRole})</p>
                </div>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asset Snapshot */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center space-x-3">
              {propertyToApprove.imageUrl && (
                <img
                  src={propertyToApprove.imageUrl}
                  alt={propertyToApprove.name}
                  className="w-16 h-16 rounded-xl object-cover border border-stone-300 shadow-2xs flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="font-bold text-sm text-stone-900 truncate">{propertyToApprove.name}</div>
                <div className="text-xs text-stone-600 font-mono">
                  {propertyToApprove.code} · {propertyToApprove.address}, {propertyToApprove.city}
                </div>
                <div className="text-[11px] text-amber-800 font-medium">
                  {propertyToApprove.unitsTotal} Units · Cadastral: {propertyToApprove.cadastralNumber || 'CAD-LT-DLA-4029-B'}
                </div>
              </div>
            </div>

            {/* Submitter Verification Review */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-900">Submitted Verification Credentials</div>
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-600">Submitted By:</span>
                  <span className="font-bold text-stone-900">
                    {propertyToApprove.submittedBy?.userName} ({propertyToApprove.submittedBy?.userRole})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">ID Document Type:</span>
                  <span className="font-bold text-stone-900">{propertyToApprove.submittedBy?.idCardType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">ID Number:</span>
                  <span className="font-bold text-amber-900">{propertyToApprove.submittedBy?.idCardNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">ID Scan File:</span>
                  <button
                    onClick={() =>
                      setInspectingDoc({
                        title: 'ID Document Scan Preview',
                        type: propertyToApprove.submittedBy?.idCardType || 'National ID Card',
                        documentName: propertyToApprove.submittedBy?.idCardDocumentName || 'ID_Card_Verified.pdf',
                        number: propertyToApprove.submittedBy?.idCardNumber,
                        details: `Submitter identity verified against government land registry database.`,
                      })
                    }
                    className="text-amber-800 font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>{propertyToApprove.submittedBy?.idCardDocumentName}</span>
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Title Deed:</span>
                  <span className="font-bold text-stone-900">{propertyToApprove.submittedBy?.titleDeedDocName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Notary Reference:</span>
                  <span>{propertyToApprove.submittedBy?.notarySealReference || 'Verified'}</span>
                </div>
              </div>
            </div>

            {/* Approval Notes Input */}
            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Owner / Super Admin Audit Sign-off Note
                </label>
                <textarea
                  rows={2}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 border border-stone-200 space-y-1">
                <div className="font-bold text-stone-800 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Statutory Legal Approval Stamp</span>
                </div>
                <p>
                  Approving this asset will update its portfolio status to <strong>APPROVED & HEALTHY</strong>, unlock lease operations, and stamp a cryptographic compliance certificate.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Stamping Approval...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Authorize Asset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT & ID SCAN INSPECTION MODAL */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-stone-900">{inspectingDoc.title}</h3>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document preview simulation card */}
            <div className="p-5 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl border-2 border-dashed border-stone-300 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs mx-auto flex items-center justify-center text-amber-800">
                <IdCard className="w-8 h-8 text-amber-700" />
              </div>

              <div>
                <div className="font-bold text-sm text-stone-900 font-mono">{inspectingDoc.documentName}</div>
                <div className="text-xs text-stone-500 font-mono mt-0.5">{inspectingDoc.type}</div>
                {inspectingDoc.number && (
                  <div className="text-xs font-mono font-bold text-amber-900 mt-1">
                    ID / Ref: {inspectingDoc.number}
                  </div>
                )}
              </div>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified Anti-Fraud Stamp</span>
              </div>

              <p className="text-[11px] text-stone-600 italic">
                {inspectingDoc.details}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
