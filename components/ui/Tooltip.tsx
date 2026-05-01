import React, {useState} from 'react';
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

export function Tooltip({content, children}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md whitespace-nowrap z-50 animate-in fade-in zoom-in duration-150 origin-bottom">
                    {content}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"/>
                </div>
            )}
        </div>
    );
}
