import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    text: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function Tooltip({ text, children, className = '' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isVisible]);

    const toggleTooltip = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
    };

    return (
        <div
            className={`relative inline-block cursor-pointer ${className}`}
            ref={tooltipRef}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={toggleTooltip}
            onTouchEnd={() => {
                // Prevent ghost clicks on some devices
                // e.preventDefault(); 
            }}
        >
            {children}

            {/* Tooltip Content */}
            <div
                className={`
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 
                    bg-gray-900 text-white text-xs rounded-lg shadow-xl 
                    text-center font-normal normal-case tracking-normal 
                    whitespace-normal leading-relaxed z-[9999]
                    transition-all duration-200 ease-out origin-bottom
                    ${isVisible
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 translate-y-1 pointer-events-none'}
                `}
                role="tooltip"
                aria-hidden={!isVisible}
            >
                {text}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
            </div>
        </div>
    );
}
