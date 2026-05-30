"use client";

import {useEffect, useState} from "react";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {ArrowRight, Heart, Share2, Info, Home, Layers, Sun, Sparkles} from "lucide-react";
import Navbar from "@/components/Navbar";
import {toast} from "sonner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import NextImage from "next/image";
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

    const getHighResUrl = (v: any) => v?.upscaled_image_url || v?.rendered_image_url;

    // Filtering variants
    const planVariants = variants.filter(v => v.view_id === 'plan' || !v.view_id);
    const isoVariants = variants.filter(v => v.view_id === 'isometric');

    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    useEffect(() => {
        if (initialShowcase?.render?.view_id === 'plan' || !initialShowcase?.render?.view_id) {
            if (initialShowcase?.render) {
                setSelectedPlan(initialShowcase.render);
            } else if (planVariants.length > 0) {
                setSelectedPlan(planVariants[0]);
            }
        } else if (planVariants.length > 0) {
            setSelectedPlan(planVariants[0]);
        }
    }, [initialShowcase, variants]);

    const [isoLeft, setIsoLeft] = useState<any>(null);
    const [isoRight, setIsoRight] = useState<any>(null);

    useEffect(() => {
        if (isoVariants.length > 0) {
            const left = isoVariants.length > 1 ? isoVariants[isoVariants.length - 2] : isoVariants[0];
            setIsoLeft(left);

            const right = initialShowcase?.render?.view_id === 'isometric'
                ? initialShowcase?.render
                : isoVariants[isoVariants.length - 1];
            setIsoRight(right);
        }
    }, [initialShowcase, variants]);

    const [showcase, setShowcase] = useState<any>(initialShowcase);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCount, setVoteCount] = useState(initialShowcase?.vote_count || 0);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
            <Navbar minimal={true}/>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 space-y-16">

                {/* Section 1: Technical Reveal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    {/* Hero Slider */}
                    <div className="lg:col-span-2 space-y-8">
                        <div
                            className="bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 relative group transition-all w-full h-auto max-h-[80vh]">
                            {mounted && selectedPlan ? (
                                <ReactCompareSlider
                                    itemOne={
                                        <div className="relative w-full h-[60vh] md:h-[80vh]">
                                            <ReactCompareSliderImage
                                                src={project.source_image_url}
                                                alt="Original Plan"
                                                sizes="(max-width: 1024px) 100vw, 66vw"
                                                style={{objectFit: 'contain'}}
                                            />
                                        </div>
                                    }
                                    itemTwo={
                                        <div className="relative w-full h-[60vh] md:h-[80vh]">
                                            <ReactCompareSliderImage
                                                src={getHighResUrl(selectedPlan)}
                                                alt="3D Render"
                                                sizes="(max-width: 1024px) 100vw, 66vw"
                                                style={{objectFit: 'contain'}}
                                            />
                                        </div>
                                    }
                                    className="w-full h-full"
                                />
                            ) : (
                                <div
                                    className="w-full h-[60vh] md:h-[80vh] relative bg-slate-50 flex items-center justify-center">
                                    <NextImage
                                        src={project.source_image_url}
                                        alt="Original Plan"
                                        fill
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                        className="object-contain"
                                    />
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
                                                className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all bg-slate-50 ${
                                                    selectedPlan?.id === v.id ? "border-indigo-600 ring-4 ring-indigo-600/10" : "border-transparent hover:border-slate-200"
                                                }`}
                                            >
                                                <NextImage
                                                    src={getHighResUrl(v)}
                                                    alt="Variant"
                                                    fill
                                                    sizes="96px"
                                                    className="object-contain"
                                                />
                                                <div
                                                    className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg z-10">
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
                                    className="bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 relative transition-all w-full h-auto max-h-[80vh]">
                                    {mounted && isoLeft && isoRight ? (
                                        <ReactCompareSlider
                                            itemOne={
                                                <div className="relative w-full h-[60vh] md:h-[80vh]">
                                                    <ReactCompareSliderImage
                                                        src={getHighResUrl(isoLeft)}
                                                        alt="Style A"
                                                        sizes="(max-width: 1024px) 100vw, 75vw"
                                                        style={{objectFit: 'contain'}}
                                                    />
                                                </div>
                                            }
                                            itemTwo={
                                                <div className="relative w-full h-[60vh] md:h-[80vh]">
                                                    <ReactCompareSliderImage
                                                        src={getHighResUrl(isoRight)}
                                                        alt="Style B"
                                                        sizes="(max-width: 1024px) 100vw, 75vw"
                                                        style={{objectFit: 'contain'}}
                                                    />
                                                </div>
                                            }
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div
                                            className="relative w-full h-[60vh] md:h-[80vh] bg-slate-50 flex items-center justify-center">
                                            <NextImage
                                                src={isoRight ? getHighResUrl(isoRight) : getHighResUrl(isoLeft)}
                                                alt="Isometric Render"
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 75vw"
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Isometric Selector */}
                            <div className="space-y-6">
                                <div
                                    className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col h-full">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 sticky top-0 bg-white z-10 py-2">
                                        Choose Styles
                                    </h3>
                                    <div className="relative overflow-hidden">
                                        <div
                                            className="grid grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-125 lg:max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
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
                                                        className={`group relative aspect-video lg:aspect-4/3 rounded-2xl overflow-hidden border-2 transition-all bg-slate-50 ${
                                                            isActive ? "border-indigo-600 ring-4 ring-indigo-600/10 scale-[0.98]" : "border-transparent hover:border-slate-200"
                                                        }`}
                                                    >
                                                        <NextImage
                                                            src={getHighResUrl(v)}
                                                            alt="Isometric preview"
                                                            fill
                                                            sizes="(max-width: 1024px) 25vw, 15vw"
                                                            className="object-contain transition-transform group-hover:scale-110"
                                                        />
                                                        <div
                                                            className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                                        <div
                                                            className="absolute bottom-3 left-3 flex flex-col items-start">
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
                                        {/* Bottom fade indicator */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none z-10"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
}
