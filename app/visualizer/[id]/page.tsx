"use client";

import {useRouter, useSearchParams, useParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {Box, X} from "lucide-react";
import Button from "@/components/ui/Button";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {ROOM_STYLES, PROJECT_CONTEXTS} from "@/lib/constants";
import VisualizerToolbar from "@/components/VisualizerToolbar";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function VisualizerPage() {
    const {id} = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sourceImage = searchParams.get("image");
    const projectName = searchParams.get("name") || `Residence ${id}`;

    const hasInitialGenerated = useRef(false);
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

    const handleBack = () => router.push("/");

    const fetchVariants = async (projectId: string) => {
        if (!sourceImage) return;

        const {data, error} = await supabase
            .from("renders")
            .select("*")
            .eq("source_image_url", sourceImage)
            .eq("status", "succeeded")
            .order("created_at", {ascending: true});

        if (error) {
            console.error("Error fetching variants:", error);
            return;
        }

        if (data) {
            console.log("Fetched variants:", data.length);
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
                alert("This image has already been upscaled!");
                setIsUpscaling(false);
                return;
            }

            await resumeUpscale(data.id);
        } catch (error: any) {
            console.error("Upscale failed:", error);
            alert(`Upscale failed: ${error.message}`);
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
                // Refresh variants
                if (id) fetchVariants(id as string);

                // Fetch the updated record to get the permanent Supabase URL
                const {data: updatedRecord} = await supabase
                    .from("renders")
                    .select("upscaled_image_url")
                    .eq("upscale_prediction_id", prediction.id)
                    .single();

                if (updatedRecord?.upscaled_image_url) {
                    setCurrentImage(updatedRecord.upscaled_image_url);
                } else {
                    const output = prediction.output;
                    const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;
                    setCurrentImage(renderedUrl);
                }
                alert("Image successfully upscaled to 4K!");
            } else {
                throw new Error("Upscale prediction failed");
            }
        } catch (error: any) {
            console.error("Resuming upscale failed:", error);
            alert(`Upscale failed: ${error.message}`);
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

    const runGeneration = async (styleOverride?: typeof ROOM_STYLES[0], contextOverride?: typeof PROJECT_CONTEXTS[0], forceNew = false) => {
        if (!sourceImage) return;

        const styleToUse = styleOverride || selectedStyle;
        const contextToUse = contextOverride || selectedContext;

        try {
            setIsProcessing(true);
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: sourceImage,
                    projectName: projectName,
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
            alert("Failed to generate 3D view. Please try again.");
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
                // Refresh variants
                if (id) fetchVariants(id as string);

                // If the backend updated the URL to Supabase storage, we should fetch the record again
                // to get that permanent URL, or the backend should return it in the prediction response.
                // Since our /api/predictions/[id] returns the Replicate prediction object, we'll
                // fetch the record from our database to get the permanent URL.
                const {data: updatedRecord} = await supabase
                    .from("renders")
                    .select("rendered_image_url")
                    .eq("prediction_id", prediction.id)
                    .single();

                if (updatedRecord?.rendered_image_url) {
                    setCurrentImage(updatedRecord.rendered_image_url);
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
            alert("Failed to resume 3D view. Please try again.");
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
        if (sourceImage) {
            setLeftImage(sourceImage);
        }
        if (variants.length > 0) {
            const latest = variants[variants.length - 1];
            setRightImage(latest.upscaled_image_url || latest.rendered_image_url);
        } else if (currentImage) {
            setRightImage(currentImage);
        }
    }, [sourceImage, variants]);

    useEffect(() => {
        if (hasInitialGenerated.current || !sourceImage) return;
        hasInitialGenerated.current = true;

        const init = async () => {
            if (id) {
                const {data: existing} = await supabase
                    .from("renders")
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();

                if (existing) {
                    if (existing.status === "succeeded" && (existing.upscaled_image_url || existing.rendered_image_url)) {
                        setCurrentImage(existing.upscaled_image_url || existing.rendered_image_url);
                        return;
                    } else if (existing.status === "processing" || existing.status === "starting") {
                        resumePrediction(existing.prediction_id);
                        return;
                    }
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
    }, [sourceImage, searchParams, id]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo"/>
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
                            <h2>{projectName}</h2>
                            <p className="note">Created by You</p>
                        </div>
                    </div>

                    <div className={`render-area ${(isProcessing || isUpscaling) ? "is-processing" : ""}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img"/>
                        ) : (
                            <div className="render-placeholder">
                                {sourceImage && (
                                    <img src={sourceImage} alt="Original" className="render-fallback"/>
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
                                    {sourceImage && <option value={sourceImage} className="bg-white text-black">Original
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
                                    {sourceImage && <option value={sourceImage} className="bg-white text-black">Original
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
                                    itemOne={<ReactCompareSliderImage src={leftImage} alt="Left"
                                                                      className="compare-img"/>}
                                    itemTwo={<ReactCompareSliderImage src={rightImage} alt="Right"
                                                                      className="compare-img"/>}
                                />
                            </div>
                        ) : (
                            <div className="compare-fallback">
                                {sourceImage && (
                                    <img src={sourceImage} alt="Before" className="compare-img object-cover"/>
                                )}
                            </div>
                        )}
                    </div>

                    {variants.length > 0 && (
                        <div className="mt-6">
                            <p className="text-xs uppercase opacity-50 font-bold mb-2">Available Variants</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {sourceImage && (
                                    <div
                                        className={`relative w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${leftImage === sourceImage || rightImage === sourceImage ? 'border-primary' : 'border-transparent'}`}
                                        onClick={(e) => {
                                            if (e.altKey) setLeftImage(sourceImage);
                                            else setRightImage(sourceImage);
                                        }}
                                    >
                                        <img src={sourceImage} alt="Original" className="w-full h-full object-cover"/>
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
                                            <img src={imgUrl} alt={`Variant ${i + 1}`}
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
                selectedStyle={selectedStyle}
                selectedContext={selectedContext}
                isProcessing={isProcessing}
                isUpscaling={isUpscaling}
                hasCurrentImage={!!currentImage}
            />
        </div>
    );
}
