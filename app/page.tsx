"use client";

import dynamic from 'next/dynamic';
import React, {useState, useEffect, Suspense} from "react";
import {
    ArrowRight,
    Upload,
    Layers,
    Zap,
    Maximize,
    ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {m} from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import Button from "@/components/ui/Button";
import {supabase} from "@/lib/supabase";

// Dynamic imports for heavy client-side components
const ReactCompareSlider = dynamic(() => import('react-compare-slider').then(mod => mod.ReactCompareSlider), {
    ssr: false,
    loading: () => <div className="w-full h-[50vh] md:h-[80vh] bg-slate-200 animate-pulse rounded-[2.5rem]"/>
});

const ReactCompareSliderImage = dynamic(() => import('react-compare-slider').then(mod => mod.ReactCompareSliderImage), {
    ssr: false
});

const MarqueeSection = dynamic(() => import('@/components/landing-page/MarqueeSection'), {
    ssr: false,
    loading: () => <div className="py-20 bg-white border-y border-slate-200 h-[400px] animate-pulse"/>
});

const HowItWorksSection = dynamic(() => import('@/components/landing-page/HowItWorksSection'), {
    ssr: false,
    loading: () => <div className="py-32 md:py-48 bg-white h-[600px] animate-pulse"/>
});

const FeaturesSection = dynamic(() => import('@/components/landing-page/FeaturesSection'), {
    ssr: false,
    loading: () => <div className="py-32 md:py-48 bg-slate-900 h-[800px] animate-pulse"/>
});

const ShowcaseGallerySection = dynamic(() => import('@/components/landing-page/ShowcaseGallerySection'), {
    ssr: false,
    loading: () => <div className="py-32 md:py-48 bg-white h-[800px] animate-pulse"/>
});

const CTASection = dynamic(() => import('@/components/landing-page/CTASection'), {
    ssr: false,
    loading: () => <div className="py-24 md:py-40 bg-slate-900 h-[400px] animate-pulse"/>
});

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+ZNPQAIXwM496nefQAAAABJRU5ErkJggg==";

export default function LandingPage() {
    const [user, setUser] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
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

    const firstTrendingWithImages = trendingItems.find(
        (item) => item.render?.source_image_url && item.render?.rendered_image_url
    );

    const showcaseImages = firstTrendingWithImages ? [{
        before: firstTrendingWithImages.render.source_image_url,
        after: firstTrendingWithImages.render.rendered_image_url,
    }] : [
        {
            before: "https://klyvifpieepniicfusan.supabase.co/storage/v1/object/public/roomify-assets/inputs/p26t4n95h.webp",
            after: "https://klyvifpieepniicfusan.supabase.co/storage/v1/object/public/roomify-assets/outputs/jbw5zr7pyxrmt0cxwyzby097vr.png",
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
            <main>
                {/* Slide Down Animation for Page Load */}
                <m.div
                    initial={{y: -100, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{duration: 0.8, ease: "easeOut"}}
                    className="fixed inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent z-60"
                />

                {/* Hero Section */}
                <section
                    className="relative min-h-[90vh] flex items-center pt-32 pb-20 md:pt-48 md:pb-40">
                    {/* Subtle Grid Pattern - Infinite Scroll */}
                    <div
                        className="absolute inset-0 z-0 pointer-events-none opacity-40"
                        style={{
                            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                            willChange: 'transform',
                        }}
                    >
                        <div
                            className="absolute inset-0 bg-linear-to-b from-[#F9FAFB]/0 via-[#F9FAFB]/50 to-[#F9FAFB]"/>
                    </div>

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
                        <div
                            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"/>
                        <div
                            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"/>
                    </div>

                    <div className="container mx-auto px-6 text-center relative z-10">
                        <div>
                            <div className="min-h-10 flex items-center justify-center mb-6">
                            <span
                                className="inline-block px-4 py-1.5 text-xs font-bold tracking-wider uppercase bg-slate-900 text-white rounded-full">
                              The Future of Visualization
                            </span>
                            </div>
                            <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-6 text-slate-900">
                                Transform 2D Floor Plans into <br className="hidden md:block"/> Stunning 3D Renders
                                in
                                Seconds
                            </h1>
                            <p className="text-lg md:text-xl text-slate-900 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                                Empowering architects, real estate agents, and homeowners with AI-driven
                                architectural
                                visualization.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-24">
                                <Link href="/dashboard">
                                    <Button variant="primary" size="lg"
                                            className="w-full sm:w-auto h-14 px-8 text-base bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 transition-all duration-300 min-h-[44px]">
                                        Get Started <ArrowRight className="ml-2 w-5 h-5"/>
                                    </Button>
                                </Link>
                                <Button variant="outline" size="lg"
                                        className="w-full sm:w-auto h-14 px-8 text-base border-slate-200 text-slate-900 hover:bg-slate-50 min-h-[44px]">
                                    Watch Demo
                                </Button>
                            </div>
                        </div>

                        {/* Visual Slider with Light Glassmorphism */}
                        {mounted && (
                            <div className="relative mt-12 md:mt-20">
                                {/* Glowing Aura */}
                                <div
                                    className="absolute inset-0 -z-10 bg-linear-to-r from-indigo-500/20 to-orange-500/20 blur-[100px] rounded-full scale-110"/>

                                <div
                                    className="relative max-w-7xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/10 bg-slate-100 backdrop-blur-sm w-full aspect-video min-h-75 md:min-h-150"
                                >
                                    <Suspense fallback={<div
                                        className="w-full h-full bg-slate-200 animate-pulse rounded-[2.5rem]"/>}>
                                        <ReactCompareSlider
                                            handle={<div
                                                className="w-1 h-full bg-white/50 backdrop-blur-sm shadow-xl"/>}
                                            itemOne={
                                                <div
                                                    className="relative w-full aspect-video min-h-75 md:min-h-150">
                                                    <NextImage
                                                        src={showcaseImages[0].before}
                                                        alt="2D Floor Plan"
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                                        className="object-cover"
                                                        priority={true}
                                                        fetchPriority="high"
                                                        placeholder="blur"
                                                        blurDataURL={BLUR_DATA_URL}
                                                    />
                                                </div>
                                            }
                                            itemTwo={
                                                <div
                                                    className="relative w-full aspect-video min-h-75 md:min-h-150">
                                                    <NextImage
                                                        src={showcaseImages[0].after}
                                                        alt="3D Render"
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                                        className="object-cover"
                                                        placeholder="blur"
                                                        blurDataURL={BLUR_DATA_URL}
                                                    />
                                                </div>
                                            }
                                            className="w-full h-full"
                                        />
                                    </Suspense>
                                    <div
                                        className="absolute z-10 bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 flex justify-between pointer-events-none">
                                <span
                                    className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest border border-white/20 text-white shadow-lg">Original Plan</span>
                                        <span
                                            className="px-4 py-2 rounded-full bg-primary/20 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest border border-primary/20 text-white shadow-lg">AI Vision</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Infinite Marquee Section */}
                <Suspense
                    fallback={<div className="py-20 bg-white border-y border-slate-200 h-100 animate-pulse"/>}>
                    <MarqueeSection marqueeItems={marqueeItems}/>
                </Suspense>

                {/* How It Works */}
                <Suspense fallback={<div className="py-32 md:py-48 bg-white h-150 animate-pulse"/>}>
                    <m.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <HowItWorksSection/>
                    </m.div>
                </Suspense>

                {/* Features Grid */}
                <Suspense fallback={<div className="py-32 md:py-48 bg-slate-900 h-200 animate-pulse"/>}>
                    <m.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <FeaturesSection/>
                    </m.div>
                </Suspense>

                {/* Showcase Gallery */}
                <Suspense fallback={<div className="py-32 md:py-48 bg-white h-200 animate-pulse"/>}>
                    <m.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <ShowcaseGallerySection
                            isLoading={isLoading}
                            trendingItems={trendingItems}
                            isAdminUser={isAdminUser}
                            setTrendingItems={setTrendingItems}
                        />
                    </m.div>
                </Suspense>

                {/* CTA Section */}
                <Suspense fallback={<div className="py-24 md:py-40 bg-slate-900 h-100 animate-pulse"/>}>
                    <m.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <CTASection/>
                    </m.div>
                </Suspense>
            </main>
        </div>
    );
}
