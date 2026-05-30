"use client";

import React, {useState, useEffect} from 'react';
import {ChevronUp} from 'lucide-react';
import {cn} from '@/lib/utils';

export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-28 md:bottom-6 right-6 z-[100] p-3 rounded-full bg-white shadow-2xl border border-slate-100 transition-all duration-300 hover:scale-110 active:scale-95 group",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
            )}
            title="Scroll to Top"
        >
            <ChevronUp
                className="w-6 h-6 text-slate-600 group-hover:text-primary transition-colors"
                strokeWidth={2.5}
            />
        </button>
    );
};
