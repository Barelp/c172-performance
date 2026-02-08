import { useTheme } from '../context/ThemeContext';
import aircraftTopView from '../resources/c172_topview.png';
import { useTranslation } from 'react-i18next';

interface StationDiagramProps {
    emptyWeight?: number;
    pilotWeight?: number;
    frontPaxWeight?: number;
    rearPax1Weight?: number;
    rearPax2Weight?: number;
    baggage1Weight?: number;
    baggage2Weight?: number;
    fuelLeftWeight?: number;
    fuelRightWeight?: number;
    unitPreference?: 'LBS' | 'KG';
}

export default function StationDiagram({
    emptyWeight = 0,
    pilotWeight = 0,
    frontPaxWeight = 0,
    rearPax1Weight = 0,
    rearPax2Weight = 0,
    baggage1Weight = 0,
    baggage2Weight = 0,
    fuelLeftWeight = 0,
    fuelRightWeight = 0,
    unitPreference = 'LBS',
}: StationDiagramProps) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const isKg = unitPreference === 'KG';
    const unitLabel = isKg ? 'kg' : 'lbs';
    const weightFactor = isKg ? 1 / 2.20462 : 1;

    const formatWeight = (lbs: number) => {
        return (lbs * weightFactor).toFixed(1);
    };

    return (
        <div className="w-full relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-colors duration-300">
            {/* Real Aircraft Image Background */}
            <div className="w-full">
                <img
                    src={aircraftTopView}
                    alt="Cessna 172 Top View"
                    className={`w-full h-auto object-contain transition-all duration-500 ${isDark ? 'opacity-40 brightness-75 invert' : 'opacity-80'}`}
                />
            </div>

            {/* Weight Boxes Overlay - Absolute Positioned relative to image container */}
            <div className="absolute inset-0 pointer-events-none">

                {/* Fuel Left */}
                <div className="absolute top-[28%] left-[18%]">
                    <div className="bg-emerald-100/30 dark:bg-emerald-900/30 backdrop-blur-sm border border-emerald-600/50 dark:border-emerald-500/50 rounded px-1.5 py-0.5 shadow-sm text-center min-w-[50px] transition-colors">
                        <span className="block text-[7px] text-emerald-800 dark:text-emerald-300 font-bold leading-none mb-0.5">{t('diagram.fuelL')}</span>
                        <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-100">{formatWeight(fuelLeftWeight)} <span className="text-[8px] opacity-70">{unitLabel}</span></span>
                    </div>
                </div>

                {/* Total Fuel */}
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2">
                    <div className="bg-blue-100/40 dark:bg-blue-900/50 backdrop-blur-md border border-blue-600/50 dark:border-blue-500/50 rounded px-2 py-0.5 shadow-sm text-center min-w-[70px] transition-colors">
                        <span className="block text-[7px] text-blue-800 dark:text-blue-300 font-bold uppercase leading-none mb-0.5">{t('diagram.totalFuel')}</span>
                        <span className="text-xs font-black text-blue-950 dark:text-blue-100">{formatWeight(fuelLeftWeight + fuelRightWeight)} <span className="text-[9px] opacity-70">{unitLabel}</span></span>
                    </div>
                </div>

                {/* Fuel Right */}
                <div className="absolute top-[28%] right-[18%]">
                    <div className="bg-emerald-100/40 dark:bg-emerald-900/40 backdrop-blur-md border border-emerald-600/50 dark:border-emerald-500/50 rounded px-1.5 py-0.5 shadow-sm text-center min-w-[50px] transition-colors">
                        <span className="block text-[7px] text-emerald-800 dark:text-emerald-300 font-bold leading-none mb-0.5">{t('diagram.fuelR')}</span>
                        <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-100">{formatWeight(fuelRightWeight)} <span className="text-[8px] opacity-70">{unitLabel}</span></span>
                    </div>
                </div>

                {/* Front Passengers */}
                <div className="absolute top-[15%] left-[50%] -translate-x-1/2">
                    <div className="bg-sky-100/30 dark:bg-sky-900/40 backdrop-blur-sm border border-sky-600/50 dark:border-sky-500/50 rounded px-2 py-0.5 shadow-md text-center min-w-[85px] transition-colors">
                        <span className="block text-[7px] text-sky-800 dark:text-sky-300 font-bold uppercase leading-none mb-0.5">{t('diagram.frontSeats')}</span>
                        <span className="text-xs font-black text-sky-950 dark:text-sky-100">{formatWeight(pilotWeight + frontPaxWeight)} <span className="text-[9px] opacity-70">{unitLabel}</span></span>
                        <div className="flex justify-between mt-0.5 pt-0.5 border-t border-sky-200/50 dark:border-sky-700/50 gap-3">
                            <span className="text-[6px] text-sky-700 dark:text-sky-400">{t('diagram.pilot')}: {formatWeight(pilotWeight)}</span>
                            <span className="text-[6px] text-sky-700 dark:text-sky-400">{t('diagram.pax')}: {formatWeight(frontPaxWeight)}</span>
                        </div>
                    </div>
                </div>

                {/* Rear Passengers */}
                <div className="absolute top-[52%] left-[50%] -translate-x-1/2">
                    <div className="bg-purple-100/40 dark:bg-purple-900/50 backdrop-blur-md border border-purple-600/50 dark:border-purple-500/50 rounded px-2 py-0.5 shadow-md text-center min-w-[85px] transform transition cursor-default">
                        <span className="block text-[7px] text-purple-800 dark:text-purple-300 font-bold uppercase leading-none mb-0.5">{t('diagram.rearSeats')}</span>
                        <span className="text-xs font-black text-purple-950 dark:text-purple-100">{formatWeight(rearPax1Weight + rearPax2Weight)} <span className="text-[9px] opacity-70">{unitLabel}</span></span>
                        <div className="flex justify-between mt-0.5 pt-0.5 border-t border-purple-200/50 dark:border-purple-700/50 gap-3">
                            <span className="text-[6px] text-purple-700 dark:text-purple-400">{t('diagram.p1')}: {formatWeight(rearPax1Weight)}</span>
                            <span className="text-[6px] text-purple-700 dark:text-purple-400">{t('diagram.p2')}: {formatWeight(rearPax2Weight)}</span>
                        </div>
                    </div>
                </div>

                {/* Baggage 1 */}
                <div className="absolute top-[65%] left-[50%] -translate-x-1/2">
                    <div className="bg-pink-100/40 dark:bg-pink-900/50 backdrop-blur-md border border-pink-500/50 rounded px-2.5 py-0.5 shadow-sm text-center min-w-[80px] transition-colors">
                        <span className="block text-[7px] text-pink-800 dark:text-pink-300 font-bold leading-none mb-0.5">{t('diagram.baggage1')}</span>
                        <span className="text-xs font-bold text-pink-950 dark:text-pink-100">{formatWeight(baggage1Weight)} <span className="text-[9px] opacity-70">{unitLabel}</span></span>
                    </div>
                </div>

                {/* Baggage 2 */}
                <div className="absolute top-[75%] left-[50%] -translate-x-1/2">
                    <div className="bg-yellow-100/40 dark:bg-yellow-900/50 backdrop-blur-md border border-yellow-500/50 rounded px-2.5 py-0.5 shadow-sm text-center min-w-[80px] transition-colors">
                        <span className="block text-[7px] text-yellow-800 dark:text-yellow-300 font-bold leading-none mb-0.5">{t('diagram.baggage2')}</span>
                        <span className="text-xs font-bold text-yellow-950 dark:text-yellow-100">{formatWeight(baggage2Weight)} <span className="text-[9px] opacity-70">{unitLabel}</span></span>
                    </div>
                </div>

                {/* BEW / Empty Weight */}
                <div className="absolute bottom-[4%] left-[50%] -translate-x-1/2">
                    <div className="bg-gray-100/30 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-400/50 rounded px-3 py-1 shadow-sm text-center min-w-[100px] transition-colors">
                        <span className="block text-[7px] text-gray-500 dark:text-gray-400 font-bold uppercase leading-none mb-0.5">{t('diagram.emptyWeight')}</span>
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">{formatWeight(emptyWeight)} <span className="text-[9px] opacity-70">{unitLabel}</span></span>
                    </div>
                </div>

            </div>
        </div>
    );
}
