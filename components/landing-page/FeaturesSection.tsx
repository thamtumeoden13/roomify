import React from 'react';
import {motion} from 'framer-motion';
import {ArrowRight, Zap, Maximize, Layers, ShieldCheck} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const FeaturesSection = () => {
    return (
        <section id="features" className="py-32 md:py-48 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"/>
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-6xl font-bold mb-8 tracking-tight">Powerful
                            Features</h2>
                        <p className="text-xl text-slate-400 leading-relaxed">Everything you need to create
                            professional-grade architectural visualizations.</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline"
                                className="border-white/20 text-white hover:bg-white/10 flex gap-2 items-center rounded-full px-8 py-6">
                            Explore All Features <ArrowRight className="w-4 h-4"/>
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
                    {/* Feature 1: AI Precision (Large) */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        className="md:col-span-8 relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-12 transition-all hover:border-primary/50"
                    >
                        <div
                            className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-64 h-64 text-primary"/>
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-end">
                            <div
                                className="p-4 w-fit rounded-2xl bg-primary/20 mb-8 border border-primary/30 text-primary">
                                <Zap className="w-8 h-8"/>
                            </div>
                            <h3 className="text-3xl font-bold mb-4">AI-Powered Precision</h3>
                            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                                Our advanced neural networks understand complex architectural spatial
                                relationships, ensuring every render respects your original dimensions.
                            </p>
                        </div>
                    </motion.div>

                    {/* Feature 2: 4K Upscaling (Tall) */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.1}}
                        className="md:col-span-4 relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-10 transition-all hover:border-blue-500/50"
                    >
                        <div
                            className="relative z-10 h-full flex flex-col items-center text-center justify-center">
                            <div
                                className="p-4 w-fit rounded-2xl bg-blue-500/20 mb-8 border border-blue-500/30 text-blue-400">
                                <Maximize className="w-8 h-8"/>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">4K Upscaling</h3>
                            <p className="text-slate-400 leading-relaxed mb-8">
                                Transform standard renders into crystal-clear 4K masterpieces ready for
                                high-end
                                presentations and print.
                            </p>
                            <div
                                className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-blue-500"/>
                                <span
                                    className="text-xs font-mono uppercase tracking-widest">Enhancing Details...</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 3: Multiple Variants (Small) */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.2}}
                        className="md:col-span-6 relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-10 transition-all hover:border-purple-500/50"
                    >
                        <div className="relative z-10 h-full flex flex-col">
                            <div
                                className="p-4 w-fit rounded-2xl bg-purple-500/20 mb-8 border border-purple-500/30 text-purple-400 group-hover:rotate-12 transition-transform">
                                <Layers className="w-8 h-8"/>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Multiple Variants</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Generate dozens of interior styles from a single plan to explore every
                                possibility in seconds.
                            </p>
                        </div>
                    </motion.div>

                    {/* Feature 4: Cloud Storage (Small) */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.3}}
                        className="md:col-span-6 relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-10 transition-all hover:border-green-500/50"
                    >
                        <div className="relative z-10 h-full flex flex-col">
                            <div
                                className="p-4 w-fit rounded-2xl bg-green-500/20 mb-8 border border-green-500/30 text-green-400 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-8 h-8"/>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Secure Cloud Storage</h3>
                            <p className="text-slate-400 leading-relaxed">
                                All your projects and renders are safely stored and accessible from any
                                device,
                                anywhere in the world.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
