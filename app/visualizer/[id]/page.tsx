"use client";

import {useRouter, useSearchParams, useParams} from "next/navigation";
import {useEffect, useRef, useState, Suspense} from "react";
import {
    RefreshCcw,
    Sparkles,
    Zap,
    X,
    ThumbsUp,
    ThumbsDown,
    Info,
    Home,
    Layers,
    Sun,
    Trash2,
    Edit,
    Check,
    Eraser,
    AlertCircle
} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import RoomifyLogo from "@/components/RoomifyLogo";
import {toast} from "sonner";
import Button from "@/components/ui/Button";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {ROOM_STYLES, PROJECT_CONTEXTS, FLOORING_MATERIALS, LIGHTING_MOODS, CAMERA_VIEWS} from "@/lib/constants";
import VisualizerToolbar from "@/components/VisualizerToolbar";
import {useCredits} from "@/lib/hooks/useCredits";
import {Tooltip} from "@/components/ui/Tooltip";
import {cn, processFloorPlan} from "@/lib/utils";
import InpaintCanvas, {type InpaintCanvasHandle} from "@/components/InpaintCanvas";

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
    const [customInstructions, setCustomInstructions] = useState("");
    const [rating, setRating] = useState<number | null>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [leftImage, setLeftImage] = useState<string | null>(null);
    const [rightImage, setRightImage] = useState<string | null>(null);

    // New Comparison States for Isometric
    const [isoLeftImage, setIsoLeftImage] = useState<string | null>(null);
    const [isoRightImage, setIsoRightImage] = useState<string | null>(null);

    const [isError, setIsError] = useState(false);

    // Edit Mode States
    const [isEditMode, setIsEditMode] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const inpaintCanvasRef = useRef<InpaintCanvasHandle>(null);

    const [imgOffsets, setImgOffsets] = useState({top: 16, right: 16});

    const handleImageLoad = (e: any) => {
        const img = e.target;
        const container = img.closest('.compare-stage');
        if (!img || !container) return;

        const containerRect = container.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        // Calculate the top and right offsets relative to the container
        const top = Math.max(16, imgRect.top - containerRect.top + 16);
        const right = Math.max(16, containerRect.right - imgRect.right + 16);

        setImgOffsets({top, right});
    };

    const [showToast, setShowToast] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [showcaseId, setShowcaseId] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const isUpscaled = !!(selectedVariant?.upscaled_image_url || (currentImage && variants.find(v => v.upscaled_image_url === currentImage)));
    const {refreshCredits} = useCredits();

    const getVariantLabel = (v: any) => {
        const style = ROOM_STYLES.find(s => s.id === v.style_id)?.name || v.style_id;
        const flooring = FLOORING_MATERIALS.find(f => f.id === v.flooring_id)?.name || v.flooring_id;
        const mood = LIGHTING_MOODS.find(l => l.id === v.lighting_id)?.name || v.lighting_id;
        return `${style} • ${flooring} • ${mood}`;
    };

    const getVariantLabelByUrl = (url: string) => {
        const variant = variants.find(v => v.upscaled_image_url === url || v.rendered_image_url === url);
        if (!variant) return url === project?.source_image_url ? "Original 2D Plan" : "Selected Plan";
        return getVariantLabel(variant);
    };

    const getHighResUrl = (v: any) => v?.upscaled_image_url || v?.rendered_image_url;

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
        const imageToUpscale = selectedVariant ? getHighResUrl(selectedVariant) : currentImage;
        const renderIdToUse = selectedVariant?.id || null;

        if (!imageToUpscale || !id) return;

        try {
            setIsUpscaling(true);
            const response = await fetch("/api/upscale", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: imageToUpscale,
                    renderId: renderIdToUse || id // Fallback to project ID if no variant selected, but ideally we want the render ID
                }),
            });

            const data = await response.json();
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(data.error);
            }

            setUpscalePrediction(data);

            if (data.alreadyExists) {
                setCurrentImage(data.output);
                toast.info("This image has already been upscaled!");
                setIsUpscaling(false);
                return;
            }

        } catch (error: any) {
            console.error("Upscale failed:", error);
            toast.error(`Upscale failed: ${error.message}`);
            setIsUpscaling(false);
        }
    };


    const handleDeleteVariant = async (variantId: string) => {
        try {
            const variantToDelete = variants.find(v => v.id === variantId);
            if (!variantToDelete) return;

            // 1. Delete from Supabase Database
            const {error: dbError} = await supabase
                .from("renders")
                .delete()
                .eq("id", variantId);

            if (dbError) throw dbError;

            // 2. Optional: Delete from Supabase Storage
            const getFileName = (url: string) => url.split('/').pop()?.split('?')[0];

            if (variantToDelete.rendered_image_url) {
                const fileName = getFileName(variantToDelete.rendered_image_url);
                if (fileName) {
                    await supabase.storage.from("renders").remove([fileName]);
                }
            }
            if (variantToDelete.upscaled_image_url) {
                const fileName = getFileName(variantToDelete.upscaled_image_url);
                if (fileName) {
                    await supabase.storage.from("renders").remove([fileName]);
                }
            }

            // 3. Update local state
            const updatedVariants = variants.filter(v => v.id !== variantId);
            setVariants(updatedVariants);

            // 3.5 Update project rendered_image_url if it was the deleted variant
            if (project?.rendered_image_url === variantToDelete.upscaled_image_url ||
                project?.rendered_image_url === variantToDelete.rendered_image_url) {

                // Find another suitable thumbnail for the project
                const otherVariants = updatedVariants.filter(v => v.id !== variantId);
                let newThumbnail = null;
                if (otherVariants.length > 0) {
                    const latest = otherVariants[otherVariants.length - 1];
                    newThumbnail = latest.upscaled_image_url || latest.rendered_image_url;
                }

                await supabase
                    .from("projects")
                    .update({rendered_image_url: newThumbnail})
                    .eq("id", project.id);

                setProject({...project, rendered_image_url: newThumbnail});
            }

            // 4. Fallback for comparison sliders
            const deletedUrl = variantToDelete.upscaled_image_url || variantToDelete.rendered_image_url;
            const isPlan = variantToDelete.view_id === 'plan' || !variantToDelete.view_id;

            if (isPlan) {
                if (rightImage === deletedUrl) {
                    const remainingPlan = updatedVariants.filter(v => v.view_id === 'plan' || !v.view_id);
                    if (remainingPlan.length > 0) {
                        setRightImage(getHighResUrl(remainingPlan[remainingPlan.length - 1]));
                    } else {
                        setRightImage(project?.source_image_url || null);
                    }
                }
                if (leftImage === deletedUrl) {
                    setLeftImage(project?.source_image_url || null);
                }
            } else {
                if (isoRightImage === deletedUrl || isoLeftImage === deletedUrl) {
                    const remainingIso = updatedVariants.filter(v => v.view_id === 'isometric');
                    if (isoRightImage === deletedUrl) {
                        setIsoRightImage(remainingIso.length > 0 ? getHighResUrl(remainingIso[remainingIso.length - 1]) : null);
                    }
                    if (isoLeftImage === deletedUrl) {
                        setIsoLeftImage(remainingIso.length > 1 ? getHighResUrl(remainingIso[remainingIso.length - 2]) : null);
                    }
                }
            }

            if (currentImage === deletedUrl) {
                const remaining = updatedVariants.length > 0 ? updatedVariants[updatedVariants.length - 1] : null;
                setCurrentImage(remaining ? getHighResUrl(remaining) : null);
            }

            toast.success("Variant deleted successfully");
        } catch (error: any) {
            console.error("Error deleting variant:", error);
            toast.error(`Failed to delete variant: ${error.message}`);
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

        setIsError(false);

        try {
            if (isPlan) {
                setIsPlanProcessing(true);
            } else {
                setIsIsoProcessing(true);
            }

            // --- INPAINT MASK CAPTURE ---
            let maskToUse = null;
            let detectedWidth = undefined;
            let detectedHeight = undefined;

            if (isEditMode) {
                if (!currentImage) {
                    toast.error("Please generate a 3D view before using the Refine tool");
                    return;
                }
                const maskData = inpaintCanvasRef.current?.getMask();
                if (maskData) {
                    maskToUse = maskData.mask;
                    detectedWidth = maskData.width;
                    detectedHeight = maskData.height;
                }
                console.log("In-painting mode active, mask captured:", maskToUse ? "Yes (Base64)" : "No");
            }

            // --- IMAGE PRE-PROCESSING ---
            // Process the floor plan to remove/blur text for better AI results
            let imageToUse = (isEditMode && currentImage) ? currentImage : project.source_image_url;

            // Chỉ apply pre-processing nếu không phải in-paint mode
            if (!isEditMode) {
                try {
                    const processedBlob = await processFloorPlan(project.source_image_url);
                    if (processedBlob) {
                        const fileName = `processed_${Math.random().toString(36).slice(2, 11)}.png`;
                        const formData = new FormData();
                        formData.append('file', new File([processedBlob], fileName, {type: 'image/png'}));

                        const uploadRes = await fetch(`/api/upload?filename=${fileName}`, {
                            method: 'POST',
                            body: formData,
                        });

                        if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            imageToUse = uploadData.url;
                            console.log("Using processed image for generation:", imageToUse);
                        }
                    }
                } catch (procError) {
                    console.error("Failed to process image, falling back to original:", procError);
                }
            }
            // --- END PRE-PROCESSING ---

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: imageToUse,
                    mask: maskToUse,
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
                    width: detectedWidth,
                    height: detectedHeight,
                    forceNew,
                    customInstructions
                }),
            });

            const prediction = await response.json();
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(prediction.error);
            }

            if (prediction.isCacheHit) {
                if (isPlan) {
                    setCurrentImage(prediction.output);
                    setRightImage(prediction.output);
                    setPlanPrediction(prediction);
                    setIsPlanProcessing(false);
                } else {
                    setIsoRightImage(prediction.output);
                    setIsoPrediction(prediction);
                    setIsIsoProcessing(false);
                }
                return;
            }

            // Update URL with predictionId
            const params = new URLSearchParams(window.location.search);
            params.set("predictionId", prediction.id);

            window.history.replaceState({}, "", `/visualizer/${id}?${params.toString()}`);

        } catch (error: any) {
            console.error("Generation failed:", error);
            setIsError(true);
            toast.error(error.message || "Failed to generate 3D view. Please try again.");
            if (isPlan) {
                setIsPlanProcessing(false);
            } else {
                setIsIsoProcessing(false);
            }
        }
    };

    const getProcessingStatus = (status: string, elapsed: number) => {
        if (status === "succeeded") return "Render Complete!";
        if (status === "failed") return "Render Failed.";
        if (status === "starting") return "Initializing AI Engine...";
        if (status === "processing") return "AI is generating your 3D render...";

        if (elapsed < 3000) return "Step 1 (0-20%): Analyzing floor plan architecture...";
        if (elapsed < 8000) return `Step 2 (20-60%): Applying ${selectedFlooring.name} and ${selectedStyle.name}...`;
        if (elapsed < 14000) return `Step 3 (60-90%): Calculating ${selectedLighting.name} shadows...`;
        return "Step 4 (90-100%): Finalizing 3D render...";
    };
    useEffect(() => {
        if (id) {
            fetchVariants(id as string);
        }
    }, [id]);

    useEffect(() => {
        if (project?.source_image_url && !leftImage) {
            setLeftImage(project.source_image_url);
        }
        if (planVariants.length > 0) {
            const latest = planVariants[planVariants.length - 1];
            const latestUrl = latest.upscaled_image_url || latest.rendered_image_url;

            // Only auto-update if we don't have a right image yet OR if a NEW variant was just added
            // A "new" variant is detected if the current rightImage is not in the planVariants list,
            // or if we just want to track the latest by default when it first arrives.
            if (!rightImage) {
                setRightImage(latestUrl);
            } else {
                // Check if rightImage is currently pointing to a variant that is NOT the latest, 
                // and if the latest is actually NEWER than what we have.
                // To keep it simple: if rightImage is one of the planVariants but not the latest one, 
                // it means the user might have manually selected it. 
                // If rightImage is NOT in planVariants (e.g. it was currentImage placeholder), we update.
                const isManualSelection = planVariants.some(v => (v.upscaled_image_url || v.rendered_image_url) === rightImage);
                if (!isManualSelection && rightImage !== latestUrl && rightImage !== project?.source_image_url) {
                    setRightImage(latestUrl);
                }
            }
        } else if (currentImage && (selectedView.id === 'plan' || !selectedView.id) && !rightImage) {
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
            } else {
                // Only auto-update Right side if current selection is not one of the variants (e.g. initial load or processing)
                const isManualSelection = isoVariants.some(v => (v.upscaled_image_url || v.rendered_image_url) === isoRightImage);
                const latest = isoVariants[isoVariants.length - 1];
                const latestUrl = latest.upscaled_image_url || latest.rendered_image_url;
                if (!isManualSelection && isoRightImage !== latestUrl) {
                    setIsoRightImage(latestUrl);
                }
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
                .eq("status", "succeeded") // Only show succeeded ones as currentImage candidate
                .order("created_at", {ascending: false});

            if (existingRenders && existingRenders.length > 0) {
                const latest = existingRenders[0];
                if (latest.status === "succeeded" && (latest.upscaled_image_url || latest.rendered_image_url)) {
                    setCurrentImage(latest.upscaled_image_url || latest.rendered_image_url);
                    setSelectedVariant(latest);
                    return;
                }
            }

            // If no successful renders, also check if there are ANY renders that might be processing
            const {data: allRenders} = await supabase
                .from("renders")
                .select("*")
                .eq("project_id", id)
                .order("created_at", {ascending: false})
                .limit(1);

            if (allRenders && allRenders.length > 0) {
                const latest = allRenders[0];
                if (latest.status === "processing" || latest.status === "starting") {
                    if (latest.view_id === 'isometric') {
                        setIsIsoProcessing(true);
                    } else {
                        setIsPlanProcessing(true);
                    }
                    return;
                }
            }

            const predictionId = searchParams.get("predictionId");
            if (predictionId) {
                // Wait for realtime subscription
                setIsPlanProcessing(true);
            } else {
                runGeneration();
            }
        };

        init();
    }, [project, searchParams, id]);

    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`project-renders-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "renders",
                    filter: `project_id=eq.${id}`,
                },
                async (payload) => {
                    console.log("Realtime update received:", payload);
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;
                    const predictionId = payload.new.prediction_id;
                    const upscalePredictionId = payload.new.upscale_prediction_id;

                    console.log(`Status change for project ${id}: ${oldStatus} -> ${newStatus}`);
                    console.log(`Payload IDs - prediction_id: ${predictionId}, upscale_prediction_id: ${upscalePredictionId}`);

                    // Update the correct prediction state
                    if (predictionId) {
                        if (payload.new.view_id === 'isometric') {
                            console.log("Updating isoPrediction state");
                            setIsoPrediction(payload.new);
                        } else {
                            console.log("Updating planPrediction state");
                            setPlanPrediction(payload.new);
                        }
                    }

                    if (upscalePredictionId) {
                        console.log("Updating upscalePrediction state");
                        setUpscalePrediction(payload.new);
                    }

                    if (newStatus === "succeeded") {
                        await fetchVariants(id as string);

                        const finalUrl = payload.new.upscaled_image_url || payload.new.rendered_image_url;
                        const viewId = payload.new.view_id;

                        if (viewId === "plan" || !viewId) {
                            setCurrentImage(finalUrl);
                            setRightImage(finalUrl);
                        } else if (viewId === "isometric") {
                            setIsoRightImage(finalUrl);
                        }

                        setIsPlanProcessing(false);
                        setIsIsoProcessing(false);
                        setIsUpscaling(false);
                        // States already updated above
                        refreshCredits();
                        toast.success("Design updated successfully!");
                    } else if (newStatus === "failed") {
                        setIsPlanProcessing(false);
                        setIsIsoProcessing(false);
                        setIsUpscaling(false);
                        setIsError(true);
                        // States already updated above
                        toast.error("Generation failed. Please try again.");
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Realtime subscription status for project ${id}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

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

            <section className="content pb-[280px] lg:pb-32">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || "Loading..."}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        {selectedVariant && (
                            <div className="flex flex-wrap gap-4 mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400">Style</span>
                                    <span className="text-sm font-medium text-zinc-900">
                                        {ROOM_STYLES.find(s => s.id === selectedVariant.style_id)?.name || selectedVariant.style_id}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400">Mood</span>
                                    <span className="text-sm font-medium text-zinc-900">
                                        {LIGHTING_MOODS.find(l => l.id === selectedVariant.lighting_id)?.name || selectedVariant.lighting_id}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400">Flooring</span>
                                    <span className="text-sm font-medium text-zinc-900">
                                        {FLOORING_MATERIALS.find(f => f.id === selectedVariant.flooring_id)?.name || selectedVariant.flooring_id}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400">Context</span>
                                    <span className="text-sm font-medium text-zinc-900">
                                        {PROJECT_CONTEXTS.find(c => c.id === selectedVariant.project_context)?.name || selectedVariant.project_context}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className={`render-area bg-slate-50 ${(isPlanProcessing || isUpscaling || isError) ? "is-processing" : ""}`}>
                        {currentImage ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img src={currentImage} alt={`${selectedStyle.name} style AI architectural render`}
                                     className="render-img" loading="eager"
                                     style={{
                                         width: '100%',
                                         height: 'auto',
                                         maxHeight: 'calc(100vh - 280px)',
                                         objectFit: 'contain'
                                     }}/>
                                {isUpscaled && (
                                    <div
                                        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-xl animate-in fade-in zoom-in duration-500">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/>
                                        <span
                                            className="text-[10px] font-black text-white tracking-[0.1em] uppercase">4K ULTRA HD</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="render-placeholder">
                                {project?.source_image_url && (
                                    <img src={project.source_image_url} alt="Original floor plan"
                                         className="render-fallback"
                                         loading="eager"
                                         style={{
                                             width: '100%',
                                             height: 'auto',
                                             maxHeight: 'calc(100vh - 280px)',
                                             objectFit: 'contain'
                                         }}/>
                                )}
                            </div>
                        )}

                        <AnimatePresence>
                            {isError && (
                                <motion.div
                                    initial={{opacity: 0, scale: 0.9}}
                                    animate={{opacity: 1, scale: 1}}
                                    exit={{opacity: 0, scale: 0.9}}
                                    className="render-overlay bg-slate-50/20 backdrop-blur-md z-50"
                                >
                                    <div
                                        className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-6 max-w-md mx-auto text-center">
                                        <div
                                            className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                            <AlertCircle className="w-10 h-10 text-red-500"/>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <h3 className="text-slate-900 font-bold tracking-tight text-2xl">Generation
                                                Failed</h3>
                                            <p className="text-slate-600 font-medium text-sm leading-relaxed">
                                                Something went wrong while processing your plan. Don't worry, if the
                                                process didn't start, your credits might not have been deducted.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 w-full">
                                            <Button
                                                variant="primary"
                                                className="flex-1 shadow-lg shadow-indigo-200"
                                                onClick={() => runGeneration()}
                                            >
                                                Try Again
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setCurrentImage(null);
                                                    setIsError(false);
                                                }}
                                            >
                                                Back to Original
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {isPlanProcessing && (
                                <motion.div
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                    className="render-overlay bg-slate-50/20 backdrop-blur-md"
                                >
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
                                </motion.div>
                            )}

                            {isUpscaling && (
                                <motion.div
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                    className="render-overlay bg-slate-50/20 backdrop-blur-md"
                                >
                                    <div
                                        className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-4">
                                        <RefreshCcw className="w-12 h-12 text-indigo-600 animate-spin"/>
                                        <div className="flex flex-col items-center">
                                            <span
                                                className="text-slate-900 font-semibold tracking-tight text-xl">Enhancing details...</span>
                                            <span
                                                className="text-indigo-600/80 font-medium text-sm text-center max-w-xs mt-1">
                                                {getProcessingStatus(upscalePrediction?.status, elapsed)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="panel compare mt-12 relative overflow-hidden">
                    <AnimatePresence>
                        {isError && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                className="absolute inset-0 z-[60] bg-slate-50/20 backdrop-blur-md flex items-center justify-center"
                            >
                                <div
                                    className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-4 scale-90 max-w-sm text-center">
                                    <AlertCircle className="w-12 h-12 text-red-500"/>
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-900 font-semibold tracking-tight text-xl">Generation Failed</span>
                                        <p className="text-slate-500 text-sm mt-1">Please check the main viewport for
                                            details.</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsError(false)}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {isPlanProcessing && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                className="absolute inset-0 z-50 bg-slate-50/20 backdrop-blur-md flex items-center justify-center"
                            >
                                <div
                                    className="bg-white/90 rounded-3xl p-8 shadow-2xl border border-white flex flex-col items-center gap-4 scale-90">
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="panel-meta">
                            <p>Technical Visualization</p>
                            <h3>Side by Side</h3>
                        </div>
                        <div className="flex items-center gap-4 z-50">
                            <div
                                className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Left Side</span>
                                <select
                                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none w-full max-w-[256px] md:w-64 pr-2"
                                    value={leftImage || ""}
                                    onChange={(e) => setLeftImage(e.target.value)}
                                >
                                    {project?.source_image_url && (
                                        <option value={project.source_image_url} className="bg-white text-black">
                                            Original 2D Plan
                                        </option>
                                    )}
                                    {planVariants.map((v) => (
                                        <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                className="bg-white text-black">
                                            {getVariantLabel(v)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div
                                className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Right Side</span>
                                <select
                                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none w-full max-w-[256px] md:w-64 pr-2"
                                    value={rightImage || ""}
                                    onChange={(e) => setRightImage(e.target.value)}
                                >
                                    {project?.source_image_url && (
                                        <option value={project.source_image_url} className="bg-white text-black">
                                            Original 2D Plan
                                        </option>
                                    )}
                                    {planVariants.map((v) => (
                                        <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                className="bg-white text-black">
                                            {getVariantLabel(v)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={cn("compare-stage bg-slate-50 dark:bg-zinc-100", isEditMode && "!max-h-none")}>
                        {isEditMode && rightImage ? (
                            <div className="relative w-full h-full flex flex-col">
                                <div
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Brush Size: {brushSize}px</span>
                                            <input
                                                type="range"
                                                min="5"
                                                max="100"
                                                value={brushSize}
                                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                                className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                        <button
                                            onClick={() => inpaintCanvasRef.current?.clear()}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                                        >
                                            <Eraser size={16}/>
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsEditMode(false)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold uppercase"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                const mask = inpaintCanvasRef.current?.getMask();
                                                if (mask) {
                                                    runGeneration();
                                                    setIsEditMode(false);
                                                } else {
                                                    toast.error("Please paint an area to edit first");
                                                }
                                            }}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase shadow-lg shadow-indigo-500/20"
                                        >
                                            <Check size={16}/>
                                            Apply Changes
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 relative overflow-hidden min-h-125 pb-32">
                                    <InpaintCanvas
                                        ref={inpaintCanvasRef}
                                        image={rightImage}
                                        brushSize={brushSize}
                                    />
                                </div>
                            </div>
                        ) : leftImage && rightImage ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <ReactCompareSlider
                                    defaultValue={50}
                                    style={{width: "100%", height: "100%", maxHeight: "calc(100vh - 280px)"}}
                                    itemOne={<ReactCompareSliderImage src={leftImage} alt="Before: Original floor plan"
                                                                      className="compare-img"
                                                                      onLoad={handleImageLoad}
                                                                      style={{
                                                                          objectFit: 'contain',
                                                                          width: '100%',
                                                                          height: '100%'
                                                                      }}/>}
                                    itemTwo={<ReactCompareSliderImage src={rightImage}
                                                                      alt="After: AI 3D architectural render"
                                                                      className="compare-img"
                                                                      onLoad={handleImageLoad}
                                                                      style={{
                                                                          objectFit: 'contain',
                                                                          width: '100%',
                                                                          height: '100%'
                                                                      }}/>}
                                />
                                {rightImage && (
                                    <div
                                        style={{top: `${imgOffsets.top}px`, right: `${imgOffsets.right}px`}}
                                        className="absolute z-20 flex flex-col items-end gap-3 pointer-events-none transition-all duration-300">
                                        <div className="flex flex-col gap-2 pointer-events-auto">
                                            <button
                                                onClick={() => setIsEditMode(true)}
                                                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors font-bold uppercase text-[10px] tracking-wider"
                                            >
                                                <Edit className="w-4 h-4"/>
                                                Edit Area (In-paint)
                                            </button>
                                        </div>
                                        <div
                                            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-white/20 flex flex-col gap-3 pointer-events-auto">
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

                                        {/* Staff Pick Badge - Conditionally shown if public and approved */}
                                        {isPublic && showcaseId && (
                                            <div
                                                className="bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-500">
                                                <Sparkles className="w-4 h-4"/>
                                                Staff Pick
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="compare-fallback">
                                {project?.source_image_url && (
                                    <img src={project.source_image_url} alt="Before: Original floor plan"
                                         className="compare-img"/>
                                )}
                            </div>
                        )}
                    </div>

                    {planVariants.length >= 0 && (
                        <div className="mt-6 p-4">
                            <p className="text-xs uppercase opacity-50 font-bold mb-2">Plan Styles</p>
                            <div className="flex gap-3 overflow-x-auto pb-4">
                                {project?.source_image_url && (
                                    <div
                                        className={`relative w-24 h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:ring-2 hover:ring-indigo-500/50 ${(leftImage === project.source_image_url || rightImage === project.source_image_url || !selectedVariant) ? 'border-indigo-500' : 'border-transparent'}`}
                                        onClick={() => {
                                            setRightImage(project.source_image_url);
                                            setCurrentImage(project.source_image_url);
                                            setSelectedVariant(null);
                                            toast.info("Original Plan selected");
                                        }}
                                    >
                                        <img src={project.source_image_url} alt="Original source plan"
                                             className="w-full h-full object-cover"/>
                                        <div
                                            className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                                            Original
                                        </div>

                                        {/* Selection Badge */}
                                        {(leftImage === project.source_image_url || rightImage === project.source_image_url) && (
                                            <div
                                                className="absolute top-1 right-1 flex gap-0.5">
                                                {leftImage === project.source_image_url && (
                                                    <div
                                                        className="w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white shadow-sm"
                                                        title="Active in Style A"/>
                                                )}
                                                {rightImage === project.source_image_url && (
                                                    <div
                                                        className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-sm"
                                                        title="Active in Style B"/>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {planVariants.map((v, i) => {
                                    const imgUrl = getHighResUrl(v);
                                    const isActiveLeft = leftImage === imgUrl;
                                    const isActiveRight = rightImage === imgUrl;
                                    const isActive = isActiveLeft || isActiveRight || selectedVariant?.id === v.id;

                                    const tooltipContent = (
                                        <div className="flex flex-col gap-1 p-1">
                                            <div className="flex items-center gap-2">
                                                <Home size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Theme:</span>
                                                <span>{ROOM_STYLES.find(s => s.id === v.style_id)?.name || v.style_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Layers size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Space:</span>
                                                <span>{PROJECT_CONTEXTS.find(c => c.id === v.project_context)?.name || v.project_context}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Info size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Flooring:</span>
                                                <span>{FLOORING_MATERIALS.find(f => f.id === v.flooring_id)?.name || v.flooring_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Sun size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Mood:</span>
                                                <span>{LIGHTING_MOODS.find(l => l.id === v.lighting_id)?.name || v.lighting_id}</span>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <Tooltip key={v.id} content={tooltipContent}>
                                            <div
                                                className={`group relative w-24 h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:ring-2 hover:ring-indigo-500/50 ${(isActive || selectedVariant?.id === v.id) ? 'border-indigo-500' : 'border-transparent'}`}
                                                onClick={() => {
                                                    setRightImage(imgUrl);
                                                    setCurrentImage(imgUrl);
                                                    setSelectedVariant(v);

                                                    // Sync Toolbar
                                                    const style = ROOM_STYLES.find(s => s.id === v.style_id);
                                                    if (style) setSelectedStyle(style);

                                                    const flooring = FLOORING_MATERIALS.find(f => f.id === v.flooring_id);
                                                    if (flooring) setSelectedFlooring(flooring);

                                                    const mood = LIGHTING_MOODS.find(l => l.id === v.lighting_id);
                                                    if (mood) setSelectedLighting(mood);

                                                    const context = PROJECT_CONTEXTS.find(c => c.id === v.project_context);
                                                    if (context) setSelectedContext(context);

                                                    toast.info(`Variant ${i + 1} selected`);
                                                }}
                                            >
                                                <img src={imgUrl} alt={`Plan Variant ${i + 1}`}
                                                     className="w-full h-full object-cover"/>

                                                {/* Delete Button */}
                                                <div
                                                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                className="p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-md backdrop-blur-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently
                                                                    delete this render variant from our servers.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteVariant(v.id)}
                                                                    className="bg-red-500 hover:bg-red-600"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>

                                                {/* Selection Badge */}
                                                {isActive && (
                                                    <div
                                                        className="absolute top-1 right-1 flex gap-0.5">
                                                        {isActiveLeft && (
                                                            <div
                                                                className="w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white shadow-sm"
                                                                title="Active in Style A"/>
                                                        )}
                                                        {isActiveRight && (
                                                            <div
                                                                className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-sm"
                                                                title="Active in Style B"/>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="absolute bottom-1 left-1 flex items-center gap-1">
                                                    <span
                                                        className="text-[9px] bg-black/60 text-white font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-[2px]">
                                                        V{i + 1}
                                                    </span>
                                                    {v.upscaled_image_url && (
                                                        <div
                                                            className="flex items-center justify-center w-4 h-4 bg-amber-500 rounded-sm shadow-sm">
                                                            <span className="text-[8px] font-black text-white">4K</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Tooltip>
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
                                    <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Left Style</span>
                                    <select
                                        className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none w-full max-w-[256px] md:w-64 pr-2"
                                        value={isoLeftImage || ""}
                                        onChange={(e) => setIsoLeftImage(e.target.value)}
                                    >
                                        {isoVariants.map((v, i) => (
                                            <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                    className="bg-white text-black">
                                                {getVariantLabel(v)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div
                                    className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                    <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">Right Style</span>
                                    <select
                                        className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none w-full max-w-[256px] md:w-64 pr-2"
                                        value={isoRightImage || ""}
                                        onChange={(e) => setIsoRightImage(e.target.value)}
                                    >
                                        {isoVariants.map((v, i) => (
                                            <option key={v.id} value={v.upscaled_image_url || v.rendered_image_url}
                                                    className="bg-white text-black">
                                                {getVariantLabel(v)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="compare-stage bg-slate-50 dark:bg-zinc-100">
                            {isoLeftImage && isoRightImage ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <ReactCompareSlider
                                        defaultValue={50}
                                        style={{width: "100%", height: "100%", maxHeight: "calc(100vh - 280px)"}}
                                        itemOne={<ReactCompareSliderImage src={isoLeftImage} alt="Style A"
                                                                          className="compare-img"
                                                                          onLoad={handleImageLoad}
                                                                          style={{
                                                                              objectFit: 'contain',
                                                                              width: '100%',
                                                                              height: '100%'
                                                                          }}/>}
                                        itemTwo={<ReactCompareSliderImage src={isoRightImage} alt="Style B"
                                                                          className="compare-img"
                                                                          onLoad={handleImageLoad}
                                                                          style={{
                                                                              objectFit: 'contain',
                                                                              width: '100%',
                                                                              height: '100%'
                                                                          }}/>}
                                    />
                                    {isPublic && showcaseId && (
                                        <div
                                            style={{top: `${imgOffsets.top}px`, right: `${imgOffsets.right}px`}}
                                            className="absolute z-20 bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500 transition-all">
                                            <Sparkles className="w-4 h-4"/>
                                            Staff Pick
                                        </div>
                                    )}
                                </div>
                            ) : isoRightImage ? (
                                <div className="compare-fallback">
                                    <img src={isoRightImage} alt="Isometric variant"
                                         className="compare-img"/>
                                </div>
                            ) : (
                                <div
                                    className="compare-fallback bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-[400px] rounded-2xl">
                                    <p className="text-slate-400">Select isometric variants to compare</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-4">
                            <p className="text-xs uppercase opacity-50 font-bold mb-2">Isometric Styles</p>
                            <div className="flex gap-3 overflow-x-auto pb-4">
                                {isoVariants.map((v, i) => {
                                    const imgUrl = getHighResUrl(v);
                                    const isActiveLeft = isoLeftImage === imgUrl;
                                    const isActiveRight = isoRightImage === imgUrl;
                                    const isActive = isActiveLeft || isActiveRight || selectedVariant?.id === v.id;

                                    const tooltipContent = (
                                        <div className="flex flex-col gap-1 p-1">
                                            <div className="flex items-center gap-2">
                                                <Home size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Theme:</span>
                                                <span>{ROOM_STYLES.find(s => s.id === v.style_id)?.name || v.style_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Layers size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Space:</span>
                                                <span>{PROJECT_CONTEXTS.find(c => c.id === v.project_context)?.name || v.project_context}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Info size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Flooring:</span>
                                                <span>{FLOORING_MATERIALS.find(f => f.id === v.flooring_id)?.name || v.flooring_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Sun size={12} className="text-indigo-400"/>
                                                <span className="font-bold">Mood:</span>
                                                <span>{LIGHTING_MOODS.find(l => l.id === v.lighting_id)?.name || v.lighting_id}</span>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <Tooltip key={v.id} content={tooltipContent}>
                                            <div
                                                className={`group relative w-24 h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:ring-2 hover:ring-indigo-500/50 ${(isActive || selectedVariant?.id === v.id) ? 'border-indigo-500' : 'border-transparent'}`}
                                                onClick={() => {
                                                    setIsoRightImage(imgUrl);
                                                    setCurrentImage(imgUrl);
                                                    setSelectedVariant(v);

                                                    // Sync Toolbar
                                                    const style = ROOM_STYLES.find(s => s.id === v.style_id);
                                                    if (style) setSelectedStyle(style);

                                                    const flooring = FLOORING_MATERIALS.find(f => f.id === v.flooring_id);
                                                    if (flooring) setSelectedFlooring(flooring);

                                                    const mood = LIGHTING_MOODS.find(l => l.id === v.lighting_id);
                                                    if (mood) setSelectedLighting(mood);

                                                    const context = PROJECT_CONTEXTS.find(c => c.id === v.project_context);
                                                    if (context) setSelectedContext(context);

                                                    toast.info(`Isometric Variant ${i + 1} selected`);
                                                }}
                                            >
                                                <img src={imgUrl} alt={`Isometric Variant ${i + 1}`}
                                                     className="w-full h-full object-cover"/>

                                                {/* Delete Button */}
                                                <div
                                                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                className="p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-md backdrop-blur-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently
                                                                    delete this render variant from our servers.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteVariant(v.id)}
                                                                    className="bg-red-500 hover:bg-red-600"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>

                                                {/* Selection Badge */}
                                                {isActive && (
                                                    <div
                                                        className="absolute top-1 right-1 flex gap-0.5">
                                                        {isActiveLeft && (
                                                            <div
                                                                className="w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white shadow-sm"
                                                                title="Active in Style A"/>
                                                        )}
                                                        {isActiveRight && (
                                                            <div
                                                                className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-sm"
                                                                title="Active in Style B"/>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="absolute bottom-1 left-1 flex items-center gap-1">
                                                    <span
                                                        className="text-[9px] bg-black/60 text-white font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-[2px]">
                                                        V{i + 1}
                                                    </span>
                                                    {v.upscaled_image_url && (
                                                        <div
                                                            className="flex items-center justify-center w-4 h-4 bg-amber-500 rounded-sm shadow-sm">
                                                            <span className="text-[8px] font-black text-white">4K</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Tooltip>
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
                isUpscaled={isUpscaled}
                hasCurrentImage={!!currentImage}
                isPublic={isPublic}
                onTogglePublic={handleTogglePublic}
                currentPlanExists={currentPlanExists}
                customInstructions={customInstructions}
                onCustomInstructionsChange={setCustomInstructions}
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
