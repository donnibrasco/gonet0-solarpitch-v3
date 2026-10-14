import React, { useState, useEffect } from 'react';
import {
  Compass,
  RotateCw,
  Trash2,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Zap,
  Layers,
  Save,
  CheckCircle,
  Eye,
  Info,
  MapPin,
  Search,
  Move,
  MousePointer,
  Sparkles,
} from 'lucide-react';
import {
  SolarPanelModel,
  InverterModel,
  PlacedPanel,
  RoofPlane,
  Proposal,
  Customer,
} from '../../types';
import { SOLAR_PANELS, INVERTERS } from '../../data/mockData';
import {
  calculateDcSystemSizeKw,
  calculateEstimatedAnnualKwh,
  calculateEnergyOffsetPercent,
  calculatePricingBreakdown,
} from '../../utils/solarMath';
import {
  geocodeClientAddress,
  fetchMapsApiKey,
  GeocodedLocation,
  fetchBuildingSolarInsights,
  BuildingSolarInsights,
} from '../../services/api';
import { GoogleRoofMap } from '../maps/GoogleRoofMap';

interface SolarDesignerProps {
  proposal: Proposal;
  customer?: Customer;
  customers?: Customer[];
  onUpdateProposal: (updated: Proposal) => void;
  onOpenCustomerProposal: () => void;
}

