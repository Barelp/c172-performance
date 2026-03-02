import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, CloudRain, AlertTriangle, Wind, Info, FileText, Code, Search } from 'lucide-react';
import { parseMetar, parseTAF } from 'metar-taf-parser';
import { parseAtis } from '../utils/atisParser';
import { parseWarning, formatCoordinateStr } from '../utils/warningParser';

interface WeatherData {
    data?: {
        metars?: Record<string, any[]>;
        tafors?: Record<string, any[]>;
        atis?: Record<string, any[]>;
        area_warnings?: Record<string, any>;
        warnings?: Record<string, any>;
    };
}

export default function WeatherTab() {
    const { t } = useTranslation();
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'raw' | 'decoded'>(() => {
        const saved = localStorage.getItem('weatherViewMode');
        return (saved === 'raw' || saved === 'decoded') ? saved : 'raw';
    });

    useEffect(() => {
        localStorage.setItem('weatherViewMode', viewMode);
    }, [viewMode]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchWeather = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = `${window.location.origin}/api/weather`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            setWeatherData(data);
            setLastUpdate(new Date());
        } catch (err) {
            console.error("Failed to fetch weather data:", err);
            setError(t('navPlanner.weather.error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let metars: string[] = [];
    if (weatherData?.data?.metars) {
        Object.values(weatherData.data.metars).forEach(arr => {
            arr.forEach(item => {
                if (item.content) metars.push(item.content);
            });
        });
    }

    let tafors: string[][] = [];
    if (weatherData?.data?.tafors) {
        Object.values(weatherData.data.tafors).forEach(arr => {
            arr.forEach(item => {
                if (item.lines) {
                    tafors.push(item.lines.map((l: any) => l.content));
                }
            });
        });
    }

    let atis: string[] = [];
    if (weatherData?.data?.atis) {
        Object.values(weatherData.data.atis).forEach(arr => {
            arr.forEach(item => {
                if (item.content) atis.push(item.content);
            });
        });
    }

    let warnings: string[][] = [];
    if (weatherData?.data?.area_warnings) {
        Object.values(weatherData.data.area_warnings).forEach(item => {
            if (item.lines) {
                warnings.push(item.lines.map((l: any) => l.content));
            }
        });
    }
    // Add Aerodrome Warnings as well
    if (weatherData?.data?.warnings) {
        Object.values(weatherData.data.warnings).forEach(aidGroup => {
            Object.values(aidGroup).forEach((item: any) => {
                if (item.lines) {
                    warnings.push(item.lines.map((l: any) => l.content));
                }
            });
        });
    }

    if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toUpperCase();
        metars = metars.filter(m => m.toUpperCase().includes(query));
        tafors = tafors.filter(t => t.join(' ').toUpperCase().includes(query));
        atis = atis.filter(a => a.toUpperCase().includes(query));
        warnings = warnings.filter(w => w.join(' ').toUpperCase().includes(query));
    }

    const renderDecodedMetar = (raw: string) => {
        try {
            const decoded = parseMetar(raw);
            return (
                <div className="text-sm space-y-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div><span className="text-gray-500 text-xs uppercase block">Station</span><span className="font-bold">{decoded.station}</span></div>
                        {decoded.wind && (
                            <div><span className="text-gray-500 text-xs uppercase block">Wind</span><span className="font-bold">{decoded.wind.direction !== undefined ? `${decoded.wind.direction}°` : 'VRB'} at {decoded.wind.speed}{decoded.wind.gust ? `G${decoded.wind.gust}` : ''} {decoded.wind.unit}</span></div>
                        )}
                        <div><span className="text-gray-500 text-xs uppercase block">Visibility</span><span className="font-bold">{decoded.visibility ? `${decoded.visibility.indicator === 'M' ? '<' : decoded.visibility.indicator === 'P' ? '>' : ''}${decoded.visibility.value}${decoded.visibility.unit}` : 'CAVOK'}</span></div>
                        {decoded.temperature && (
                            <div><span className="text-gray-500 text-xs uppercase block">Temp / Dew</span><span className="font-bold">{decoded.temperature}°C {decoded.dewPoint ? `/ ${decoded.dewPoint}°C` : ''}</span></div>
                        )}
                        {decoded.altimeter && (
                            <div><span className="text-gray-500 text-xs uppercase block">Altimeter</span><span className="font-bold">{decoded.altimeter.value} {decoded.altimeter.unit}</span></div>
                        )}
                    </div>
                    {decoded.weatherConditions && decoded.weatherConditions.length > 0 && (
                        <div><span className="text-gray-500 mr-2">Weather:</span> <span className="font-semibold">{decoded.weatherConditions.map(w => w.phenomenons?.join(', ')).join(' | ')}</span></div>
                    )}
                    {decoded.clouds && decoded.clouds.length > 0 && (
                        <div><span className="text-gray-500 mr-2">Clouds:</span> <span className="font-semibold">{decoded.clouds.map(c => `${c.quantity} at ${c.height !== undefined ? c.height : 'Unknown'}ft ${c.type ? `(${c.type})` : ''}`).join(', ')}</span></div>
                    )}
                    <div className="mt-2 pt-2 text-xs text-gray-400 font-mono border-t border-gray-100 dark:border-gray-800">{raw}</div>
                </div>
            );
        } catch (e) {
            return <div className="font-mono text-sm">{raw}</div>;
        }
    };

    const renderDecodedTaf = (lines: string[]) => {
        const rawTaf = lines.join(' ');
        try {
            const decoded = parseTAF(rawTaf);
            return (
                <div className="text-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div>
                            <span className="text-gray-500 text-xs uppercase block">Station</span>
                            <span className="font-bold text-lg">{decoded.station}</span>
                        </div>
                    </div>

                    {/* Base Forecast */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-2 shadow-sm">
                        <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">Base Forecast</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {decoded.wind && (
                                <div><span className="text-gray-500 text-xs uppercase block">Wind</span><span className="font-medium">{decoded.wind.direction}° at {decoded.wind.speed}{decoded.wind.gust ? `G${decoded.wind.gust}` : ''} {decoded.wind.unit}</span></div>
                            )}
                            <div><span className="text-gray-500 text-xs uppercase block">Visibility</span><span className="font-medium">{decoded.visibility ? `${decoded.visibility.indicator === 'M' ? '<' : decoded.visibility.indicator === 'P' ? '>' : ''}${decoded.visibility.value}${decoded.visibility.unit}` : 'CAVOK'}</span></div>
                            {decoded.clouds && decoded.clouds.length > 0 && (
                                <div className="col-span-2"><span className="text-gray-500 text-xs uppercase block">Clouds</span><span className="font-medium">{decoded.clouds.map(c => `${c.quantity} ${c.height ? c.height : ''}`).join(', ')}</span></div>
                            )}
                        </div>
                    </div>

                    {/* Trends */}
                    {decoded.trends && decoded.trends.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {decoded.trends.map((trend, idx) => (
                                <div key={idx} className="bg-gray-100 dark:bg-gray-700/50 border-l-4 border-blue-400 p-2 rounded-r">
                                    <div className="font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded text-xs">{trend.type}</span>
                                        {trend.validity && <span className="text-xs">From: {trend.validity.startDay} {trend.validity.startHour}:00 To: {trend.validity.endDay} {trend.validity.endHour}:00</span>}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                        {trend.wind && (
                                            <div><span className="text-gray-500 uppercase block">Wind</span><span>{trend.wind.direction}° at {trend.wind.speed} {trend.wind.unit}</span></div>
                                        )}
                                        {trend.visibility && (
                                            <div><span className="text-gray-500 uppercase block">Visibility</span><span>{trend.visibility.indicator === 'M' ? '<' : trend.visibility.indicator === 'P' ? '>' : ''}{trend.visibility.value}{trend.visibility.unit}</span></div>
                                        )}
                                        {trend.weatherConditions && trend.weatherConditions.length > 0 && (
                                            <div className="col-span-2"><span className="text-gray-500 uppercase block">Weather</span><span>{trend.weatherConditions.map(w => w.phenomenons?.join(', ')).join(' | ')}</span></div>
                                        )}
                                        {trend.clouds && trend.clouds.length > 0 && (
                                            <div className="col-span-2"><span className="text-gray-500 uppercase block">Clouds</span><span>{trend.clouds.map(c => `${c.quantity} ${c.height || ''}`).join(', ')}</span></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return (
                <div className="font-mono text-sm flex flex-col gap-1">
                    {lines.map((line, j) => (
                        <div key={j} className={j > 0 ? "pl-4 text-gray-600 dark:text-gray-400" : "font-bold"}>{line}</div>
                    ))}
                </div>
            );
        }
    };

    const renderDecodedAtis = (raw: string) => {
        try {
            const decoded = parseAtis(raw);
            return (
                <div className="text-sm space-y-2">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="font-bold text-lg text-blue-800 dark:text-blue-300">
                            {decoded.station || "ATIS"}
                        </span>
                        {decoded.time && <span className="ml-2 text-gray-500 text-xs">At {decoded.time}</span>}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {decoded.cavok && (
                            <div className="col-span-full">
                                <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold uppercase">CAVOK</span>
                            </div>
                        )}
                        {decoded.generalWind && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">Wind</span>
                                <span className="font-bold">{decoded.generalWind.direction}° at {decoded.generalWind.speed}{decoded.generalWind.gust ? `G${decoded.generalWind.gust}` : ''}KT</span>
                            </div>
                        )}
                        {decoded.visibility && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">Visibility</span>
                                <span className="font-bold">{decoded.visibility}</span>
                            </div>
                        )}
                        {decoded.temperature && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">Temp / Dew</span>
                                <span className="font-bold">{decoded.temperature}°C {decoded.dewPoint ? `/ ${decoded.dewPoint}°C` : ''}</span>
                            </div>
                        )}
                        {decoded.qnh && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">QNH</span>
                                <span className="font-bold">{decoded.qnh} hPa</span>
                            </div>
                        )}
                    </div>

                    {decoded.runwayWinds.length > 0 && (
                        <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                            <span className="text-gray-500 text-xs uppercase block mb-1">Runway Winds</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {decoded.runwayWinds.map((rw, idx) => (
                                    <div key={idx} className="flex flex-col text-xs">
                                        <span className="font-mono font-semibold">RWY {rw.rwy}</span>
                                        <span>Dir: {rw.direction}°, Spd: {rw.speed}KT {rw.max ? `(Max: ${rw.max}KT)` : ''} {rw.min ? `(Min: ${rw.min}KT)` : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {decoded.clouds && decoded.clouds.length > 0 && !decoded.cavok && (
                        <div className="mt-1">
                            <span className="text-gray-500 text-xs uppercase block">Clouds</span>
                            <span className="font-semibold">{decoded.clouds.join(', ')}</span>
                        </div>
                    )}

                    {decoded.trend && (
                        <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-100 dark:border-yellow-800">
                            <span className="text-gray-500 text-xs uppercase block mb-1">Trend</span>
                            <span className="font-semibold text-xs">{decoded.trend}</span>
                        </div>
                    )}

                    <div className="mt-2 pt-2 text-xs text-gray-400 font-mono border-t border-gray-100 dark:border-gray-800 break-words">{raw}</div>
                </div>
            );
        } catch (e) {
            return <div className="font-mono text-sm">{raw}</div>;
        }
    };

    const renderDecodedWarning = (lines: string[]) => {
        try {
            const decoded = parseWarning(lines);
            return (
                <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="font-bold text-lg text-red-600 dark:text-red-400">
                            {decoded.type === 'AD WRNG' ? 'AERODROME WARNING' : decoded.type} {decoded.number || ''}
                        </span>
                        {(decoded.validFrom || decoded.validTo) && (
                            <span className="text-xs text-gray-500 font-mono">
                                Valid: {decoded.validFrom || '??'} to {decoded.validTo || '??'}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {decoded.fir && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">FIR / Region</span>
                                <span className="font-bold">{decoded.fir}</span>
                            </div>
                        )}
                        {decoded.phenomenon && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">Phenomenon</span>
                                <span className="font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 px-1 py-0.5 rounded">{decoded.phenomenon}</span>
                            </div>
                        )}
                        {decoded.flightLevels && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">Flight Levels</span>
                                <span className="font-bold">{decoded.flightLevels}</span>
                            </div>
                        )}
                        {decoded.trend && (
                            <div>
                                <span className="text-gray-500 text-xs uppercase block">Trend</span>
                                <span className="font-bold">{decoded.trend}</span>
                            </div>
                        )}
                    </div>

                    {decoded.polygon && decoded.polygon.length > 0 && (
                        <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-500 text-xs uppercase block mb-1">Affected Area Polygon</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-xs">
                                {decoded.polygon.map((pt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="text-gray-400">Pt {idx + 1}:</span>
                                        <span>{formatCoordinateStr(pt.raw)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-2 pt-2 text-xs text-gray-400 font-mono border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                        {lines.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </div>
            );
        } catch (e) {
            return (
                <div className="font-mono text-sm flex flex-col gap-1">
                    {lines.map((line, j) => (
                        <div key={j} className={j > 0 ? "pl-4 text-gray-600 dark:text-gray-400" : "font-bold text-red-600 dark:text-red-400"}>{line}</div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-aviation-blue px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-4">
                    {/* Title */}
                    <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                        <CloudRain className="h-6 w-6 text-white shrink-0" />
                        <h3 className="text-xl font-bold text-white break-words w-full pr-2">
                            {t('navPlanner.weather.title')}
                        </h3>
                    </div>

                    {/* Actions Box */}
                    <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto text-white mt-1 sm:mt-0">
                        {/* Mobile Refresh (Now moved to same line as Raw/Decoded) */}
                        <button
                            onClick={fetchWeather}
                            disabled={isLoading}
                            className={`sm:hidden shrink-0 flex items-center justify-center p-2 bg-white/10 text-white hover:text-blue-200 border border-white/20 rounded-lg hover:bg-white/20 transition ${isLoading ? "opacity-50" : ""}`}
                            title={t('navPlanner.weather.refresh')}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
                            {lastUpdate && (
                                <span className="text-xs font-semibold ml-1.5 whitespace-nowrap">
                                    {lastUpdate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </button>

                        {/* Raw / Decoded Toggles */}
                        <div className="bg-white/10 p-1 rounded-lg flex items-center flex-1 sm:flex-none">
                            <button
                                onClick={() => setViewMode('raw')}
                                className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'raw' ? 'bg-white text-aviation-blue shadow-sm' : 'text-white hover:bg-white/20'}`}
                            >
                                <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {t('navPlanner.weather.raw', 'Raw')}
                            </button>
                            <button
                                onClick={() => setViewMode('decoded')}
                                className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'decoded' ? 'bg-white text-aviation-blue shadow-sm' : 'text-white hover:bg-white/20'}`}
                            >
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {t('navPlanner.weather.decoded', 'Decoded')}
                            </button>
                        </div>

                        <div className="hidden sm:flex items-center gap-4">
                            {lastUpdate && (
                                <span className="text-sm opacity-90 font-mono">
                                    {t('navPlanner.weather.lastUpdate')} {lastUpdate.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            <button
                                onClick={fetchWeather}
                                disabled={isLoading}
                                className={`p-1.5 text-white hover:text-blue-200 rounded-lg hover:bg-white/10 transition ${isLoading ? "opacity-50" : ""}`}
                                title={t('navPlanner.weather.refresh')}
                            >
                                <RefreshCw className={`h-[18px] w-[18px] ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('navPlanner.weather.searchPlaceholder', 'Filter by airport (e.g. LLBG)')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 focus:ring-2 focus:ring-aviation-blue focus:border-transparent outline-none transition-shadow text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="p-4 sm:p-6 text-gray-800 dark:text-gray-200">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {!error && !weatherData && isLoading && (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-aviation-blue border-t-transparent"></div>
                        </div>
                    )}

                    {!error && weatherData && (
                        <>
                            {/* Area Warnings Section */}
                            {warnings.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-5 w-5" />
                                        {t('navPlanner.weather.warnings')}
                                    </h4>
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        {warnings.map((lines, i) => (
                                            <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-3 rounded-md text-red-900 dark:text-red-200 flex flex-col gap-1">
                                                {viewMode === 'decoded' ? renderDecodedWarning(lines) : (
                                                    <div className="font-mono text-sm flex flex-col gap-1">
                                                        {lines.map((line, j) => (
                                                            <div key={j} className={j > 0 ? "pl-4 opacity-80" : "font-bold"}>{line}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ATIS Section */}
                            {atis.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
                                        <Info className="h-5 w-5 text-green-500" />
                                        {t('navPlanner.weather.atis')}
                                    </h4>
                                    <div className="grid gap-2 lg:grid-cols-2">
                                        {atis.map((a, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-300">
                                                {viewMode === 'decoded' ? renderDecodedAtis(a) : <div className="font-mono text-sm">{a}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* METAR Section */}
                            {metars.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
                                        <Info className="h-5 w-5 text-blue-500" />
                                        {t('navPlanner.weather.metar')}
                                    </h4>
                                    <div className="grid gap-2 lg:grid-cols-2">
                                        {metars.map((metar, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-300">
                                                {viewMode === 'decoded' ? renderDecodedMetar(metar) : <div className="font-mono text-sm">{metar}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAF Section */}
                            {tafors.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-200">
                                        <Wind className="h-5 w-5 text-blue-500" />
                                        {t('navPlanner.weather.taf')}
                                    </h4>
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        {tafors.map((lines, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-300 flex flex-col gap-1">
                                                {viewMode === 'decoded' ? renderDecodedTaf(lines) : (
                                                    <div className="font-mono text-sm flex flex-col gap-1">
                                                        {lines.map((line, j) => (
                                                            <div key={j} className={j > 0 ? "pl-4 text-gray-600 dark:text-gray-400" : "font-bold"}>{line}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {metars.length === 0 && tafors.length === 0 && atis.length === 0 && warnings.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    {t('navPlanner.weather.noData')}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
