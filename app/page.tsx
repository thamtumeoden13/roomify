"use client";

import React, {useState, useEffect} from "react";
import {
    ArrowRight,
    Upload as UploadIcon,
    Layers,
    Zap,
    Maximize,
    ShieldCheck,
    LogIn,
    Menu,
    X,
    Box
} from "lucide-react";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {motion, AnimatePresence} from "framer-motion";
import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {supabase} from "@/lib/supabase";

export default function LandingPage() {
    const [user, setUser] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const fadeIn = {
        initial: {opacity: 0, y: 20},
        whileInView: {opacity: 1, y: 0},
        viewport: {once: true},
        transition: {duration: 0.6}
    };

    const showcaseImages = [
        {
            before: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop",
            after: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
        },
        {
            before: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2070&auto=format&fit=crop",
            after: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1974&auto=format&fit=crop",
        }
    ];

    const galleryItems = [
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2070&auto=format&fit=crop",
    ];

    const marqueeItems = [
        {
            label: "Industrial",
            image: "https://images.unsplash.com/photo-1515549832467-8783363e19b6?q=80&w=2000&auto=format&fit=crop",
        },
        {
            label: "Modern",
            image: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?q=80&w=2000&auto=format&fit=crop",
        },
        {
            label: "Minimalist",
            image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2000&auto=format&fit=crop",
        },
        {
            label: "Scandinavian",
            image: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?q=80&w=2000&auto=format&fit=crop",
        },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-slate-900 selection:bg-primary/30">
            {/* Sticky Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
                    isScrolled
                        ? "bg-white/80 backdrop-blur-md border-slate-200 py-3"
                        : "bg-transparent border-transparent py-5"
                }`}
            >
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Box className="w-6 h-6 text-primary"/>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Roomify</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#how-it-works"
                              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How
                            It
                            Works</Link>
                        <Link href="#features"
                              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
                        <Link href="#showcase"
                              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Showcase</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button variant="primary" size="sm" className="hidden md:flex">Dashboard</Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline" size="sm"
                                        className="hidden md:flex gap-2 border-slate-200 text-slate-900 hover:bg-slate-50">
                                    <LogIn className="w-4 h-4"/> Login
                                </Button>
                            </Link>
                        )}
                        <button
                            className="md:hidden text-slate-900"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X/> : <Menu/>}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: "auto"}}
                            exit={{opacity: 0, height: 0}}
                            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
                        >
                            <div className="flex flex-col gap-4 p-6">
                                <Link href="#how-it-works" className="text-slate-600"
                                      onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                                <Link href="#features" className="text-slate-600"
                                      onClick={() => setMobileMenuOpen(false)}>Features</Link>
                                <Link href="#showcase" className="text-slate-600"
                                      onClick={() => setMobileMenuOpen(false)}>Showcase</Link>
                                <hr className="border-slate-100"/>
                                {user ? (
                                    <Link href="/dashboard" className="text-slate-900 font-semibold"
                                          onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                                ) : (
                                    <Link href="/login" className="text-slate-900 font-semibold"
                                          onClick={() => setMobileMenuOpen(false)}>Login</Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
                            backgroundSize: '60px 60px'
                        }}/>
                        <div
                            className="absolute inset-0 bg-gradient-to-b from-[#F9FAFB]/0 via-[#F9FAFB]/50 to-[#F9FAFB]"/>
                    </div>

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
                        <div
                            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"/>
                        <div
                            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"/>
                    </div>

                    <div className="container mx-auto px-6 text-center relative z-10">
                        <motion.div
                            initial={{opacity: 0, y: 30}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.8}}
                        >
              <span
                  className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 rounded-full">
                The Future of Visualization
              </span>
                            <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-6 text-slate-900">
                                Transform 2D Floor Plans into <br className="hidden md:block"/> Stunning 3D Renders in
                                Seconds
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                                Empowering architects, real estate agents, and homeowners with AI-driven architectural
                                visualization.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                                <Link href="/dashboard">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.05, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <Button variant="primary" size="lg"
                                                className="w-full sm:w-auto h-14 px-8 text-base bg-orange-600 hover:bg-orange-700">
                                            Get Started <ArrowRight className="ml-2 w-5 h-5"/>
                                        </Button>
                                    </motion.div>
                                </Link>
                                <Button variant="outline" size="lg"
                                        className="w-full sm:w-auto h-14 px-8 text-base border-slate-200 text-slate-900 hover:bg-slate-50">
                                    Watch Demo
                                </Button>
                            </div>
                        </motion.div>

                        {/* Visual Slider with Light Glassmorphism */}
                        {mounted && (
                            <motion.div
                                initial={{opacity: 0, scale: 0.95}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{duration: 1, delay: 0.2}}
                                className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white/40 backdrop-blur-md p-1"
                            >
                                <ReactCompareSlider
                                    itemOne={<ReactCompareSliderImage src={showcaseImages[0].before}
                                                                      alt="2D Floor Plan"/>}
                                    itemTwo={<ReactCompareSliderImage src={showcaseImages[0].after} alt="3D Render"/>}
                                    className="aspect-video"
                                />
                                <div
                                    className="absolute z-10 bottom-6 left-6 right-6 flex justify-between pointer-events-none">
                                <span
                                    className="px-3 py-1 rounded bg-white/70 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest border border-slate-200 text-slate-900">Before</span>
                                    <span
                                        className="px-3 py-1 rounded bg-white/70 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest border border-slate-200 text-slate-900">After</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* Infinite Marquee Section */}
                <section className="py-20 bg-white border-y border-slate-200 overflow-hidden">
                    <div className="container mx-auto px-6 mb-12 text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Versatile Styles for Every Project</h2>
                        <p className="text-slate-600 mt-2">Explore our range of architectural aesthetics</p>
                    </div>

                    <div className="flex overflow-hidden">
                        {mounted && (
                            <motion.div
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
                                        className="relative flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden group border border-slate-200 shadow-md"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.label}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div
                                            className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
                                        <span
                                            className="text-sm font-semibold tracking-wide uppercase text-white">{item.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="py-24 md:py-40 bg-white border-b border-slate-100">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-20 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">How It Works</h2>
                            <p className="text-lg text-slate-600">Professional architectural rendering made simple.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                            {[
                                {
                                    step: "01",
                                    title: "Upload",
                                    desc: "Upload your 2D floor plan or room photo. Supports JPG and PNG.",
                                    icon: <UploadIcon className="w-8 h-8"/>
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
                                <motion.div
                                    key={i}
                                    {...fadeIn}
                                    transition={{delay: i * 0.2}}
                                    className="relative p-10 rounded-3xl bg-slate-50 border border-slate-200 hover:border-primary/30 transition-all group"
                                >
                                    <div
                                        className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <span
                                        className="absolute top-8 right-10 text-6xl font-black text-slate-200/50 group-hover:text-primary/5 transition-colors pointer-events-none">{item.step}</span>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-900">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 md:py-40 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Powerful
                                    Features</h2>
                                <p className="text-lg text-slate-600">Everything you need to create professional-grade
                                    architectural visualizations.</p>
                            </div>
                            <Link href="/dashboard">
                                <Button variant="outline"
                                        className="border-slate-300 text-slate-900 hover:bg-white flex gap-2 items-center">Explore
                                    All Features <ArrowRight
                                        className="w-4 h-4"/></Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: "AI-Powered Precision",
                                    desc: "Our advanced neural networks understand architectural spatial relationships.",
                                    icon: <Zap className="w-6 h-6 text-orange-500"/>
                                },
                                {
                                    title: "4K Upscaling",
                                    desc: "Transform standard renders into crystal-clear 4K masterpieces ready for presentations.",
                                    icon: <Maximize className="w-6 h-6 text-blue-500"/>
                                },
                                {
                                    title: "Multiple Variants",
                                    desc: "Generate dozens of interior styles from a single plan to explore every possibility.",
                                    icon: <Layers className="w-6 h-6 text-purple-500"/>
                                },
                                {
                                    title: "Secure Cloud Storage",
                                    desc: "All your projects and renders are safely stored and accessible from any device.",
                                    icon: <ShieldCheck className="w-6 h-6 text-green-500"/>
                                }
                            ].map((feature, i) => (
                                <motion.div key={i} {...fadeIn} transition={{delay: i * 0.1}}>
                                    <Card
                                        className="h-full bg-white hover:shadow-xl transition-shadow duration-300 border-slate-200">
                                        <CardHeader>
                                            <div
                                                className="p-3 w-fit rounded-xl bg-slate-50 mb-6 border border-slate-100">{feature.icon}</div>
                                            <CardTitle className="text-xl text-slate-900">{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Showcase Gallery */}
                <section id="showcase" className="py-24 md:py-40 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-20 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Gallery</h2>
                            <p className="text-lg text-slate-600">See what our community has been creating.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {galleryItems.map((img, i) => (
                                <motion.div
                                    key={i}
                                    {...fadeIn}
                                    transition={{delay: i * 0.05}}
                                    className="rounded-3xl overflow-hidden border border-slate-200 group relative shadow-md aspect-[4/3]"
                                >
                                    <img
                                        src={img}
                                        alt={`Render ${i}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div
                                        className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                                        <span
                                            className="text-sm font-bold tracking-widest uppercase text-white">Project {i + 1}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 md:py-40 relative overflow-hidden bg-slate-900 text-white">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                            backgroundSize: '80px 80px'
                        }}/>
                    </div>

                    <div className="container mx-auto px-6 relative z-10 text-center">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to transform your vision?</h2>
                        <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
                            Join thousands of architects and designers who are already using Roomify to speed up
                            their workflow.
                        </p>
                        <Link href="/dashboard">
                            <Button variant="primary" size="lg"
                                    className="h-16 px-12 text-lg bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20">
                                Start Your First Project Now <ArrowRight className="ml-2 w-6 h-6"/>
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="py-16 bg-white border-t border-slate-200">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-2">
                            <Box className="w-8 h-8 text-primary"/>
                            <span className="text-2xl font-bold tracking-tight text-slate-900 font-serif">Roomify</span>
                        </div>
                        <div className="flex gap-10">
                            <Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors">Privacy
                                Policy</Link>
                            <Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors">Terms of
                                Service</Link>
                            <Link href="#"
                                  className="text-slate-500 hover:text-slate-900 transition-colors">Twitter</Link>
                        </div>
                    </div>
                    <p className="text-center text-slate-400 text-sm">© {new Date().getFullYear()} Roomify AI. All
                        rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
