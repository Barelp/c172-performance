import { useState } from 'react';
import buildInfo from '../build-info.json';

interface BuildVersionProps {
    className?: string;
}

export default function BuildVersion({ className = '' }: BuildVersionProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const version = '1.0.0';
    const displayVersion = `v${version}-${buildInfo.shortHash}`;

    return (
        <div
            className={`select-none z-40 ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="relative flex items-center">
                <span className="text-[10px] text-white/50 font-mono hover:text-white transition-colors cursor-default">
                    {displayVersion}
                </span>

                {showTooltip && (
                    <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap border border-gray-700">
                        <div className="space-y-1">
                            <div>
                                <span className="text-gray-400">Version:</span> <span className="font-semibold">{version}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Commit:</span> <span className="font-mono text-blue-300">{buildInfo.shortHash}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Branch:</span> <span className="font-mono">{buildInfo.branch}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Date:</span> <span className="font-mono text-xs">{new Date(buildInfo.commitDate).toLocaleString()}</span>
                            </div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-800"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
