"use client";

import {useRouter, useSearchParams, useParams} from "next/navigation";
import {useEffect, useRef, useState, Suspense} from "react";
import {RefreshCcw, Sparkles, X} from "lucide-react";
import RoomifyLogo from "@/components/RoomifyLogo";
import {toast} from "sonner";
import Button from "@/components/ui/Button";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {ROOM_STYLES, PROJECT_CONTEXTS} from "@/lib/constants";
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [prediction, setPrediction] = useState<any>(null);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [upscalePrediction, setUpscalePrediction] = useState<any>(null);
    const [selectedStyle, setSelectedStyle] = useState(ROOM_STYLES[0]);
    const [selectedContext, setSelectedContext] = useState(PROJECT_CONTEXTS[0]);
    const [variants, setVariants] = useState<any[]>([]);
    const [leftImage, setLeftImage] = useState<string | null>(null);
    const [rightImage, setRightImage] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [showcaseId, setShowcaseId] = useState<string | null>(null);
    const {refreshCredits} = useCredits();

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

    const runGeneration = async (styleOverride?: typeof ROOM_STYLES[0], contextOverride?: typeof PROJECT_CONTEXTS[0], forceNew = false) => {
        if (!project?.source_image_url) return;

        const styleToUse = styleOverride || selectedStyle;
        const contextToUse = contextOverride || selectedContext;

        try {
            setIsProcessing(true);
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
                    forceNew
                }),
            });

            const prediction = await response.json();
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(prediction.error);
            }

            if (prediction.isCacheHit) {
                setCurrentImage(prediction.output);
                setPrediction(prediction);
                setIsProcessing(false);
                return;
            }

            // Update URL with predictionId
            const params = new URLSearchParams(window.location.search);
            params.set("predictionId", prediction.id);

            window.history.replaceState({}, "", `/visualizer/${id}?${params.toString()}`);

            await resumePrediction(prediction.id);
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error("Failed to generate 3D view. Please try again.");
            setIsProcessing(false);
        }
    };

    const resumePrediction = async (predictionId: string) => {
        try {
            setIsProcessing(true);
            let predictionResponse = await fetch("/api/predictions/" + predictionId);
            let prediction = await predictionResponse.json();

            if (predictionResponse.status !== 200) {
                throw new Error(prediction.error);
            }

            setPrediction(prediction);

            // Polling mechanism
            while (prediction.status !== "succeeded" && prediction.status !== "failed") {
                await sleep(2000);
                const response = await fetch("/api/predictions/" + prediction.id);
                prediction = await response.json();
                if (response.status !== 200) {
                    throw new Error(prediction.error);
                }
                setPrediction(prediction);
            }

            if (prediction.status === "succeeded") {
                // Refresh variants and credits
                if (id) fetchVariants(id as string);

                // Add a small delay to allow database triggers/RPCs to finish
                setTimeout(() => {
                    refreshCredits();
                }, 1000);

                // If the backend updated the URL to Supabase storage, we should fetch the record again
                // to get that permanent URL, or the backend should return it in the prediction response.
                // Since our /api/predictions/[id] returns the Replicate prediction object, we'll
                // fetch the record from our database to get the permanent URL.
                const {data: updatedRecord} = await supabase
                    .from("renders")
                    .select("rendered_image_url, project_id")
                    .eq("prediction_id", prediction.id)
                    .single();

                if (updatedRecord?.rendered_image_url) {
                    setCurrentImage(updatedRecord.rendered_image_url);
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
                    setCurrentImage(renderedUrl);
                }
            } else {
                throw new Error("Prediction failed");
            }
        } catch (error) {
            console.error("Resuming prediction failed:", error);
            toast.error("Failed to resume 3D view. Please try again.");
        } finally {
            setIsProcessing(false);
        }
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
        if (variants.length > 0) {
            const latest = variants[variants.length - 1];
            setRightImage(latest.upscaled_image_url || latest.rendered_image_url);
        } else if (currentImage) {
            setRightImage(currentImage);
        }
    }, [project, variants, currentImage]);

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

                    <div className={`render-area ${(isProcessing || isUpscaling) ? "is-processing" : ""}`}>
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

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner"/>
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">
                    {prediction?.status === "starting" ? "Starting Replicate engine..." :
                        prediction?.status === "processing" ? "AI is imagining your room..." :
                            "Generating your 3D visualization"}
                  </span>
                                </div>
                            </div>
                        )}

                        {isUpscaling && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner"/>
                                    <span className="title">Enhancing details...</span>
                                    <span className="subtitle">
                    {upscalePrediction?.status === "starting" ? "Preparing AI Upscaler..." :
                        upscalePrediction?.status === "processing" ? "Adding 4K textures and details..." :
                            "Upscaling your render to 4K"}
                  </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel compare">
                    <div className="panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="panel-meta">
                            <p>Comparison</p>
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
                                    {variants.map((v, i) => (
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
                                    {variants.map((v, i) => (
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

                    {variants.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs uppercase opacity-50 font-bold mb-2">Available Variants</p>
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
                                {variants.map((v, i) => {
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
            </section>
            <VisualizerToolbar
                onGenerate={(style, context, isVariant) => {
                    if (style) {
                        setSelectedStyle(style);
                        runGeneration(style);
                    } else if (context) {
                        setSelectedContext(context);
                        runGeneration(undefined, context);
                    } else if (isVariant) {
                        runGeneration(undefined, undefined, true);
                    }
                }}
                onUpscale={handleUpscale}
                onExport={handleExport}
                onShare={handleShare}
                selectedStyle={selectedStyle}
                selectedContext={selectedContext}
                isProcessing={isProcessing}
                isUpscaling={isUpscaling}
                hasCurrentImage={!!currentImage}
                isPublic={isPublic}
                onTogglePublic={handleTogglePublic}
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
