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
} from 'lucide-react';
import { PropertyRecord } from '../types';
import { PROPERTIES_DATA } from '../data/estateData';
import { useSecurity } from '../context/SecurityContext';

interface PropertiesManagerProps {
  onNavigateToMaintenance: () => void;
  initialOpenAdd?: boolean;
}

export const PropertiesManager: React.FC<PropertiesManagerProps> = ({
  onNavigateToMaintenance,
  initialOpenAdd = false,
}) => {
  const { canPerform, showSecurityNotification } = useSecurity();
  const [properties, setProperties] = useState<PropertyRecord[]>(PROPERTIES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'multifamily' | 'under90'>('all');
  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(PROPERTIES_DATA[0]);
  const [showMobileCardMode, setShowMobileCardMode] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);

  // Add Property Slide-in Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(initialOpenAdd);
  const [addStepState, setAddStepState] = useState<1 | 2 | 3 | 4>(1);
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropCity, setNewPropCity] = useState('Austin');
  const [newPropUnits, setNewPropUnits] = useState('');
  const [unitError, setUnitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
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
    setNewPropUnits('');
    setUnitError(null);
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

  const handleSimulateAddProperty = (overrideName?: string, overrideUnits?: number) => {
    const name = overrideName || newPropName || 'Cedar Row Annex';
    const units = overrideUnits || Number(newPropUnits) || 18;

    setIsSaving(true);
    setAddStepState(3);

    setTimeout(() => {
      setIsSaving(false);
      setAddStepState(4);

      const newRecord: PropertyRecord = {
        id: `prp-${Date.now()}`,
        code: `PRP-0${Math.floor(250 + Math.random() * 50)}`,
        name: name,
        address: newPropAddress || '414 Cedar Lane',
        city: newPropCity,
        state: 'TX',
        zip: '78704',
        propertyType: 'Multi-family',
        unitsTotal: units,
        unitsOccupied: Math.round(units * 0.88),
        occupancyPercent: 88,
        status: 'Healthy',
        openWorkOrders: 1,
        unitsInTurnover: 1,
        nextLeaseStart: 'Nov 15',
        documents: [
          { name: 'Master deed (PDF)', size: '1.9 MB', date: 'Sep 2026', verified: true },
        ],
        maintenanceSummary: {
          inProgress: 'Unit 1A, intake inspection',
          awaitingApproval: 'None',
        },
      };

      setProperties((prev) => [newRecord, ...prev]);
      setHighlightedPropertyId(newRecord.id);
      setSelectedProperty(newRecord);

      setTimeout(() => {
        setIsAddDrawerOpen(false);
        showSecurityNotification(`"${name}" registered successfully. Idempotent token verified. Toast: "Add units now"`);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            EstateFlow · Property & Unit Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Properties, Units, and Portfolio Records
          </h1>
          <p className="text-sm text-stone-600 mt-0.5 max-w-3xl">
            A searchable inventory of every property and unit, with occupancy at a glance, a full property detail view, and a validated add-property flow.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Reflow Simulation Switcher */}
          <button
            onClick={() => setShowMobileCardMode(!showMobileCardMode)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showMobileCardMode
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title="Demonstrate mobile reflow into tappable cards (<760px)"
          >
            {showMobileCardMode ? 'Viewing: Mobile Cards (<760px)' : 'View Mobile Reflow (<760px)'}
          </button>

          <button
            onClick={handleOpenAddDrawer}
            id="properties-add-btn"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add property</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inventory & Occupancy Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inventory List & Search */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by name, city, or property ID…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  All ({properties.length})
                </button>
                <button
                  onClick={() => setFilterType('multifamily')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    filterType === 'multifamily'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Multi-family
                </button>
                <button
                  onClick={() => setFilterType('under90')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
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
                      <th className="py-2.5 px-3">Property</th>
                      <th className="py-2.5 px-3 text-center">Units</th>
                      <th className="py-2.5 px-3">Occupancy</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Open Wk. Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProperties.map((prop) => {
                      const isSelected = selectedProperty?.id === prop.id;
                      const isHighlighted = highlightedPropertyId === prop.id;

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
                            <div className="font-bold text-stone-900">{prop.name}</div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              {prop.code} · {prop.city}, {prop.state}
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
                              <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
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
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                                prop.status === 'Healthy'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : prop.status === 'Watch'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {prop.status}
                            </span>
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
              /* Mobile Card Reflow Mode (<760px) as specifically documented on Page 2 */
              <div className="mt-4 space-y-3">
                <div className="text-[11px] text-stone-500 italic pb-2">
                  "On screens under 760 px the table reflows into tappable cards — same filters, same sort, no horizontal scrolling."
                </div>
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
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-stone-900">{prop.name}</div>
                        <div className="text-xs text-stone-500 font-mono">
                          {prop.code} · {prop.city}, {prop.state}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          prop.status === 'Healthy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : prop.status === 'Watch'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-stone-100 font-medium">
                      <span className="text-stone-800">
                        <strong>{prop.unitsTotal} units</strong> · {prop.occupancyPercent}% occupied
                      </span>
                      <span className="text-amber-800 font-semibold">{prop.openWorkOrders} open</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validated Add-Property Flow Interactive Preview (4 States from Page 2) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Add-property flow — validated states
                </h3>
                <p className="text-xs text-stone-500">
                  A slide-in drawer collects name, address, unit count, and property type. Each state is modeled below:
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                Interactive Spec
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* State 1 */}
              <div
                onClick={() => {
                  setAddStepState(1);
                  setIsAddDrawerOpen(true);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  addStepState === 1 ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-400' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>1 · Required fields</span>
                  <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-stone-600">
                  <div className="text-stone-400">Property name *</div>
                  <div className="text-stone-400">Street address *</div>
                  <div className="text-stone-400">Unit count *</div>
                </div>
                <p className="mt-2 text-[10px] text-stone-500 italic">
                  Empty required fields keep the Save button disabled.
                </p>
              </div>

              {/* State 2 */}
              <div
                onClick={() => {
                  setAddStepState(2);
                  setNewPropUnits('abc');
                  setUnitError('Enter a whole number between 1 and 500.');
                  setIsAddDrawerOpen(true);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  addStepState === 2 ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-400' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>2 · Invalid input</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                </div>
                <div className="mt-2 text-[11px] text-stone-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                  Unit count: <strong>abc</strong>
                  <div className="text-rose-700 text-[10px] font-semibold mt-0.5">
                    Enter a whole number between 1 and 500.
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-stone-500 italic">
                  Inline errors announce via aria-live; focus stays in the field.
                </p>
              </div>

              {/* State 3 */}
              <div
                onClick={() => {
                  setAddStepState(3);
                  setIsAddDrawerOpen(true);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  addStepState === 3 ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-400' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>3 · Saving</span>
                  <Loader2 className="w-3 h-3 text-amber-700 animate-spin" />
                </div>
                <div className="mt-2 text-[11px] text-stone-700 font-semibold">
                  Cedar Row Annex
                </div>
                <p className="mt-2 text-[10px] text-stone-500 italic">
                  Save button shows a spinner and locks form — POST /properties is idempotent with request key.
                </p>
              </div>

              {/* State 4 */}
              <div
                onClick={() => {
                  setAddStepState(4);
                  handleSimulateAddProperty('Cedar Row Annex', 18);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  addStepState === 4 ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-400' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>4 · Success</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium">
                  "Cedar Row Annex" added
                </div>
                <p className="mt-2 text-[10px] text-stone-500 italic">
                  Drawer closes, new row highlighted in inventory, toast offers "Add units now".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Occupancy Summary Chart & Property Detail Slideout */}
        <div className="space-y-4">
          {/* Occupancy Summary Chart */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900">Occupancy summary</h2>
              <span className="text-[11px] font-mono text-stone-500">Target: 90%</span>
            </div>

            {/* Occupancy Target Chart (Oak, Maple, Cedar, Willow) */}
            <div className="mt-4">
              <div className="relative h-44 flex items-end justify-between px-3 border-b border-stone-200">
                {/* 90% Target line across */}
                <div
                  style={{ bottom: '90%' }}
                  className="absolute left-0 right-0 border-b border-dashed border-amber-600 z-10 flex items-center justify-end pr-1"
                >
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-white/90 px-1 rounded">
                    target 90%
                  </span>
                </div>

                {/* 4 Properties bars */}
                {[
                  { name: 'Oak', code: 'PRP-0142', rate: 92 },
                  { name: 'Maple', code: 'PRP-0187', rate: 81 },
                  { name: 'Cedar', code: 'PRP-0203', rate: 67 },
                  { name: 'Willow', code: 'PRP-0219', rate: 97 },
                ].map((item) => {
                  const isAboveTarget = item.rate >= 90;
                  return (
                    <div
                      key={item.name}
                      onClick={() => {
                        const match = properties.find((p) => p.name.includes(item.name));
                        if (match) setSelectedProperty(match);
                      }}
                      className="flex-1 flex flex-col items-center group cursor-pointer"
                    >
                      <span className="text-[11px] font-mono font-bold text-stone-900 mb-1">
                        {item.rate}%
                      </span>
                      <div className="w-8 sm:w-10 h-32 flex items-end justify-center">
                        <div
                          style={{ height: `${item.rate}%` }}
                          className={`w-full rounded-t-sm transition-all group-hover:opacity-90 ${
                            isAboveTarget ? 'bg-[#92400E]' : 'bg-[#D97706]'
                          }`}
                        />
                      </div>
                      <span className="mt-2 text-xs font-semibold text-stone-700">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-stone-600">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#92400E]"></span>
                  <span>At or above target</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]"></span>
                  <span>Below 90% target</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <strong>Cedar Row Homes</strong> sits 23 points under target — its detail view is one tap away from the table row.
              </p>
            </div>
          </div>

          {/* Property Detail View (Oak Residence PRP-0142) */}
          {selectedProperty && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <div className="text-[11px] font-mono text-amber-800 font-semibold">
                  Property detail · {selectedProperty.name}
                </div>
                <div className="text-xs text-stone-500 font-mono mt-0.5">
                  {selectedProperty.code} · {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip} · {selectedProperty.propertyType}
                </div>
              </div>

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

              {/* Documents */}
              <div>
                <div className="text-xs font-bold text-stone-900 mb-2">Documents</div>
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
                      <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">
                        {doc.size} · {doc.date}
                      </span>
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
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-normal hover:underline"
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
          )}
        </div>
      </div>

      {/* Slide-in Add Property Drawer (Validated Flow) */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Add Property</h2>
                  <p className="text-xs text-stone-500">Validated 4-stage registration flow</p>
                </div>
                <button
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form fields */}
              <div className="mt-6 space-y-4">
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
                    placeholder="e.g. 414 Cedar Lane"
                    value={newPropAddress}
                    onChange={(e) => setNewPropAddress(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">City</label>
                    <input
                      type="text"
                      value={newPropCity}
                      onChange={(e) => setNewPropCity(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800">Property type</label>
                    <select className="mt-1 w-full px-2.5 py-2 text-xs border border-stone-300 rounded-lg bg-white">
                      <option>Multi-family</option>
                      <option>Single-family</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800">
                    Unit count <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter a whole number 1-500"
                    value={newPropUnits}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className={`mt-1 w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                      unitError
                        ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500'
                        : 'border-stone-300 focus:ring-amber-600'
                    }`}
                  />
                  {/* Inline error announcing via aria-live as required in document */}
                  {unitError && (
                    <div
                      aria-live="polite"
                      className="mt-1.5 flex items-center space-x-1.5 text-xs text-rose-600 font-medium"
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{unitError}</span>
                    </div>
                  )}
                </div>

                {/* Idempotency safeguard note */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
                  <strong>Idempotent POST /properties:</strong> Request key generated on load. Form locks during transit to eliminate duplicate building registrations.
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newPropName || !newPropAddress || !newPropUnits || Boolean(unitError) || isSaving}
                onClick={() => handleSimulateAddProperty()}
                className={`px-5 py-2 text-xs font-bold rounded-lg flex items-center space-x-1.5 ${
                  !newPropName || !newPropAddress || !newPropUnits || Boolean(unitError) || isSaving
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-amber-700 text-white hover:bg-amber-800 shadow-xs'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Property</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
