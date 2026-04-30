"use client";

import {useRouter, useSearchParams, useParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {Box, Download, RefreshCcw, Share2, X, Palette} from "lucide-react";
import Button from "@/components/ui/Button";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {ROOM_STYLES} from "@/lib/constants";

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
    const [selectedStyle, setSelectedStyle] = useState(ROOM_STYLES[0]);

    const handleBack = () => router.push("/");

    const checkExistingRender = async (projectId: string) => {
        // Try to find by UUID first, then by predictionId as fallback if id is not UUID
        const {data, error} = await supabase
            .from("renders")
            .select("*")
            .eq("id", projectId)
            .maybeSingle();

        if (error) {
            console.warn("Error fetching from Supabase by ID (might not be a UUID):", error);
            // Fallback: search by prediction_id if the URL id was actually a prediction ID
            const {data: predData} = await supabase
                .from("renders")
                .select("*")
                .eq("prediction_id", projectId)
                .maybeSingle();
            return predData;
        }

        return data;
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

    const runGeneration = async (styleOverride?: typeof ROOM_STYLES[0]) => {
        if (!sourceImage) return;

        const styleToUse = styleOverride || selectedStyle;

        try {
            setIsProcessing(true);
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: sourceImage,
                    projectName: projectName,
                    styleKeywords: styleToUse.keywords
                }),
            });

            const prediction = await response.json();
            if (response.status !== 201) {
                throw new Error(prediction.error);
            }

            // Update URL with predictionId
            const params = new URLSearchParams(window.location.search);
            params.set("predictionId", prediction.id);

            // Fetch the newly created record from Supabase to get the actual UUID
            const {data: newRecord} = await supabase
                .from("renders")
                .select("id")
                .eq("prediction_id", prediction.id)
                .single();

            const finalId = newRecord?.id || id;

            window.history.replaceState({}, "", `/visualizer/${finalId}?${params.toString()}`);

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
        if (hasInitialGenerated.current || !sourceImage) return;
        hasInitialGenerated.current = true;

        const init = async () => {
            if (id) {
                const existing = await checkExistingRender(id as string);
                if (existing) {
                    if (existing.status === "succeeded" && existing.rendered_image_url) {
                        setCurrentImage(existing.rendered_image_url);
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

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{projectName}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            <div className="style-selector">
                                <Palette className="w-4 h-4 mr-2 opacity-50"/>
                                <select
                                    value={selectedStyle.id}
                                    onChange={(e) => {
                                        const style = ROOM_STYLES.find(s => s.id === e.target.value);
                                        if (style) setSelectedStyle(style);
                                    }}
                                    className="style-select"
                                    disabled={isProcessing}
                                >
                                    {ROOM_STYLES.map(style => (
                                        <option key={style.id} value={style.id}>{style.name}</option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => runGeneration()}
                                    disabled={isProcessing}
                                    className="ml-2"
                                >
                                    Re-render
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2"/> Export
                            </Button>
                            <Button size="sm" className="share" disabled>
                                <Share2 className="w-4 h-4 mr-2"/> Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
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
                    </div>
                </div>

                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Comparison</p>
                            <h3>Before and After</h3>
                        </div>
                        <div className="hint">Drag to compare</div>
                    </div>

                    <div className="compare-stage">
                        {sourceImage && currentImage ? (
                            <div style={{position: "relative", width: "100%", height: "auto"}}>
                                <ReactCompareSlider
                                    defaultValue={50}
                                    itemOne={<ReactCompareSliderImage src={sourceImage} alt="before"
                                                                      className="compare-img"/>}
                                    itemTwo={<ReactCompareSliderImage src={currentImage} alt="after"
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
                </div>
            </section>
        </div>
    );
}
