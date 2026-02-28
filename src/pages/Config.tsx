import { useState } from 'react';
import { Settings, Save, RotateCcw, Plane, PlusCircle, X, Trash2 } from 'lucide-react';
import type { Aircraft } from '../types';
import { DEFAULT_AIRCRAFT } from '../data/c172s';
import {
    getAllPresets, getPresetAircraft, AIRCRAFT_CONFIG_KEY,
    getCustomAircraftList, saveCustomAircraft,
    deleteCustomAircraft, deleteAllCustomAircraft
} from '../data/presets';

import { useTranslation } from 'react-i18next';

const BLANK_AIRCRAFT: Aircraft = {
    id: 'new',
    tailNumber: '',
    datumLocation: '',
    maxTakeoffWeight: 0,
    maxFrontSeatWeight: 0,
    maxRearSeatWeight: 0,
    stationArms: {
        pilot_front_pax: 0,
        rear_pax: 0,
        baggage_1: 0,
        baggage_2: 0,
        fuel: 0,
    },
    basicEmptyWeight: 0,
    emptyWeightArm: 0,
    basicEmptyMoment: 0,
    fuelCapacity: 0,
    usableFuelPerGal: 0,
    maxBaggage1Weight: 0,
    maxBaggage2Weight: 0,
    maxTotalBaggageWeight: 0,
    // Default to standard C172 normal-category envelope so the chart renders correctly
    cgLimits: {
        fwd_low: { weight: 1950, arm: 35.0 },
        fwd_high: { weight: 2400, arm: 39.2 },
        aft: 47.3,
    },
    envelopePoints: [
        { x: 35.0, y: 1500 },
        { x: 35.0, y: 1950 },
        { x: 39.2, y: 2400 },
        { x: 47.3, y: 2400 },
        { x: 47.3, y: 1500 },
        { x: 35.0, y: 1500 },
    ],
};

