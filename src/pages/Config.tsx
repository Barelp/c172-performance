import { useState } from 'react';
import { Settings, Save, RotateCcw, Plane } from 'lucide-react';
import type { Aircraft } from '../types';
import { DEFAULT_AIRCRAFT } from '../data/c172s';
import { getAllPresets, getPresetAircraft } from '../data/presets';

const STORAGE_KEY = 'c172_aircraft_config';

export default function Config() {
    const [aircraft, setAircraft] = useState<Aircraft>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_AIRCRAFT;
    });

    const [saved, setSaved] = useState(false);

    const handleChange = (field: keyof Aircraft, value: any) => {
        setAircraft(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        // Recalculate moment based on weight and arm
        const updatedAircraft = {
            ...aircraft,
            basicEmptyMoment: aircraft.basicEmptyWeight * aircraft.emptyWeightArm
        };
        setAircraft(updatedAircraft);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAircraft));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        setAircraft(DEFAULT_AIRCRAFT);
        localStorage.removeItem(STORAGE_KEY);
        setSaved(false);
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = getPresetAircraft(presetId);
        if (preset) {
            setAircraft(preset);
            setSaved(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="h-6 w-6 text-aviation-blue dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aircraft Configuration</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Preset Selector */}
                    <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <Plane className="h-5 w-5 text-aviation-blue dark:text-blue-400" />
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Quick Load Preset</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {getAllPresets().map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleLoadPreset(preset.id)}
                                    className="px-4 py-3 bg-white dark:bg-gray-900/50 border border-blue-300 dark:border-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-aviation-blue dark:hover:border-blue-500 transition-all text-left group"
                                >
                                    <div className="font-semibold text-aviation-blue dark:text-blue-400 group-hover:scale-105 transition-transform origin-left">{preset.tailNumber}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">{preset.name}</div>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 font-medium">
                            Click a preset to load its configuration. Don't forget to save after loading.
                        </p>
                    </div>

                    {/* Identification */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">Identification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tail Number</label>
                                <input
                                    type="text"
                                    value={aircraft.tailNumber}
                                    onChange={(e) => handleChange('tailNumber', e.target.value)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    placeholder="N172SP"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Limits */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">Performance Limits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Takeoff Weight (lbs)</label>
                                <input
                                    type="number"
                                    value={aircraft.maxTakeoffWeight}
                                    onChange={(e) => handleChange('maxTakeoffWeight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Station Arms */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">Station Arms (Inches from Datum)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Front Seats</label>
                                <input
                                    type="number"
                                    value={aircraft.stationArms.pilot_front_pax}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, pilot_front_pax: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Rear Seats</label>
                                <input
                                    type="number"
                                    value={aircraft.stationArms.rear_pax}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, rear_pax: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Baggage 1</label>
                                <input
                                    type="number"
                                    value={aircraft.stationArms.baggage_1}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, baggage_1: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Baggage 2</label>
                                <input
                                    type="number"
                                    value={aircraft.stationArms.baggage_2}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, baggage_2: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Fuel</label>
                                <input
                                    type="number"
                                    value={aircraft.stationArms.fuel}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, fuel: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Empty Weight */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">Empty Weight Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Empty Weight (lbs)</label>
                                <input
                                    type="number"
                                    value={aircraft.basicEmptyWeight}
                                    onChange={(e) => handleChange('basicEmptyWeight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empty Weight Arm (inches)</label>
                                <input
                                    type="number"
                                    value={aircraft.emptyWeightArm}
                                    onChange={(e) => handleChange('emptyWeightArm', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.01"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Total Moment: <span className="font-bold text-aviation-blue dark:text-blue-400">{(aircraft.basicEmptyWeight * aircraft.emptyWeightArm).toFixed(0)}</span> in-lbs
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Fuel */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">Fuel</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usable Fuel Capacity (gallons)</label>
                                <input
                                    type="number"
                                    value={aircraft.fuelCapacity}
                                    onChange={(e) => handleChange('fuelCapacity', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuel Weight (lbs/gal)</label>
                                <input
                                    type="number"
                                    value={aircraft.usableFuelPerGal}
                                    onChange={(e) => handleChange('usableFuelPerGal', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Baggage Limits */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">Baggage Limits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Baggage Area 1 Max (lbs)</label>
                                <input
                                    type="number"
                                    value={aircraft.maxBaggage1Weight}
                                    onChange={(e) => handleChange('maxBaggage1Weight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Baggage Area 2 Max (lbs)</label>
                                <input
                                    type="number"
                                    value={aircraft.maxBaggage2Weight}
                                    onChange={(e) => handleChange('maxBaggage2Weight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Baggage Max (lbs)</label>
                                <input
                                    type="number"
                                    value={aircraft.maxTotalBaggageWeight}
                                    onChange={(e) => handleChange('maxTotalBaggageWeight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-aviation-blue hover:bg-blue-700 text-white rounded-md font-medium transition shadow-sm active:scale-95"
                    >
                        <Save className="h-4 w-4" />
                        Save Configuration
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium transition shadow-sm active:scale-95"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset to Default
                    </button>
                    {saved && (
                        <div className="flex items-center text-green-600 dark:text-green-400 font-medium ml-4 animate-in fade-in duration-300">
                            ✓ Configuration saved successfully
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 transition-colors">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Note</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    These settings are saved to your browser's local storage and will persist across sessions.
                    The empty weight moment is automatically calculated from the weight and arm values.
                </p>
            </div>
        </div>
    );
}
