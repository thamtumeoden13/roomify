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
    Printer,
    LayoutDashboard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {motion, AnimatePresence} from "framer-motion";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Footer from "@/components/Footer";
import {supabase} from "@/lib/supabase";
import {Heart, Eye, Sparkles, User} from "lucide-react";

const ZaloIcon = ({className}: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2C6.477 2 2 6.03 2 11c0 1.956.702 3.75 1.887 5.207L2.4 20.6a.5.5 0 0 0 .72.54l4.242-2.121c1.43.642 3.018.981 4.638.981 5.523 0 10-4.03 10-9s-4.477-9-10-9zm5.334 12.333c-.225.334-.847.457-1.18.233-.334-.224-.457-.846-.233-1.18.224-.334.846-.457 1.18-.233.333.224.456.846.233 1.18zm-2.667-1.333c-.224.333-.846.456-1.18.233-.333-.225-.456-.847-.233-1.18.224-.334.846-.457 1.18-.234.333.225.456.847.233 1.181zm-2.667-1.333c-.224.333-.846.457-1.18.233-.333-.224-.456-.846-.233-1.18.224-.334.846-.457 1.18-.233.333.224.456.846.233 1.18z"/>
    </svg>
);

export default function LandingPage() {
    const [user, setUser] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [trendingItems, setTrendingItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);

    useEffect(() => {
        setMounted(true);

        const checkAdmin = async (userId: string) => {
            const {data} = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            setIsAdminUser(data?.role === 'admin');
        };

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                checkAdmin(currentUser.id);
            } else {
                setIsAdminUser(false);
            }
        });

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        const fetchShowcase = async () => {
            setIsLoading(true);
            try {
                const {data, error} = await supabase
                    .from("showcase")
                    .select("*, render:renders(*)")
                    .order("is_admin_approved", {ascending: false})
                    .order("trending_score", {ascending: false})
                    .limit(12);

                if (data) {
                    setTrendingItems(data);
                }
            } catch (error) {
                console.error("Error fetching showcase:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchShowcase();

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

    const showcaseImages = trendingItems.length > 0 ? trendingItems.map(item => ({
        before: item.render?.source_image_url,
        after: item.render?.rendered_image_url,
    })) : [
        {
            before: "https://klyvifpieepniicfusan.supabase.co/storage/v1/object/public/roomify-assets/inputs/p26t4n95h.webp",
            after: "https://klyvifpieepniicfusan.supabase.co/storage/v1/object/public/roomify-assets/outputs/3ad99xpxx1rmw0cxwf3awxj8j8.png",
        }
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
            <Navbar/>
            {/* Slide Down Animation for Page Load */}
            <motion.div
                initial={{y: -100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.8, ease: "easeOut"}}
                className="fixed inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent z-[60]"
            />
            <main>
                {/* Hero Section */}
                <section
                    className="relative min-h-[90vh] flex items-center pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
                    {/* Subtle Grid Pattern - Infinite Scroll */}
                    <motion.div
                        className="absolute inset-0 z-0 pointer-events-none opacity-40"
                        style={{
                            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                        }}
                        animate={{
                            backgroundPositionY: [0, 60],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-b from-[#F9FAFB]/0 via-[#F9FAFB]/50 to-[#F9FAFB]"/>
                    </motion.div>

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
                                                className="w-full sm:w-auto h-14 px-8 text-base bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 transition-all duration-300">
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
                            <div className="relative mt-20">
                                {/* Glowing Aura */}
                                <div
                                    className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/20 to-orange-500/20 blur-[100px] rounded-full scale-110"/>

                                <motion.div
                                    style={{
                                        y: typeof window !== 'undefined' ? (window.scrollY * 0.1) : 0
                                    }}
                                    initial={{opacity: 0, scale: 0.95}}
                                    whileInView={{opacity: 1, scale: 1}}
                                    viewport={{once: true}}
                                    transition={{duration: 1}}
                                    className="relative max-w-7xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-white/5 backdrop-blur-sm"
                                >
                                    <ReactCompareSlider
                                        itemOne={<ReactCompareSliderImage src={showcaseImages[0].before}
                                                                          alt="2D Floor Plan" loading="eager"/>}
                                        itemTwo={<ReactCompareSliderImage src={showcaseImages[0].after} alt="3D Render"
                                                                          loading="eager"/>}
                                        className="aspect-video"
                                    />
                                    <div
                                        className="absolute z-10 bottom-8 left-8 right-8 flex justify-between pointer-events-none">
                                    <span
                                        className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest border border-white/20 text-white">Original Plan</span>
                                        <span
                                            className="px-4 py-2 rounded-full bg-primary/20 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest border border-primary/20 text-white">AI Vision</span>
                                    </div>
                                </motion.div>
                            </div>
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
                                            className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
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
                <section id="how-it-works"
                         className="py-32 md:py-48 bg-white border-b border-slate-100 overflow-hidden">
                    <div className="container mx-auto px-6 relative">
                        <div className="text-center mb-24 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">How It Works</h2>
                            <p className="text-lg text-slate-600">Professional architectural rendering made simple.</p>
                        </div>

                        {/* Connection Line */}
                        <div className="absolute top-[60%] left-[10%] right-[10%] h-[2px] hidden md:block z-0">
                            <svg className="w-full h-24 overflow-visible">
                                <motion.path
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
                                    initial={{opacity: 0, y: 30}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{delay: i * 0.3, duration: 0.6}}
                                    className="relative p-10 rounded-[2.5rem] bg-slate-50 border border-slate-200 hover:border-primary/50 transition-all group overflow-hidden"
                                >
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>

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
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
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
                                        Transform standard renders into crystal-clear 4K masterpieces ready for high-end
                                        presentations and print.
                                    </p>
                                    <div
                                        className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"/>
                                        <span className="text-xs font-mono uppercase tracking-widest">Enhancing Details...</span>
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
                                        All your projects and renders are safely stored and accessible from any device,
                                        anywhere in the world.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Showcase Gallery */}
                <section id="showcase" className="py-32 md:py-48 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">Community
                                    Showcase</h2>
                                <p className="text-lg text-slate-600">Discover the most inspiring AI transformations
                                    from our creators.</p>
                            </div>
                            <Link href="/gallery">
                                <Button variant="outline" className="rounded-full px-8">View Full Gallery</Button>
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="aspect-[4/5] rounded-3xl bg-slate-100 animate-pulse"/>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {trendingItems.map((item, i) => {
                                    const render = item.render;
                                    const imageUrl = render.upscaled_image_url || render.rendered_image_url;
                                    const isTrending = item.view_count > 50 || item.vote_count > 10;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            {...fadeIn}
                                            transition={{delay: i * 0.05}}
                                            className="h-full group/item relative"
                                        >
                                            {isAdminUser && (
                                                <div
                                                    className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-white/90 backdrop-blur-md border-slate-200 text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex items-center justify-center rounded-full"
                                                        onClick={async (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (confirm('Unapprove this item?')) {
                                                                const res = await fetch('/api/admin/approve', {
                                                                    method: 'POST',
                                                                    headers: {'Content-Type': 'application/json'},
                                                                    body: JSON.stringify({
                                                                        showcaseId: item.id,
                                                                        action: 'unapprove'
                                                                    }),
                                                                });
                                                                if (res.ok) {
                                                                    // Update the list or re-fetch
                                                                    setTrendingItems(prev => prev.map(ti => ti.id === item.id ? {
                                                                        ...ti,
                                                                        is_admin_approved: false
                                                                    } : ti));
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <X className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            )}
                                            <Link href={`/share/${item.id}`} className="block h-full group">
                                                <div
                                                    className="relative h-full flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                                                    {/* Image Container with Hover Effect */}
                                                    <div className="relative aspect-[4/3] overflow-hidden">
                                                        <img
                                                            src={imageUrl}
                                                            alt={render.project_name || "AI Render"}
                                                            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-0 transition-opacity duration-500"
                                                            loading={i < 4 ? "eager" : "lazy"}
                                                        />
                                                        <img
                                                            src={render.source_image_url}
                                                            alt="Original"
                                                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                            loading={i < 4 ? "eager" : "lazy"}
                                                        />

                                                        {/* Badges */}
                                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                            {item.is_admin_approved && (
                                                                <span
                                                                    className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                                    <Sparkles className="w-3 h-3"/> Staff Pick
                                                                </span>
                                                            )}
                                                            {isTrending && (
                                                                <span
                                                                    className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                                    🔥 Trending
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div
                                                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-white/20 capitalize">
                                                            {render.style_id || "Japandi"}
                                                        </div>
                                                    </div>

                                                    {/* Card Footer */}
                                                    <div
                                                        className="p-5 border-t border-slate-50 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                                <User className="w-4 h-4 text-slate-400"/>
                                                            </div>
                                                            <span
                                                                className="text-sm font-bold text-slate-700">User_{item.user_id.substring(0, 4)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-slate-400">
                                                            <div className="flex items-center gap-1.5">
                                                                <Heart className="w-4 h-4"/>
                                                                <span
                                                                    className="text-xs font-bold">{item.vote_count}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Eye className="w-4 h-4"/>
                                                                <span
                                                                    className="text-xs font-bold">{item.view_count}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
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
                                    className="h-16 px-12 text-lg bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20">
                                Start Your First Project Now <ArrowRight className="ml-2 w-6 h-6"/>
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer/>
        </div>
    );
}
