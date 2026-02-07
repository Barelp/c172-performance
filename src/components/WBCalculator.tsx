import { useWeightAndBalance, KG_TO_LBS, GAL_TO_LITER } from '../hooks/useWeightAndBalance';
import CGChart from './CGChart';
import StationDiagram from './StationDiagram';
import { Package, ChevronDown, ChevronUp, HelpCircle, PlaneTakeoff, PlaneLanding, Trash2, Settings, Users } from 'lucide-react';
import { getAllPresets, getPresetAircraft } from '../data/presets';
import { useState } from 'react';

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] text-center font-normal normal-case tracking-normal transform scale-95 group-hover:scale-100 whitespace-normal leading-relaxed">
      {text}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900"></div>
    </div>
  </div>
);

export default function WBCalculator() {
  const { flight, setFlight, aircraft, setAircraft, results } = useWeightAndBalance();
  const [showDetails, setShowDetails] = useState(true);

  const isKg = flight.unitPreference === 'KG';
  // Helpers
  const unitLabel = isKg ? 'kg' : 'lbs';
  const fuelUnit = isKg ? 'L' : 'gal';

  // Helper to convert display value to LBS for calculation
  const toLbs = (val: number, unit: any) => unit === 'KG' ? val * KG_TO_LBS : val;

  // Handlers
  const handleWeightChange = (field: keyof typeof flight, value: string) => {
    let num = parseFloat(value) || 0;
    // Fuel inputs in KG mode are interpreted as liters and converted to gallons for state
    if (isKg && (field === 'fuelLeftGallons' || field === 'fuelRightGallons' || field === 'fuelBurnGallons')) {
      num = num / GAL_TO_LITER;
    }
    setFlight(prev => ({ ...prev, [field]: num }));
  };

  const toggleUnit = () => {
    // When switching units, we might want to convert the values or just switch the mode.
    // The requirement says: "Input should be in KG... internal calculation converts to LBS".
    // Usually, if a user switches preference, they expect the *values* they see to convert.
    // Let's implemented value conversion for better UX.

    const newUnit = isKg ? 'LBS' : 'KG';
    const factor = newUnit === 'KG' ? 1 / KG_TO_LBS : KG_TO_LBS;

    setFlight(prev => ({
      ...prev,
      unitPreference: newUnit,
      pilotWeight: Math.round(prev.pilotWeight * factor),
      frontPaxWeight: Math.round(prev.frontPaxWeight * factor),
      rearPax1Weight: Math.round(prev.rearPax1Weight * factor),
      rearPax2Weight: Math.round(prev.rearPax2Weight * factor),
      baggage1Weight: Math.round(prev.baggage1Weight * factor),
      baggage2Weight: Math.round(prev.baggage2Weight * factor),
    }));
  };

  const handleAircraftChange = (id: string) => {
    const preset = getPresetAircraft(id);
    if (preset) {
      setAircraft(preset);
      // Synchronize flight data with new aircraft specs
      setFlight(prev => ({
        ...prev,
        aircraftId: preset.id,
        fuelLeftGallons: preset.fuelCapacity / 2,
        fuelRightGallons: preset.fuelCapacity / 2,
        fuelGallons: preset.fuelCapacity,
        fuelBurnGallons: 0,
      }));
    }
  };

  const handleClearAll = () => {
    setFlight({
      ...flight,
      pilotWeight: 0,
      frontPaxWeight: 0,
      rearPax1Weight: 0,
      rearPax2Weight: 0,
      baggage1Weight: 0,
      baggage2Weight: 0,
      fuelLeftGallons: 0,
      fuelRightGallons: 0,
      fuelGallons: 0,
      fuelBurnGallons: 0,
    });
  };

  const handleStandardFlight = () => {
    // Standard: 2 in front (180lbs each), 40 gal total fuel (20/side)
    setFlight({
      ...flight,
      pilotWeight: isKg ? 180 / KG_TO_LBS : 180,
      frontPaxWeight: isKg ? 180 / KG_TO_LBS : 180,
      rearPax1Weight: 0,
      rearPax2Weight: 0,
      baggage1Weight: 0,
      baggage2Weight: 0,
      fuelLeftGallons: 20,
      fuelRightGallons: 20,
      fuelGallons: 40,
      fuelBurnGallons: 0,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">

      {/* Header Summary Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 flex flex-wrap items-center justify-between gap-6 border-l-8 border-aviation-blue transition-colors">
        <div>
          <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            Flight Status <span className={`h-2 w-2 rounded-full ${results.isWithinLimits ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          </h2>
          <p className="text-xl font-black text-aviation-black dark:text-white flex items-center gap-2">
            {aircraft.tailNumber} - {results.isWithinLimits ? (
              <span className="text-green-600">READY FOR TAKEOFF</span>
            ) : (
              <Tooltip text={[
                results.status !== 'OK' ? results.status.replace('_', ' ') : null,
                results.stationWarnings?.frontSeats ? 'Front Row Limit Exceeded' : null,
                results.stationWarnings?.rearSeats ? 'Rear Row Limit Exceeded' : null,
                results.stationWarnings?.totalBaggage ? 'Baggage Compartment Limit Exceeded' : null,
                results.stationWarnings?.baggage1 ? 'Baggage 1 Limit Exceeded' : null,
                results.stationWarnings?.baggage2 ? 'Baggage 2 Limit Exceeded' : null,
                results.stationWarnings?.fuelCapacity ? 'Fuel Capacity Exceeded' : null,
              ].filter(Boolean).join(', ')}>
                <span className="text-red-600 flex items-center gap-1 cursor-help">
                  RESTRICTED <HelpCircle className="h-4 w-4" />
                </span>
              </Tooltip>
            )}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right border-r border-gray-100 dark:border-gray-700 pr-4">
            <div className={`text-2xl font-mono font-bold ${results.totalWeight > aircraft.maxTakeoffWeight ? 'text-red-600' : 'text-aviation-black dark:text-white'}`}>
              {results.totalWeight.toFixed(0)} lbs
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Gross Weight</div>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Max: {aircraft.maxTakeoffWeight} lbs</div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-mono font-bold ${results.status === 'FWD_CG' || results.status === 'AFT_CG' ? 'text-red-600' : 'text-aviation-blue dark:text-blue-400'}`}>
              {results.cg.toFixed(2)} in
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Center of Gravity</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col: Inputs */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 border border-transparent dark:border-gray-700 transition-colors">

          {/* Aircraft Selection */}
          <div className="pb-4 border-b border-gray-100">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Settings className="h-3 w-3" /> Aircraft Configuration
            </label>
            <div className="relative">
              <select
                value={aircraft.id}
                onChange={(e) => handleAircraftChange(e.target.value)}
                className="block w-full rounded-md border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 py-2.5 pl-3 pr-10 text-sm font-semibold text-aviation-black dark:text-white focus:border-aviation-blue focus:ring-aviation-blue transition shadow-sm appearance-none"
              >
                {getAllPresets().map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
              <span>BEW: <span className="font-bold text-gray-700 dark:text-gray-300">{aircraft.basicEmptyWeight} lbs</span></span>
              <span>MTW: <span className="font-bold text-gray-700 dark:text-gray-300">{aircraft.maxTakeoffWeight} lbs</span></span>
              <span>Arm: <span className="font-bold text-gray-700 dark:text-gray-300">{aircraft.emptyWeightArm}"</span></span>
              <span>Fuel: <span className="font-bold text-gray-700 dark:text-gray-300">{(aircraft.fuelCapacity * (isKg ? GAL_TO_LITER : 1)).toFixed(1)} {fuelUnit}</span></span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-aviation-black dark:text-white">
              <Package className="h-5 w-5 text-aviation-blue dark:text-blue-400" />
              Loading
              <Tooltip text="Enter the weight for each station. Arm is the distance from the datum. Weight x Arm = Moment.">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              </Tooltip>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-6 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={handleStandardFlight}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-aviation-blue dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition shadow-sm border border-aviation-blue active:scale-95"
              title="Set 2 Front PAX (180lbs) and 40 Gal Fuel"
            >
              <Users className="h-3.5 w-3.5" />
              Standard Flight
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg transition border border-gray-200 dark:border-gray-600 shadow-sm active:scale-95"
              title="Clear all inputs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
            <button
              onClick={toggleUnit}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition border border-gray-200 dark:border-gray-600 active:scale-95"
            >
              Unit: {isKg ? 'KG' : 'LBS'}
            </button>
          </div>

          {/* Form Fields */}
          {[
            { id: 'pilotWeight', label: 'Pilot', max: aircraft.maxFrontSeatWeight, isCombined: true },
            { id: 'frontPaxWeight', label: 'Front Pax', max: aircraft.maxFrontSeatWeight, isCombined: true },
            { id: 'rearPax1Weight', label: 'Rear Pax 1', max: aircraft.maxRearSeatWeight, isCombined: true },
            { id: 'rearPax2Weight', label: 'Rear Pax 2', max: aircraft.maxRearSeatWeight, isCombined: true },
            {
              id: 'baggage1Weight',
              label: 'Baggage 1',
              max: aircraft.maxBaggage1Weight,
              warning: results.stationWarnings?.baggage1
            },
            {
              id: 'baggage2Weight',
              label: 'Baggage 2',
              max: aircraft.maxBaggage2Weight,
              warning: results.stationWarnings?.baggage2
            },
          ].map((field) => (
            <div key={field.id}>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                {(field as any).max && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">
                    {(field as any).isCombined ? 'Row Max: ' : 'Max: '}
                    {((isKg ? (field as any).max / KG_TO_LBS : (field as any).max)).toFixed(0)} {unitLabel}
                  </span>
                )}
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={(flight as any)[field.id] === undefined ? '' : (flight as any)[field.id]}
                  onChange={(e) => handleWeightChange(field.id as any, e.target.value)}
                  className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 pl-3 pr-12 sm:text-sm py-2 text-aviation-black dark:text-white focus:ring-aviation-blue focus:border-aviation-blue transition-colors ${(field as any).warning ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{unitLabel}</span>
                </div>
              </div>
              {(field as any).warning && (
                <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">
                  ! Exceeds structural limit for this station
                </p>
              )}
            </div>
          ))}

          {/* Combined Warnings */}
          <div className="space-y-2">
            {results.stationWarnings?.frontSeats && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-[10px] text-red-700 dark:text-red-400 font-bold animate-pulse">
                WARNING: Front Seat Row combined weight exceeds {((isKg ? aircraft.maxFrontSeatWeight / KG_TO_LBS : aircraft.maxFrontSeatWeight)).toFixed(0)} {unitLabel} limit
              </div>
            )}
            {results.stationWarnings?.rearSeats && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-[10px] text-red-700 dark:text-red-400 font-bold animate-pulse">
                WARNING: Rear Seat Row combined weight exceeds {((isKg ? aircraft.maxRearSeatWeight / KG_TO_LBS : aircraft.maxRearSeatWeight)).toFixed(0)} {unitLabel} limit
              </div>
            )}
            {results.stationWarnings?.totalBaggage && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-[10px] text-red-700 dark:text-red-400 font-bold animate-pulse">
                WARNING: Combined Baggage (1+2) exceeds total structural limit of {((isKg ? aircraft.maxTotalBaggageWeight / KG_TO_LBS : aircraft.maxTotalBaggageWeight)).toFixed(0)} {unitLabel}
              </div>
            )}
          </div>

          {/* Dual Fuel Tanks */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Left ({fuelUnit})</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    value={flight.fuelLeftGallons === undefined ? '' : (isKg ? (flight.fuelLeftGallons * GAL_TO_LITER).toFixed(1) : flight.fuelLeftGallons)}
                    onChange={(e) => handleWeightChange('fuelLeftGallons', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 pl-3 pr-10 focus:border-aviation-blue focus:ring-aviation-blue sm:text-sm py-2 text-aviation-black dark:text-white transition-colors"
                    placeholder={isKg ? "75" : "20"}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 text-xs">
                    {fuelUnit}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Right ({fuelUnit})</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    value={flight.fuelRightGallons === undefined ? '' : (isKg ? (flight.fuelRightGallons * GAL_TO_LITER).toFixed(1) : flight.fuelRightGallons)}
                    onChange={(e) => handleWeightChange('fuelRightGallons', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 pl-3 pr-10 focus:border-aviation-blue focus:ring-aviation-blue sm:text-sm py-2 text-aviation-black dark:text-white transition-colors"
                    placeholder={isKg ? "75" : "20"}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 text-xs">
                    {fuelUnit}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
              <span className={results.stationWarnings?.fuelCapacity ? 'text-red-600 dark:text-red-400 font-bold animate-pulse' : ''}>
                Total: {(((flight.fuelLeftGallons || 0) + (flight.fuelRightGallons || 0)) * (isKg ? GAL_TO_LITER : 1)).toFixed(1)} {fuelUnit}
                {results.stationWarnings?.fuelCapacity && ` (MAX ${(aircraft.fuelCapacity * (isKg ? GAL_TO_LITER : 1)).toFixed(1)})`}
              </span>
              <span className="font-bold text-aviation-blue dark:text-blue-400 underline underline-offset-2 decoration-aviation-blue/30">
                Weight: {(((flight.fuelLeftGallons || 0) + (flight.fuelRightGallons || 0)) * aircraft.usableFuelPerGal).toFixed(0)} lbs
              </span>
            </p>
          </div>

          {/* Fuel Burn */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Est. Fuel Burn ({fuelUnit})</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                value={isKg ? (flight.fuelBurnGallons * GAL_TO_LITER).toFixed(1) : flight.fuelBurnGallons}
                onChange={(e) => handleWeightChange('fuelBurnGallons', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 pl-3 pr-12 focus:border-aviation-blue focus:ring-aviation-blue sm:text-sm py-2 text-aviation-black dark:text-white transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{fuelUnit}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
              <span>Burn Wt: {(results.fuelBurnWeight || 0).toFixed(0)} lbs</span>
              {results.isFuelBurnInvalid && (
                <span className="text-red-500 dark:text-red-400 font-bold animate-pulse">! Exceeds fuel on board</span>
              )}
            </p>
          </div>

        </div>

        {/* Right Col: Chart & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-transparent dark:border-gray-700 transition-colors">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">CG Envelope</h3>
            <CGChart
              currentWeight={results.totalWeight}
              currentCG={results.cg}
              isWithinLimits={results.isWithinLimits}
              landingWeight={results.landingWeight}
              landingCG={results.landingCG}
              envelopePoints={aircraft.envelopePoints}
              unitPreference={flight.unitPreference}
            />
          </div>

          {/* Details Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-transparent dark:border-gray-700 transition-colors">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moment</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Total Aircraft</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-bold">{results.totalWeight.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{results.totalMoment.toFixed(0)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">CG Location</td>
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-aviation-blue dark:text-blue-400">
                    {results.cg.toFixed(2)} inches
                  </td>
                </tr>
                {/* Landing Results */}
                <tr className="bg-gray-50 dark:bg-gray-900/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Landing Weight</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-bold">{(results.landingWeight || 0).toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{(results.landingMoment || 0).toFixed(0)}</td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-900/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Landing CG</td>
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-aviation-blue dark:text-blue-400">
                    {(results.landingCG || 0).toFixed(2)} inches
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Calculation Details Toggle - Outside the grid for full width */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-transparent dark:border-gray-700 transition-colors">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Detailed Calculation Breakdown</span>
          {showDetails ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
        </button>

        {showDetails && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm space-y-8 transition-colors">
            {/* 1. Full-Width Weight & Balance Summary Table */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Weight & Balance Summary
                <Tooltip text="Detailed breakdown showing Weight x Arm = Moment for every station.">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </Tooltip>
              </h4>
              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs text-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 uppercase tracking-tighter font-bold text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Station</th>
                      <th className="px-3 py-2 text-right">
                        <Tooltip text="The physical mass of the item in lbs.">
                          <span className="flex items-center justify-end gap-1">
                            Weight <HelpCircle className="h-3 w-3" />
                          </span>
                        </Tooltip>
                      </th>
                      <th className="px-3 py-2 text-center text-gray-400">×</th>
                      <th className="px-3 py-2 text-right">
                        <Tooltip text="The distance (inches) from the reference datum.">
                          <span className="flex items-center justify-end gap-1">
                            Arm <HelpCircle className="h-3 w-3" />
                          </span>
                        </Tooltip>
                      </th>
                      <th className="px-3 py-2 text-center text-gray-400">=</th>
                      <th className="px-3 py-2 text-right">
                        <Tooltip text="The turning force: Weight x Arm. Sum moments to find total leverage.">
                          <span className="flex items-center justify-end gap-1">
                            Moment <HelpCircle className="h-3 w-3" />
                          </span>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Basic Empty Weight */}
                    <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 transition-colors">
                      <td className="px-3 py-2 font-medium">Basic Empty Weight</td>
                      <td className="px-3 py-2 text-right">{aircraft.basicEmptyWeight.toFixed(1)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">×</td>
                      <td className="px-3 py-2 text-right">{aircraft.emptyWeightArm.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">=</td>
                      <td className="px-3 py-2 text-right font-mono">{aircraft.basicEmptyMoment.toFixed(0)}</td>
                    </tr>
                    {/* Front Pax */}
                    <tr className="dark:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-2">Pilot & Front Pax</td>
                      <td className="px-3 py-2 text-right">{(toLbs(flight.pilotWeight, flight.unitPreference) + toLbs(flight.frontPaxWeight, flight.unitPreference)).toFixed(1)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">×</td>
                      <td className="px-3 py-2 text-right">37.00</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">=</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-gray-400 font-medium">
                        {((toLbs(flight.pilotWeight, flight.unitPreference) + toLbs(flight.frontPaxWeight, flight.unitPreference)) * 37).toFixed(0)}
                      </td>
                    </tr>
                    {/* Rear Passengers */}
                    <tr className="dark:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-2">Rear Passengers</td>
                      <td className="px-3 py-2 text-right">{(toLbs(flight.rearPax1Weight, flight.unitPreference) + toLbs(flight.rearPax2Weight, flight.unitPreference)).toFixed(1)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">×</td>
                      <td className="px-3 py-2 text-right">73.00</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">=</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                        {((toLbs(flight.rearPax1Weight, flight.unitPreference) + toLbs(flight.rearPax2Weight, flight.unitPreference)) * 73).toFixed(0)}
                      </td>
                    </tr>
                    {/* Baggage 1 */}
                    <tr className="dark:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-2">Baggage Area 1</td>
                      <td className="px-3 py-2 text-right">{toLbs(flight.baggage1Weight, flight.unitPreference).toFixed(1)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">×</td>
                      <td className="px-3 py-2 text-right">95.00</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">=</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                        {(toLbs(flight.baggage1Weight, flight.unitPreference) * 95).toFixed(0)}
                      </td>
                    </tr>
                    {/* Baggage 2 */}
                    <tr className="dark:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-2">Baggage Area 2</td>
                      <td className="px-3 py-2 text-right">{toLbs(flight.baggage2Weight, flight.unitPreference).toFixed(1)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">×</td>
                      <td className="px-3 py-2 text-right">123.00</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">=</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                        {(toLbs(flight.baggage2Weight, flight.unitPreference) * 123).toFixed(0)}
                      </td>
                    </tr>
                    {/* Fuel (Total) */}
                    <tr className="bg-blue-50/30 dark:bg-blue-900/10 font-semibold transition-colors">
                      <td className="px-3 py-2">Fuel ({(results.totalFuelGallons! * (isKg ? GAL_TO_LITER : 1)).toFixed(1)} {fuelUnit})</td>
                      <td className="px-3 py-2 text-right">{(results.totalFuelGallons! * aircraft.usableFuelPerGal).toFixed(1)}</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">×</td>
                      <td className="px-3 py-2 text-right">48.00</td>
                      <td className="px-3 py-2 text-center text-gray-300 dark:text-gray-600">=</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-700 dark:text-blue-400">
                        {(results.totalFuelGallons! * aircraft.usableFuelPerGal * 48).toFixed(0)}
                      </td>
                    </tr>
                    {/* TOTAL TAKEOFF */}
                    <tr className="bg-aviation-blue text-white font-bold border-t-2 border-aviation-blue text-sm uppercase transition-colors">
                      <td className="px-3 py-3">TOTAL TAKEOFF</td>
                      <td className="px-3 py-3 text-right">{results.totalWeight.toFixed(1)}</td>
                      <td colSpan={3}></td>
                      <td className="px-3 py-3 text-right font-mono">{results.totalMoment.toFixed(0)}</td>
                    </tr>
                    {/* CG */}
                    <tr className="bg-gray-100 dark:bg-gray-900/40 font-bold italic transition-colors">
                      <td className="px-3 py-2">TAKEOFF CG</td>
                      <td colSpan={4}></td>
                      <td className="px-3 py-2 text-right font-mono text-aviation-blue dark:text-blue-400 text-sm">{results.cg.toFixed(2)} in</td>
                    </tr>
                    {/* TOTAL LANDING */}
                    <tr className="bg-indigo-600 text-white font-bold text-sm uppercase transition-colors">
                      <td className="px-3 py-3 flex items-center gap-2">
                        TOTAL LANDING
                        <Tooltip text={`Takeoff Total (${results.totalWeight.toFixed(1)} lbs) - Fuel Burn (${(flight.fuelBurnGallons * aircraft.usableFuelPerGal).toFixed(1)} lbs) = Landing Total. Moment deduction: -${(flight.fuelBurnGallons * aircraft.usableFuelPerGal * 48).toFixed(0)}.`}>
                          <HelpCircle className="h-3.5 w-3.5 text-indigo-200 cursor-help" />
                        </Tooltip>
                      </td>
                      <td className="px-3 py-3 text-right">{(results.landingWeight || 0).toFixed(1)}</td>
                      <td colSpan={3}></td>
                      <td className="px-3 py-3 text-right font-mono">{(results.landingMoment || 0).toFixed(0)}</td>
                    </tr>
                    {/* Landing CG */}
                    <tr className="bg-gray-100 dark:bg-gray-900/40 font-bold italic transition-colors">
                      <td className="px-3 py-2">LANDING CG</td>
                      <td colSpan={4}></td>
                      <td className="px-3 py-2 text-right font-mono text-indigo-700 dark:text-indigo-400 text-sm">{(results.landingCG || 0).toFixed(2)} in</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Secondary Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left Column: Calculations and Details */}
              <div className="space-y-6">
                {/* CG Math */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Center of Gravity Formula</h4>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-sm shadow-sm relative transition-colors">
                    <p className="text-gray-500 dark:text-gray-400 mb-1 italic flex items-center gap-1">
                      CG = Total Moment / Total Weight
                      <Tooltip text="Center of Gravity: The point where the aircraft would balance perfectly. Found by dividing sum of moments by sum of weights.">
                        <HelpCircle className="h-3 w-3 text-gray-300 dark:text-gray-600 cursor-help" />
                      </Tooltip>
                    </p>
                    <p className="text-aviation-blue dark:text-blue-400 font-bold text-lg mb-6">
                      {results.cg.toFixed(2)} = {results.totalMoment.toFixed(0)} / {results.totalWeight.toFixed(1)}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Takeoff Limits</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${results.isWithinLimits ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                            {results.isWithinLimits ? "OK" : "OUT"}
                          </span>
                        </div>
                        <div className="flex gap-2 text-[11px]">
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-gray-400 dark:text-gray-600 uppercase text-[8px] mb-0.5">Min</div>
                            <div className="font-bold text-gray-700 dark:text-gray-300">{results.limits?.takeoff.min.toFixed(2)}"</div>
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-gray-400 dark:text-gray-600 uppercase text-[8px] mb-0.5">Max</div>
                            <div className="font-bold text-gray-700 dark:text-gray-300">{results.limits?.takeoff.max.toFixed(2)}"</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Landing Limits</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${results.landingStatus === 'OK' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                            {results.landingStatus === 'OK' ? "OK" : "OUT"}
                          </span>
                        </div>
                        <div className="flex gap-2 text-[11px]">
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-gray-400 dark:text-gray-600 uppercase text-[8px] mb-0.5">Min</div>
                            <div className="font-bold text-gray-700 dark:text-gray-300">{results.limits?.landing.min.toFixed(2)}"</div>
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-gray-400 dark:text-gray-600 uppercase text-[8px] mb-0.5">Max</div>
                            <div className="font-bold text-gray-700 dark:text-gray-300">{results.limits?.landing.max.toFixed(2)}"</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Runway-Style CG Balance Diagram */}
                    <div className="mt-12 pt-4">
                      <div className="relative h-20 w-full mt-4 bg-[#262626] rounded-sm border-y-2 border-gray-400/30 dark:border-gray-600/30 px-10 flex items-center shadow-2xl overflow-visible">
                        {/* Runway Asphalt Texture / Centerline */}
                        <div className="absolute inset-x-0 top-1/2 h-0.5 border-t border-dashed border-white/40 -translate-y-1/2"></div>

                        {/* Threshold Runway Numbers & Piano Keys */}
                        <div className="absolute inset-y-0 left-0 w-10 flex flex-col items-center justify-center border-r border-white/20 bg-emerald-900/10">
                          <span className="text-white font-black text-xs mb-1 tracking-tighter">35</span>
                          <div className="flex gap-0.5 h-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-1 bg-white/90"></div>)}
                          </div>
                        </div>
                        <div className="absolute inset-y-0 right-0 w-10 flex flex-col items-center justify-center border-l border-white/20 bg-emerald-900/10">
                          <span className="text-white font-black text-xs mb-1 tracking-tighter">50</span>
                          <div className="flex gap-0.5 h-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-1 bg-white/90"></div>)}
                          </div>
                        </div>

                        {/* Runway Edge Markings */}
                        <div className="absolute top-0 inset-x-0 h-1 border-b border-white/30"></div>
                        <div className="absolute bottom-0 inset-x-0 h-1 border-t border-white/30"></div>

                        {/* Allowable Range Bar (The Safe Runway Zone) */}
                        {results.limits && (
                          <div
                            className="absolute h-[80%] bg-emerald-500/10 border-x border-emerald-400/40 top-1/2 -translate-y-1/2 z-10"
                            style={{
                              left: `${((results.limits.takeoff.min - 35) / 15) * 100}%`,
                              right: `${100 - (((results.limits.takeoff.max - 35) / 15) * 100)}%`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                          </div>
                        )}

                        {/* Takeoff CG Icon (Plane Takeoff) */}
                        <div
                          className="absolute z-30 transition-all duration-700 ease-out"
                          style={{
                            left: `${((results.cg - 35) / 15) * 100}%`,
                            top: '40%',
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <Tooltip text={`Takeoff CG: ${results.cg.toFixed(2)}" (Target balance point at start of flight)`}>
                            <div className="relative group/takeoff cursor-help">
                              <div className={`absolute inset-0 blur-xl opacity-60 ${results.isWithinLimits ? 'bg-sky-400' : 'bg-red-400'} scale-150`}></div>
                              <div className={`relative transition-transform group-hover/takeoff:scale-125 ${results.isWithinLimits ? 'text-sky-400' : 'text-red-400'}`}>
                                <PlaneTakeoff className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" strokeWidth={2.5} />
                              </div>
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap opacity-0 group-hover/takeoff:opacity-100 transition-all pointer-events-none scale-90 group-hover/takeoff:scale-100 border border-white/10">
                                <span className="font-bold tracking-tight">TAKEOFF: {results.cg.toFixed(2)}"</span>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
                              </div>
                            </div>
                          </Tooltip>
                        </div>

                        {/* Landing CG Icon (Plane Landing) */}
                        {results.landingCG && (
                          <div
                            className="absolute z-20 transition-all duration-700 ease-out"
                            style={{
                              left: `${((results.landingCG - 35) / 15) * 100}%`,
                              top: '72%',
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Tooltip text={`Landing CG: ${results.landingCG.toFixed(2)}" (Balance point after fuel burn)`}>
                              <div className="group/landing relative cursor-help">
                                <div className="absolute inset-0 blur-lg opacity-40 bg-indigo-400"></div>
                                <div className="relative text-indigo-400 transition-transform group-hover/landing:scale-125">
                                  <PlaneLanding className="w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" strokeWidth={2.5} />
                                </div>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover/landing:opacity-100 transition-all scale-90 group-hover/landing:scale-100">
                                  LANDING: {results.landingCG.toFixed(2)}"
                                </div>
                                <div className="absolute top-[120%] left-1/2 -translate-x-1/2 w-4 h-[1px] bg-indigo-400/50"></div>
                              </div>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between mt-3 px-3 items-center text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2 group/legendTO">
                          <PlaneTakeoff className="w-4 h-4 text-sky-500 dark:text-sky-400 transition-transform group-hover/legendTO:scale-110" />
                          <span className="text-[10px] font-bold tracking-tight uppercase">Takeoff CG</span>
                        </div>
                        <div className="flex items-center gap-2 group/legendLND">
                          <PlaneLanding className="w-4 h-4 text-indigo-500 dark:text-indigo-400 transition-transform group-hover/legendLND:scale-110" />
                          <span className="text-[10px] font-bold tracking-tight uppercase">Landing CG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Weight Distribution Diagram */}
              <div className="lg:sticky lg:top-4 h-fit flex flex-col">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between transition-colors">
                  <span>Weight Distribution</span>
                  <div className="flex space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Empty</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Fuel</span>
                    </div>
                  </div>
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 overflow-hidden flex-1 transition-colors">
                  <StationDiagram
                    emptyWeight={aircraft.basicEmptyWeight}
                    pilotWeight={toLbs(flight.pilotWeight, flight.unitPreference)}
                    frontPaxWeight={toLbs(flight.frontPaxWeight, flight.unitPreference)}
                    rearPax1Weight={toLbs(flight.rearPax1Weight, flight.unitPreference)}
                    rearPax2Weight={toLbs(flight.rearPax2Weight, flight.unitPreference)}
                    baggage1Weight={toLbs(flight.baggage1Weight, flight.unitPreference)}
                    baggage2Weight={toLbs(flight.baggage2Weight, flight.unitPreference)}
                    fuelLeftWeight={flight.fuelLeftGallons * aircraft.usableFuelPerGal}
                    fuelRightWeight={flight.fuelRightGallons * aircraft.usableFuelPerGal}
                    unitPreference={flight.unitPreference}
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

    </div >
  );
}
