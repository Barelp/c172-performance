import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Plus, Trash2, Calculator, PlusCircle, Send, AlertTriangle, RefreshCw, Search, Code, FileText } from 'lucide-react';
import { decode } from '@rovacc/notam-decoder';
import type { FlightDetails, FlightLeg, Notam } from '../types/navigation';
import { waypoints } from '../data/waypoints';
import { getAllPresets } from '../data/presets';
import FlightMap from '../components/FlightMap';
import WeatherTab from '../components/WeatherTab';

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const initialDetails: FlightDetails = {
    takeoffTime: '08:00',
    flightDate: getTodayDate(),
    cruiseGS: 90,
    cruiseGPH: 8,
    taxiFuel: 1.1,
    tocFuel: 1,
    origin: '',
    landing1: '',
    landing2: '',
    finalDest: '',
    altName: '',
    altFreq: '',
    pilotName: '',
    pilotLicense: '',
    pilotPhone: '',
    pilotEmail: '',
    paxCount: '',
    flightEndurance: '',
    aircraftType: '172',
    callsign: '',
    flightRules: 'V'
};

export default function NavigationPlanner() {
    const { t } = useTranslation();
    const [details, setDetails] = useState<FlightDetails>(() => {
        try {
            const saved = localStorage.getItem('navPlannerDetails');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure the parsed object has all properties from initialDetails that might be missing
                return { ...initialDetails, ...parsed };
            }
        } catch (e) {
            console.error('Error loading nav planner details:', e);
        }
        return initialDetails;
    });
    const [legs, setLegs] = useState<FlightLeg[]>(() => {
        try {
            const saved = localStorage.getItem('navPlannerLegs');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Error loading nav planner legs:', e);
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('navPlannerDetails', JSON.stringify(details));
    }, [details]);

    useEffect(() => {
        localStorage.setItem('navPlannerLegs', JSON.stringify(legs));
    }, [legs]);
    const [activeTab, setActiveTab] = useState<'planner' | 'map' | 'notams' | 'weather'>('planner');
    const [notamsSearch, setNotamsSearch] = useState('');
    const [fetchedNotams, setFetchedNotams] = useState<Notam[]>([]);
    const [notamsFileDate, setNotamsFileDate] = useState<string | null>(null);
    const [isLoadingNotams, setIsLoadingNotams] = useState(false);
    const [notamViewMode, setNotamViewMode] = useState<'raw' | 'decoded'>(() => {
        const saved = localStorage.getItem('notamViewMode');
        return (saved === 'raw' || saved === 'decoded') ? saved : 'raw';
    });

    useEffect(() => {
        localStorage.setItem('notamViewMode', notamViewMode);
    }, [notamViewMode]);

    const fetchNotams = async () => {
        setIsLoadingNotams(true);
        try {
            // Use proxy to bypass CORS. Works locally via Vite proxy and in Prod via vercel.json rewrite.
            // Works locally via Vite proxy and in Prod via vercel.json rewrite.
            const url = '/api/notamdata/Israel.json';
            const response = await fetch(url);
            const data = await response.json();
            if (data && data.notams) {
                setFetchedNotams(data.notams);
                if (data.date) setNotamsFileDate(data.date);
            }
        } catch (error) {
            console.error("Failed to fetch NOTAMs for tab:", error);
        } finally {
            setIsLoadingNotams(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'notams' && fetchedNotams.length === 0 && !isLoadingNotams) {
            fetchNotams();
        }
    }, [activeTab, fetchedNotams.length, isLoadingNotams]);

    const filteredNotams = fetchedNotams.filter(n => {
        if (!notamsSearch) return true;
        const search = notamsSearch.toLowerCase();
        const notam = n.notam;
        return (
            (notam.series + notam.number).toLowerCase().includes(search) ||
            (notam.raw && notam.raw.toLowerCase().includes(search)) ||
            (notam.notamText && notam.notamText.toLowerCase().includes(search))
        );
    }).sort((a, b) => {
        // Sort by year descending, then by number descending (newest first)
        if (b.notam.year !== a.notam.year) return b.notam.year - a.notam.year;
        return b.notam.number - a.notam.number;
    });

    const airportOptions = [
        { code: '', label: '---' },
        ...waypoints
            .filter(wp => wp.code.startsWith('LL') && wp.code.length === 4)
            .sort((a, b) => a.name.localeCompare(b.name, 'he'))
            .map(wp => ({
                code: wp.code,
                label: `${wp.code} - ${wp.name}`
            }))
    ];
    const callsignOptions = ['', ...getAllPresets().map(p => p.tailNumber)];
    const [icaoPlan, setIcaoPlan] = useState<string | null>(null);
    const [icaoError, setIcaoError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Format hours to HH:mm:ss
    const formatDuration = (hours: number) => {
        if (!isFinite(hours) || isNaN(hours)) return '00:00:00';
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        const s = Math.round(((hours - h) * 60 - m) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleDetailChange = (field: keyof FlightDetails, value: string | number) => {
        let parsedValue = value;
        if (typeof value === 'string') {
            if (field === 'paxCount') {
                parsedValue = value.replace(/[^0-9]/g, '');
            } else if (field === 'pilotName') {
                parsedValue = value.replace(/[^a-zA-Z\s]/g, '');
            } else if (field === 'flightEndurance') {
                parsedValue = value.replace(/[^0-9.]/g, '');
                // Prevent multiple decimal points
                const parts = parsedValue.split('.');
                if (parts.length > 2) {
                    parsedValue = parts[0] + '.' + parts.slice(1).join('');
                }
            }
        }
        setDetails(prev => ({ ...prev, [field]: parsedValue }));
    };

    const handleLegChange = (id: string, field: keyof FlightLeg, value: string | number) => {
        let parsedValue = value;
        if (typeof value === 'string' && (field === 'heading' || field === 'windDir')) {
            parsedValue = value.replace(/[^0-9]/g, '');
            if (parsedValue !== '') {
                const numericValue = parseInt(parsedValue, 10);
                if (numericValue > 360) {
                    parsedValue = '360';
                } else if (parsedValue.length > 3) {
                    parsedValue = parsedValue.slice(0, 3);
                }
            }
        }
        setLegs(prev => prev.map(leg => {
            if (leg.id !== id) return leg;
            const updatedLeg = { ...leg, [field]: parsedValue };

            if (field === 'from' || field === 'to') {
                const getWaypoint = (codeOrName: string) => {
                    if (!codeOrName || typeof codeOrName !== 'string') return null;
                    const code = codeOrName.split('-')[0].trim().toUpperCase();
                    return waypoints.find(wp => wp.code.toUpperCase() === code);
                };
                const wpFrom = getWaypoint(updatedLeg.from);
                const wpTo = getWaypoint(updatedLeg.to);
                if (wpFrom && wpTo && wpFrom.lat && wpFrom.lon && wpTo.lat && wpTo.lon) {
                    const midLat = (wpFrom.lat + wpTo.lat) / 2;
                    const dx = (wpTo.lon - wpFrom.lon) * Math.cos(midLat * Math.PI / 180);
                    const dy = wpTo.lat - wpFrom.lat;
                    const distNM = Math.sqrt(dx * dx + dy * dy) * 60;
                    updatedLeg.distNM = parseFloat(distNM.toFixed(1));

                    let tc = Math.atan2(dx, dy) * 180 / Math.PI;
                    if (tc < 0) tc += 360;

                    updatedLeg.heading = Math.round(tc).toString().padStart(3, '0');
                }
            }
            return updatedLeg;
        }));
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
            vorDist: '',
            temperature: 15, // Default ISA sea level temp
            windDir: '',
            windSpeed: ''
        };
        setLegs(prev => [...prev, newLeg]);
    };

    const insertLeg = (index: number) => {
        const prevLeg = index > 0 ? legs[index - 1] : null;
        const newLeg: FlightLeg = {
            id: crypto.randomUUID(),
            to: '',
            from: prevLeg ? prevLeg.to : '',
            distNM: '',
            heading: '',
            altitude: '',
            trend: '',
            control: '',
            primaryFreq: '',
            secondaryFreq: '',
            vorName: '',
            vorRadial: '',
            vorDist: '',
            temperature: 15, // Default ISA sea level temp
            windDir: '',
            windSpeed: ''
        };
        const newLegs = [...legs];
        newLegs.splice(index, 0, newLeg);
        setLegs(newLegs);
    };

    const removeLeg = (id: string) => {
        setLegs(prev => prev.filter(leg => leg.id !== id));
    };

    // Calculations
    const parseNum = (val: string | number) => (val === '' || isNaN(Number(val)) ? 0 : Number(val));
    const cruiseIAS = parseNum(details.cruiseGS);
    const gph = parseNum(details.cruiseGPH);
    const taxiFuel = parseNum(details.taxiFuel);
    const tocFuel = parseNum(details.tocFuel);

    let cumulativeHours = 0;

    const calculateTAS = (ias: number, altitude: number, tempC: number) => {
        // Approximate TAS formula: TAS = IAS + (2% per 1000 ft of altitude)
        // A more accurate common formula involving temperature is: TAS = IAS * sqrt( density_sea_level / density_alt )
        // Using a simpler common aviation rule of thumb: +2% per 1000ft, plus ~1% for every 5C above standard temperature.
        // Or the standard: TAS = IAS * (1 + (Altitude / 1000) * 0.02)
        // Let's use standard rule of thumb for standard temp, but adjust by temperature roughly.
        // Actually, the simplest accurate enough formula: TAS = IAS * (1 + 0.02 * (Altitude / 1000))
        // We'll ignore temp for the basic rule if altitude is only thing provided, but since temp is provided,
        // Standard temp at altitude = 15 - 2 * (Alt/1000).
        // Dev. from Standard = Actual Temp - Standard Temp.
        // Rule of thumb: add 1% to TAS for every 5 degrees C above standard, subtract 1% for 5 degrees below.

        const alt = altitude || 0;
        const stdTemp = 15 - 2 * (alt / 1000);
        const tempISA = tempC - stdTemp;
        const tasBase = ias * (1 + 0.02 * (alt / 1000));
        const tasFinal = tasBase + tasBase * (tempISA / 5) * 0.01;

        return tasFinal;
    };

    const calculateWindEffects = (courseDeg: number, windDirDeg: number, windSpeed: number, tas: number) => {
        if (!tas || isNaN(courseDeg) || isNaN(windDirDeg) || isNaN(windSpeed)) return { wca: 0, gs: tas || 0 };
        const windAngleRad = (windDirDeg - courseDeg) * (Math.PI / 180);
        let wcaRad = Math.asin((windSpeed * Math.sin(windAngleRad)) / tas);
        if (isNaN(wcaRad)) wcaRad = 0;
        const wcaDeg = wcaRad * (180 / Math.PI);
        const gs = tas * Math.cos(wcaRad) - windSpeed * Math.cos(windAngleRad);
        return { wca: wcaDeg, gs: Math.max(0, gs) };
    }

    const calculatedLegs = legs.map(leg => {
        const dist = parseNum(leg.distNM);
        const course = parseNum(leg.heading);
        const windDir = leg.windDir !== '' ? parseNum(leg.windDir) : NaN;
        const windSpeed = leg.windSpeed !== '' ? parseNum(leg.windSpeed) : NaN;
        const alt = parseNum(leg.altitude);
        const temp = parseNum(leg.temperature);

        const currentTAS = cruiseIAS > 0 ? Math.round(calculateTAS(cruiseIAS, alt, temp !== 0 ? temp : 15)) : 0;
        let legGS = currentTAS;
        let legWCA = 0;

        if (!isNaN(windDir) && !isNaN(windSpeed) && !isNaN(course) && currentTAS > 0) {
            const effects = calculateWindEffects(course, windDir, windSpeed, currentTAS);
            legGS = effects.gs;
            legWCA = effects.wca;
        }

        const flightTimeHours = legGS > 0 ? dist / legGS : 0;
        const fuelUsed = flightTimeHours * gph;

        cumulativeHours += flightTimeHours;
        const timeOverPoint = formatDuration(cumulativeHours);

        return {
            ...leg,
            flightTimeHours,
            flightTimeStr: formatDuration(flightTimeHours),
            fuelUsed,
            timeOverPoint,
            calculatedTAS: currentTAS,
            calculatedGS: legGS,
            calculatedWCA: legWCA
        };
    });


    const totalDist = calculatedLegs.reduce((acc, leg) => acc + parseNum(leg.distNM), 0);
    const totalTimeHours = calculatedLegs.reduce((acc, leg) => acc + leg.flightTimeHours, 0);
    const totalFuelUsed = calculatedLegs.reduce((acc, leg) => acc + leg.fuelUsed, 0) + taxiFuel + tocFuel;

    const reqFuelNoReserve = totalFuelUsed;
    const reserve45 = 0.75 * gph;
    const reqFuel45Min = reqFuelNoReserve + reserve45;
    const reqFuel60Min = reqFuelNoReserve + gph;

    const validateForm = (): string[] => {
        const errors: string[] = [];
        if (legs.length === 0) errors.push(t('navPlanner.errors.noLegs'));
        if (!details.origin) errors.push(t('navPlanner.errors.noOrigin'));
        if (!details.finalDest) errors.push(t('navPlanner.errors.noDest'));
        if (!details.pilotName) errors.push(t('navPlanner.errors.noPilotName'));
        if (!details.pilotLicense) errors.push(t('navPlanner.errors.noLicense'));
        if (!details.pilotPhone) errors.push(t('navPlanner.errors.noPhone'));
        if (!details.paxCount) errors.push(t('navPlanner.errors.noPax'));
        if (!details.flightEndurance) errors.push(t('navPlanner.errors.noEndurance'));
        if (!details.callsign) errors.push(t('navPlanner.errors.noCallsign'));
        if (!details.flightRules) errors.push(t('navPlanner.errors.noRules'));
        if (!details.flightDate) errors.push(t('navPlanner.errors.noDate'));

        // Additional format validations
        if (details.paxCount && !/^[0-9]+$/.test(details.paxCount)) errors.push(t('navPlanner.errors.invalidPax'));
        if (details.pilotName && !/^[a-zA-Z\s]+$/.test(details.pilotName)) errors.push(t('navPlanner.errors.invalidPilotName'));
        if (details.flightEndurance && !/^[0-9.]+$/.test(details.flightEndurance)) errors.push(t('navPlanner.errors.invalidEndurance'));
        if (details.pilotEmail && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(details.pilotEmail)) errors.push(t('navPlanner.errors.invalidEmail'));

        return errors;
    };

    const generateICAO = () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setIcaoError(`${t('navPlanner.validationErrorTitle')}\n• ${validationErrors.join('\n• ')}`);
            setIcaoPlan(null);
            return;
        }

        // Validate waypoints (ignore empty, origin, destination, and known airports)
        const originCode = details.origin.split('-')[0].trim().toUpperCase();
        const destCode = details.finalDest.split('-')[0].trim().toUpperCase();

        const hasInvalidWaypoint = legs.some(l => {
            if (!l.to) return false;
            const code = l.to.split('-')[0].trim().split(' ')[0].trim().toUpperCase();
            const isAirport = airportOptions.some(a => a.code === code) || code === originCode || code === destCode;
            if (isAirport) return false;
            return !waypoints.some(wp => wp.code.toUpperCase() === code);
        });

        if (hasInvalidWaypoint) {
            setIcaoError(t('navPlanner.invalidWaypointError'));
            setIcaoPlan(null);
            return;
        }

        setIcaoError(null);

        // Date formatted as YYMMDD from the flightDate field
        const dateParts = details.flightDate.split('-');
        let dof = '';
        if (dateParts.length === 3) {
            const yy = dateParts[0].slice(-2);
            dof = `${yy}${dateParts[1]}${dateParts[2]}`;
        }

        // For ICAO string, use the TAS of the first leg, or IAS if no legs
        const initialTAS = calculatedLegs.length > 0 ? calculatedLegs[0].calculatedTAS : cruiseIAS;
        // Format speed (N + 4 digits: e.g. 90 -> N0090)
        const speed = `N${String(Math.round(initialTAS)).padStart(4, '0')}`;

        // Format time (HHMM)
        const time = details.takeoffTime.replace(':', '');

        // Format total EET (Estimated Enroute Time)
        const mEetHours = Math.floor(totalTimeHours);
        const mEetMins = Math.round((totalTimeHours - mEetHours) * 60);
        const eet = `${String(mEetHours).padStart(2, '0')}${String(mEetMins).padStart(2, '0')}`;

        // Format Endurance (e.g. from decimal "4.5" -> "0430")
        const enduranceVal = parseFloat(details.flightEndurance) || 0;
        const eHrs = Math.floor(enduranceVal);
        const eMins = Math.round((enduranceVal - eHrs) * 60);
        const enduranceStr = `${String(eHrs).padStart(2, '0')}${String(eMins).padStart(2, '0')}`;

        // Build Route from legs. The datalist format is "CODE - Name", so we extract just the CODE part.
        // We also filter out any points that are exactly the Origin or Destination codes.
        const allPoints: string[] = [];
        if (legs.length > 0 && legs[0].from) {
            allPoints.push(legs[0].from.split('-')[0].trim().split(' ')[0].trim());
        }
        legs.forEach(l => {
            if (l.to) {
                allPoints.push(l.to.split('-')[0].trim().split(' ')[0].trim());
            }
        });

        const routePoints = allPoints.filter(point => {
            return point && point !== originCode && point !== destCode;
        });
        const routeStr = routePoints.length > 0 ? routePoints.join(' ') : 'DCT';

        const ruleString = details.flightRules === 'I' ? 'IFR' : 'VFR';
        const plan = `(FPL-${details.callsign}-${details.flightRules}G
-C172/L-S/C
-${originCode}${time}
-${speed}${ruleString} ${routeStr}
-${destCode}${eet}
-DOF/${dof} RMK/PIC ${details.pilotName.trim()} LICENSE ${details.pilotLicense} CELL ${details.pilotPhone}
-E/${enduranceStr} P/${details.paxCount.padStart(3, '0')})`.toUpperCase();

        // Validate that no Hebrew characters slipped into the final ICAO plan (e.g. from user input)
        if (/[\u0590-\u05FF]/.test(plan)) {
            setIcaoError(t('navPlanner.hebrewCharacterError'));
            setIcaoPlan(null);
            return;
        }

        setIcaoPlan(plan);
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 800);
    };


    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
                <Map className="h-8 w-8 text-aviation-blue dark:text-blue-400" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('navPlanner.title')}</h2>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6 rtl:space-x-reverse">
                <button
                    onClick={() => setActiveTab('planner')}
                    className={`pb-2 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'planner'
                        ? 'border-aviation-blue text-aviation-blue dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    {t('navPlanner.tabs.planner')}
                </button>
                <button
                    onClick={() => setActiveTab('map')}
                    className={`pb-2 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'map'
                        ? 'border-aviation-blue text-aviation-blue dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    {t('navPlanner.tabs.map')}
                </button>
                <button
                    onClick={() => setActiveTab('notams')}
                    className={`pb-2 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notams'
                        ? 'border-aviation-blue text-aviation-blue dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    {t('navPlanner.tabs.notams', 'NOTAMs')}
                </button>
                <button
                    onClick={() => setActiveTab('weather')}
                    className={`pb-2 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'weather'
                        ? 'border-aviation-blue text-aviation-blue dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    {t('navPlanner.tabs.weather')}
                </button>
            </div>

            {activeTab === 'planner' && (
                <div className="space-y-6 animate-in fade-in duration-300">
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('navPlanner.flightDate')}</label>
                                        <input type="date" value={details.flightDate} onChange={e => handleDetailChange('flightDate', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-aviation-blue" />
                                    </div>
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('navPlanner.tocFuel')}</label>
                                        <input type="number" step="0.1" value={details.tocFuel} onChange={e => handleDetailChange('tocFuel', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-aviation-blue" />
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
                                        <input type="text" list="airports-list" value={details.origin} onChange={e => handleDetailChange('origin', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm" placeholder="---" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.landing1')}</label>
                                        <input type="text" list="airports-list" value={details.landing1} onChange={e => handleDetailChange('landing1', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm" placeholder="---" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.landing2')}</label>
                                        <input type="text" list="airports-list" value={details.landing2} onChange={e => handleDetailChange('landing2', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm" placeholder="---" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('navPlanner.finalDest')}</label>
                                        <input type="text" list="airports-list" value={details.finalDest} onChange={e => handleDetailChange('finalDest', e.target.value)} className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm" placeholder="---" />
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
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.windDir')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.windSpeed')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.altitude')}</th>
                                        <th className="px-3 py-2 text-center">{t('navPlanner.legsTable.temperature')}</th>
                                        <th className="px-3 py-2 text-center">{t('navPlanner.legsTable.tas')}</th>
                                        <th className="px-3 py-2 text-center">{t('navPlanner.legsTable.wca')}</th>
                                        <th className="px-3 py-2 text-center">{t('navPlanner.legsTable.gs')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.trend')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.control')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.primaryFreq')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.secondaryFreq')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.vorName')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.vorRadial')}</th>
                                        <th className="px-3 py-2">{t('navPlanner.legsTable.vorDist')}</th>
                                        <th className="px-3 py-2 text-center whitespace-nowrap">+/-</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculatedLegs.map((leg, index) => (
                                        <tr key={leg.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-2 py-1"><input type="text" list="waypoints-list" value={leg.from} onChange={e => handleLegChange(leg.id, 'from', e.target.value)} className="w-28 sm:w-36 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600" /></td>
                                            <td className="px-2 py-1"><input type="text" list="waypoints-list" value={leg.to} onChange={e => handleLegChange(leg.id, 'to', e.target.value)} className="w-28 sm:w-36 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600" /></td>
                                            <td className="px-2 py-1"><input type="number" value={leg.distNM} onChange={e => handleLegChange(leg.id, 'distNM', e.target.value)} className="w-12 sm:w-16 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                            <td className="px-2 py-1 font-mono text-center text-gray-600 dark:text-gray-400">{leg.flightTimeStr}</td>
                                            <td className="px-2 py-1 font-mono text-center text-gray-600 dark:text-gray-400">{leg.timeOverPoint}</td>
                                            <td className="px-2 py-1 text-center font-medium text-aviation-blue dark:text-blue-400">{leg.fuelUsed.toFixed(1)}</td>

                                            <td className="px-2 py-1"><input type="text" placeholder="°" value={leg.heading} onChange={e => handleLegChange(leg.id, 'heading', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                            <td className="px-2 py-1"><input type="text" placeholder="°" value={leg.windDir} onChange={e => handleLegChange(leg.id, 'windDir', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                            <td className="px-2 py-1"><input type="number" placeholder="KT" value={leg.windSpeed} onChange={e => handleLegChange(leg.id, 'windSpeed', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                            <td className="px-2 py-1"><input type="text" value={leg.altitude} onChange={e => handleLegChange(leg.id, 'altitude', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>
                                            <td className="px-2 py-1"><input type="number" placeholder="°C" value={leg.temperature} onChange={e => handleLegChange(leg.id, 'temperature', e.target.value)} className="w-12 p-1 border rounded text-xs bg-white dark:bg-gray-800 dark:border-gray-600 text-center" /></td>

                                            <td className="px-2 py-1 text-center font-mono text-xs text-gray-600 dark:text-gray-400 font-bold">
                                                {leg.calculatedTAS > 0 ? Math.round(leg.calculatedTAS) : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center font-mono text-xs text-gray-600 dark:text-gray-400">
                                                {leg.calculatedWCA !== 0 ? (leg.calculatedWCA > 0 ? `+${leg.calculatedWCA.toFixed(0)}°` : `${leg.calculatedWCA.toFixed(0)}°`) : '-'}
                                            </td>
                                            <td className="px-2 py-1 text-center font-mono text-xs text-gray-600 dark:text-gray-400 font-bold">
                                                {Math.round(leg.calculatedGS)}
                                            </td>

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

                                            <td className="px-2 py-1 text-center whitespace-nowrap">
                                                <button onClick={() => insertLeg(index + 1)} title={t('navPlanner.insertLeg')} className="text-green-500 hover:text-green-700 transition-colors p-1">
                                                    <PlusCircle className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => removeLeg(leg.id)} title={t('navPlanner.removeLeg')} className="text-red-500 hover:text-red-700 transition-colors p-1">
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

                    {/* Flight Status (Moved to Bottom) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mt-8">
                        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('navPlanner.flightStatus')}</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.pilotName')}</label>
                                <input type="text" value={details.pilotName} onChange={e => handleDetailChange('pilotName', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.pilotLicense')}</label>
                                <input type="text" value={details.pilotLicense} onChange={e => handleDetailChange('pilotLicense', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.pilotPhone')}</label>
                                <input type="text" value={details.pilotPhone} onChange={e => handleDetailChange('pilotPhone', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.pilotEmail')}</label>
                                <input type="email" value={details.pilotEmail} onChange={e => handleDetailChange('pilotEmail', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.departureDest')}</label>
                                <div className="col-span-2 flex gap-2">
                                    <input type="text" value={details.origin} readOnly className="flex-1 p-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm text-center text-gray-500" placeholder={t('navPlanner.origin')} />
                                    <input type="text" value={details.finalDest} readOnly className="flex-1 p-1.5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-sm text-center text-gray-500" placeholder={t('navPlanner.finalDest')} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.paxCount')}</label>
                                <input type="text" value={details.paxCount} onChange={e => handleDetailChange('paxCount', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center" />
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
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.flightRules')}</label>
                                <select value={details.flightRules} onChange={e => handleDetailChange('flightRules', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center font-bold">
                                    <option value="V">VFR</option>
                                    <option value="I">IFR</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2 md:col-start-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1">{t('navPlanner.callsign')}</label>
                                <select value={details.callsign} onChange={e => handleDetailChange('callsign', e.target.value)} className="col-span-2 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-center font-bold">
                                    {callsignOptions.map(opt => <option key={`callsign-${opt}`} value={opt}>{opt || '---'}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ICAO Generation Button */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <button
                                onClick={generateICAO}
                                disabled={isGenerating}
                                className={`w-full md:w-auto px-6 py-2 font-medium rounded-md shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${isGenerating
                                    ? 'bg-green-600 hover:bg-green-700 text-white transform scale-95'
                                    : 'bg-aviation-blue hover:bg-blue-800 text-white'
                                    }`}
                            >
                                {isGenerating && (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isGenerating ? t('navPlanner.icaoGenerated') : t('navPlanner.generateICAO')}
                            </button>

                            {icaoError && (
                                <div className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                    {icaoError}
                                </div>
                            )}

                            {icaoPlan && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">{t('navPlanner.icaoGenerated')}</h4>
                                    <textarea
                                        readOnly
                                        value={icaoPlan}
                                        rows={8}
                                        className="w-full p-3 font-mono text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-aviation-blue mb-3"
                                    />
                                    <div className="flex flex-col items-start gap-2">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <button
                                                disabled
                                                title="שליחת מייל אינה זמינה כרגע עקב בעיה טכנית"
                                                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-md text-sm font-medium cursor-not-allowed flex items-center justify-center min-w-[160px] opacity-60"
                                            >
                                                <Send className="mr-2 h-4 w-4" />
                                                {t('navPlanner.sendEmail')}
                                            </button>
                                        </div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <span>⚠️</span>
                                            <span>{t('navPlanner.emailUnavailable')}</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'map' && (
                <div className="animate-in fade-in duration-300">
                    <FlightMap legs={calculatedLegs} origin={details.origin} finalDest={details.finalDest} />
                </div>
            )}

            {activeTab === 'weather' && (
                <WeatherTab />
            )}

            {activeTab === 'notams' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="bg-aviation-blue px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Title & Mobile Refresh */}
                            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <AlertTriangle className="h-6 w-6 text-white shrink-0" />
                                    <h3 className="text-xl font-bold text-white truncate">
                                        {t('navPlanner.notams.title', 'NOTAMs List')} <span className="text-sm font-normal opacity-75 hidden xs:inline">(notammap.org)</span>
                                    </h3>
                                </div>
                            </div>

                            {/* Actions Box */}
                            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto text-white mt-1 sm:mt-0">
                                {/* Mobile Refresh */}
                                <button
                                    onClick={fetchNotams}
                                    disabled={isLoadingNotams}
                                    className={`sm:hidden shrink-0 flex items-center justify-center p-2 bg-white/10 text-white hover:text-blue-200 border border-white/20 rounded-lg hover:bg-white/20 transition ${isLoadingNotams ? "opacity-50" : ""}`}
                                    title={t('navPlanner.notams.refresh', 'Refresh NOTAMs')}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoadingNotams ? 'animate-spin' : ''}`} strokeWidth={2} />
                                    {notamsFileDate && (
                                        <span className="text-xs font-semibold ml-1.5 whitespace-nowrap">
                                            {new Date(notamsFileDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </button>

                                {/* Raw / Decoded Toggles */}
                                <div className="bg-white/10 p-1 rounded-lg flex items-center flex-1 sm:flex-none">
                                    <button
                                        onClick={() => setNotamViewMode('raw')}
                                        className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${notamViewMode === 'raw' ? 'bg-white text-aviation-blue shadow-sm' : 'text-white hover:bg-white/20'}`}
                                    >
                                        <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        {t('navPlanner.notams.raw', 'Raw')}
                                    </button>
                                    <button
                                        onClick={() => setNotamViewMode('decoded')}
                                        className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${notamViewMode === 'decoded' ? 'bg-white text-aviation-blue shadow-sm' : 'text-white hover:bg-white/20'}`}
                                    >
                                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        {t('navPlanner.notams.decoded', 'Decoded')}
                                    </button>
                                </div>

                                {/* Desktop Refresh & Time */}
                                <div className="hidden sm:flex items-center gap-4">
                                    {notamsFileDate && (
                                        <span className="text-sm opacity-90 font-mono">
                                            {t('navPlanner.weather.lastUpdate', 'Last Updated:')} {new Date(notamsFileDate).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    <button
                                        onClick={fetchNotams}
                                        disabled={isLoadingNotams}
                                        className={`p-1.5 text-white hover:text-blue-200 rounded-lg hover:bg-white/10 transition ${isLoadingNotams ? "opacity-50" : ""}`}
                                        title={t('navPlanner.notams.refresh', 'Refresh NOTAMs')}
                                    >
                                        <RefreshCw className={`h-[18px] w-[18px] ${isLoadingNotams ? 'animate-spin' : ''}`} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={t('navPlanner.notams.searchPlaceholder', 'Search by ID or text...')}
                                    className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 focus:ring-2 focus:ring-aviation-blue focus:border-transparent outline-none transition-shadow text-gray-900 dark:text-gray-100"
                                    value={notamsSearch}
                                    onChange={(e) => setNotamsSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4">
                            {isLoadingNotams ? (
                                <div className="flex justify-center items-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-aviation-blue" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : filteredNotams.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredNotams.map(n => {
                                        const notam = n.notam;
                                        return (
                                            <div key={n.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-red-600 text-lg">NOTAM: {notam.series}{notam.number}/{notam.year}</span>
                                                    {(() => {
                                                        const rawText = notam.raw || notam.notamText || '';
                                                        const match = rawText.match(/CREATED:\s*(\d{2}\s+\w{3}\s+\d{4}\s+\d{2}:\d{2})/i);
                                                        return match ? (
                                                            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded whitespace-nowrap">
                                                                {match[1]}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </div>

                                                {notamViewMode === 'raw' ? (
                                                    <pre className="text-sm whitespace-pre-wrap font-mono m-0 text-gray-800 dark:text-gray-300">
                                                        {notam.raw || notam.notamText}
                                                    </pre>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {(() => {
                                                            const rawText = notam.raw || notam.notamText || '';
                                                            try {
                                                                const decoded = decode(rawText);
                                                                return (
                                                                    <div className="text-sm text-gray-800 dark:text-gray-200">
                                                                        {/* Decoded Title & Location */}
                                                                        {(decoded.title || decoded.fir) && (
                                                                            <div className="mb-2 font-semibold text-aviation-blue dark:text-blue-400">
                                                                                {decoded.fir && <span className="mr-2">[{decoded.fir}]</span>}
                                                                                {decoded.title}
                                                                            </div>
                                                                        )}

                                                                        {/* Human Readable Text */}
                                                                        <div className="bg-white/50 dark:bg-black/20 p-3 rounded border border-gray-100 dark:border-gray-800 mb-2 whitespace-pre-wrap leading-relaxed">
                                                                            {decoded.text}
                                                                        </div>

                                                                        {/* Details (Dates, Rules) */}
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                                            {decoded.duration && (
                                                                                <div>
                                                                                    <strong>Valid: </strong><br />
                                                                                    {new Date(decoded.duration.dateBegin).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                                                                                    {' - '}
                                                                                    {decoded.duration.permanent ? 'Permanent' : (decoded.duration.dateEnd ? new Date(decoded.duration.dateEnd).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown')}
                                                                                </div>
                                                                            )}
                                                                            {decoded.rules && decoded.rules.length > 0 && (
                                                                                <div>
                                                                                    <strong>Rules: </strong>
                                                                                    {decoded.rules.join(', ')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                // On decode fail, fallback to raw gracefully
                                                                return (
                                                                    <pre className="text-sm whitespace-pre-wrap font-mono m-0 text-gray-800 dark:text-gray-300">
                                                                        {rawText}
                                                                    </pre>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    {notamsSearch ? t('navPlanner.notams.noResults', 'No NOTAMs matched your search.') : t('navPlanner.notams.empty', 'No NOTAMs available.')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
            {/* Datalist for Airports */}
            <datalist id="airports-list">
                {airportOptions
                    .filter(opt => opt.code !== '')
                    .filter((opt, index, self) => index === self.findIndex((t) => t.code === opt.code))
                    .map(opt => (
                        <option key={`dl-apt-${opt.code}`} value={opt.label} />
                    ))}
            </datalist>

            {/* Datalist for Waypoints */}
            <datalist id="waypoints-list">
                {waypoints
                    .filter((wp, index, self) => index === self.findIndex((t) => t.code === wp.code))
                    .map(wp => (
                        <option key={wp.code} value={`${wp.code} - ${wp.name}`} />
                    ))}
            </datalist>
        </div >
    );
}
