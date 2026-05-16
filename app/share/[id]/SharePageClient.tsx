"use client";

import {useEffect, useState} from "react";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {Sparkles, ArrowRight, Heart, Eye, Share2, Info, Home, Layers, Sun} from "lucide-react";
import {toast} from "sonner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {Tooltip} from "@/components/ui/Tooltip";
import {ROOM_STYLES, PROJECT_CONTEXTS, FLOORING_MATERIALS, LIGHTING_MOODS} from "@/lib/constants";

interface SharePageClientProps {
    id: string;
    initialProject: any;
    initialVariants: any[];
    initialShowcase: any;
}

export default function SharePageClient({
                                            id,
                                            initialProject,
                                            initialVariants,
                                            initialShowcase,
                                        }: SharePageClientProps) {
    const [project, setProject] = useState<any>(initialProject);
    const [variants, setVariants] = useState<any[]>(initialVariants);

    // Filtering variants
    const planVariants = variants.filter(v => v.view_id === 'plan' || !v.view_id);
    const isoVariants = variants.filter(v => v.view_id === 'isometric');

    const [selectedPlan, setSelectedPlan] = useState<any>(
        initialShowcase?.render?.view_id === 'plan' || !initialShowcase?.render?.view_id
            ? initialShowcase?.render
            : (planVariants.length > 0 ? planVariants[0] : null)
    );

    const [isoLeft, setIsoLeft] = useState<any>(
        isoVariants.length > 1 ? isoVariants[isoVariants.length - 2] : (isoVariants.length > 0 ? isoVariants[0] : null)
    );
    const [isoRight, setIsoRight] = useState<any>(
        initialShowcase?.render?.view_id === 'isometric'
            ? initialShowcase?.render
            : (isoVariants.length > 0 ? isoVariants[isoVariants.length - 1] : null)
    );

    const [showcase, setShowcase] = useState<any>(initialShowcase);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCount, setVoteCount] = useState(initialShowcase?.vote_count || 0);
    const [isAdminUser, setIsAdminUser] = useState(false);

    const getVariantDetails = (v: any) => {
        if (!v) return null;
        return {
            style: ROOM_STYLES.find(s => s.id === v.style_id)?.name || v.style_id || "Modern",
            context: PROJECT_CONTEXTS.find(c => c.id === v.project_context)?.name || v.project_context || "Residential",
            flooring: FLOORING_MATERIALS.find(f => f.id === v.flooring_id)?.name || v.flooring_id || "Light Oak",
            mood: LIGHTING_MOODS.find(l => l.id === v.lighting_id)?.name || v.lighting_id || "Natural Daylight"
        };
    };

    useEffect(() => {
        async function checkUserStatus() {
            // Get user and check admin status
            const {data: {user}} = await supabase.auth.getUser();
            if (user) {
                const {data: profile} = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setIsAdminUser(profile?.role === 'admin');

                if (showcase) {
                    const {data: vote} = await supabase
                        .from("showcase_votes")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("showcase_id", showcase.id)
                        .maybeSingle();
                    setHasVoted(!!vote);
                }
            }
        }

        checkUserStatus();

        if (showcase) {
            // Increment view count
            supabase.rpc("increment_showcase_view", {target_showcase_id: showcase.id}).then();
        }
    }, [showcase]);

    const handleVote = async () => {
        if (!showcase) return;

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in to vote!");
            return;
        }

        try {
            const {data, error} = await supabase.rpc("toggle_showcase_vote", {
                target_showcase_id: showcase.id
            });

            if (error) throw error;

            setHasVoted(data.action === "voted");
            setVoteCount(data.vote_count);
        } catch (error: any) {
            console.error("Vote failed:", error);
            toast.error(error.message);
        }
    };

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Project Not Found</h1>
                    <p className="text-slate-600 mb-8">This project might have been removed or the link is
                        incorrect.</p>
                    <Link href="/">
                        <Button variant="primary">Go to Homepage</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white"/>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">Roomify</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {showcase && (
                            <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 gap-4 mr-4">
                                <div className="flex items-center gap-1.5">
                                    <Heart
                                        className={`w-4 h-4 ${hasVoted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}/>
                                    <span className="text-sm font-bold text-slate-700">{voteCount}</span>
                                </div>
                                <div className="w-[1px] h-3 bg-slate-300"/>
                                <div className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-slate-400"/>
                                    <span className="text-sm font-bold text-slate-700">{showcase.view_count}</span>
                                </div>
                            </div>
                        )}
                        <div className="text-right">
                            <h1 className="text-sm font-semibold text-slate-900">{project.name}</h1>
                            <p className="text-xs text-slate-500">{showcase ? 'Community Showcase' : 'Shared Design'}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 space-y-16">

                {/* Section 1: Technical Reveal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    {/* Hero Slider */}
                    <div className="lg:col-span-2 space-y-8">
                        <div
                            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 relative group transition-all">
                            {selectedPlan ? (
                                <ReactCompareSlider
                                    itemOne={<ReactCompareSliderImage src={project.source_image_url} alt="Original Plan"
                                                                      loading="eager"/>}
                                    itemTwo={<ReactCompareSliderImage
                                        src={selectedPlan.upscaled_image_url || selectedPlan.rendered_image_url}
                                        alt="3D Render" loading="eager"/>}
                                    className="aspect-[4/3] md:aspect-video"
                                />
                            ) : (
                                <div
                                    className="aspect-[4/3] md:aspect-video bg-slate-100 flex items-center justify-center">
                                    <img src={project.source_image_url} alt="Original Plan"
                                         className="max-h-full object-contain" loading="eager"/>
                                </div>
                            )}

                            {showcase?.is_admin_approved && (
                                <div
                                    className="absolute top-6 left-6 bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 z-20">
                                    <Sparkles className="w-4 h-4"/>
                                    Staff Pick
                                </div>
                            )}

                            {isAdminUser && showcase && (
                                <div className="absolute top-6 right-6 flex gap-2 z-20">
                                    {!showcase.is_admin_approved ? (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg"
                                            onClick={async () => {
                                                const res = await fetch('/api/admin/approve', {
                                                    method: 'POST',
                                                    headers: {'Content-Type': 'application/json'},
                                                    body: JSON.stringify({showcaseId: showcase.id, action: 'approve'}),
                                                });
                                                if (res.ok) setShowcase({...showcase, is_admin_approved: true});
                                            }}
                                        >
                                            Approve
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white/90 backdrop-blur-md border-slate-200 text-red-600 hover:bg-red-50 rounded-full shadow-lg"
                                            onClick={async () => {
                                                const res = await fetch('/api/admin/approve', {
                                                    method: 'POST',
                                                    headers: {'Content-Type': 'application/json'},
                                                    body: JSON.stringify({
                                                        showcaseId: showcase.id,
                                                        action: 'unapprove'
                                                    }),
                                                });
                                                if (res.ok) setShowcase({...showcase, is_admin_approved: false});
                                            }}
                                        >
                                            Unapprove
                                        </Button>
                                    )}
                                </div>
                            )}

                            {showcase && (
                                <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
                                    <Button
                                        variant={hasVoted ? "secondary" : "primary"}
                                        onClick={handleVote}
                                        size="sm"
                                        className="rounded-full shadow-lg"
                                    >
                                        <Heart
                                            className={`w-4 h-4 mr-2 ${hasVoted ? 'fill-rose-500 text-rose-500' : ''}`}/>
                                        {hasVoted ? "Voted" : "Vote"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/80 backdrop-blur-md rounded-full shadow-lg"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success("Link copied!");
                                        }}
                                    >
                                        <Share2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Plan Selector */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Technical Plan
                                    Variants</h3>
                                <span
                                    className="text-xs font-medium text-slate-400">{planVariants.length} versions</span>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {planVariants.map((v, i) => {
                                    const details = getVariantDetails(v);
                                    const tooltipContent = (
                                        <div className="p-2 space-y-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Home className="w-3 h-3 text-indigo-400"/>
                                                <b>Style:</b> {details?.style}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Layers className="w-3 h-3 text-indigo-400"/>
                                                <b>Flooring:</b> {details?.flooring}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Sun className="w-3 h-3 text-indigo-400"/> <b>Mood:</b> {details?.mood}
                                            </div>
                                        </div>
                                    );
                                    return (
                                        <Tooltip key={v.id} content={tooltipContent}>
                                            <button
                                                onClick={() => setSelectedPlan(v)}
                                                className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                                                    selectedPlan?.id === v.id ? "border-indigo-600 ring-4 ring-indigo-600/10" : "border-transparent hover:border-slate-200"
                                                }`}
                                            >
                                                <img src={v.rendered_image_url} alt="Variant"
                                                     className="w-full h-full object-cover"/>
                                                <div
                                                    className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                                    V{i + 1}
                                                </div>
                                            </button>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Technical Metadata Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 transition-all">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{project.name}</h2>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                AI-powered 2D-to-3D floor plan transformation. Precision architecture meets professional
                                rendering.
                            </p>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Technical
                                    Specs</h3>
                                <div className="grid gap-3">
                                    {[
                                        {label: "Base Plan", value: "2D Floor Plan", icon: Layers},
                                        {label: "Style", value: getVariantDetails(selectedPlan)?.style, icon: Home},
                                        {label: "Mood", value: getVariantDetails(selectedPlan)?.mood, icon: Sun},
                                        {
                                            label: "Flooring",
                                            value: getVariantDetails(selectedPlan)?.flooring,
                                            icon: Info
                                        },
                                    ].map((item, i) => (
                                        <div key={i}
                                             className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <item.icon className="w-4 h-4 text-slate-400"/>
                                                <span className="text-sm font-medium text-slate-500">{item.label}</span>
                                            </div>
                                            <span
                                                className="text-sm font-bold text-slate-900">{item.value || "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Aesthetic 3D Models (Isometric Comparison) */}
                {isoVariants.length > 0 && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900">3D Diorama Comparison</h2>
                                <p className="text-slate-500">Explore different interior styles in immersive 3D.</p>
                            </div>
                            <div
                                className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                <div
                                    className="px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-bold text-slate-900 border border-slate-200">Style
                                    A: <span className="text-indigo-600">{getVariantDetails(isoLeft)?.style}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400"/>
                                <div
                                    className="px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-bold text-slate-900 border border-slate-200">Style
                                    B: <span className="text-indigo-600">{getVariantDetails(isoRight)?.style}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
                            {/* Isometric Slider */}
                            <div className="lg:col-span-3">
                                <div
                                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 relative transition-all">
                                    <ReactCompareSlider
                                        itemOne={<ReactCompareSliderImage
                                            src={isoLeft?.upscaled_image_url || isoLeft?.rendered_image_url}
                                            alt="Style A" loading="lazy"/>}
                                        itemTwo={<ReactCompareSliderImage
                                            src={isoRight?.upscaled_image_url || isoRight?.rendered_image_url}
                                            alt="Style B" loading="lazy"/>}
                                        className="aspect-[4/3] md:aspect-video"
                                    />
                                </div>
                            </div>

                            {/* Isometric Selector */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Choose
                                        Styles</h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                                        {isoVariants.map((v, i) => {
                                            const isActive = isoLeft?.id === v.id || isoRight?.id === v.id;
                                            return (
                                                <button
                                                    key={v.id}
                                                    onClick={() => {
                                                        if (isoLeft?.id === v.id) return;
                                                        setIsoLeft(isoRight);
                                                        setIsoRight(v);
                                                    }}
                                                    className={`group relative aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all ${
                                                        isActive ? "border-indigo-600 ring-4 ring-indigo-600/10 scale-[0.98]" : "border-transparent hover:border-slate-200"
                                                    }`}
                                                >
                                                    <img src={v.rendered_image_url} alt="Isometric preview"
                                                         className="w-full h-full object-cover transition-transform group-hover:scale-110"/>
                                                    <div
                                                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                                    <div className="absolute bottom-3 left-3 flex flex-col items-start">
                                                        <span
                                                            className="text-[10px] font-bold text-white uppercase tracking-wider">{getVariantDetails(v)?.style}</span>
                                                    </div>
                                                    {isoLeft?.id === v.id && <div
                                                        className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full border-2 border-indigo-600"
                                                        title="Selected as A"/>}
                                                    {isoRight?.id === v.id && <div
                                                        className="absolute top-3 right-3 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"
                                                        title="Selected as B"/>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Conversion Banner */}
            <footer className="mt-auto p-6 md:p-12">
                <div
                    className="max-w-5xl mx-auto bg-indigo-600 rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-center shadow-2xl border border-indigo-500/50">
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 opacity-90"/>
                    <div
                        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                            Inspired by this design?
                        </h2>
                        <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                            Transform your own floor plans into stunning photorealistic 3D visualizations in seconds
                            with Roomify.
                        </p>
                        <Link href="/">
                            <Button
                                className="bg-white text-indigo-600 hover:bg-indigo-50 px-10 py-5 h-auto text-xl font-bold rounded-[2rem] group shadow-xl transition-all hover:scale-105 active:scale-95">
                                Create your own design
                                <ArrowRight
                                    className="ml-2 w-6 h-6 inline transition-transform group-hover:translate-x-2"/>
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="text-center mt-12 text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Roomify AI. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
