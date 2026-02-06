import { useTheme } from '../App';
import aircraftTopView from '../resources/c172_topview.png';

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
}: StationDiagramProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="w-full relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-colors duration-300" style={{ aspectRatio: '4/3' }}>
            {/* Real Aircraft Image Background */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                    src={aircraftTopView}
                    alt="Cessna 172 Top View"
                    className={`w-full h-full object-contain transition-all duration-500 ${isDark ? 'opacity-40 brightness-75 invert' : 'opacity-80'}`}
                />
            </div>

            {/* Weight Boxes Overlay - Absolute Positioned */}
            <div className="absolute inset-0">

                {/* Fuel Left */}
                <div className="absolute top-[25%] left-[20%]">
                    <div className="bg-emerald-100/30 dark:bg-emerald-900/30 backdrop-blur-sm border border-emerald-600/50 dark:border-emerald-500/50 rounded px-1.5 py-0.5 shadow-sm text-center min-w-[50px] transition-colors">
                        <span className="block text-[7px] text-emerald-800 dark:text-emerald-300 font-bold leading-none mb-0.5">Fuel L</span>
                        <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-100">{fuelLeftWeight.toFixed(1)}</span>
                    </div>
                </div>

                {/* Total Fuel */}
                <div className="absolute top-[35%] left-[50%] -translate-x-1/2">
                    <div className="bg-blue-100/30 dark:bg-blue-900/40 backdrop-blur-sm border border-blue-600/50 dark:border-blue-500/50 rounded px-2 py-0.5 shadow-sm text-center min-w-[70px] transition-colors">
                        <span className="block text-[7px] text-blue-800 dark:text-blue-300 font-bold uppercase leading-none mb-0.5">Total Fuel</span>
                        <span className="text-xs font-black text-blue-950 dark:text-blue-100">{(fuelLeftWeight + fuelRightWeight).toFixed(1)}</span>
                    </div>
                </div>

                {/* Fuel Right */}
                <div className="absolute top-[25%] right-[20%]">
                    <div className="bg-emerald-100/30 dark:bg-emerald-900/30 backdrop-blur-sm border border-emerald-600/50 dark:border-emerald-500/50 rounded px-1.5 py-0.5 shadow-sm text-center min-w-[50px] transition-colors">
                        <span className="block text-[7px] text-emerald-800 dark:text-emerald-300 font-bold leading-none mb-0.5">Fuel R</span>
                        <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-100">{fuelRightWeight.toFixed(1)}</span>
                    </div>
                </div>

                {/* Front Passengers */}
                <div className="absolute top-[17%] left-[50%] -translate-x-1/2">
                    <div className="bg-sky-100/30 dark:bg-sky-900/40 backdrop-blur-sm border border-sky-600/50 dark:border-sky-500/50 rounded px-2 py-0.5 shadow-md text-center min-w-[85px] transition-colors">
                        <span className="block text-[7px] text-sky-800 dark:text-sky-300 font-bold uppercase leading-none mb-0.5">Front Seats</span>
                        <span className="text-xs font-black text-sky-950 dark:text-sky-100">{pilotWeight + frontPaxWeight}</span>
                        <div className="flex justify-between mt-0.5 pt-0.5 border-t border-sky-200/50 dark:border-sky-700/50">
                            <span className="text-[6px] text-sky-700 dark:text-sky-400">P: {pilotWeight}</span>
                            <span className="text-[6px] text-sky-700 dark:text-sky-400 ml-3">Ax: {frontPaxWeight}</span>
                        </div>
                    </div>
                </div>

                {/* Rear Passengers */}
                <div className="absolute top-[48%] left-[50%] -translate-x-1/2">
                    <div className="bg-purple-100/30 dark:bg-purple-900/40 backdrop-blur-sm border border-purple-600/50 dark:border-purple-500/50 rounded px-2 py-0.5 shadow-md text-center min-w-[85px] transform hover:scale-105 transition cursor-default">
                        <span className="block text-[7px] text-purple-800 dark:text-purple-300 font-bold uppercase leading-none mb-0.5">Rear Seats</span>
                        <span className="text-xs font-black text-purple-950 dark:text-purple-100">{rearPax1Weight + rearPax2Weight}</span>
                        <div className="flex justify-between mt-0.5 pt-0.5 border-t border-purple-200/50 dark:border-purple-700/50">
                            <span className="text-[6px] text-purple-700 dark:text-purple-400">P1: {rearPax1Weight}</span>
                            <span className="text-[6px] text-purple-700 dark:text-purple-400 ml-3">P2: {rearPax2Weight}</span>
                        </div>
                    </div>
                </div>

                {/* Baggage 1 */}
                <div className="absolute top-[62%] left-[50%] -translate-x-1/2">
                    <div className="bg-pink-100/30 dark:bg-pink-900/40 backdrop-blur-sm border border-pink-500/50 rounded px-2.5 py-0.5 shadow-sm text-center min-w-[80px] transition-colors">
                        <span className="block text-[7px] text-pink-800 dark:text-pink-300 font-bold leading-none mb-0.5">Baggage 1</span>
                        <span className="text-xs font-bold text-pink-950 dark:text-pink-100">{baggage1Weight}</span>
                    </div>
                </div>

                {/* Baggage 2 */}
                <div className="absolute top-[72%] left-[50%] -translate-x-1/2">
                    <div className="bg-yellow-100/30 dark:bg-yellow-900/40 backdrop-blur-sm border border-yellow-500/50 rounded px-2.5 py-0.5 shadow-sm text-center min-w-[80px] transition-colors">
                        <span className="block text-[7px] text-yellow-800 dark:text-yellow-300 font-bold leading-none mb-0.5">Baggage 2</span>
                        <span className="text-xs font-bold text-yellow-950 dark:text-yellow-100">{baggage2Weight}</span>
                    </div>
                </div>

                {/* BEW / Empty Weight */}
                <div className="absolute bottom-[4%] left-[50%] -translate-x-1/2">
                    <div className="bg-gray-100/30 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-400/50 rounded px-3 py-1 shadow-sm text-center min-w-[100px] transition-colors">
                        <span className="block text-[7px] text-gray-500 dark:text-gray-400 font-bold uppercase leading-none mb-0.5">Empty Weight (BEW)</span>
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">{emptyWeight} lbs</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
