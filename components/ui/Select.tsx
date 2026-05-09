import React, {useState, useRef, useEffect, type ReactNode} from 'react';
import {Check, ChevronDown} from 'lucide-react';
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

import {Tooltip} from '@/components/ui/Tooltip';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: { id: string; name: string; icon?: ReactNode; tooltip?: string }[];
    label?: string;
    icon?: ReactNode;
    disabled?: boolean;
    position?: 'top' | 'bottom';
}

export function Select({value, onValueChange, options, label, icon, disabled, position = 'bottom'}: SelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((opt) => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5" ref={containerRef}>
            {label &&
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider ml-1">{label}</span>}
            <div className="relative">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-slate-200 text-sm font-medium transition-all hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-between",
                        open && "border-indigo-500/50 ring-2 ring-indigo-500/10"
                    )}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
                        <span className="truncate">{selectedOption?.name || 'Select...'}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")}/>
                </button>

                {open && (
                    <div
                        className={cn(
                            "absolute left-0 w-full min-w-[180px] bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in duration-200",
                            position === 'top' ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
                        )}>
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onValueChange(option.id);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors hover:bg-slate-50",
                                    value === option.id ? "text-indigo-600 font-semibold bg-indigo-50/50" : "text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {option.tooltip ? (
                                        <Tooltip content={option.tooltip}>
                                            <div className="flex items-center gap-2">
                                                {option.icon}
                                                {option.name}
                                            </div>
                                        </Tooltip>
                                    ) : (
                                        <>
                                            {option.icon}
                                            {option.name}
                                        </>
                                    )}
                                </div>
                                {value === option.id && <Check className="w-4 h-4"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