export default function Config() {
    const { t } = useTranslation();
    const [aircraft, setAircraft] = useState<Aircraft>(() => {
        const stored = localStorage.getItem(AIRCRAFT_CONFIG_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_AIRCRAFT;
    });

    const [saved, setSaved] = useState(false);
    const [isNewMode, setIsNewMode] = useState(false);
    const [customList, setCustomList] = useState<Aircraft[]>(() => getCustomAircraftList());

    const handleChange = <K extends keyof Aircraft>(field: K, value: Aircraft[K]) => {
        setAircraft(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        const mtw = aircraft.maxTakeoffWeight;

        // For custom aircraft: derive CG limits and envelope from maxTakeoffWeight.
        // Fwd limit scales linearly: 35.0" @ 1950 lbs → 39.2" @ 2400 lbs (C172 ratio).
        // For different MTW, interpolate/extrapolate the fwd_high arm from the same ratio.
        const FWD_LOW_WEIGHT = 1950;
        const FWD_LOW_ARM = 35.0;
        const FWD_HIGH_ARM = mtw > FWD_LOW_WEIGHT
            ? FWD_LOW_ARM + (39.2 - 35.0) * ((mtw - FWD_LOW_WEIGHT) / (2400 - FWD_LOW_WEIGHT))
            : FWD_LOW_ARM;
        const AFT_ARM = aircraft.cgLimits?.aft > 0 ? aircraft.cgLimits.aft : 47.3;

        const derivedCgLimits = {
            fwd_low: { weight: FWD_LOW_WEIGHT, arm: FWD_LOW_ARM },
            fwd_high: { weight: mtw, arm: parseFloat(FWD_HIGH_ARM.toFixed(2)) },
            aft: AFT_ARM,
        };

        const derivedEnvelope = [
            { x: FWD_LOW_ARM, y: 1500 },
            { x: FWD_LOW_ARM, y: FWD_LOW_WEIGHT },
            { x: parseFloat(FWD_HIGH_ARM.toFixed(2)), y: mtw },
            { x: AFT_ARM, y: mtw },
            { x: AFT_ARM, y: 1500 },
            { x: FWD_LOW_ARM, y: 1500 },
        ];

        const isCustomAircraft = isNewMode || aircraft.id.startsWith('custom_');

        const updatedAircraft = {
            ...aircraft,
            id: isNewMode ? `custom_${aircraft.tailNumber || Date.now()}` : aircraft.id,
            basicEmptyMoment: aircraft.basicEmptyWeight * aircraft.emptyWeightArm,
            // For custom aircraft always recalculate limits from MTW; keep preset limits untouched
            ...(isCustomAircraft && {
                cgLimits: derivedCgLimits,
                envelopePoints: derivedEnvelope,
            }),
        };
        setAircraft(updatedAircraft);
        localStorage.setItem(AIRCRAFT_CONFIG_KEY, JSON.stringify(updatedAircraft));
        // Persist to the custom list for new aircraft AND when editing existing custom ones
        if (isCustomAircraft) {
            saveCustomAircraft(updatedAircraft);
            setCustomList(getCustomAircraftList());
        }
        setSaved(true);
        setIsNewMode(false);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        setAircraft(DEFAULT_AIRCRAFT);
        localStorage.removeItem(AIRCRAFT_CONFIG_KEY);
        deleteAllCustomAircraft();
        setCustomList([]);
        setSaved(false);
        setIsNewMode(false);
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = getPresetAircraft(presetId);
        if (preset) {
            setAircraft(preset);
            setSaved(false);
            setIsNewMode(false);
        }
    };

    const handleLoadCustom = (ac: Aircraft) => {
        setAircraft(ac);
        localStorage.setItem(AIRCRAFT_CONFIG_KEY, JSON.stringify(ac));
        setSaved(false);
        setIsNewMode(false);
    };

    const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteCustomAircraft(id);
        const updated = getCustomAircraftList();
        setCustomList(updated);
        // If we were viewing the deleted aircraft, fall back to default
        if (aircraft.id === id) {
            const stored = localStorage.getItem(AIRCRAFT_CONFIG_KEY);
            const stored2 = stored ? JSON.parse(stored) : null;
            if (!stored2 || stored2.id === id) {
                setAircraft(DEFAULT_AIRCRAFT);
                localStorage.removeItem(AIRCRAFT_CONFIG_KEY);
            }
        }
    };

    const handleStartNew = () => {
        setAircraft(BLANK_AIRCRAFT);
        setSaved(false);
        setIsNewMode(true);
    };

    const handleCancelNew = () => {
        const stored = localStorage.getItem(AIRCRAFT_CONFIG_KEY);
        setAircraft(stored ? JSON.parse(stored) : DEFAULT_AIRCRAFT);
        setSaved(false);
        setIsNewMode(false);
    };

    // In new-aircraft mode show blank instead of 0
    const numVal = (val: number): number | string => isNewMode && val === 0 ? '' : val;

    // Validation — only enforced in new-aircraft mode
    const newModeErrors: string[] = isNewMode ? [
        ...(!aircraft.tailNumber.trim() ? [t('config.tailNumber')] : []),
        ...(aircraft.maxTakeoffWeight <= 0 ? [t('config.maxTakeoffWeight')] : []),
        ...(aircraft.basicEmptyWeight <= 0 ? [t('config.basicEmptyWeight')] : []),
        ...(aircraft.emptyWeightArm <= 0 ? [t('config.emptyWeightArm')] : []),
        ...(aircraft.fuelCapacity <= 0 ? [t('config.usableFuel')] : []),
        ...(aircraft.usableFuelPerGal <= 0 ? [t('config.fuelWeight')] : []),
        ...(aircraft.stationArms.pilot_front_pax <= 0 ? [t('config.frontSeats')] : []),
        ...(aircraft.stationArms.rear_pax <= 0 ? [t('config.rearSeats')] : []),
        ...(aircraft.stationArms.baggage_1 <= 0 ? [t('config.baggage1')] : []),
        ...(aircraft.stationArms.baggage_2 <= 0 ? [t('config.baggage2')] : []),
        ...(aircraft.stationArms.fuel <= 0 ? [t('config.fuel')] : []),
        ...(aircraft.maxBaggage1Weight <= 0 ? [t('config.baggage1Max')] : []),
        ...(aircraft.maxTotalBaggageWeight <= 0 ? [t('config.totalBaggageMax')] : []),
    ] : [];
    const hasNewModeErrors = newModeErrors.length > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="h-6 w-6 text-aviation-blue dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('config.title')}</h1>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Preset Selector */}
                    <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <Plane className="h-5 w-5 text-aviation-blue dark:text-blue-400" />
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('config.quickLoad')}</h3>
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
                            {t('config.presetInstruction')}
                        </p>

                        {/* Custom Aircraft Tiles */}
                        {customList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
                                    {t('config.myAircraft')}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {customList.map((ac) => (
                                        <div
                                            key={ac.id}
                                            onClick={() => handleLoadCustom(ac)}
                                            className="relative px-4 py-3 bg-white dark:bg-gray-900/50 border border-green-400 dark:border-green-700 rounded-md hover:bg-green-50 dark:hover:bg-gray-800 hover:border-green-600 dark:hover:border-green-500 transition-all text-left group cursor-pointer"
                                        >
                                            <div className="font-semibold text-green-700 dark:text-green-400 group-hover:scale-105 transition-transform origin-left">{ac.tailNumber || '—'}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                BEW: {ac.basicEmptyWeight.toFixed(0)} | MTW: {ac.maxTakeoffWeight.toFixed(0)}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteCustom(ac.id, e)}
                                                title="Delete"
                                                className="absolute top-2 right-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add New Aircraft button — always at the bottom */}
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                            <button
                                onClick={handleStartNew}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition shadow-sm active:scale-95"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                {t('config.addNewAircraft')}
                            </button>

                            {/* New Aircraft Banner — shown below the button */}
                            {isNewMode && (
                                <div className="mt-3 flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg px-4 py-3">
                                    <PlusCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-green-800 dark:text-green-300 text-sm">{t('config.newAircraftMode')}</p>
                                        <p className="text-xs text-green-700 dark:text-green-400">{t('config.newAircraftNote')}</p>
                                    </div>
                                    <button
                                        onClick={handleCancelNew}
                                        className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                        {t('config.cancelNew')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identification */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('config.identification')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('config.tailNumber')}
                                    {!isNewMode && (
                                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">(read only)</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={aircraft.tailNumber}
                                    readOnly={!isNewMode}
                                    onChange={isNewMode ? (e) => handleChange('tailNumber', e.target.value) : undefined}
                                    placeholder={isNewMode ? t('config.tailNumberPlaceholder') : undefined}
                                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm px-3 py-2 transition-colors ${isNewMode
                                        ? 'bg-white dark:bg-gray-900/50 focus:border-green-500 focus:ring-green-500 dark:text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Limits */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('config.performanceLimits')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.maxTakeoffWeight')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.maxTakeoffWeight)}
                                    onChange={(e) => handleChange('maxTakeoffWeight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Station Arms */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('config.stationArms')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('config.frontSeats')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.stationArms.pilot_front_pax)}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, pilot_front_pax: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('config.rearSeats')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.stationArms.rear_pax)}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, rear_pax: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('config.baggage1')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.stationArms.baggage_1)}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, baggage_1: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('config.baggage2')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.stationArms.baggage_2)}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, baggage_2: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('config.fuel')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.stationArms.fuel)}
                                    onChange={(e) => handleChange('stationArms', { ...aircraft.stationArms, fuel: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 text-sm transition-colors"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Empty Weight */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('config.emptyWeightConfig')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.basicEmptyWeight')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.basicEmptyWeight)}
                                    onChange={(e) => handleChange('basicEmptyWeight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.emptyWeightArm')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.emptyWeightArm)}
                                    onChange={(e) => handleChange('emptyWeightArm', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.01"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {t('config.totalMoment')}: <span className="font-bold text-aviation-blue dark:text-blue-400">{(aircraft.basicEmptyWeight * aircraft.emptyWeightArm).toFixed(0)}</span> in-lbs
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Fuel */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('config.fuelSection')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.usableFuel')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.fuelCapacity)}
                                    onChange={(e) => handleChange('fuelCapacity', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.fuelWeight')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.usableFuelPerGal)}
                                    onChange={(e) => handleChange('usableFuelPerGal', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Baggage Limits */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('config.baggageLimits')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.baggage1Max')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.maxBaggage1Weight)}
                                    onChange={(e) => handleChange('maxBaggage1Weight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.baggage2Max')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.maxBaggage2Weight)}
                                    onChange={(e) => handleChange('maxBaggage2Weight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config.totalBaggageMax')}</label>
                                <input
                                    type="number"
                                    value={numVal(aircraft.maxTotalBaggageWeight)}
                                    onChange={(e) => handleChange('maxTotalBaggageWeight', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 shadow-sm focus:border-aviation-blue focus:ring-aviation-blue dark:text-white px-3 py-2 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        disabled={hasNewModeErrors}
                        className={`flex items-center gap-2 px-6 py-2 text-white rounded-md font-medium transition shadow-sm active:scale-95 ${hasNewModeErrors
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                                : 'bg-aviation-blue hover:bg-blue-700'
                            }`}
                    >
                        <Save className="h-4 w-4" />
                        {t('config.save')}
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium transition shadow-sm active:scale-95"
                    >
                        <RotateCcw className="h-4 w-4" />
                        {t('config.reset')}
                    </button>
                    {saved && (
                        <div className="flex items-center text-green-600 dark:text-green-400 font-medium ml-4 animate-in fade-in duration-300">
                            ✓ {t('config.savedSuccess')}
                        </div>
                    )}
                    {hasNewModeErrors && (
                        <div className="w-full mt-2 text-sm text-red-600 dark:text-red-400">
                            <p className="font-semibold mb-1">⚠ {t('config.validationError')}</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                {newModeErrors.map(field => (
                                    <li key={field}>{field}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 transition-colors">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{t('config.noteTitle')}</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t('config.noteContent')}
                </p>
            </div>
        </div>
    );
}
