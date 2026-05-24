import React, {useState, useRef, useEffect, type ReactNode} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {twMerge} from 'tailwind-merge';
import {clsx, type ClassValue} from 'clsx';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PopoverProps {
    trigger: ReactNode;
    children: ReactNode;
    position?: 'top' | 'bottom';
}

export function Popover({
                            trigger,
                            children,
                            position = 'bottom'
                        }: PopoverProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div className="relative" ref={containerRef}>
            <div onClick={() => setOpen(!open)}>
                {trigger}
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10}}
                        transition={{duration: 0.15, ease: "easeOut"}}
                        className={cn(
                            "absolute z-50 min-w-[300px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 overflow-hidden",
                            position === 'top' ? "bottom-full mb-2 right-0 origin-bottom-right" : "top-full mt-2 right-0 origin-top-right"
                        )}>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