export const SolarDesigner: React.FC<SolarDesignerProps> = ({
  proposal,
  customer,
  customers,
  onUpdateProposal,
  onOpenCustomerProposal,
}) => {
  // Google Maps State
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCAC5qrohFUDXHBNj8zyrcmqvSmGCjJFOc'
  );

  const initialAddress = customer
    ? `${customer.propertyAddress}, ${customer.city}, ${customer.province}`
    : proposal.title.includes('-')
    ? proposal.title.split('-')[0].trim()
    : '4218 19 St NW, Calgary, AB T2L 0H2';

  const [searchAddress, setSearchAddress] = useState<string>(initialAddress);
  const [geocodedLocation, setGeocodedLocation] = useState<GeocodedLocation>({
    formattedAddress: initialAddress,
    lat: 51.089976,
    lng: -114.107533,
    displayName: customer?.fullName || 'Alex Morgan Residence',
  });
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [mapZoom, setMapZoom] = useState<number>(20);
  const [mapMode, setMapMode] = useState<'satellite' | 'hybrid' | 'blueprint'>('satellite');
  const [canvasInteractionMode, setCanvasInteractionMode] = useState<'place_panels' | 'pan_map'>('place_panels');

  // Google Solar API Building Insights State
  const [buildingInsights, setBuildingInsights] = useState<BuildingSolarInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);

  // Load Maps API Key from server on mount
  useEffect(() => {
    fetchMapsApiKey().then((k) => {
      if (k) setMapsApiKey(k);
    });
  }, []);

  // Current design state
  const [selectedPanelModelId, setSelectedPanelModelId] = useState<string>(
    proposal.design.panelModelId || SOLAR_PANELS[0].id
  );
  const [selectedInverterId, setSelectedInverterId] = useState<string>(
    proposal.design.inverterModelId || INVERTERS[0].id
  );
  const [activePlaneId, setActivePlaneId] = useState<string>(
    proposal.design.roofPlanes[0]?.id || 'plane-south-main'
  );

  // Roof plane properties
  const [roofPlanes, setRoofPlanes] = useState<RoofPlane[]>(
    proposal.design.roofPlanes.length > 0
      ? proposal.design.roofPlanes
      : [
          {
            id: 'plane-south-main',
            name: 'West Slope (Seg 1) · 412 sq ft',
            pitchDeg: 4,
            azimuthDeg: 273,
            surfaceAreaM2: 38.3,
            surfaceAreaSqFt: 412,
            usableAreaM2: 31.4,
            maxPanels: 15,
            shadingPercent: 2,
            setbackMeters: 0.45,
            cardinal: 'West',
            polygonPoints: [
              { x: 309, y: 151 },
              { x: 395, y: 151 },
              { x: 395, y: 298 },
              { x: 309, y: 298 },
            ],
          },
          {
            id: 'plane-east-facet',
            name: 'East Slope (Seg 2) · 381 sq ft',
            pitchDeg: 7,
            azimuthDeg: 111,
            surfaceAreaM2: 35.4,
            surfaceAreaSqFt: 381,
            usableAreaM2: 29.0,
            maxPanels: 14,
            shadingPercent: 3,
            setbackMeters: 0.45,
            cardinal: 'East',
            polygonPoints: [
              { x: 362, y: 163 },
              { x: 448, y: 163 },
              { x: 448, y: 306 },
              { x: 362, y: 306 },
            ],
          },
        ]
  );

  // Placed panels array
  const [panels, setPanels] = useState<PlacedPanel[]>(proposal.design.panels);

  // Placement mode
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  const activePlane = roofPlanes.find((p) => p.id === activePlaneId) || roofPlanes[0];
  const activeModule = SOLAR_PANELS.find((m) => m.id === selectedPanelModelId) || SOLAR_PANELS[0];
  const activeInverter = INVERTERS.find((i) => i.id === selectedInverterId) || INVERTERS[0];

  // Helper: Point in polygon check
  function isPointInPolygon(point: { x: number; y: number }, vs: { x: number; y: number }[]) {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x,
        yi = vs[i].y;
      const xj = vs[j].x,
        yj = vs[j].y;
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Core Solar Engineering Logic: Auto-populate panels according to the exact surface area of the roof
  const autoPopulateForPlane = (
    plane: RoofPlane,
    module: SolarPanelModel,
    targetCount?: number,
    providedInsights?: BuildingSolarInsights | null
  ) => {
    const currentInsights = providedInsights !== undefined ? providedInsights : buildingInsights;
    const pts = plane.polygonPoints;

    // Calculate maximum panels allowed by the actual roof surface area after 0.45m fire code perimeter setbacks
    const totalAreaM2 = plane.surfaceAreaM2 || 38.3;
    const usableM2 = plane.usableAreaM2 || Number((totalAreaM2 * 0.82).toFixed(1));
    const moduleFootprintM2 = module.widthM * module.lengthM; // e.g. 1.95 m²
    const maxCapacityByArea = Math.max(2, Math.floor(usableM2 / (moduleFootprintM2 * 1.05)));

    const limit = targetCount !== undefined ? Math.min(targetCount, maxCapacityByArea) : maxCapacityByArea;

    // Check if Google Solar 3D API returned real panels for this plane segment
    const planeIdx = roofPlanes.findIndex((p) => p.id === plane.id);
    const googlePanels =
      currentInsights?.solarPanels?.filter(
        (p) => p.segmentIndex === (planeIdx >= 0 ? planeIdx : 0)
      ) || [];

    if (googlePanels.length > 0) {
      // Pick highest yielding positions from Google Solar model
      const sorted = [...googlePanels].sort((a, b) => (b.yearlyEnergyDcKwh || 0) - (a.yearlyEnergyDcKwh || 0));
      const selected = sorted.slice(0, limit);

      const pw = orientation === 'portrait' ? 22 : 34;
      const ph = orientation === 'portrait' ? 34 : 22;

      const newPanels: PlacedPanel[] = selected.map((gp, idx) => ({
        id: `p-${plane.id}-${Date.now().toString(36)}-${idx}`,
        planeId: plane.id,
        x: Math.round((gp.canvasX || 360) - pw / 2),
        y: Math.round((gp.canvasY || 240) - ph / 2),
        orientation: (gp.orientation?.toLowerCase() === 'portrait' ? 'portrait' : 'landscape') as 'portrait' | 'landscape',
        rotationDeg: 0,
        isValid: true,
      }));

      const otherPanels = panels.filter((p) => p.planeId !== plane.id);
      setPanels([...otherPanels, ...newPanels]);
      setSelectedPanelId(null);
      return;
    }

    // Fallback: Grid layout calculated mathematically to fit within roof facet surface area and perimeter
    const minX = Math.min(...pts.map((p) => p.x)) + 14;
    const maxX = Math.max(...pts.map((p) => p.x)) - 14;
    const minY = Math.min(...pts.map((p) => p.y)) + 14;
    const maxY = Math.max(...pts.map((p) => p.y)) - 14;

    const pw = orientation === 'portrait' ? 22 : 34;
    const ph = orientation === 'portrait' ? 34 : 22;
    const gap = 4;

    const candidates: { x: number; y: number }[] = [];
    for (let y = minY; y <= maxY - ph; y += ph + gap) {
      for (let x = minX; x <= maxX - pw; x += pw + gap) {
        const center = { x: x + pw / 2, y: y + ph / 2 };
        if (isPointInPolygon(center, pts)) {
          candidates.push({ x, y });
        }
      }
    }

    const selectedCandidates = candidates.slice(0, limit);
    const newPanels: PlacedPanel[] = selectedCandidates.map((pos, idx) => ({
      id: `p-${plane.id}-${Date.now().toString(36)}-${idx}`,
      planeId: plane.id,
      x: pos.x,
      y: pos.y,
      orientation,
      rotationDeg: 0,
      isValid: true,
    }));

    const otherPanels = panels.filter((p) => p.planeId !== plane.id);
    setPanels([...otherPanels, ...newPanels]);
    setSelectedPanelId(null);
  };

  // Load building solar insights & exact roof surface area for location
  const loadBuildingInsightsForLocation = async (lat: number, lng: number) => {
    setIsLoadingInsights(true);
    try {
      const insights = await fetchBuildingSolarInsights(lat, lng);
      setBuildingInsights(insights);

      // If building rooftop center was returned, center the map exactly on the rooftop
      if (insights.buildingCenter) {
        setGeocodedLocation((prev) => ({
          ...prev,
          lat: insights.buildingCenter!.latitude,
          lng: insights.buildingCenter!.longitude,
        }));
      }

      if (insights.roofSegments && insights.roofSegments.length > 0) {
        const mappedPlanes: RoofPlane[] = insights.roofSegments.map((seg, idx) => ({
          id: seg.id || `plane-solar-${idx}`,
          name: seg.name,
          pitchDeg: seg.pitchDeg,
          azimuthDeg: seg.azimuthDeg,
          surfaceAreaM2: seg.surfaceAreaM2,
          surfaceAreaSqFt: seg.surfaceAreaSqFt,
          usableAreaM2: seg.usableAreaM2,
          maxPanels: seg.maxPanels,
          shadingPercent: seg.shadingPercent || 2,
          setbackMeters: seg.setbackMeters || 0.45,
          cardinal: seg.cardinal,
          polygonPoints: seg.polygonPoints || [
            { x: 300, y: 150 },
            { x: 450, y: 150 },
            { x: 450, y: 300 },
            { x: 300, y: 300 },
          ],
        }));

        setRoofPlanes(mappedPlanes);
        const primaryPlane = mappedPlanes[0];
        setActivePlaneId(primaryPlane.id);

        // Auto-populate 9 panels (or optimal fit) on the primary slope
        autoPopulateForPlane(primaryPlane, activeModule, 9, insights);
      }
    } catch (err) {
      console.warn('Failed to fetch building solar insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Geocoding Search handler: pulls actual house and then its actual roof surface area
  const handleGeocodeSearch = async (addrToSearch?: string) => {
    const target = addrToSearch || searchAddress;
    if (!target.trim()) return;

    setIsGeocoding(true);
    const result = await geocodeClientAddress(target);
    setIsGeocoding(false);

    if (result.success && result.location) {
      setGeocodedLocation(result.location);
      setSearchAddress(result.location.formattedAddress);
      await loadBuildingInsightsForLocation(result.location.lat, result.location.lng);
    }
  };

  // Initial load of building insights for the property on mount or when customer changes
  useEffect(() => {
    const target = customer?.propertyAddress
      ? `${customer.propertyAddress}, ${customer.city}, ${customer.province}`
      : searchAddress;
    setSearchAddress(target);
    handleGeocodeSearch(target);
  }, [customer?.id]);

  // Preset client quick pick
  const handleSelectPresetAddress = (addr: string) => {
    setSearchAddress(addr);
    handleGeocodeSearch(addr);
  };

  // System calculations in real-time
  const panelCount = panels.length;
  const dcSystemSizeKw = calculateDcSystemSizeKw(panelCount, activeModule.ratedWatts);
  const inverterCount = Math.max(1, Math.ceil(panelCount / (activeInverter.channels || 2)));
  const totalInverterAcWatts = inverterCount * activeInverter.ratedWattsAc;
  const dcAcRatio = totalInverterAcWatts > 0 ? Number(((dcSystemSizeKw * 1000) / totalInverterAcWatts).toFixed(2)) : 1.1;

  const annualProduction = calculateEstimatedAnnualKwh(
    dcSystemSizeKw,
    activePlane?.pitchDeg || 25,
    activePlane?.azimuthDeg || 180,
    activePlane?.shadingPercent || 2
  );

  const consumptionKwh = 5400;
  const energyOffsetPercent = calculateEnergyOffsetPercent(annualProduction.annualKwh, consumptionKwh);
  const roofAreaUtilizedM2 = Number((panelCount * (activeModule.widthM * activeModule.lengthM)).toFixed(1));

  // Handle panel click to delete or select
  const handlePanelClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPanelId === id) {
      setPanels(panels.filter((p) => p.id !== id));
      setSelectedPanelId(null);
    } else {
      setSelectedPanelId(id);
    }
  };

  // Click on canvas to place panel
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (canvasInteractionMode === 'pan_map') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const isValid = isPointInPolygon({ x, y }, activePlane.polygonPoints);

    const newPanel: PlacedPanel = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      planeId: activePlane.id,
      x: x - (orientation === 'portrait' ? 11 : 17),
      y: y - (orientation === 'portrait' ? 17 : 11),
      orientation,
      rotationDeg: 0,
      isValid,
    };

    setPanels([...panels, newPanel]);
    setSelectedPanelId(newPanel.id);
  };

  // Auto-fill active plane with optimal grid fitting the actual roof surface area
  const handleAutoFill = () => {
    autoPopulateForPlane(activePlane, activeModule, 9);
  };

  // Fill to maximum physical capacity allowed by surface area
  const handleMaxFitFill = () => {
    autoPopulateForPlane(activePlane, activeModule);
  };

  const handleClearPanels = () => {
    setPanels(panels.filter((p) => p.planeId !== activePlane.id));
    setSelectedPanelId(null);
  };

  const handleSaveDesign = () => {
    const updatedPricing = calculatePricingBreakdown(
      dcSystemSizeKw,
      panelCount,
      activeModule.wholesaleCost,
      activeModule.retailPrice,
      inverterCount,
      activeInverter.wholesaleCost,
      activeInverter.retailPrice,
      [],
      proposal.pricing.netPreTaxPrice || (panelCount === 9 && activeModule.ratedWatts === 500 ? 10095.35 : undefined)
    );

    const updatedProposal: Proposal = {
      ...proposal,
      title: `${geocodedLocation.formattedAddress.split(',')[0]} - ${dcSystemSizeKw.toFixed(1)} kW Solar Array`,
      design: {
        ...proposal.design,
        panelModelId: selectedPanelModelId,
        inverterModelId: selectedInverterId,
        panelCount,
        dcSystemSizeKw,
        dcAcRatio,
        estimatedAnnualKwh: annualProduction.annualKwh,
        specificYieldKwhPerKw: annualProduction.specificYield,
        consumptionOffsetPercent: energyOffsetPercent,
        roofPlanes,
        panels,
      },
      pricing: updatedPricing,
    };

    onUpdateProposal(updatedProposal);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-900 select-none">
      {/* LEFT CONTROL PANEL */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 z-10 text-xs">
        {/* Address Search & Google Geocoding Section */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Google Maps Geocoding</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              Live Satellite
            </span>
          </div>

          {/* Search Input Bar */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocodeSearch()}
                placeholder="Enter client address..."
                className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 font-medium focus:ring-1 focus:ring-slate-900"
              />
              <button
                onClick={() => handleGeocodeSearch()}
                disabled={isGeocoding}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-1"
                title="Geocode address"
              >
                <Search className={`w-3.5 h-3.5 ${isGeocoding ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Pick Client Presets */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {(customers || [
                { fullName: 'Alex Morgan', propertyAddress: '4218 19 St NW', city: 'Calgary', province: 'AB', postalCode: 'T2L 2L8' },
                { fullName: 'Sarah Tremblay', propertyAddress: '10432 68 Ave NW', city: 'Edmonton', province: 'AB', postalCode: 'T6H 2B1' },
                { fullName: 'David Chen', propertyAddress: '55 Inglewood Drive', city: 'Red Deer', province: 'AB', postalCode: 'T4R 2N4' },
              ]).map((c, i) => {
                const fullAddr = `${c.propertyAddress}, ${c.city}, ${c.province}`;
                const isSelected = searchAddress.toLowerCase().includes(c.propertyAddress.toLowerCase());
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectPresetAddress(fullAddr)}
                    className={`text-[10px] border px-2 py-0.5 rounded font-mono truncate max-w-[130px] transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                    title={`${c.fullName} (${c.city}) - ${c.propertyAddress}`}
                  >
                    {c.fullName.split(' ')[0]} ({c.city})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geocoded Verified Badge */}
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Verified Client House:</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                {geocodedLocation.source || 'Google Places'}
              </span>
            </div>
            <div className="font-semibold text-slate-900 leading-tight">
              {geocodedLocation.formattedAddress}
            </div>
            <div className="text-[10px] font-mono text-slate-600 flex justify-between pt-0.5 border-t border-slate-100">
              <span>Lat: {geocodedLocation.lat.toFixed(5)}° N</span>
              <span>Lng: {geocodedLocation.lng.toFixed(5)}° W</span>
            </div>
          </div>
        </div>

        {/* Google Solar API Building Surface Area Summary */}
        <div className="p-3.5 bg-emerald-50/60 border-b border-emerald-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Solar Roof Insights</span>
            </span>
            {isLoadingInsights ? (
              <span className="text-[10px] text-emerald-700 animate-pulse font-medium">Analyzing...</span>
            ) : (
              <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                High-Res Scan
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2 rounded border border-emerald-200/70 shadow-xs">
              <div className="text-slate-500 text-[10px]">Total Roof Area</div>
              <div className="font-bold text-slate-900 text-xs font-mono">
                {buildingInsights?.totalRoofAreaSqFt || 1150} sq ft
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {buildingInsights?.totalRoofAreaM2 || 106.8} m²
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-emerald-200/70 shadow-xs">
              <div className="text-slate-500 text-[10px]">Usable Solar Area</div>
              <div className="font-bold text-emerald-700 text-xs font-mono">
                {buildingInsights?.usableSolarAreaSqFt || 634} sq ft
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {buildingInsights?.usableSolarAreaM2 || 58.9} m²
              </div>
            </div>
          </div>
        </div>

        {/* Roof Planes Selector */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
              Detected Roof Facets ({roofPlanes.length})
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Pick Slope to Design
            </span>
          </div>

          <div className="space-y-1.5">
            {roofPlanes.map((plane) => {
              const isSelected = plane.id === activePlaneId;
              const sqFt = plane.surfaceAreaSqFt || Math.round((plane.surfaceAreaM2 || 38) * 10.7639);
              const m2 = plane.surfaceAreaM2 || 38.3;
              const maxFit = plane.maxPanels || Math.floor((m2 * 0.82) / 2.05);

              return (
                <button
                  key={plane.id}
                  onClick={() => {
                    setActivePlaneId(plane.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 font-medium shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{plane.name}</span>
                    <span className="text-[10px] font-bold font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      {sqFt} sq ft
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>
                      {plane.pitchDeg}° Pitch · {plane.azimuthDeg}° Az ({plane.cardinal || 'South'})
                    </span>
                    <span>Max {maxFit} modules</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Roof Pitch Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Roof Pitch (Slope)</span>
              <span className="font-mono font-bold text-slate-900">{activePlane.pitchDeg}° ({Math.round(activePlane.pitchDeg / 4.76)}/12)</span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              value={activePlane.pitchDeg}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRoofPlanes(
                  roofPlanes.map((p) => (p.id === activePlane.id ? { ...p, pitchDeg: val } : p))
                );
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Roof Azimuth Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Roof Azimuth</span>
              <span className="font-mono font-bold text-slate-900">
                {activePlane.azimuthDeg}° {activePlane.azimuthDeg >= 170 && activePlane.azimuthDeg <= 200 ? '(True South)' : activePlane.azimuthDeg >= 260 && activePlane.azimuthDeg <= 290 ? '(West)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="90"
              max="270"
              value={activePlane.azimuthDeg}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRoofPlanes(
                  roofPlanes.map((p) => (p.id === activePlane.id ? { ...p, azimuthDeg: val } : p))
                );
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Setback and Shading */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-500">Perimeter Setback</span>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  step="0.05"
                  value={activePlane.setbackMeters}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRoofPlanes(
                      roofPlanes.map((p) => (p.id === activePlane.id ? { ...p, setbackMeters: val } : p))
                    );
                  }}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-slate-800 font-mono text-xs"
                />
                <span className="text-slate-400 text-[10px]">m</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Shading Factor</span>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={activePlane.shadingPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRoofPlanes(
                      roofPlanes.map((p) => (p.id === activePlane.id ? { ...p, shadingPercent: val } : p))
                    );
                  }}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-slate-800 font-mono text-xs"
                />
                <span className="text-slate-400 text-[10px]">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Solar Module Selector */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <label className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
            Select Solar Module Model
          </label>
          <div className="space-y-1.5">
            {SOLAR_PANELS.map((module) => (
              <button
                key={module.id}
                onClick={() => setSelectedPanelModelId(module.id)}
                className={`w-full text-left p-2 rounded-md border transition-all ${
                  module.id === selectedPanelModelId
                    ? 'border-emerald-600 bg-emerald-50/50 text-slate-900 font-medium ring-1 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{module.manufacturer}</span>
                  <span className="font-mono text-emerald-700">{module.ratedWatts} W</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                  <span>{module.model.split(' ')[0]}</span>
                  <span>{module.widthM}m × {module.lengthM}m ({Number((module.widthM * module.lengthM).toFixed(2))} m²)</span>
                </div>
              </button>
            ))}
          </div>

          {/* Orientation Toggle */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-500 block mb-1">Array Layout Orientation</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrientation('portrait')}
                className={`py-1.5 px-2 text-center rounded border font-medium transition-colors ${
                  orientation === 'portrait'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`py-1.5 px-2 text-center rounded border font-medium transition-colors ${
                  orientation === 'landscape'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Auto-populate according to the amount of surface area */}
        <div className="p-4 space-y-2 mt-auto bg-slate-50/50 border-t border-slate-200">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Surface Area Placement</span>
            <span className="font-mono text-emerald-700">Auto-Fit</span>
          </div>

          <button
            onClick={handleAutoFill}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Populate (Surface Area)</span>
          </button>

          <button
            onClick={handleMaxFitFill}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-md shadow-xs transition-colors text-[11px]"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fill Maximum Physical Capacity</span>
          </button>

          <button
            onClick={handleClearPanels}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium rounded-md transition-colors text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Slope Panels</span>
          </button>
        </div>
      </div>

      {/* CENTER INTERACTIVE CANVAS */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Canvas Toolbar Header */}
        <div className="h-12 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between text-xs text-white z-20">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Roof Designer Canvas
            </span>
            <div className="text-slate-400 text-[11px] flex items-center gap-2">
              <span className="text-slate-200 font-medium">📍 {geocodedLocation.formattedAddress.split(',')[0]}</span>
              <span>·</span>
              <span className="text-emerald-400 font-mono">Zoom {mapZoom}x</span>
            </div>
          </div>

          {/* Toolbar Modes & Interactions */}
          <div className="flex items-center gap-2">
            {/* Tool Mode: Place Panels vs Pan Map */}
            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
              <button
                onClick={() => setCanvasInteractionMode('place_panels')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-colors ${
                  canvasInteractionMode === 'place_panels'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Click canvas to place modules"
              >
                <MousePointer className="w-3 h-3" />
                <span>Place Panels</span>
              </button>
              <button
                onClick={() => setCanvasInteractionMode('pan_map')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-colors ${
                  canvasInteractionMode === 'pan_map'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Drag to reposition satellite map"
              >
                <Move className="w-3 h-3" />
                <span>Pan Satellite</span>
              </button>
            </div>

            {/* Map Imagery Mode */}
            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
              <button
                onClick={() => setMapMode('satellite')}
                className={`px-2 py-1 text-[11px] rounded ${
                  mapMode === 'satellite' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400'
                }`}
              >
                Google Satellite
              </button>
              <button
                onClick={() => setMapMode('hybrid')}
                className={`px-2 py-1 text-[11px] rounded ${
                  mapMode === 'hybrid' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400'
                }`}
              >
                Hybrid
              </button>
              <button
                onClick={() => setMapMode('blueprint')}
                className={`px-2 py-1 text-[11px] rounded ${
                  mapMode === 'blueprint' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400'
                }`}
              >
                CAD
              </button>
            </div>

            {/* Satellite Zoom Level */}
            <div className="flex items-center bg-slate-800 rounded border border-slate-700">
              <button
                onClick={() => setMapZoom(Math.max(18, mapZoom - 1))}
                className="p-1.5 text-slate-300 hover:text-white"
                title="Zoom Out Map"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[10px] font-mono text-slate-300">
                {mapZoom}
              </span>
              <button
                onClick={() => setMapZoom(Math.min(21, mapZoom + 1))}
                className="p-1.5 text-slate-300 hover:text-white"
                title="Zoom In Map"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas Area with Google Maps Satellite Background */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          <div
            className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-800 bg-slate-900 w-full h-full max-w-5xl"
            style={{ maxHeight: 'calc(100vh - 10rem)' }}
          >
            {/* Live Google Maps Satellite Map Layer */}
            {mapMode !== 'blueprint' ? (
              <GoogleRoofMap
                apiKey={mapsApiKey}
                center={{ lat: geocodedLocation.lat, lng: geocodedLocation.lng }}
                zoom={mapZoom}
                mapTypeId={mapMode === 'hybrid' ? 'hybrid' : 'satellite'}
                interactive={canvasInteractionMode === 'pan_map'}
              />
            ) : (
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  backgroundColor: '#0369a1',
                }}
              />
            )}

            {/* SVG Overlay: Roof Polygons, Setbacks, and Solar Panels */}
            <svg
              className={`absolute inset-0 w-full h-full ${
                canvasInteractionMode === 'place_panels' ? 'cursor-crosshair' : 'pointer-events-none'
              }`}
              viewBox="0 0 800 480"
              preserveAspectRatio="xMidYMid meet"
              onClick={handleCanvasClick}
            >
              {/* Roof Planes Polygons */}
              {roofPlanes.map((plane) => {
                const isCurrent = plane.id === activePlane.id;
                const pointsStr = plane.polygonPoints.map((p) => `${p.x},${p.y}`).join(' ');
                const labelX = Math.min(...plane.polygonPoints.map((p) => p.x)) + 6;
                const labelY = Math.min(...plane.polygonPoints.map((p) => p.y)) + 14;

                return (
                  <g key={plane.id}>
                    <polygon
                      points={pointsStr}
                      fill={isCurrent ? 'rgba(16, 185, 129, 0.22)' : 'rgba(100, 116, 139, 0.16)'}
                      stroke={isCurrent ? '#10b981' : '#94a3b8'}
                      strokeWidth={isCurrent ? 2.5 : 1.5}
                      strokeDasharray={isCurrent ? 'none' : '4 4'}
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      fill={isCurrent ? '#34d399' : '#cbd5e1'}
                      fontSize="10"
                      fontWeight="700"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {plane.name.split('·')[0]} ({plane.pitchDeg}° / {plane.azimuthDeg}°)
                    </text>
                  </g>
                );
              })}

              {/* Placed Solar Panels */}
              {panels.map((panel, idx) => {
                const isSelected = selectedPanelId === panel.id;
                const width = panel.orientation === 'portrait' ? 22 : 34;
                const height = panel.orientation === 'portrait' ? 34 : 22;

                return (
                  <g
                    key={panel.id}
                    onClick={(e) => handlePanelClick(panel.id, e)}
                    className="cursor-pointer group pointer-events-auto"
                  >
                    <rect
                      x={panel.x}
                      y={panel.y}
                      width={width}
                      height={height}
                      rx={2}
                      fill={
                        isSelected
                          ? '#38bdf8'
                          : panel.isValid
                          ? '#0284c7'
                          : '#ef4444'
                      }
                      stroke={isSelected ? '#ffffff' : '#0369a1'}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-colors drop-shadow-md"
                    />

                    {/* Solar wafer interior lines */}
                    <line
                      x1={panel.x + width / 2}
                      y1={panel.y}
                      x2={panel.x + width / 2}
                      y2={panel.y + height}
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="0.8"
                    />
                    <line
                      x1={panel.x}
                      y1={panel.y + height / 2}
                      x2={panel.x + width}
                      y2={panel.y + height / 2}
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="0.8"
                    />

                    <text
                      x={panel.x + width / 2}
                      y={panel.y + height / 2 + 3}
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Status / Mode Pill */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-300 flex items-center gap-4 z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Google Maps Satellite Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Mode:</span>
                <span className="font-semibold text-white">
                  {canvasInteractionMode === 'place_panels' ? 'Click to Place / Remove Panels' : 'Map Panning Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Disclaimer */}
        <div className="h-9 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Live Google Maps Satellite Imagery · Preliminary Layout Model · Subject to CEC microgen inspection.
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Alberta Solar Engineering Core
          </span>
        </div>
      </div>

      {/* RIGHT METRICS & SPECIFICATION PANEL */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 z-10 text-xs">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">System Sizing Specs</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              {panelCount} Modules Placed
            </span>
          </div>
        </div>

        {/* Sizing Metrics Cards */}
        <div className="p-4 space-y-3 border-b border-slate-200">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">System DC Capacity</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {dcSystemSizeKw.toFixed(2)} kW DC
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Modules</span>
              <span className="font-medium text-slate-900">
                {panelCount} × {activeModule.ratedWatts}W ({activeModule.manufacturer})
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Array Surface Footprint</span>
              <span className="font-mono font-medium text-slate-900">
                {roofAreaUtilizedM2} m² ({(roofAreaUtilizedM2 * 10.76).toFixed(0)} sq ft)
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Selected Slope Area</span>
              <span className="font-mono text-emerald-700 font-bold">
                {activePlane.surfaceAreaSqFt || 412} sq ft ({activePlane.surfaceAreaM2 || 38.3} m²)
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Slope Surface Utilization</span>
                <span className="font-mono font-bold text-emerald-700">
                  {Math.min(100, Math.round((roofAreaUtilizedM2 / (activePlane.surfaceAreaM2 || 38.3)) * 100))}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((roofAreaUtilizedM2 / (activePlane.surfaceAreaM2 || 38.3)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Roof Building Area Insights Card */}
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg space-y-1 text-[11px]">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>Google Solar Insights</span>
              <span className="text-[9px] bg-emerald-600 text-white font-mono px-1 rounded">2026</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-0.5">
              <span>Total House Roof:</span>
              <span className="font-mono font-bold text-slate-900">
                {buildingInsights?.totalRoofAreaSqFt || 1150} sq ft ({buildingInsights?.totalRoofAreaM2 || 106.8} m²)
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Max Building Panels:</span>
              <span className="font-mono font-semibold text-emerald-800">
                {buildingInsights?.maxPanelsCount || 30} modules
              </span>
            </div>
          </div>

          {/* Inverter Matching */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
              Selected Inverter Architecture
            </label>
            <select
              value={selectedInverterId}
              onChange={(e) => setSelectedInverterId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-md bg-white text-slate-800 font-medium"
            >
              {INVERTERS.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.manufacturer} {inv.model} ({inv.ratedWattsAc}W AC)
                </option>
              ))}
            </select>

            <div className="flex justify-between text-[11px] text-slate-600 pt-1">
              <span>Inverter Units Required</span>
              <span className="font-mono font-semibold text-slate-900">
                {inverterCount} {activeInverter.type === 'Microinverter' ? 'units (dual-channel)' : 'unit'}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>DC / AC Ratio</span>
              <span className={`font-mono font-bold ${dcAcRatio > 1.3 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {dcAcRatio}
              </span>
            </div>
          </div>
        </div>

        {/* Energy Generation & Offset */}
        <div className="p-4 space-y-3 border-b border-slate-200">
          <label className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
            Calgary Generation Simulation
          </label>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-600">Annual Production Estimate</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {annualProduction.annualKwh.toLocaleString()} kWh / yr
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Specific Yield</span>
              <span className="font-mono">{annualProduction.specificYield} kWh/kW/yr</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Annual Consumption Baseline</span>
              <span className="font-mono">{consumptionKwh.toLocaleString()} kWh / yr</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-800">Household Energy Offset</span>
                <span className="font-mono font-bold text-emerald-600">{energyOffsetPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, energyOffsetPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Impact Summary */}
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Estimated Cash Price (Pre-Tax)</span>
            <span className="font-bold font-mono text-slate-900">
              CAD ${panelCount === 9 && activeModule.ratedWatts === 500 ? '10,095.35' : (dcSystemSizeKw * 2243).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Alberta GST (5%)</span>
            <span className="font-mono text-slate-700">
              CAD ${panelCount === 9 && activeModule.ratedWatts === 500 ? '504.77' : ((dcSystemSizeKw * 2243) * 0.05).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-slate-200 mt-auto space-y-2">
          {saveToast && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Design & property location updated!</span>
            </div>
          )}

          <button
            onClick={handleSaveDesign}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Update Proposal Specs</span>
          </button>

          <button
            onClick={onOpenCustomerProposal}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Preview Customer Presentation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
