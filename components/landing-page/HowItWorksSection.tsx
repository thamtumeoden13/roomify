import React from 'react';
import {m} from 'framer-motion';
import {Upload, Layers, Zap} from 'lucide-react';

const HowItWorksSection = () => {
    return (
        <section id="how-it-works"
                 className="py-32 md:py-48 bg-white border-b border-slate-100 overflow-hidden">
            <div className="container mx-auto px-6 relative">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">How It Works</h2>
                    <p className="text-lg text-slate-600">Professional architectural rendering made simple.</p>
                </div>

                {/* Connection Line */}
                <div className="absolute top-[60%] left-[10%] right-[10%] h-0.5 hidden md:block z-0">
                    <svg className="w-full h-24 overflow-visible">
                        <m.path
                            d="M 0 50 Q 250 -50 500 50 T 1000 50"
                            fill="transparent"
                            stroke="url(#gradient-line)"
                            strokeWidth="2"
                            strokeDasharray="8 8"
                            initial={{pathLength: 0}}
                            whileInView={{pathLength: 1}}
                            viewport={{once: true}}
                            transition={{duration: 2, ease: "easeInOut"}}
                        />
                        <defs>
                            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1"/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 max-w-7xl mx-auto relative z-10">
                    {[
                        {
                            step: "01",
                            title: "Upload",
                            desc: "Upload your 2D floor plan or room photo. Supports JPG and PNG.",
                            icon: <Upload className="w-8 h-8"/>
                        },
                        {
                            step: "02",
                            title: "Customize",
                            desc: "Choose your architectural style, materials, and lighting context.",
                            icon: <Layers className="w-8 h-8"/>
                        },
                        {
                            step: "03",
                            title: "Visualize",
                            desc: "Get a photorealistic 3D render in seconds and upscale to 4K.",
                            icon: <Zap className="w-8 h-8"/>
                        }
                    ].map((item, i) => (
                        <m.div
                            key={i}
                            initial={{opacity: 0, y: 30}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true}}
                            transition={{delay: i * 0.3, duration: 0.6}}
                            className="relative p-10 rounded-[2.5rem] bg-slate-50 border border-slate-200 hover:border-primary/50 transition-all group overflow-hidden"
                        >
                            <div
                                className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>

                            <div className="relative z-10">
                                <div
                                    className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary mb-8 shadow-sm group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-slate-900">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>

                            <span
                                className="absolute -bottom-4 -right-2 text-[10rem] font-black text-slate-200/20 leading-none select-none transition-colors group-hover:text-primary/10"
                                style={{fontFamily: 'serif'}}
                            >
                            {item.step}
                        </span>
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
