"use client";

import {useRouter, useSearchParams, useParams} from "next/navigation";
import {useEffect, useRef, useState, Suspense} from "react";
import {RefreshCcw, Sparkles, X, ThumbsUp, ThumbsDown} from "lucide-react";
import RoomifyLogo from "@/components/RoomifyLogo";
import {toast} from "sonner";
import Button from "@/components/ui/Button";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {ROOM_STYLES, PROJECT_CONTEXTS, FLOORING_MATERIALS, LIGHTING_MOODS, CAMERA_VIEWS} from "@/lib/constants";
import VisualizerToolbar from "@/components/VisualizerToolbar";
import {useCredits} from "@/lib/hooks/useCredits";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function VisualizerContent() {
    const {id} = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const hasInitialGenerated = useRef(false);
    const [project, setProject] = useState<any>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [isPlanProcessing, setIsPlanProcessing] = useState(false);
    const [planPrediction, setPlanPrediction] = useState<any>(null);
    const [isIsoProcessing, setIsIsoProcessing] = useState(false);
    const [isoPrediction, setIsoPrediction] = useState<any>(null);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [upscalePrediction, setUpscalePrediction] = useState<any>(null);
    const [selectedStyle, setSelectedStyle] = useState(ROOM_STYLES[0]);
    const [selectedContext, setSelectedContext] = useState(PROJECT_CONTEXTS[0]);
    const [selectedFlooring, setSelectedFlooring] = useState(FLOORING_MATERIALS[0]);
    const [selectedLighting, setSelectedLighting] = useState(LIGHTING_MOODS[1]); // Default to Natural Daylight
    const [selectedView, setSelectedView] = useState(CAMERA_VIEWS[0]);
    const [rating, setRating] = useState<number | null>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [leftImage, setLeftImage] = useState<string | null>(null);
    const [rightImage, setRightImage] = useState<string | null>(null);

    // New Comparison States for Isometric
    const [isoLeftImage, setIsoLeftImage] = useState<string | null>(null);
    const [isoRightImage, setIsoRightImage] = useState<string | null>(null);

    const [showToast, setShowToast] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [showcaseId, setShowcaseId] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const {refreshCredits} = useCredits();

    // Variant Filtering
    const planVariants = variants.filter(v => v.view_id === 'plan' || !v.view_id);
    const isoVariants = variants.filter(v => v.view_id === 'isometric');

    const currentPlanExists = variants.some(v =>
        (v.view_id === 'plan' || !v.view_id) &&
        (v.style_id === selectedStyle.id) &&
        (v.project_context === selectedContext.id) &&
        (v.flooring_id === selectedFlooring.id) &&
        (v.lighting_id === selectedLighting.id) &&
        v.status === 'succeeded'
    );

    const handleBack = () => router.push("/dashboard");

    const fetchVariants = async (projectId: string) => {
        const {data, error} = await supabase
            .from("renders")
            .select("*")
            .eq("project_id", projectId)
            .eq("status", "succeeded")
            .order("created_at", {ascending: true});

        if (error) {
            console.error("Error fetching variants:", error);
            return;
        }
        if (data) {
            setVariants(data);
        }
    };

    const handleUpscale = async () => {
        if (!currentImage || !id) return;

        try {
            setIsUpscaling(true);
            const response = await fetch("/api/upscale", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: currentImage,
                    renderId: id
                }),
            });

            const data = await response.json();
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(data.error);
            }

            if (data.alreadyExists) {
                setCurrentImage(data.output);
                toast.info("This image has already been upscaled!");
                setIsUpscaling(false);
                return;
            }

            await resumeUpscale(data.id);
        } catch (error: any) {
            console.error("Upscale failed:", error);
            toast.error(`Upscale failed: ${error.message}`);
            setIsUpscaling(false);
        }
    };

    const resumeUpscale = async (predictionId: string) => {
        try {
            setIsUpscaling(true);
            let predictionResponse = await fetch("/api/predictions/" + predictionId);
            let prediction = await predictionResponse.json();

            if (predictionResponse.status !== 200) {
                throw new Error(prediction.error);
            }

            setUpscalePrediction(prediction);

            // Polling mechanism
            while (prediction.status !== "succeeded" && prediction.status !== "failed") {
                await sleep(2000);
                const response = await fetch("/api/predictions/" + prediction.id);
                prediction = await response.json();
                if (response.status !== 200) {
                    throw new Error(prediction.error);
                }
                setUpscalePrediction(prediction);
            }

            if (prediction.status === "succeeded") {
                // Refresh variants and credits
                if (id) fetchVariants(id as string);

                // Add a small delay to allow database triggers/RPCs to finish
                setTimeout(() => {
                    refreshCredits();
                }, 1000);

                // Update project thumbnail
                const {data: updatedRecord} = await supabase
                    .from("renders")
                    .select("upscaled_image_url, project_id")
                    .eq("upscale_prediction_id", prediction.id)
                    .single();

                if (updatedRecord?.upscaled_image_url) {
                    setCurrentImage(updatedRecord.upscaled_image_url);
                    if (updatedRecord.project_id) {
                        await supabase
                            .from("projects")
                            .update({rendered_image_url: updatedRecord.upscaled_image_url})
                            .eq("id", updatedRecord.project_id);
                    }
                } else {
                    const output = prediction.output;
                    const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;
                    setCurrentImage(renderedUrl);
                }
                toast.success("Image successfully upscaled to 4K!");
            } else {
                throw new Error("Upscale prediction failed");
            }
        } catch (error: any) {
            console.error("Resuming upscale failed:", error);
            toast.error(`Upscale failed: ${error.message}`);
        } finally {
            setIsUpscaling(false);
            setUpscalePrediction(null);
        }
    };

    const handleExport = async () => {
        if (!currentImage) return;
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `roomify-${id || "design"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to export image:", e);
            window.open(currentImage, "_blank");
        }
    };

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/share/${showcaseId || id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            const tweetText = encodeURIComponent(`Check out my 3D interior design on Roomify! #RoomifyAI`);
            const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`;

            toast.success("Link copied!", {
                description: "Share your design with the world.",
                action: {
                    label: "Share on X",
                    onClick: () => window.open(tweetUrl, "_blank"),
                },
            });
        }).catch(err => {
            console.error('Failed to copy: ', err);
            toast.error("Failed to copy link to clipboard");
        });
    };

    const handleTogglePublic = async (shouldBePublic: boolean) => {
        if (!currentImage) return;

        try {
            const {data: {user}} = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to post to the community gallery.");
                return;
            }

            // Find the render_id for the currentImage
            const currentRender = variants.find(v => v.upscaled_image_url === currentImage || v.rendered_image_url === currentImage);
            const renderId = currentRender?.id;

            if (!renderId) {
                console.error("Could not find render ID for current image");
                return;
            }

            if (shouldBePublic) {
                const {data, error} = await supabase
                    .from("showcase")
                    .insert({
                        render_id: renderId,
                        user_id: user.id,
                        is_admin_approved: false
                    })
                    .select()
                    .single();

                if (error) throw error;
                setIsPublic(true);
                setShowcaseId(data.id);
                // Also update variants locally if needed, but the effect will handle it
            } else {
                // Find and delete ALL entries for this render to be safe
                const {error} = await supabase
                    .from("showcase")
                    .delete()
                    .eq("render_id", renderId);

                if (error) throw error;

                setIsPublic(false);
                setShowcaseId(null);
            }
        } catch (error: any) {
            console.error("Failed to toggle public status:", error);
            toast.error(`Failed to update gallery status: ${error.message}`);
        }
    };

    const runGeneration = async (
        styleOverride?: typeof ROOM_STYLES[0],
        contextOverride?: typeof PROJECT_CONTEXTS[0],
        flooringOverride?: typeof FLOORING_MATERIALS[0],
        lightingOverride?: typeof LIGHTING_MOODS[0],
        viewOverride?: typeof CAMERA_VIEWS[0],
        forceNew = true,
        specificViewId?: string
    ) => {
        if (!project?.source_image_url) return;

        const styleToUse = styleOverride || selectedStyle;
        const contextToUse = contextOverride || selectedContext;
        const flooringToUse = flooringOverride || selectedFlooring;
        const lightingToUse = lightingOverride || selectedLighting;
        const viewToUse = viewOverride || selectedView;
        const viewIdToUse = specificViewId || viewToUse.id;

        const isPlan = viewIdToUse === 'plan';

        try {
            if (isPlan) {
                setIsPlanProcessing(true);
            } else {
                setIsIsoProcessing(true);
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: project.source_image_url,
                    project_id: id,
                    projectName: project.name,
                    styleKeywords: styleToUse.keywords,
                    styleId: styleToUse.id,
                    projectContext: contextToUse.name,
                    contextId: contextToUse.id,
                    flooringKeywords: flooringToUse.keywords,
                    flooringId: flooringToUse.id,
                    lightingKeywords: lightingToUse.keywords,
                    lightingId: lightingToUse.id,
                    viewKeywords: viewToUse.keywords,
                    viewId: viewIdToUse,
                    forceNew
                }),
            });

            const prediction = await response.json();
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(prediction.error);
            }

            if (prediction.isCacheHit) {
                if (isPlan) {
                    setCurrentImage(prediction.output);
                    setPlanPrediction(prediction);
                    setIsPlanProcessing(false);
                } else {
                    setIsoPrediction(prediction);
                    setIsIsoProcessing(false);
                }
                return;
            }

            // Update URL with predictionId
            const params = new URLSearchParams(window.location.search);
            params.set("predictionId", prediction.id);

            window.history.replaceState({}, "", `/visualizer/${id}?${params.toString()}`);

            await resumePrediction(prediction.id, viewIdToUse);
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error("Failed to generate 3D view. Please try again.");
            if (isPlan) {
                setIsPlanProcessing(false);
            } else {
                setIsIsoProcessing(false);
            }
        }
    };

    const resumePrediction = async (predictionId: string, viewId: string = 'plan') => {
        const isPlan = viewId === 'plan';
        try {
            if (isPlan) {
                setIsPlanProcessing(true);
            } else {
                setIsIsoProcessing(true);
            }

            let predictionResponse = await fetch("/api/predictions/" + predictionId);
            let prediction = await predictionResponse.json();

            if (predictionResponse.status !== 200) {
                throw new Error(prediction.error);
            }

            if (isPlan) {
                setPlanPrediction(prediction);
            } else {
                setIsoPrediction(prediction);
            }

            // Polling mechanism
            while (prediction.status !== "succeeded" && prediction.status !== "failed") {
                await sleep(2000);
                const response = await fetch("/api/predictions/" + prediction.id);
                prediction = await response.json();
                if (response.status !== 200) {
                    throw new Error(prediction.error);
                }
                if (isPlan) {
                    setPlanPrediction(prediction);
                } else {
                    setIsoPrediction(prediction);
                }
            }

            if (prediction.status === "succeeded") {
                // Refresh variants and credits
                if (id) fetchVariants(id as string);

                // Add a small delay to allow database triggers/RPCs to finish
                setTimeout(() => {
                    refreshCredits();
                }, 1000);

                const {data: updatedRecord} = await supabase
                    .from("renders")
                    .select("rendered_image_url, project_id, view_id")
                    .eq("prediction_id", prediction.id)
                    .single();

                if (updatedRecord?.rendered_image_url) {
                    if (updatedRecord.view_id === 'plan' || !updatedRecord.view_id) {
                        setCurrentImage(updatedRecord.rendered_image_url);
                    } else if (updatedRecord.view_id === 'isometric') {
                        setIsoRightImage(updatedRecord.rendered_image_url);
                    }

                    if (updatedRecord.project_id) {
                        await supabase
                            .from("projects")
                            .update({rendered_image_url: updatedRecord.rendered_image_url})
                            .eq("id", updatedRecord.project_id);
                    }
                } else {
                    // Fallback to Replicate URL if database update isn't reflected yet
                    const output = prediction.output;
                    const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;
                    if (isPlan) {
                        setCurrentImage(renderedUrl);
                    } else {
                        setIsoRightImage(renderedUrl);
                    }
                }
            } else {
                throw new Error("Prediction failed");
            }
        } catch (error) {
            console.error("Resuming prediction failed:", error);
            toast.error("Failed to resume 3D view. Please try again.");
        } finally {
            if (isPlan) {
                setIsPlanProcessing(false);
            } else {
                setIsIsoProcessing(false);
            }
        }
    };
    const getProcessingStatus = (status: string, elapsed: number) => {
        if (status === "starting") return "Initializing AI Engine...";
        if (elapsed < 3000) return "Step 1 (0-20%): Analyzing floor plan architecture...";
        if (elapsed < 8000) return `Step 2 (20-60%): Applying ${selectedFlooring.name} and ${selectedStyle.name}...`;
        if (elapsed < 14000) return `Step 3 (60-90%): Calculating ${selectedLighting.name} shadows...`;
        return "Step 4 (90-100%): Finalizing 3D render...";
    };
    useEffect(() => {
        if (id) {
            fetchVariants(id as string);
        }
    }, [id, currentImage]);

    useEffect(() => {
        if (project?.source_image_url) {
            setLeftImage(project.source_image_url);
        }
        if (planVariants.length > 0) {
            const latest = planVariants[planVariants.length - 1];
            setRightImage(latest.upscaled_image_url || latest.rendered_image_url);
        } else if (currentImage && (selectedView.id === 'plan' || !selectedView.id)) {
            setRightImage(currentImage);
        }
    }, [project, planVariants, currentImage, selectedView.id]);

    useEffect(() => {
        if (isoVariants.length > 1) {
            if (!isoLeftImage) {
                setIsoLeftImage(isoVariants[isoVariants.length - 2].upscaled_image_url || isoVariants[isoVariants.length - 2].rendered_image_url);
            }
            if (!isoRightImage) {
                setIsoRightImage(isoVariants[isoVariants.length - 1].upscaled_image_url || isoVariants[isoVariants.length - 1].rendered_image_url);
            }
        } else if (isoVariants.length === 1) {
            if (!isoRightImage) {
                setIsoRightImage(isoVariants[0].upscaled_image_url || isoVariants[0].rendered_image_url);
            }
        }
    }, [isoVariants, isoLeftImage, isoRightImage]);

    useEffect(() => {
        if (!id) return;

        const checkPublicStatus = async () => {
            const currentRender = variants.find(v => v.upscaled_image_url === currentImage || v.rendered_image_url === currentImage);
            if (!currentRender) {
                setIsPublic(false);
                setShowcaseId(null);
                return;
            }

            const {data, error} = await supabase
                .from("showcase")
                .select("id")
                .eq("render_id", currentRender.id)
                .maybeSingle();

            if (data) {
                setIsPublic(true);
                setShowcaseId(data.id);
            } else {
                setIsPublic(false);
                setShowcaseId(null);
            }
        };

        checkPublicStatus();
    }, [id, currentImage, variants]);

    useEffect(() => {
        if (!id) return;

        const fetchProject = async () => {
            const {data, error} = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .maybeSingle();

            if (error) {
                console.error("Error fetching project:", error);
                return;
            }

            if (!data) {
                console.warn("Project not found, redirecting...");
                router.push("/");
                return;
            }

            setProject(data);
        };

        fetchProject();
    }, [id]);

    useEffect(() => {
        if (hasInitialGenerated.current || !project) return;
        hasInitialGenerated.current = true;

        const init = async () => {
            const {data: existingRenders} = await supabase
                .from("renders")
                .select("*")
                .eq("project_id", id)
                .order("created_at", {ascending: false});

            if (existingRenders && existingRenders.length > 0) {
                const latest = existingRenders[0];
                if (latest.status === "succeeded" && (latest.upscaled_image_url || latest.rendered_image_url)) {
                    setCurrentImage(latest.upscaled_image_url || latest.rendered_image_url);
                    return;
                } else if (latest.status === "processing" || latest.status === "starting") {
                    resumePrediction(latest.prediction_id);
                    return;
                }
            }

            const predictionId = searchParams.get("predictionId");
            if (predictionId) {
                resumePrediction(predictionId);
            } else {
                runGeneration();
            }
        };

        init();
    }, [project, searchParams, id]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlanProcessing || isIsoProcessing || isUpscaling) {
            timer = setInterval(() => setElapsed(prev => prev + 1000), 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(timer);
    }, [isPlanProcessing, isIsoProcessing, isUpscaling]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <RoomifyLogo className="logo"/>
                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon"/> Exit Editor
                </Button>
            </nav>

            <section className="content pb-32">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || "Loading..."}</h2>
                            <p className="note">Created by You</p>
                        </div>
                    </div>

                    <div className={`render-area ${(isPlanProcessing || isUpscaling) ? "is-processing" : ""}`}>
                        {currentImage ? (
                            <img src={currentImage} alt={`${selectedStyle.name} style AI architectural render`}
                                 className="render-img" loading="eager"/>
                        ) : (
                            <div className="render-placeholder">
                                {project?.source_image_url && (
                                    <img src={project.source_image_url} alt="Original floor plan"
                                         className="render-fallback"
                                         loading="eager"/>
                                )}
                            </div>
                        )}

                        {isPlanProcessing && (
                            <div className="render-overlay bg-slate-50/20 backdrop-blur-md">
                                <div
                                    className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-4">
                                    <RefreshCcw className="w-12 h-12 text-indigo-600 animate-spin"/>
                                    <div className="flex flex-col items-center">
                                        <span
                                            className="text-slate-900 font-semibold tracking-tight text-xl">Rendering...</span>
                                        <span
                                            className="text-indigo-600/80 font-medium text-sm text-center max-w-xs mt-1">
                                            {getProcessingStatus(planPrediction?.status, elapsed)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isUpscaling && (
                            <div className="render-overlay bg-slate-50/20 backdrop-blur-md">
                                <div
                                    className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-4">
                                    <RefreshCcw className="w-12 h-12 text-indigo-600 animate-spin"/>
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-900 font-semibold tracking-tight text-xl">Enhancing details...</span>
                                        <span
                                            className="text-indigo-600/80 font-medium text-sm text-center max-w-xs mt-1">
                                            {getProcessingStatus(upscalePrediction?.status, elapsed)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel compare">
                    <div className="panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="panel-meta">
                            <p>Technical Visualization</p>
                            <h3>Side by Side</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div
                                className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Left Side</span>
                                <select
                                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none !w-32 pr-2"
                                    value={leftImage || ""}
                                    onChange={(e) => setLeftImage(e.target.value)}
                                >
                                    {project?.source_image_url && <option value={project.source_image_url}
                                                                          className="bg-white text-black">Original
                                        2D</option>}
                                    {planVariants.map((v, i) => (
                                        <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                className="bg-white text-black">
                                            Variant {i + 1}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div
                                className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Right Side</span>
                                <select
                                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none !w-32 pr-2"
                                    value={rightImage || ""}
                                    onChange={(e) => setRightImage(e.target.value)}
                                >
                                    {project?.source_image_url && <option value={project.source_image_url}
                                                                          className="bg-white text-black">Original
                                        2D</option>}
                                    {planVariants.map((v, i) => (
                                        <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                className="bg-white text-black">
                                            Variant {i + 1}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="compare-stage">
                        {leftImage && rightImage ? (
                            <div style={{position: "relative", width: "100%", height: "auto"}}>
                                <ReactCompareSlider
                                    defaultValue={50}
                                    itemOne={<ReactCompareSliderImage src={leftImage} alt="Before: Original floor plan"
                                                                      className="compare-img"/>}
                                    itemTwo={<ReactCompareSliderImage src={rightImage}
                                                                      alt="After: AI 3D architectural render"
                                                                      className="compare-img"/>}
                                />
                                {planPrediction?.status === "succeeded" && (
                                    <div
                                        className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-white/20 flex flex-col gap-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Rate
                                            this render</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    setRating(1);
                                                    toast.success("Thanks for your feedback!");
                                                    if (planPrediction?.id) {
                                                        await supabase
                                                            .from("renders")
                                                            .update({feedback: 'thumbs_up'})
                                                            .eq("prediction_id", planPrediction.id);
                                                    }
                                                }}
                                                className={`p-2 rounded-xl transition-all ${rating === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600'}`}
                                            >
                                                <ThumbsUp className="w-5 h-5"/>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setRating(0);
                                                    toast.success("We'll work on improving this style!");
                                                    if (planPrediction?.id) {
                                                        await supabase
                                                            .from("renders")
                                                            .update({feedback: 'thumbs_down'})
                                                            .eq("prediction_id", planPrediction.id);
                                                    }
                                                }}
                                                className={`p-2 rounded-xl transition-all ${rating === 0 ? 'bg-rose-500 text-white' : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'}`}
                                            >
                                                <ThumbsDown className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="compare-fallback">
                                {project?.source_image_url && (
                                    <img src={project.source_image_url} alt="Before: Original floor plan"
                                         className="compare-img object-cover"/>
                                )}
                            </div>
                        )}
                    </div>

                    {planVariants.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs uppercase opacity-50 font-bold mb-2">Technical Variants</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {project?.source_image_url && (
                                    <div
                                        className={`relative w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${leftImage === project.source_image_url || rightImage === project.source_image_url ? 'border-primary' : 'border-transparent'}`}
                                        onClick={(e) => {
                                            if (e.altKey) setLeftImage(project.source_image_url);
                                            else setRightImage(project.source_image_url);
                                        }}
                                    >
                                        <img src={project.source_image_url} alt="Original source plan"
                                             className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="text-[10px] text-white font-bold">Original</span>
                                        </div>
                                    </div>
                                )}
                                {planVariants.map((v, i) => {
                                    const imgUrl = v.upscaled_image_url || v.rendered_image_url;
                                    const isActive = leftImage === imgUrl || rightImage === imgUrl;
                                    return (
                                        <div
                                            key={v.id}
                                            className={`relative w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${isActive ? 'border-primary' : 'border-transparent'}`}
                                            onClick={(e) => {
                                                if (e.altKey) setLeftImage(imgUrl);
                                                else setRightImage(imgUrl);
                                            }}
                                        >
                                            <img src={imgUrl} alt={`${selectedStyle.name} variant ${i + 1}`}
                                                 className="w-full h-full object-cover"/>
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 px-1">
                                                <span className="text-[10px] text-white">V{i + 1}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ISO COMPARISON CARD */}
                {(isoVariants.length > 0 || isIsoProcessing) && (
                    <div className="panel compare mt-12 relative overflow-hidden">
                        {isIsoProcessing && (
                            <div
                                className="absolute inset-0 z-50 bg-slate-50/20 backdrop-blur-md flex items-center justify-center">
                                <div
                                    className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-4 scale-90">
                                    <RefreshCcw className="w-12 h-12 text-indigo-600 animate-spin"/>
                                    <div className="flex flex-col items-center">
                                        <span
                                            className="text-slate-900 font-semibold tracking-tight text-xl">Rendering...</span>
                                        <span
                                            className="text-indigo-600/80 font-medium text-sm text-center max-w-xs mt-1">
                                            {getProcessingStatus(isoPrediction?.status, elapsed)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="panel-meta">
                                <p>Style Comparison (3D Model)</p>
                                <h3>Isometric Styles</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                    <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Style A</span>
                                    <select
                                        className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none !w-32 pr-2"
                                        value={isoLeftImage || ""}
                                        onChange={(e) => setIsoLeftImage(e.target.value)}
                                    >
                                        {isoVariants.map((v, i) => (
                                            <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                    className="bg-white text-black">
                                                {v.style_id?.toUpperCase() || `ISO ${i + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div
                                    className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                    <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Style B</span>
                                    <select
                                        className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none !w-32 pr-2"
                                        value={isoRightImage || ""}
                                        onChange={(e) => setIsoRightImage(e.target.value)}
                                    >
                                        {isoVariants.map((v, i) => (
                                            <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                    className="bg-white text-black">
                                                {v.style_id?.toUpperCase() || `ISO ${i + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="compare-stage">
                            {isoLeftImage && isoRightImage ? (
                                <div style={{position: "relative", width: "100%", height: "auto"}}>
                                    <ReactCompareSlider
                                        defaultValue={50}
                                        itemOne={<ReactCompareSliderImage src={isoLeftImage} alt="Style A"
                                                                          className="compare-img"/>}
                                        itemTwo={<ReactCompareSliderImage src={isoRightImage} alt="Style B"
                                                                          className="compare-img"/>}
                                    />
                                </div>
                            ) : isoRightImage ? (
                                <div className="compare-fallback">
                                    <img src={isoRightImage} alt="Isometric variant"
                                         className="compare-img object-cover"/>
                                </div>
                            ) : (
                                <div
                                    className="compare-fallback bg-slate-100 dark:bg-slate-800 flex items-center justify-center h-[400px] rounded-2xl">
                                    <p className="text-slate-400">Select isometric variants to compare</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <p className="text-xs uppercase opacity-50 font-bold mb-2">Isometric Styles</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {isoVariants.map((v, i) => {
                                    const imgUrl = v.upscaled_image_url || v.rendered_image_url;
                                    const isActive = isoLeftImage === imgUrl || isoRightImage === imgUrl;
                                    return (
                                        <div
                                            key={v.id}
                                            className={`relative w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${isActive ? 'border-primary' : 'border-transparent'}`}
                                            onClick={(e) => {
                                                if (e.altKey) setIsoLeftImage(imgUrl);
                                                else setIsoRightImage(imgUrl);
                                            }}
                                        >
                                            <img src={imgUrl} alt={`Isometric ${v.style_id}`}
                                                 className="w-full h-full object-cover"/>
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 px-1">
                                                <span
                                                    className="text-[10px] text-white uppercase">{v.style_id?.substring(0, 3)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </section>
            <VisualizerToolbar
                onSpaceChange={(val) => {
                    const context = PROJECT_CONTEXTS.find(c => c.id === val);
                    if (context) setSelectedContext(context);
                }}
                onStyleChange={(val) => {
                    const style = ROOM_STYLES.find(s => s.id === val);
                    if (style) setSelectedStyle(style);
                }}
                onFlooringChange={(val) => {
                    const flooring = FLOORING_MATERIALS.find(f => f.id === val);
                    if (flooring) setSelectedFlooring(flooring);
                }}
                onMoodChange={(val) => {
                    const mood = LIGHTING_MOODS.find(l => l.id === val);
                    if (mood) setSelectedLighting(mood);
                }}
                onViewChange={(val) => {
                    const view = CAMERA_VIEWS.find(v => v.id === val);
                    if (view) setSelectedView(view);
                }}
                // CHỈ nhấn nút này mới gọi runGeneration
                onGenerate={(viewId) => runGeneration(undefined, undefined, undefined, undefined, undefined, true, viewId)}
                onUpscale={handleUpscale}
                onExport={handleExport}
                onShare={handleShare}
                selectedStyle={selectedStyle}
                selectedContext={selectedContext}
                selectedFlooring={selectedFlooring}
                selectedLighting={selectedLighting}
                selectedView={selectedView}
                isPlanProcessing={isPlanProcessing}
                isIsoProcessing={isIsoProcessing}
                isUpscaling={isUpscaling}
                hasCurrentImage={!!currentImage}
                isPublic={isPublic}
                onTogglePublic={handleTogglePublic}
                currentPlanExists={currentPlanExists}
            />
        </div>
    );
}

export default function VisualizerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <VisualizerContent/>
        </Suspense>
    );
}
