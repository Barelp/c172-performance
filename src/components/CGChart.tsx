import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    ScatterController,
    CategoryScale
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { useMemo } from 'react';
import { useTheme } from '../App';

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
}

export default function CGChart({ currentWeight, currentCG, isWithinLimits, landingWeight, landingCG, envelopePoints }: CGChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const data = useMemo(() => {
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

        return {
            datasets: [
                {
                    label: 'Normal Category Envelope',
                    data: plotPoints,
                    borderColor: isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(54, 162, 235, 0.5)',
                    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(54, 162, 235, 0.1)',
                    showLine: true,
                    pointRadius: 0,
                    fill: true,
                    order: 2,
                },
                {
                    label: 'Current Flight',
                    data: [{ x: currentCG, y: currentWeight }],
                    backgroundColor: isWithinLimits ? (isDark ? '#4ade80' : 'green') : (isDark ? '#f87171' : 'red'),
                    borderColor: isWithinLimits ? (isDark ? '#4ade80' : 'green') : (isDark ? '#f87171' : 'red'),
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    order: 1,
                },
                {
                    label: 'Landing',
                    data: landingWeight && landingCG ? [{ x: landingCG, y: landingWeight }] : [],
                    backgroundColor: isDark ? '#fb923c' : 'orange',
                    borderColor: isDark ? '#fb923c' : 'orange',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    order: 1,
                }
            ]
        };
    }, [currentWeight, currentCG, isWithinLimits, landingWeight, landingCG, isDark, envelopePoints]);

    const options = {
        scales: {
            x: {
                type: 'linear' as const,
                position: 'bottom' as const,
                title: {
                    display: true,
                    text: 'Center of Gravity (Inches Aft of Datum)',
                    color: isDark ? '#9ca3af' : '#666'
                },
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    lineWidth: 0.5,
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
                    text: 'Aircraft Weight (Lbs)',
                    color: isDark ? '#9ca3af' : '#666'
                },
                ticks: {
                    color: isDark ? '#9ca3af' : '#666',
                    stepSize: 50,
                },
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    lineWidth: 0.5,
                },
                min: 1400,
                max: 2700,
            }
        },
        plugins: {
            legend: {
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
                    label: (ctx: any) => `CG: ${ctx.parsed.x.toFixed(1)}, Wt: ${ctx.parsed.y.toFixed(0)}`
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div className="h-[500px] w-full bg-white dark:bg-gray-800 p-2 rounded-lg relative transition-colors">
            <Scatter data={data} options={options} />
        </div>
    );
}
