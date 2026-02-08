import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    ScatterController,
    CategoryScale,
    type TooltipItem
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { UnitSystem } from '../types';

ChartJS.register(
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    ScatterController,
    CategoryScale
);

interface CGChartProps {
    currentWeight: number;
    currentCG: number;
    isWithinLimits: boolean;
    landingWeight?: number;
    landingCG?: number;
    envelopePoints?: { x: number; y: number }[];
    unitPreference?: UnitSystem;
}

export default function CGChart({ currentWeight, currentCG, isWithinLimits, landingWeight, landingCG, envelopePoints, unitPreference = 'LBS' }: CGChartProps) {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const isDark = theme === 'dark';
    const isKg = unitPreference === 'KG';
    const weightFactor = isKg ? 1 / 2.20462 : 1;
    const isRtl = i18n.dir() === 'rtl';

    const data = useMemo(() => {
        const convertWeight = (lbs: number) => lbs * weightFactor;

        const points = envelopePoints || [
            { x: 35.0, y: 1500 },
            { x: 35.0, y: 1950 }, // Generic fallback
            { x: 40.0, y: 2400 },
            { x: 47.3, y: 2400 },
            { x: 47.3, y: 1500 },
            { x: 35.0, y: 1500 },
        ];

        // Ensure the loop is closed if the provided points don't close it
        const plotPoints = [...points];
        if (points.length > 0) {
            const first = points[0];
            const last = points[points.length - 1];
            if (first.x !== last.x || first.y !== last.y) {
                plotPoints.push(first);
            }
        }

        // Convert envelope points to current unit
        const convertedPoints = plotPoints.map(p => ({ x: p.x, y: convertWeight(p.y) }));

        return {
            datasets: [
                {
                    label: t('chart.normalEnvelope'),
                    data: convertedPoints,
                    borderColor: isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(54, 162, 235, 0.5)',
                    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(54, 162, 235, 0.1)',
                    showLine: true,
                    pointRadius: 0,
                    fill: true,
                    order: 2,
                },
                {
                    label: t('chart.currentFlight'),
                    data: [{ x: currentCG, y: convertWeight(currentWeight) }],
                    backgroundColor: isWithinLimits ? (isDark ? '#4ade80' : 'green') : (isDark ? '#f87171' : 'red'),
                    borderColor: isWithinLimits ? (isDark ? '#4ade80' : 'green') : (isDark ? '#f87171' : 'red'),
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    order: 1,
                },
                {
                    label: t('chart.landing'),
                    data: landingWeight && landingCG ? [{ x: landingCG, y: convertWeight(landingWeight) }] : [],
                    backgroundColor: isDark ? '#fb923c' : 'orange',
                    borderColor: isDark ? '#fb923c' : 'orange',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    order: 1,
                }
            ]
        };
    }, [currentWeight, currentCG, isWithinLimits, landingWeight, landingCG, isDark, envelopePoints, t, weightFactor]);

    const options = {
        maintainAspectRatio: true,
        scales: {
            x: {
                type: 'linear' as const,
                position: 'bottom' as const,
                title: {
                    display: true,
                    text: t('chart.xAxis'),
                    color: isDark ? '#9ca3af' : '#666'
                },
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    lineWidth: 0.25,
                },
                ticks: {
                    color: isDark ? '#9ca3af' : '#666',
                    stepSize: 1,
                },
                min: 30,
                max: 55,
            },
            y: {
                type: 'linear' as const,
                title: {
                    display: true,
                    text: `${t('chart.yAxis')} (${isKg ? 'KG' : 'Lbs'})`,
                    color: isDark ? '#9ca3af' : '#666'
                },
                ticks: {
                    color: isDark ? '#9ca3af' : '#666',
                    stepSize: isKg ? 25 : 50,
                },
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    lineWidth: 0.25,
                },
                // Adjust min/max for KG if needed, or leave dynamic. 
                // 1400 lbs ~ 635 kg, 2700 lbs ~ 1225 kg.
                min: isKg ? 600 : 1400,
                max: isKg ? 1250 : 2700,
            }
        },
        plugins: {
            legend: {
                rtl: isRtl,
                labels: {
                    color: isDark ? '#e5e7eb' : '#374151'
                }
            },
            tooltip: {
                backgroundColor: isDark ? '#1f2937' : '#fff',
                titleColor: isDark ? '#fff' : '#000',
                bodyColor: isDark ? '#e5e7eb' : '#374151',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
                callbacks: {
                    label: (ctx: TooltipItem<'scatter'>) => {
                        const x = ctx.parsed?.x || 0;
                        const y = ctx.parsed?.y || 0;
                        return `CG: ${x.toFixed(1)}, Wt: ${y.toFixed(0)} ${isKg ? 'kg' : 'lbs'}`;
                    }
                }
            }
        },
        responsive: true,
    };

    return (
        <div className="w-full aspect-video min-h-[300px] bg-white dark:bg-gray-800 p-2 rounded-lg relative transition-colors">
            <Scatter data={data} options={options} />
        </div>
    );
}
