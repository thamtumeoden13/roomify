"use client";

import {useRouter, useSearchParams, useParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "@/components/ui/Button";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

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

    const handleBack = () => router.push("/");

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

    const runGeneration = async () => {
        if (!sourceImage) return;

        try {
            setIsProcessing(true);
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({image: sourceImage}),
            });

            let prediction = await response.json();
            if (response.status !== 201) {
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
                // Replicate SDXL Canny output is usually an array of strings [canny_edge, final_image]
                const output = prediction.output;
                const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;
                setCurrentImage(renderedUrl);
            } else {
                throw new Error("Prediction failed");
            }
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate 3D view. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (hasInitialGenerated.current || !sourceImage) return;
        hasInitialGenerated.current = true;
        runGeneration();
    }, [sourceImage]);

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
                            <div style={{position: "relative", width: "100%", aspectRatio: "1/1"}}>
                                <ReactCompareSlider
                                    defaultValue={50}
                                    style={{width: "100%", height: "100%", position: "absolute", top: 0, left: 0}}
                                    itemOne={<ReactCompareSliderImage src={sourceImage} alt="before"
                                                                      className="compare-img"/>}
                                    itemTwo={<ReactCompareSliderImage src={currentImage} alt="after"
                                                                      className="compare-img"/>}
                                />
                            </div>
                        ) : (
                            <div className="compare-fallback">
                                {sourceImage && (
                                    <img src={sourceImage} alt="Before" className="compare-img"
                                         style={{aspectRatio: "1/1"}}/>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
