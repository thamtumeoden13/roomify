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
    AlertCircle,
    Download
} from "lucide-react";
import {m, AnimatePresence} from "framer-motion";
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
import {ROOM_STYLES, PROJECT_CONTEXTS, FLOORING_MATERIALS, LIGHTING_MOODS, CAMERA_VIEWS, INTERIOR_VIEWS} from "@/lib/constants";
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
    const [hasMask, setHasMask] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label: string } | null>(null);
    const [isInteriorViewsRunning, setIsInteriorViewsRunning] = useState(false);
    const [interiorViewsProgress, setInteriorViewsProgress] = useState<{ current: number; total: number; label: string } | null>(null);
    const [interiorViewVariants, setInteriorViewVariants] = useState<Record<string, Record<string, any>>>({});
    const [selectedPlanVariantIdForInteriorViews, setSelectedPlanVariantIdForInteriorViews] = useState<string | null>(null);
    const [selectedInteriorView, setSelectedInteriorView] = useState<string>("interior-entrance");
    const [generatingInteriorViewId, setGeneratingInteriorViewId] = useState<string | null>(null);
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
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
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

    // Get selected plan variant object from ID (more stable than storing object directly)
    const selectedPlanVariantForInteriorViews = selectedPlanVariantIdForInteriorViews
        ? planVariants.find(v => v.id === selectedPlanVariantIdForInteriorViews)
        : null;

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

            // Group interior view variants by style_id (source 3D plan), then by view_id
            const interiorMap: Record<string, Record<string, any>> = {};
            const stylesWithInteriorViews = new Set<string>();

            data.filter(v => v.view_id?.startsWith('interior-')).forEach(v => {
                const styleId = v.style_id || 'default';
                stylesWithInteriorViews.add(styleId);

                if (!interiorMap[styleId]) {
                    interiorMap[styleId] = {};
                }
                const existing = interiorMap[styleId][v.view_id];
                if (!existing || new Date(v.created_at) > new Date(existing.created_at)) {
                    interiorMap[styleId][v.view_id] = v;
                }
            });

            console.log("Fetched interior views:", interiorMap);
            console.log("Styles with interior views:", Array.from(stylesWithInteriorViews));
            setInteriorViewVariants(interiorMap);

            // Auto-select 3D plan variant for interior views:
            // ONLY auto-select if no variant is currently selected
            // Once user selects a variant, keep it until they explicitly change it
            const planVariants = data.filter(v => v.view_id === 'plan' || !v.view_id);

            if (planVariants.length > 0 && !selectedPlanVariantIdForInteriorViews) {
                // First, try to find a plan variant that has interior views
                const variantWithInteriorViews = planVariants.find(v =>
                    stylesWithInteriorViews.has(v.style_id || 'default')
                );

                if (variantWithInteriorViews) {
                    console.log("Auto-selecting plan variant with interior views:", variantWithInteriorViews.style_id);
                    setSelectedPlanVariantIdForInteriorViews(variantWithInteriorViews.id);
                } else {
                    // Otherwise, select the latest plan variant
                    console.log("Auto-selecting latest plan variant (no interior views yet)");
                    setSelectedPlanVariantIdForInteriorViews(planVariants[planVariants.length - 1].id);
                }
            }
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

            // Polling fallback: nếu webhook không reach được (dev/staging),
            // polling sẽ gọi /api/predictions/{id} để update DB → trigger Supabase Realtime
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            let pollCount = 0;
            const MAX_POLLS = 450; // ~30 phút ở interval 4s
            pollTimerRef.current = setInterval(async () => {
                pollCount++;
                if (pollCount >= MAX_POLLS) {
                    clearInterval(pollTimerRef.current!);
                    pollTimerRef.current = null;
                    setIsPlanProcessing(false);
                    setIsIsoProcessing(false);
                    setIsError(true);
                    toast.error("Generation timed out. Please try again.");
                    return;
                }
                try {
                    const res = await fetch(`/api/predictions/${prediction.id}`);
                    if (!res.ok) return;
                    const poll = await res.json();
                    if (poll.status === "succeeded" || poll.status === "failed") {
                        clearInterval(pollTimerRef.current!);
                        pollTimerRef.current = null;
                    }
                } catch (_) { /* ignore transient errors */
                }
            }, 4000);

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

    // Helper: đợi một prediction cụ thể hoàn thành (dùng cho batch)
    const waitForPrediction = async (predId: string): Promise<void> => {
        const MAX_WAIT_MS = 5 * 60 * 1000; // 5 phút
        const start = Date.now();
        while (Date.now() - start < MAX_WAIT_MS) {
            await new Promise(r => setTimeout(r, 4000));
            try {
                const res = await fetch(`/api/predictions/${predId}`);
                if (!res.ok) break;
                const data = await res.json();
                if (data.status === "succeeded" || data.status === "failed") return;
            } catch (_) { /* ignore */ }
        }
    };

    // Batch generation: process ảnh 1 lần, gen tuần tự từng style
    const runBatchGeneration = async (styleIds: string[]) => {
        if (!project?.source_image_url || styleIds.length === 0) return;

        const styles = styleIds
            .map(sid => ROOM_STYLES.find(s => s.id === sid))
            .filter(Boolean) as typeof ROOM_STYLES;

        setIsBatchRunning(true);
        setIsError(false);

        // Bước 1: Process floor plan 1 lần cho toàn batch
        let imageToUse = project.source_image_url;
        try {
            const processedBlob = await processFloorPlan(project.source_image_url);
            if (processedBlob) {
                const fileName = `processed_${Math.random().toString(36).slice(2, 11)}.png`;
                const formData = new FormData();
                formData.append("file", new File([processedBlob], fileName, {type: "image/png"}));
                const uploadRes = await fetch(`/api/upload?filename=${fileName}`, {
                    method: "POST",
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageToUse = uploadData.url;
                }
            }
        } catch (e) {
            console.error("Batch: image processing failed, using original");
        }

        // Bước 2: Gen từng style tuần tự
        let successCount = 0;
        for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            setBatchProgress({current: i + 1, total: styles.length, label: style.name});

            try {
                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        image: imageToUse,
                        project_id: id,
                        projectName: project.name,
                        styleKeywords: style.keywords,
                        styleId: style.id,
                        projectContext: selectedContext.name,
                        contextId: selectedContext.id,
                        flooringKeywords: selectedFlooring.keywords,
                        flooringId: selectedFlooring.id,
                        lightingKeywords: selectedLighting.keywords,
                        lightingId: selectedLighting.id,
                        viewKeywords: selectedView.keywords,
                        viewId: selectedView.id === "isometric" ? "plan" : selectedView.id,
                        forceNew: true,
                        customInstructions,
                    }),
                });

                const prediction = await res.json();

                if (res.status === 200 && prediction.isCacheHit) {
                    successCount++;
                    continue; // cache hit — không cần poll
                }

                if (res.status === 201 && prediction.id) {
                    await waitForPrediction(prediction.id);
                    successCount++;
                }
            } catch (e) {
                console.error(`Batch: failed for style "${style.name}"`, e);
            }
        }

        // Bước 3: Refresh gallery và cleanup
        setBatchProgress(null);
        setIsBatchRunning(false);
        await fetchVariants(id as string);
        toast.success(`Batch done — ${successCount}/${styles.length} styles generated`, {duration: 4000});
    };

    // Interior views: generate 4 perspective views from the current 3D render
    const runInteriorViewsGeneration = async () => {
        // Get source image from selected plan variant
        if (!selectedPlanVariantForInteriorViews) {
            toast.error("Please select a 3D plan variant first.");
            return;
        }

        const sourceImage = selectedPlanVariantForInteriorViews.upscaled_image_url || selectedPlanVariantForInteriorViews.rendered_image_url;
        if (!sourceImage) {
            toast.error("Selected 3D plan is missing image data.");
            return;
        }

        setIsInteriorViewsRunning(true);
        setIsError(false);

        // Get style info from selected variant
        const variantStyle = ROOM_STYLES.find(s => s.id === selectedPlanVariantForInteriorViews.style_id) || selectedStyle;
        const variantFlooring = FLOORING_MATERIALS.find(f => f.id === selectedPlanVariantForInteriorViews.flooring_id) || selectedFlooring;
        const variantLighting = LIGHTING_MOODS.find(l => l.id === selectedPlanVariantForInteriorViews.lighting_id) || selectedLighting;
        const variantContext = PROJECT_CONTEXTS.find(c => c.id === selectedPlanVariantForInteriorViews.project_context) || selectedContext;

        let successCount = 0;
        for (let i = 0; i < INTERIOR_VIEWS.length; i++) {
            const view = INTERIOR_VIEWS[i];
            setInteriorViewsProgress({current: i + 1, total: INTERIOR_VIEWS.length, label: view.name});

            try {
                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        image: sourceImage,          // use selected 3D plan image
                        project_id: id,
                        projectName: project?.name,
                        styleKeywords: variantStyle.keywords,
                        styleId: variantStyle.id,
                        projectContext: variantContext.name,
                        contextId: variantContext.id,
                        flooringKeywords: variantFlooring.keywords,
                        flooringId: variantFlooring.id,
                        lightingKeywords: variantLighting.keywords,
                        lightingId: variantLighting.id,
                        viewKeywords: view.keywords,  // interior view prompt
                        viewId: view.id,              // 'interior-entrance', etc.
                        forceNew: true,
                    }),
                });

                const prediction = await res.json();
                if (res.status === 200 && prediction.isCacheHit) {
                    successCount++;
                    continue;
                }
                if (res.status === 201 && prediction.id) {
                    await waitForPrediction(prediction.id);
                    successCount++;
                }
            } catch (e) {
                console.error(`Interior views: failed for "${view.name}"`, e);
            }
        }

        setInteriorViewsProgress(null);
        setIsInteriorViewsRunning(false);
        await fetchVariants(id as string);
        toast.success(`Interior views complete — ${successCount}/4 views generated`, {duration: 4000});
    };

    // Generate single interior view
    const generateSingleInteriorView = async (viewId: string) => {
        if (!selectedPlanVariantForInteriorViews) {
            toast.error("Please select a 3D plan variant first.");
            return;
        }

        const sourceImage = selectedPlanVariantForInteriorViews.upscaled_image_url || selectedPlanVariantForInteriorViews.rendered_image_url;
        if (!sourceImage) {
            toast.error("Selected 3D plan is missing image data.");
            return;
        }

        const view = INTERIOR_VIEWS.find(v => v.id === viewId);
        if (!view) {
            toast.error("Interior view not found.");
            return;
        }

        setGeneratingInteriorViewId(viewId);
        setIsError(false);

        // Get style info from selected variant
        const variantStyle = ROOM_STYLES.find(s => s.id === selectedPlanVariantForInteriorViews.style_id) || selectedStyle;
        const variantFlooring = FLOORING_MATERIALS.find(f => f.id === selectedPlanVariantForInteriorViews.flooring_id) || selectedFlooring;
        const variantLighting = LIGHTING_MOODS.find(l => l.id === selectedPlanVariantForInteriorViews.lighting_id) || selectedLighting;
        const variantContext = PROJECT_CONTEXTS.find(c => c.id === selectedPlanVariantForInteriorViews.project_context) || selectedContext;

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    image: sourceImage,
                    project_id: id,
                    projectName: project?.name,
                    styleKeywords: variantStyle.keywords,
                    styleId: variantStyle.id,
                    projectContext: variantContext.name,
                    contextId: variantContext.id,
                    flooringKeywords: variantFlooring.keywords,
                    flooringId: variantFlooring.id,
                    lightingKeywords: variantLighting.keywords,
                    lightingId: variantLighting.id,
                    viewKeywords: view.keywords,
                    viewId: view.id,
                    forceNew: true,
                }),
            });

            const prediction = await res.json();

            if (res.status === 200 && prediction.isCacheHit) {
                toast.success(`${view.name} loaded from cache!`, {duration: 3000});
                setGeneratingInteriorViewId(null);
                await fetchVariants(id as string);
                return;
            }

            if (res.status === 201 && prediction.id) {
                await waitForPrediction(prediction.id);
                await fetchVariants(id as string);
                toast.success(`${view.name} generated! (1 credit)`, {duration: 3000});
            }
        } catch (e) {
            console.error(`Failed to generate "${view.name}"`, e);
            toast.error(`Failed to generate ${view.name}`);
        } finally {
            setGeneratingInteriorViewId(null);
        }
    };

    const loadingMessages = [
        `Analyzing floor plan geometry and spatial layout...`,
        `Applying ${selectedStyle.name} design language...`,
        `Texturing surfaces with ${selectedFlooring.name}...`,
        `Setting up ${selectedLighting.name} light and shadows...`,
        `Placing furniture and architectural elements...`,
        `Rendering volumes, depth, and reflections...`,
        `Applying photorealistic details and final touches...`,
    ];
    const currentLoadingMsg = loadingMessages[loadingMsgIndex % loadingMessages.length];

    const getProcessingStatus = (status: string) => {
        if (status === "succeeded") return "Render Complete!";
        if (status === "failed") return "Render Failed.";
        if (status === "starting") return "Initializing AI Engine...";
        return currentLoadingMsg;
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
                        // Clear polling fallback — Realtime đã fire thành công
                        if (pollTimerRef.current) {
                            clearInterval(pollTimerRef.current);
                            pollTimerRef.current = null;
                        }

                        await fetchVariants(id as string);

                        const finalUrl = payload.new.upscaled_image_url || payload.new.rendered_image_url;
                        const viewId = payload.new.view_id;

                        if (viewId === "plan" || !viewId) {
                            setCurrentImage(finalUrl);
                            setRightImage(finalUrl);
                        } else if (viewId === "isometric") {
                            setIsoRightImage(finalUrl);
                        } else if (viewId?.startsWith("interior-")) {
                            // Interior view complete — update nested map by style_id for instant UI feedback
                            const styleId = payload.new.style_id || 'default';
                            setInteriorViewVariants(prev => ({
                                ...prev,
                                [styleId]: {
                                    ...(prev[styleId] || {}),
                                    [viewId]: payload.new
                                }
                            }));
                        }

                        setIsPlanProcessing(false);
                        setIsIsoProcessing(false);
                        setIsUpscaling(false);
                        // States already updated above
                        refreshCredits();
                        if (!isBatchRunning && !isInteriorViewsRunning) toast.success("Design updated successfully!");
                    } else if (newStatus === "failed") {
                        if (pollTimerRef.current) {
                            clearInterval(pollTimerRef.current);
                            pollTimerRef.current = null;
                        }
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
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
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

    useEffect(() => {
        if (!isPlanProcessing && !isIsoProcessing && !isUpscaling) {
            setLoadingMsgIndex(0);
            return;
        }
        const msgTimer = setInterval(() => setLoadingMsgIndex(prev => prev + 1), 3500);
        return () => clearInterval(msgTimer);
    }, [isPlanProcessing, isIsoProcessing, isUpscaling]);

    // Reset hasMask khi thoát edit mode (canvas unmount → strokes destroyed)
    useEffect(() => {
        if (!isEditMode) setHasMask(false);
    }, [isEditMode]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip khi user đang gõ trong input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;

            // Escape: thoát edit mode → clear error
            if (e.key === 'Escape') {
                if (isEditMode) {
                    if (inpaintCanvasRef.current?.hasStrokes()) {
                        inpaintCanvasRef.current.clear();
                        toast.info("Mask cleared");
                    }
                    setIsEditMode(false);
                    return;
                }
                if (isError) { setIsError(false); return; }
                return;
            }

            // ← → : navigate variants
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && planVariants.length > 0) {
                e.preventDefault();
                const currentIdx = selectedVariant ? planVariants.findIndex(v => v.id === selectedVariant.id) : -1;
                const nextIdx = e.key === 'ArrowLeft'
                    ? (currentIdx <= 0 ? planVariants.length - 1 : currentIdx - 1)
                    : (currentIdx >= planVariants.length - 1 ? 0 : currentIdx + 1);

                const next = planVariants[nextIdx];
                if (!next) return;
                const imgUrl = getHighResUrl(next);
                setRightImage(imgUrl);
                setCurrentImage(imgUrl);
                setSelectedVariant(next);
                const s = ROOM_STYLES.find(r => r.id === next.style_id); if (s) setSelectedStyle(s);
                const f = FLOORING_MATERIALS.find(r => r.id === next.flooring_id); if (f) setSelectedFlooring(f);
                const l = LIGHTING_MOODS.find(r => r.id === next.lighting_id); if (l) setSelectedLighting(l);
                const c = PROJECT_CONTEXTS.find(r => r.id === next.project_context); if (c) setSelectedContext(c);
                const cv = CAMERA_VIEWS.find(r => r.id === (next.view_id || 'plan')); if (cv) setSelectedView(cv);
                setCustomInstructions(next.custom_instructions || "");
                return;
            }

            // Ctrl/Cmd + Enter: generate
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!isPlanProcessing && !isIsoProcessing && !isUpscaling) {
                    runGeneration();
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, isError, planVariants, selectedVariant, isPlanProcessing, isIsoProcessing, isUpscaling]);

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
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400">Camera</span>
                                    <span className="text-sm font-medium text-zinc-900">
                                        {CAMERA_VIEWS.find(cv => cv.id === (selectedVariant.view_id || 'plan'))?.name || 'Top-Down'}
                                    </span>
                                </div>
                                {selectedVariant.custom_instructions && (
                                    <div className="flex flex-col w-full">
                                        <span className="text-[10px] uppercase font-bold text-zinc-400">Custom Instructions</span>
                                        <span className="text-sm font-medium text-zinc-600 italic">"{selectedVariant.custom_instructions}"</span>
                                    </div>
                                )}
                                <div className="w-full pt-3 border-t border-zinc-200">
                                    <button
                                        onClick={() => {
                                            const rStyle = ROOM_STYLES.find(s => s.id === selectedVariant.style_id);
                                            const rContext = PROJECT_CONTEXTS.find(c => c.id === selectedVariant.project_context);
                                            const rFlooring = FLOORING_MATERIALS.find(f => f.id === selectedVariant.flooring_id);
                                            const rMood = LIGHTING_MOODS.find(l => l.id === selectedVariant.lighting_id);
                                            const rView = CAMERA_VIEWS.find(cv => cv.id === (selectedVariant.view_id || 'plan'));
                                            runGeneration(rStyle, rContext, rFlooring, rMood, rView, true);
                                        }}
                                        disabled={isPlanProcessing}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        <RefreshCcw size={12}/>
                                        Regenerate this look
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Keyboard shortcuts hint */}
                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                            {[
                                {keys: ['←', '→'], label: 'Navigate variants'},
                                {keys: [isEditMode ? 'Esc' : '⌘', isEditMode ? '' : '↵'], label: isEditMode ? 'Exit edit' : 'Generate'},
                                ...(!isEditMode ? [{keys: ['Esc'], label: 'Clear error'}] : []),
                            ].map(({keys, label}) => (
                                <div key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                    {keys.filter(Boolean).map((k, i) => (
                                        <kbd key={i} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 rounded font-mono text-[9px] border border-zinc-200 dark:border-slate-700 leading-tight">{k}</kbd>
                                    ))}
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
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
                                {/* Edit button in main render view */}
                                {!isPlanProcessing && !isUpscaling && !isError && (
                                    <button
                                        onClick={() => {
                                            setIsEditMode(true);
                                            document.querySelector('.panel.compare')?.scrollIntoView({behavior: 'smooth', block: 'start'});
                                        }}
                                        className="absolute top-3 left-3 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-2.5 py-1.5 rounded-xl shadow-md border border-white/30 flex items-center gap-1.5 text-indigo-600 hover:bg-white hover:shadow-lg transition-all font-bold text-[10px] uppercase tracking-wider"
                                    >
                                        <Edit className="w-3 h-3"/>
                                        Edit Area
                                    </button>
                                )}

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
                                <m.div
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
                                </m.div>
                            )}

                            {isPlanProcessing && (
                                <m.div
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
                                                {getProcessingStatus(planPrediction?.status)}
                                            </span>
                                        </div>
                                    </div>
                                </m.div>
                            )}

                            {isUpscaling && (
                                <m.div
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
                                                {getProcessingStatus(upscalePrediction?.status)}
                                            </span>
                                        </div>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="panel compare mt-12 relative overflow-hidden">
                    <AnimatePresence>
                        {isError && (
                            <m.div
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
                            </m.div>
                        )}

                        {isPlanProcessing && (
                            <m.div
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
                                            {getProcessingStatus(planPrediction?.status)}
                                        </span>
                                    </div>
                                </div>
                            </m.div>
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
                                            onClick={() => {
                                                if (hasMask) {
                                                    inpaintCanvasRef.current?.clear();
                                                    toast.info("Mask cleared");
                                                }
                                                setIsEditMode(false);
                                            }}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold uppercase"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!hasMask) {
                                                    toast.error("Please paint an area to edit first");
                                                    return;
                                                }
                                                runGeneration();
                                                setIsEditMode(false);
                                            }}
                                            disabled={!hasMask}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase shadow-lg shadow-indigo-500/20"
                                        >
                                            <Check size={16}/>
                                            Apply Changes
                                            {hasMask && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 relative overflow-hidden min-h-125 pb-32">
                                    <InpaintCanvas
                                        ref={inpaintCanvasRef}
                                        image={rightImage}
                                        brushSize={brushSize}
                                        onStrokesChange={setHasMask}
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
                        ) : planVariants.length === 0 && !isPlanProcessing ? (
                            <div className="compare-fallback flex flex-col items-center justify-center min-h-[400px] gap-6 text-center p-8">
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-indigo-400"/>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-slate-800 dark:text-slate-200 font-bold text-xl">Generate your first design</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
                                        Choose your preferred style, flooring, and lighting mood, then hit{" "}
                                        <span className="font-semibold text-indigo-600">Generate 3D Plan</span> below.
                                    </p>
                                </div>
                                {project?.source_image_url && (
                                    <div className="relative w-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 opacity-50">
                                        <img src={project.source_image_url} alt="Your floor plan" className="w-full"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end justify-center pb-3">
                                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">Your Floor Plan</span>
                                        </div>
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

                                                    // Sync Toolbar — khôi phục toàn bộ settings của variant này
                                                    const style = ROOM_STYLES.find(s => s.id === v.style_id);
                                                    if (style) setSelectedStyle(style);

                                                    const flooring = FLOORING_MATERIALS.find(f => f.id === v.flooring_id);
                                                    if (flooring) setSelectedFlooring(flooring);

                                                    const mood = LIGHTING_MOODS.find(l => l.id === v.lighting_id);
                                                    if (mood) setSelectedLighting(mood);

                                                    const context = PROJECT_CONTEXTS.find(c => c.id === v.project_context);
                                                    if (context) setSelectedContext(context);

                                                    const cameraView = CAMERA_VIEWS.find(cv => cv.id === (v.view_id || 'plan'));
                                                    if (cameraView) setSelectedView(cameraView);

                                                    setCustomInstructions(v.custom_instructions || "");

                                                    toast.success(`V${i + 1} restored — hit Generate to recreate`, {duration: 2500});
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

                                                {/* Regenerate on hover */}
                                                <div
                                                    className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-indigo-900/80 to-transparent flex items-end justify-center pb-1 pt-4 pointer-events-none group-hover:pointer-events-auto">
                                                    <button
                                                        title="Regenerate with these exact settings"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rStyle = ROOM_STYLES.find(s => s.id === v.style_id);
                                                            const rContext = PROJECT_CONTEXTS.find(c => c.id === v.project_context);
                                                            const rFlooring = FLOORING_MATERIALS.find(f => f.id === v.flooring_id);
                                                            const rMood = LIGHTING_MOODS.find(l => l.id === v.lighting_id);
                                                            const rView = CAMERA_VIEWS.find(cv => cv.id === (v.view_id || 'plan'));
                                                            runGeneration(rStyle, rContext, rFlooring, rMood, rView, true);
                                                        }}
                                                        className="text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 hover:text-indigo-200 transition-colors"
                                                    >
                                                        <RefreshCcw size={9}/>
                                                        Regen
                                                    </button>
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
                                            {getProcessingStatus(isoPrediction?.status)}
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

                                                {/* Regenerate on hover */}
                                                <div
                                                    className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-indigo-900/80 to-transparent flex items-end justify-center pb-1 pt-4 pointer-events-none group-hover:pointer-events-auto">
                                                    <button
                                                        title="Regenerate with these exact settings"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rStyle = ROOM_STYLES.find(s => s.id === v.style_id);
                                                            const rContext = PROJECT_CONTEXTS.find(c => c.id === v.project_context);
                                                            const rFlooring = FLOORING_MATERIALS.find(f => f.id === v.flooring_id);
                                                            const rMood = LIGHTING_MOODS.find(l => l.id === v.lighting_id);
                                                            const rView = CAMERA_VIEWS.find(cv => cv.id === (v.view_id || 'plan'));
                                                            runGeneration(rStyle, rContext, rFlooring, rMood, rView, true);
                                                        }}
                                                        className="text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 hover:text-indigo-200 transition-colors"
                                                    >
                                                        <RefreshCcw size={9}/>
                                                        Regen
                                                    </button>
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

            {/* ═══ INTERIOR VIEWS PANEL ═══ */}
            <section className="content pb-40">
                <div className="panel compare mt-12 relative overflow-hidden">
                    <div className="panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="panel-meta">
                            <p>From 3D Plan → Perspective Views</p>
                            <h3>Interior Walkthrough</h3>
                        </div>
                        <div className="flex items-center gap-4 z-50 flex-wrap">
                            {/* Plan Variant Selector */}
                            <div className="flex items-center bg-zinc-900 text-white h-9 shadow-sm hover:bg-zinc-800 rounded-md px-3 transition-all focus-within:ring-2 focus-within:ring-zinc-400/20 focus-within:border-zinc-400 cursor-pointer">
                                <span className="text-[10px] uppercase opacity-70 font-bold mr-2 whitespace-nowrap">From Plan</span>
                                <select
                                    className="bg-transparent border-none text-xs font-bold uppercase tracking-wide text-white focus:ring-0 cursor-pointer outline-none w-full max-w-[200px] pr-2"
                                    value={selectedPlanVariantIdForInteriorViews || ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedPlanVariantIdForInteriorViews(e.target.value);
                                            // Reset selected interior view when plan variant changes
                                            setSelectedInteriorView("interior-entrance");
                                        }
                                    }}
                                >
                                    {planVariants.map((v) => (
                                        <option key={v.id} value={v.id} className="bg-white text-black">
                                            {getVariantLabel(v)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!selectedPlanVariantForInteriorViews && (
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700/40">
                                    Generate a 3D plan first
                                </span>
                            )}
                            <button
                                onClick={runInteriorViewsGeneration}
                                disabled={isInteriorViewsRunning || !!generatingInteriorViewId || isPlanProcessing || isUpscaling || !selectedPlanVariantForInteriorViews}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                    (isInteriorViewsRunning || generatingInteriorViewId)
                                        ? "bg-indigo-500/20 border border-indigo-400/40 text-indigo-700 dark:text-indigo-300 cursor-not-allowed"
                                        : selectedPlanVariantForInteriorViews
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isInteriorViewsRunning ? (
                                    <>
                                        <RefreshCcw className="w-4 h-4 animate-spin"/>
                                        {interiorViewsProgress?.label} ({interiorViewsProgress?.current}/{interiorViewsProgress?.total})
                                    </>
                                ) : generatingInteriorViewId ? (
                                    <>
                                        <RefreshCcw className="w-4 h-4 animate-spin"/>
                                        Generating View...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4"/>
                                        Generate All 4 (4 credits)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {isInteriorViewsRunning && interiorViewsProgress && (
                        <div className="px-6 pb-2">
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                    style={{width: `${(interiorViewsProgress.current / interiorViewsProgress.total) * 100}%`}}
                                />
                            </div>
                        </div>
                    )}

                    {/* 2-Column Layout: 80% left for main image, 20% right for thumbnails */}
                    <div className="p-4 md:p-6">
                        {(() => {
                            const selectedStyleId = selectedPlanVariantForInteriorViews?.style_id || 'default';
                            const hasViewsForSelectedStyle = selectedPlanVariantForInteriorViews &&
                                interiorViewVariants[selectedStyleId] &&
                                Object.keys(interiorViewVariants[selectedStyleId]).length > 0;
                            return hasViewsForSelectedStyle;
                        })() ? (
                            <div className="flex gap-4" style={{minHeight: '400px', maxHeight: 'calc(100vh - 280px)'}}>
                                {/* Left column: 80% — Large main image */}
                                <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col">
                                    {(() => {
                                        const styleId = selectedPlanVariantForInteriorViews.style_id || 'default';
                                        const viewsForStyle = interiorViewVariants[styleId];
                                        const selectedView = INTERIOR_VIEWS.find(v => v.id === selectedInteriorView);
                                        const mainRender = viewsForStyle?.[selectedInteriorView];
                                        const mainImg = mainRender?.upscaled_image_url || mainRender?.rendered_image_url;

                                        return (
                                            <div className="relative w-full h-full group flex items-center justify-center">
                                                {mainImg ? (
                                                    <>
                                                        <img
                                                            src={mainImg}
                                                            alt={selectedView?.name || "Interior View"}
                                                            className="w-full h-full object-contain"
                                                        />
                                                        {/* Download button on hover */}
                                                        <a
                                                            href={mainImg}
                                                            download={`${selectedInteriorView}.png`}
                                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-900/80 backdrop-blur p-2.5 rounded-lg shadow"
                                                        >
                                                            <Download className="w-4 h-4 text-slate-700 dark:text-slate-200"/>
                                                        </a>
                                                        {/* View info overlay */}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">{selectedView?.emoji}</span>
                                                                <div>
                                                                    <p className="font-bold text-sm">{selectedView?.name}</p>
                                                                    <p className="text-xs opacity-75">{selectedView?.nameVi}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                                                        <span className="text-4xl">{selectedView?.emoji}</span>
                                                        <span className="text-xs font-bold uppercase">{selectedView?.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Right column: 20% — 4 small thumbnail cards (no scroll) */}
                                <div className="w-1/5 flex flex-col gap-2">
                                    {(() => {
                                        const styleId = selectedPlanVariantForInteriorViews.style_id || 'default';
                                        const viewsForStyle = interiorViewVariants[styleId] || {};

                                        return INTERIOR_VIEWS.map((view, i) => {
                                            const render = viewsForStyle[view.id];
                                            const imgUrl = render?.upscaled_image_url || render?.rendered_image_url;
                                            const isSelected = selectedInteriorView === view.id;
                                            const isGenerating = generatingInteriorViewId === view.id;

                                            return (
                                                <div
                                                    key={view.id}
                                                    onClick={() => setSelectedInteriorView(view.id)}
                                                    className={cn(
                                                        "relative flex flex-col flex-1 min-h-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer group",
                                                        isSelected
                                                            ? "border-indigo-500 shadow-lg shadow-indigo-500/30"
                                                            : "border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                                                    )}
                                                >
                                                    {/* Thumbnail image */}
                                                    <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                                        {imgUrl ? (
                                                            <img
                                                                src={imgUrl}
                                                                alt={view.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : isGenerating ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                                                                <RefreshCcw className="w-4 h-4 text-indigo-500 animate-spin"/>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                                <span className="text-xl">{view.emoji}</span>
                                                            </div>
                                                        )}

                                                        {/* Regenerate button - corner icon on hover */}
                                                        {imgUrl && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    generateSingleInteriorView(view.id);
                                                                }}
                                                                disabled={isGenerating}
                                                                title="Regenerate this view"
                                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white p-1.5 rounded-lg shadow-md"
                                                            >
                                                                <RefreshCcw className={cn("w-3 h-3", isGenerating && "animate-spin")}/>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Label */}
                                                    <div className="px-2 py-1 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                                                        <p className="text-[9px] font-bold truncate text-slate-700 dark:text-slate-300">{view.name}</p>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-12 text-center flex items-center justify-center" style={{minHeight: '400px', maxHeight: 'calc(100vh - 280px)'}}>
                                <p className="text-sm text-slate-400">
                                    {selectedPlanVariantForInteriorViews
                                        ? 'No interior views yet. Click "Generate 4 Views" to create perspective walkthroughs.'
                                        : 'Select a 3D plan variant above to generate interior perspective views.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
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
                onBatchGenerate={runBatchGeneration}
                isBatchRunning={isBatchRunning}
                batchProgress={batchProgress}
                onInteriorViewsGenerate={runInteriorViewsGeneration}
                isInteriorViewsRunning={isInteriorViewsRunning}
                interiorViewsProgress={interiorViewsProgress}
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
