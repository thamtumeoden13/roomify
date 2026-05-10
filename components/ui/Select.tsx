import React, {useState, useRef, useEffect, type ReactNode} from 'react';
import {Check, ChevronDown} from 'lucide-react';
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import {motion, AnimatePresence} from 'framer-motion';

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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">{label}</span>}
            <div className="relative">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-sm font-semibold transition-all hover:bg-white/60 dark:hover:bg-slate-800/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-between backdrop-blur-sm shadow-sm",
                        open && "bg-white/90 dark:bg-slate-800/90 border-indigo-500/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                    )}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {icon && (
                            <motion.div
                                key={value}
                                initial={{scale: 0.8, rotate: -10}}
                                animate={{scale: 1, rotate: 0}}
                                className="text-slate-500 dark:text-slate-400 shrink-0"
                            >
                                {icon}
                            </motion.div>
                        )}
                        <span className="truncate tracking-tight">{selectedOption?.name || 'Select...'}</span>
                    </div>
                    <ChevronDown
                        className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", open && "rotate-180")}/>
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{opacity: 0, y: position === 'top' ? 10 : -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: position === 'top' ? 10 : -10}}
                            transition={{duration: 0.15, ease: "easeOut"}}
                            className={cn(
                                "absolute left-0 w-full min-w-[180px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-2xl py-1 z-50 overflow-hidden",
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
                                        "flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
                                        value === option.id ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/20" : "text-slate-700 dark:text-slate-300"
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
