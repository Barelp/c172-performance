import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Plus, Trash2, Calculator } from 'lucide-react';
import type { FlightDetails, FlightLeg } from '../types/navigation';
import { waypoints } from '../data/waypoints';
import { getAllPresets } from '../data/presets';

const initialDetails: FlightDetails = {
    takeoffTime: '08:00',
    cruiseGS: 90,
    cruiseGPH: 8,
    taxiFuel: 1.1,
    origin: '',
    landing1: '',
    landing2: '',
    finalDest: '',
    altName: '',
    altFreq: '',
    registration: '',
    paxCount: '',
    departureDest: '',
    flightEndurance: '',
    aircraftType: '172',
    callsign: ''
};

export default function NavigationPlanner() {
    const { t } = useTranslation();
    const [details, setDetails] = useState<FlightDetails>(initialDetails);
    const [legs, setLegs] = useState<FlightLeg[]>([]);

    const airportOptions = ['', 'LLHZ', 'LLHA', 'LLMG', 'LLIB'];
    const callsignOptions = ['', ...getAllPresets().map(p => p.tailNumber)];

    // Format hours to HH:mm:ss
    const formatDuration = (hours: number) => {
        if (!isFinite(hours) || isNaN(hours)) return '00:00:00';
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        const s = Math.round(((hours - h) * 60 - m) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Add hours to time string (HH:mm)
    const addTimeToTakeoff = (baseTime: string, hoursToAdd: number) => {
        if (!baseTime) return '';
        const [hStr, mStr] = baseTime.split(':');
        let totalHours = (parseInt(hStr || '0', 10)) + (parseInt(mStr || '0', 10) / 60) + hoursToAdd;
        totalHours = totalHours % 24; // Handle day wrap
        return formatDuration(totalHours);
    };

    const handleDetailChange = (field: keyof FlightDetails, value: string | number) => {
        setDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleLegChange = (id: string, field: keyof FlightLeg, value: string | number) => {
        setLegs(prev => prev.map(leg => leg.id === id ? { ...leg, [field]: value } : leg));
    };

    const addLeg = () => {
        const lastLeg = legs.length > 0 ? legs[legs.length - 1] : null;
        const newLeg: FlightLeg = {
            id: crypto.randomUUID(),
            to: '',
            from: lastLeg ? lastLeg.to : '',
            distNM: '',
            heading: '',
            altitude: '',
            trend: '',
            control: '',
            primaryFreq: '',
            secondaryFreq: '',
            vorName: '',
            vorRadial: '',
            vorDist: ''
        };
        setLegs(prev => [...prev, newLeg]);
    };

    const removeLeg = (id: string) => {
        setLegs(prev => prev.filter(leg => leg.id !== id));
    };

    // Calculations
    const parseNum = (val: string | number) => (val === '' || isNaN(Number(val)) ? 0 : Number(val));
    const gs = parseNum(details.cruiseGS);
    const gph = parseNum(details.cruiseGPH);
    const taxiFuel = parseNum(details.taxiFuel);

    let cumulativeHours = 0;

    const calculatedLegs = legs.map(leg => {
        const dist = parseNum(leg.distNM);
        const flightTimeHours = gs > 0 ? dist / gs : 0;
        const fuelUsed = flightTimeHours * gph;

        cumulativeHours += flightTimeHours;
        const timeOverPoint = addTimeToTakeoff(details.takeoffTime, cumulativeHours);

        return {
            ...leg,
            flightTimeHours,
            flightTimeStr: formatDuration(flightTimeHours),
            fuelUsed,
            timeOverPoint
        };
    });

    const totalDist = legs.reduce((acc, leg) => acc + parseNum(leg.distNM), 0);
    const totalTimeHours = gs > 0 ? totalDist / gs : 0;
    const totalFuelUsed = totalTimeHours * gph;

    const reqFuelNoReserve = totalFuelUsed + taxiFuel;
    const reserve45 = 0.75 * gph;
    const reqFuel45Min = reqFuelNoReserve + reserve45;
    const reqFuel60Min = reqFuelNoReserve + gph;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
                <Map className="h-8 w-8 text-aviation-blue dark:text-blue-400" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('navPlanner.title')}</h2>
                </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                            {t('navPlanner.warning')}
                        </p>
                    </div>
                </div>
            </div>

            {/* General Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Flight Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('navPlanner.flightStatus')}</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-3 items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.registration')}</label>
                            <input type="text" value={details.registration} onChange={e => handleDetailChange('registration', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.paxCount')}</label>
                            <input type="text" value={details.paxCount} onChange={e => handleDetailChange('paxCount', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.departureDest')}</label>
                            <input type="text" value={details.departureDest} onChange={e => handleDetailChange('departureDest', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.flightEndurance')}</label>
                            <input type="text" value={details.flightEndurance} onChange={e => handleDetailChange('flightEndurance', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.aircraftType')}</label>
                            <input type="text" value="Cessna 172" readOnly className="col-span-2 p-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm text-center text-gray-500" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.callsign')}</label>
                            <select value={details.callsign} onChange={e => handleDetailChange('callsign', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center font-bold">
                                {callsignOptions.map(opt => <option key={`callsign-${opt}`} value={opt}>{opt || '---'}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* General Details & Flight Route */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* General Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                {t('navPlanner.generalDetails')}
                            </h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('navPlanner.takeoffTime')}</label>
                                <input type="time" value={details.takeoffTime} onChange={e => handleDetailChange('takeoffTime', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-aviation-blue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('navPlanner.cruiseGS')}</label>
                                <input type="number" value={details.cruiseGS} onChange={e => handleDetailChange('cruiseGS', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-aviation-blue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('navPlanner.cruiseGPH')}</label>
                                <input type="number" step="0.1" value={details.cruiseGPH} onChange={e => handleDetailChange('cruiseGPH', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-aviation-blue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('navPlanner.taxiFuel')}</label>
                                <input type="number" step="0.1" value={details.taxiFuel} onChange={e => handleDetailChange('taxiFuel', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-aviation-blue" />
                            </div>
                        </div>
                    </div>

                    {/* Flight Route Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('navPlanner.routeDetails')}</h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.origin')}</label>
                                <select value={details.origin} onChange={e => handleDetailChange('origin', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
                                    {airportOptions.map(opt => <option key={`origin-${opt}`} value={opt}>{opt || '---'}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.landing1')}</label>
                                <select value={details.landing1} onChange={e => handleDetailChange('landing1', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
                                    {airportOptions.map(opt => <option key={`landing1-${opt}`} value={opt}>{opt || '---'}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.landing2')}</label>
                                <select value={details.landing2} onChange={e => handleDetailChange('landing2', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
                                    {airportOptions.map(opt => <option key={`landing2-${opt}`} value={opt}>{opt || '---'}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.finalDest')}</label>
                                <select value={details.finalDest} onChange={e => handleDetailChange('finalDest', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
                                    {airportOptions.map(opt => <option key={`finalDest-${opt}`} value={opt}>{opt || '---'}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="px-4 pb-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{t('navPlanner.alternate')}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.altName')}</label>
                                    <input type="text" value={details.altName} onChange={e => handleDetailChange('altName', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.altFreq')}</label>
                                    <input type="text" value={details.altFreq} onChange={e => handleDetailChange('altFreq', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Legs Table Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('navPlanner.legsTable.to')} / {t('navPlanner.legsTable.from')}</h3>
                    <button
                        onClick={addLeg}
                        className="flex items-center gap-1 bg-aviation-blue hover:bg-blue-800 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
                    >
                        <Plus className="h-4 w-4" /> {t('navPlanner.addLeg')}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left">
                        <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <tr>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.from')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.to')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.dist')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.time')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.timeOverPoint')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.fuelGal')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.heading')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.altitude')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.trend')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.control')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.primaryFreq')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.secondaryFreq')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.vorName')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.vorRadial')}</th>
                                <th className="px-3 py-2">{t('navPlanner.legsTable.vorDist')}</th>
                                <th className="px-3 py-2 text-center">X</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedLegs.map((leg) => (
                                <tr key={leg.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-2 py-1"><input type="text" list="waypoints-list" value={leg.from} onChange={e => handleLegChange(leg.id, 'from', e.target.value)} className="w-16 sm:w-20 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600" /></td>
                                    <td className="px-2 py-1"><input type="text" list="waypoints-list" value={leg.to} onChange={e => handleLegChange(leg.id, 'to', e.target.value)} className="w-16 sm:w-20 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600" /></td>
                                    <td className="px-2 py-1"><input type="number" value={leg.distNM} onChange={e => handleLegChange(leg.id, 'distNM', e.target.value)} className="w-12 sm:w-16 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                    <td className="px-2 py-1 font-mono text-center text-gray-600 dark:text-gray-400">{leg.flightTimeStr}</td>
                                    <td className="px-2 py-1 font-mono text-center text-gray-600 dark:text-gray-400">{leg.timeOverPoint}</td>
                                    <td className="px-2 py-1 text-center font-medium text-aviation-blue dark:text-blue-400">{leg.fuelUsed.toFixed(1)}</td>

                                    <td className="px-2 py-1"><input type="text" value={leg.heading} onChange={e => handleLegChange(leg.id, 'heading', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                    <td className="px-2 py-1"><input type="text" value={leg.altitude} onChange={e => handleLegChange(leg.id, 'altitude', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                    <td className="px-2 py-1">
                                        <select value={leg.trend} onChange={e => handleLegChange(leg.id, 'trend', e.target.value)} className="w-20 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600">
                                            <option value="">-</option>
                                            <option value="climb">{t('navPlanner.trendOptions.climb')}</option>
                                            <option value="descent">{t('navPlanner.trendOptions.descent')}</option>
                                            <option value="noChange">{t('navPlanner.trendOptions.noChange')}</option>
                                        </select>
                                    </td>
                                    <td className="px-2 py-1"><input type="text" value={leg.control} onChange={e => handleLegChange(leg.id, 'control', e.target.value)} className="w-20 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600" /></td>

                                    <td className="px-2 py-1"><input type="text" value={leg.primaryFreq} onChange={e => handleLegChange(leg.id, 'primaryFreq', e.target.value)} className="w-16 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                    <td className="px-2 py-1"><input type="text" value={leg.secondaryFreq} onChange={e => handleLegChange(leg.id, 'secondaryFreq', e.target.value)} className="w-16 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>

                                    <td className="px-2 py-1"><input type="text" value={leg.vorName} onChange={e => handleLegChange(leg.id, 'vorName', e.target.value)} className="w-16 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600" /></td>
                                    <td className="px-2 py-1"><input type="text" value={leg.vorRadial} onChange={e => handleLegChange(leg.id, 'vorRadial', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                    <td className="px-2 py-1"><input type="text" value={leg.vorDist} onChange={e => handleLegChange(leg.id, 'vorDist', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>

                                    <td className="px-2 py-1 text-center">
                                        <button onClick={() => removeLeg(leg.id)} className="text-red-500 hover:text-red-700 transition-colors p-1">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {legs.length === 0 && (
                        <div className="py-8 text-center text-gray-500 italic">
                            No legs added yet. Click "Add Leg" to start.
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-aviation-blue px-4 py-3">
                    <h3 className="text-lg font-bold text-white">{t('navPlanner.summary.title')}</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('navPlanner.summary.totalTime')}</span>
                            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-lg font-bold">{formatDuration(totalTimeHours)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('navPlanner.summary.totalDist')}</span>
                            <span className="font-mono px-3 py-1 rounded text-lg font-bold">{totalDist.toFixed(1)} NM</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('navPlanner.summary.reserve45')}</span>
                            <span className="font-mono text-yellow-600 dark:text-yellow-400 font-bold">{reserve45.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('navPlanner.summary.reqFuelNoReserve')}</span>
                            <span className="font-mono">{reqFuelNoReserve.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 px-2 rounded">
                            <span className="text-gray-700 dark:text-gray-300 font-bold">{t('navPlanner.summary.reqFuel45Min')}</span>
                            <span className="font-mono text-green-700 dark:text-green-400 font-bold text-lg">{reqFuel45Min.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('navPlanner.summary.reqFuel60Min')}</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{reqFuel60Min.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datalist for Waypoints */}
            <datalist id="waypoints-list">
                {waypoints.map(wp => (
                    <option key={wp.code} value={`${wp.code} - ${wp.name}`} />
                ))}
            </datalist>
        </div>
    );
}
