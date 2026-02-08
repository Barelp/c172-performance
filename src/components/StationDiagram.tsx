import { useTheme } from '../context/ThemeContext';
import aircraftTopView from '../resources/c172_topview.png';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../hooks/useMediaQuery';

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

const WeightBox = ({
    x,
    y,
    width,
    height,
    label,
    weight,
    subtext,
    unitLabel,
    colorClass,
    darkColorClass,
    borderColorClass,
    darkBorderColorClass,
    className = ""
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    weight: string;
    subtext?: string | string[];
    unitLabel: string;
    colorClass: string; // e.g. "fill-sky-100"
    darkColorClass: string;
    borderColorClass: string;
    darkBorderColorClass: string;
    className?: string;
}) => {
    return (
        <g
            transform={`translate(${x - width / 2}, ${y})`}
            className={className}
        >
            <rect
                width={width}
                height={height}
                rx="4"
                className={`${colorClass} ${darkColorClass} ${borderColorClass} ${darkBorderColorClass} stroke-1 opacity-90`}
            />
            <text
                x={width / 2}
                y={12}
                textAnchor="middle"
                className="font-bold uppercase fill-slate-700 dark:fill-slate-300"
                style={{ fontSize: '10px' }}
            >
                {label}
            </text>
            <text
                x={width / 2}
                y={24}
                textAnchor="middle"
                className="font-black fill-slate-900 dark:fill-slate-100"
                style={{ fontSize: '12px' }}
            >
                {weight} <tspan fontSize="9" opacity="0.7">{unitLabel}</tspan>
            </text>
            {subtext && (
                <g transform="translate(0, 30)">
                    <line x1="10" y1="0" x2={width - 10} y2="0" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="0.5" />
                    {Array.isArray(subtext) ? (
                        <text x={width / 2} y={10} textAnchor="middle" className="fill-slate-600 dark:fill-slate-400" style={{ fontSize: '8px' }}>
                            {subtext.length === 2 && (
                                <>
                                    <tspan x={width * 0.25} textAnchor="middle">{subtext[0]}</tspan>
                                    <tspan x={width * 0.75} textAnchor="middle">{subtext[1]}</tspan>
                                </>
                            )}
                        </text>
                    ) : (
                        <text x={width / 2} y={10} textAnchor="middle" className="fill-slate-600 dark:fill-slate-400" style={{ fontSize: '8px' }}>
                            {subtext}
                        </text>
                    )}
                </g>
            )}
        </g>
    );
};

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

    // Check for mobile screen - Tailwind 'md' is 768px, safer for large phones
    const isMobile = useMediaQuery('(max-width: 768px)');

    const formatWeight = (lbs: number) => {
        return (lbs * weightFactor).toFixed(1);
    };

    // Dimensions
    const vbWidth = 400;
    // Taller for mobile to allow vertical spreading without overlap
    const vbHeight = isMobile ? 900 : 600;
    const centerX = vbWidth / 2;

    // Y-Coordinate Logic:
    // If mobile, we spread things out significantly using the 900px height.
    // If desktop, we use the compact 600px layout.

    // Helper to switch coordinates
    const getPos = (mobileY: number, desktopY: number) => isMobile ? mobileY : desktopY;

    return (
        <div className="w-full relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-colors duration-300">
            <svg
                viewBox={`0 0 ${vbWidth} ${vbHeight}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Background Image 
                    - Mobile: 'contain' to preserve aspect ratio (no distortion). 
                      It will center itself in the 900px height (leaving ~150px gap top and bottom).
                    - Desktop: 'contain' fits perfectly in 600px.
                */}
                <image
                    href={aircraftTopView}
                    x="0"
                    y="0"
                    width={vbWidth}
                    height={vbHeight}
                    className={`transition-all duration-500 ${isDark ? 'opacity-40 brightness-75 invert' : 'opacity-80'}`}
                    preserveAspectRatio="xMidYMid contain"
                />

                {/* Fuel Left: 
                   Mobile: Move up to slightly above wing area to clear space ? 
                   Actually, fuels are on wings. Let's keep them roughly relative but ensure they don't hit Front Seats.
                   Mobile Y: 220 (Top area)
                   Desktop Y: 28% of 600 = 168
                */}
                <WeightBox
                    x={vbWidth * 0.18}
                    y={getPos(220, vbHeight * 0.28)}
                    width={60}
                    height={30}
                    label={t('diagram.fuelL')}
                    weight={formatWeight(fuelLeftWeight)}
                    unitLabel={unitLabel}
                    colorClass="fill-emerald-100"
                    darkColorClass="dark:fill-emerald-900"
                    borderColorClass="stroke-emerald-600"
                    darkBorderColorClass="dark:stroke-emerald-500"
                />

                {/* Fuel Right */}
                <WeightBox
                    x={vbWidth * 0.82}
                    y={getPos(220, vbHeight * 0.28)}
                    width={60}
                    height={30}
                    label={t('diagram.fuelR')}
                    weight={formatWeight(fuelRightWeight)}
                    unitLabel={unitLabel}
                    colorClass="fill-emerald-100"
                    darkColorClass="dark:fill-emerald-900"
                    borderColorClass="stroke-emerald-600"
                    darkBorderColorClass="dark:stroke-emerald-500"
                />

                {/* Total Fuel: HIDDEN on Mobile as requested */}
                {!isMobile && (
                    <WeightBox
                        x={centerX}
                        y={vbHeight * 0.40}
                        width={80}
                        height={30}
                        label={t('diagram.totalFuel')}
                        weight={formatWeight(fuelLeftWeight + fuelRightWeight)}
                        unitLabel={unitLabel}
                        colorClass="fill-blue-100"
                        darkColorClass="dark:fill-blue-900"
                        borderColorClass="stroke-blue-600"
                        darkBorderColorClass="dark:stroke-blue-500"
                    />
                )}

                {/* Front Passengers: 
                    Mobile: Move UP towards prop/nose to clear wing/fuel area.
                    Mobile Y: 100
                    Desktop Y: 15% of 600 = 90
                 */}
                <WeightBox
                    x={centerX}
                    y={getPos(80, vbHeight * 0.15)}
                    width={100}
                    height={45}
                    label={t('diagram.frontSeats')}
                    weight={formatWeight(pilotWeight + frontPaxWeight)}
                    subtext={[
                        `${t('diagram.pilot')}: ${formatWeight(pilotWeight)}`,
                        `${t('diagram.pax')}: ${formatWeight(frontPaxWeight)}`
                    ]}
                    unitLabel={unitLabel}
                    colorClass="fill-sky-100"
                    darkColorClass="dark:fill-sky-900"
                    borderColorClass="stroke-sky-600"
                    darkBorderColorClass="dark:stroke-sky-500"
                />

                {/* Rear Passengers: 
                    Mobile: Move DOWN.
                    Mobile Y: 50% of 900 = 450 (Middle).
                    Desktop Y: 52% of 600 = 312
                */}
                <WeightBox
                    x={centerX}
                    y={getPos(480, vbHeight * 0.52)}
                    width={100}
                    height={45}
                    label={t('diagram.rearSeats')}
                    weight={formatWeight(rearPax1Weight + rearPax2Weight)}
                    subtext={[
                        `${t('diagram.p1')}: ${formatWeight(rearPax1Weight)}`,
                        `${t('diagram.p2')}: ${formatWeight(rearPax2Weight)}`
                    ]}
                    unitLabel={unitLabel}
                    colorClass="fill-purple-100"
                    darkColorClass="dark:fill-purple-900"
                    borderColorClass="stroke-purple-600"
                    darkBorderColorClass="dark:stroke-purple-500"
                />

                {/* Baggage 1: 
                    Mobile: 600
                    Desktop: 65% of 600 = 390
                 */}
                <WeightBox
                    x={centerX}
                    y={getPos(600, vbHeight * 0.65)}
                    width={90}
                    height={30}
                    label={t('diagram.baggage1')}
                    weight={formatWeight(baggage1Weight)}
                    unitLabel={unitLabel}
                    colorClass="fill-pink-100"
                    darkColorClass="dark:fill-pink-900"
                    borderColorClass="stroke-pink-500"
                    darkBorderColorClass="dark:stroke-pink-500"
                />

                {/* Baggage 2: 
                    Mobile: 700
                    Desktop: 75% of 600 = 450
                */}
                <WeightBox
                    x={centerX}
                    y={getPos(700, vbHeight * 0.75)}
                    width={90}
                    height={30}
                    label={t('diagram.baggage2')}
                    weight={formatWeight(baggage2Weight)}
                    unitLabel={unitLabel}
                    colorClass="fill-yellow-100"
                    darkColorClass="dark:fill-yellow-900"
                    borderColorClass="stroke-yellow-500"
                    darkBorderColorClass="dark:stroke-yellow-500"
                />

                {/* BEW: 
                    Mobile: 820 (Near bottom)
                    Desktop: 90% of 600 = 540
                */}
                <WeightBox
                    x={centerX}
                    y={getPos(820, vbHeight * 0.90)}
                    width={120}
                    height={30}
                    label={t('diagram.emptyWeight')}
                    weight={formatWeight(emptyWeight)}
                    unitLabel={unitLabel}
                    colorClass="fill-gray-100"
                    darkColorClass="dark:fill-gray-900"
                    borderColorClass="stroke-gray-400"
                    darkBorderColorClass="dark:stroke-gray-400"
                />

            </svg>
        </div>
    );
}
