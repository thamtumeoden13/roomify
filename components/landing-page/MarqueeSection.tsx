import React from 'react';
import {m} from 'framer-motion';
import NextImage from 'next/image';

interface MarqueeItem {
    label: string;
    image: string;
}

interface MarqueeSectionProps {
    marqueeItems: MarqueeItem[];
}

const MarqueeSection = ({marqueeItems}: MarqueeSectionProps) => {
    return (
        <section className="py-20 bg-white border-y border-slate-200 overflow-hidden">
            <div className="container mx-auto px-6 mb-12 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Versatile Styles for Every Project</h2>
                <p className="text-slate-600 mt-2">Explore our range of architectural aesthetics</p>
            </div>

            <div className="flex overflow-hidden">
                <m.div
                    animate={{
                        x: [0, -1035],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 30,
                            ease: "linear",
                        },
                    }}
                    className="flex gap-6 whitespace-nowrap py-4"
                >
                    {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                        <div
                            key={idx}
                            className="relative shrink-0 w-80 h-48 rounded-xl overflow-hidden group border border-slate-200 shadow-md"
                        >
                            <NextImage
                                src={item.image}
                                alt={item.label}
                                fill
                                sizes="320px"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div
                                className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
                                <span
                                    className="text-sm font-semibold tracking-wide uppercase text-white">{item.label}</span>
                            </div>
                        </div>
                    ))}
                </m.div>
            </div>
        </section>
    );
};

export default MarqueeSection;
