"use client";

import React, {type ReactNode} from 'react';
import {m, useScroll, useMotionValueEvent} from 'framer-motion';
import {
    Box,
    Video,
    Sparkles,
    Zap,
    Download,
    Share2,
    RefreshCcw,
    Layout,
    Palette,
    Home,
    Castle,
    Square,
    Building,
    Coins,
    Sun,
    Layers,
    Sunset,
    Lamp,
    Focus,
    Globe,
    Check,
    Maximize2,
    Eye,
    ZoomIn,
    Maximize,
    Scan,
    ArrowDownToLine,
    Camera,
    ChevronRight,
    Plus,
    LayoutList,
    Compass,
} from 'lucide-react';
import {Select} from '@/components/ui/Select';
import {Tooltip} from '@/components/ui/Tooltip';
import {Popover} from '@/components/ui/Popover';
import Button from '@/components/ui/Button';
import {ROOM_STYLES, PROJECT_CONTEXTS, FLOORING_MATERIALS, LIGHTING_MOODS, CAMERA_VIEWS, PROMPT_PRESETS} from '@/lib/constants';
import {useCredits} from '@/lib/hooks/useCredits';
import {cn} from "@/lib/utils";

interface VisualizerToolbarProps {
    // Tách biệt các sự kiện thay đổi
    onSpaceChange: (val: string) => void;
    onStyleChange: (val: string) => void;
    onFlooringChange: (val: string) => void;
    onMoodChange: (val: string) => void;
    onViewChange: (val: string) => void;
    // Chỉ nút Generate mới gọi hàm này
    onGenerate: (viewId?: string) => void;
    onUpscale: () => void;
    onExport: () => void;
    onShare: () => void;
    selectedStyle: any;
    selectedContext: any;
    selectedFlooring: any;
    selectedLighting: any;
    selectedView: any;
    isPlanProcessing: boolean;
    isIsoProcessing: boolean;
    isUpscaling: boolean;
    hasCurrentImage: boolean;
    isPublic: boolean;
    onTogglePublic: (isPublic: boolean) => void;
    isUpscaled?: boolean;
    currentPlanExists: boolean;
    customInstructions: string;
    onCustomInstructionsChange: (val: string) => void;
    onBatchGenerate: (styleIds: string[]) => void;
    isBatchRunning: boolean;
    batchProgress: { current: number; total: number; label: string } | null;
    onInteriorViewsGenerate: () => void;
    isInteriorViewsRunning: boolean;
    interiorViewsProgress: { current: number; total: number; label: string } | null;
}

const contextIcons: Record<string, ReactNode> = {
    'residential': <Home className="w-4 h-4"/>,
    'luxury-real-estate': <Castle className="w-4 h-4"/>,
    'commercial-office': <Layout className="w-4 h-4"/>,
    'retail-hospitality': <Building className="w-4 h-4"/>,
};

const styleIcons: Record<string, ReactNode> = {
    'modern': <Layout className="w-4 h-4"/>,
    'vintage': <Palette className="w-4 h-4"/>,
    'japandi': <Sparkles className="w-4 h-4"/>,
    'industrial': <Building className="w-4 h-4"/>,
};

const lightingIcons: Record<string, ReactNode> = {
    'natural-daylight': <Sun className="w-4 h-4"/>,
    'golden-hour': <Sunset className="w-4 h-4"/>,
    'cozy-evening': <Lamp className="w-4 h-4"/>,
    'studio-white': <Focus className="w-4 h-4"/>,
};

const viewIcons: Record<string, ReactNode> = {
    'plan': <Square className="w-4 h-4"/>,
    'isometric': <Box className="w-4 h-4"/>,
    'perspective': <Video className="w-4 h-4"/>,
    'birds-eye': <Maximize2 className="w-4 h-4"/>,
    '3-4-angle': <Scan className="w-4 h-4"/>,
    'eye-level': <Eye className="w-4 h-4"/>,
    'wide-shot': <Maximize className="w-4 h-4"/>,
    'close-up': <ZoomIn className="w-4 h-4"/>,
    'street-level': <ArrowDownToLine className="w-4 h-4"/>,
};

const flooringSwatches: Record<string, string> = {
    'light-oak': 'bg-[#E5D3B3]',
    'dark-walnut': 'bg-[#4B3621]',
    'polished-concrete': 'bg-[#8E8E8E]',
    'white-marble': 'bg-[#F2F2F2]',
    'hexagon-tiles': 'bg-[#D1D5DB]',
};

export default function VisualizerToolbar({
                                              onSpaceChange,
                                              onStyleChange,
                                              onFlooringChange,
                                              onMoodChange,
                                              onViewChange,
                                              onGenerate,
                                              onUpscale,
                                              onExport,
                                              onShare,
                                              selectedStyle,
                                              selectedContext,
                                              selectedFlooring,
                                              selectedLighting,
                                              selectedView,
                                              isPlanProcessing,
                                              isIsoProcessing,
                                              isUpscaling,
                                              hasCurrentImage,
                                              isPublic,
                                              onTogglePublic,
                                              isUpscaled,
                                              currentPlanExists,
                                              customInstructions,
                                              onCustomInstructionsChange,
                                              onBatchGenerate,
                                              isBatchRunning,
                                              batchProgress,
                                              onInteriorViewsGenerate,
                                              isInteriorViewsRunning,
                                              interiorViewsProgress,
                                          }: VisualizerToolbarProps) {
    const {credits} = useCredits();
    const [batchStyleIds, setBatchStyleIds] = React.useState<string[]>([]);
    const {scrollY} = useScroll();
    const [hidden, setHidden] = React.useState(false);
    const lastScrollY = React.useRef(0);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const direction = latest - lastScrollY.current;
        if (latest < 50) {
            setHidden(false);
        } else if (direction > 10) {
            setHidden(true);
        } else if (direction < -10) {
            setHidden(false);
        }
        lastScrollY.current = latest;
    });

    const [isSettingsChanged, setIsSettingsChanged] = React.useState(false);

    const handleSettingChange = (callback: (val: string) => void) => (val: string) => {
        callback(val);
        setIsSettingsChanged(true);
    };

    // Reset indicator when generation starts
    const onGenerateWithReset = (viewId?: string) => {
        setIsSettingsChanged(false);
        onGenerate(viewId);
    };

    const contextOptions = PROJECT_CONTEXTS.map(c => ({
        id: c.id,
        name: c.name,
        icon: contextIcons[c.id]
    }));

    const styleOptions = ROOM_STYLES.map(s => ({
        id: s.id,
        name: s.name,
        icon: styleIcons[s.id] || <Palette className="w-4 h-4"/>
    }));

    const flooringOptions = FLOORING_MATERIALS.map(f => ({
        id: f.id,
        name: f.name,
        icon: (
            <div className={`w-4 h-4 rounded-full border border-slate-200 ${
                f.id === 'light-oak' ? 'bg-[#E5D3B3]' :
                    f.id === 'dark-walnut' ? 'bg-[#4B3621]' :
                        f.id === 'polished-concrete' ? 'bg-[#8E8E8E]' :
                            f.id === 'white-marble' ? 'bg-[#F2F2F2]' :
                                f.id === 'hexagon-tiles' ? 'bg-[#D1D5DB]' :
                                    'bg-slate-400'
            }`}/>
        )
    }));

    const lightingOptions = LIGHTING_MOODS.map(l => ({
        id: l.id,
        name: l.name,
        icon: lightingIcons[l.id] || <Sun className="w-4 h-4"/>,
        tooltip: l.description
    }));

    // Camera views for the Select (exclude isometric — it has its own dedicated button)
    const cameraViewOptions = CAMERA_VIEWS
        .filter(v => v.id !== 'isometric')
        .map(v => ({
            id: v.id,
            name: v.name,
            icon: viewIcons[v.id] || <Camera className="w-4 h-4"/>,
            tooltip: v.description
        }));

    const handlePresetClick = (presetText: string) => {
        const current = customInstructions.trim();
        onCustomInstructionsChange(current ? `${current}, ${presetText}` : presetText);
    };

    return (
        <m.div
            variants={{
                visible: {y: 0, opacity: 1},
                hidden: {y: "120%", opacity: 0}
            }}
            initial="visible"
            animate={hidden ? "hidden" : "visible"}
            transition={{duration: 0.3, ease: "easeInOut"}}
            className="fixed bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[98vw] md:w-max"
        >
            <div
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-1.5 md:p-2 lg:p-4 flex flex-row items-center justify-between gap-1 sm:gap-2 lg:gap-4 xl:gap-8 transition-all px-2 md:px-4">

                {/* Left Group: Configuration (2x2 Grid + Camera full-width) */}
                <div
                    className="grid grid-cols-2 gap-1.5 md:gap-2 shrink-0 w-fit min-w-0">
                    <Select
                        label="Space"
                        value={selectedContext.id}
                        onValueChange={handleSettingChange(onSpaceChange)}
                        options={contextOptions}
                        icon={contextIcons[selectedContext.id]}
                        disabled={isPlanProcessing || isIsoProcessing || isUpscaling}
                        position="top"
                        compact
                    />
                    <Select
                        label="Theme"
                        value={selectedStyle.id}
                        onValueChange={handleSettingChange(onStyleChange)}
                        options={styleOptions}
                        icon={<Palette className="w-4 h-4"/>}
                        disabled={isPlanProcessing || isIsoProcessing || isUpscaling}
                        position="top"
                        compact
                    />
                    <Select
                        label="Flooring"
                        value={selectedFlooring?.id}
                        onValueChange={handleSettingChange(onFlooringChange)}
                        options={flooringOptions}
                        icon={<Layers className="w-4 h-4"/>}
                        disabled={isPlanProcessing || isIsoProcessing || isUpscaling}
                        position="top"
                        compact
                    />
                    <Select
                        label="Mood"
                        value={selectedLighting?.id}
                        onValueChange={handleSettingChange(onMoodChange)}
                        options={lightingOptions}
                        icon={lightingIcons[selectedLighting?.id] || <Sun className="w-4 h-4"/>}
                        disabled={isPlanProcessing || isIsoProcessing || isUpscaling}
                        position="top"
                        compact
                    />
                </div>

                <div className="h-12 w-px bg-slate-200/50 mx-1 shrink-0"/>

                {/* Main Action Bar: Generate, Refine, Utilities */}
                <div
                    className="flex-1 flex flex-row items-center justify-between gap-1 sm:gap-2 lg:gap-4 xl:gap-6 min-w-0 flex-nowrap">
                    {/* Center Action Group */}
                    <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                        <div className="relative flex flex-col items-center">
                            <m.div
                                animate={isSettingsChanged && !isPlanProcessing ? {scale: [1, 1.02, 1]} : {}}
                                transition={isSettingsChanged ? {duration: 2, repeat: Infinity, ease: "easeInOut"} : {}}
                                whileHover={{y: -2}}
                                whileTap={{scale: 0.98}}
                            >
                                <Tooltip
                                    content={isPlanProcessing ? "Imagining..." : (credits === 0 ? "Out of Credits" : "Generate 3D Plan")}>
                                    <Button
                                        onClick={() => onGenerateWithReset('plan')}
                                        disabled={isPlanProcessing || isUpscaling || credits === 0}
                                        className={cn(
                                            "relative overflow-hidden h-11 lg:h-12 px-3 md:px-4 lg:px-6 xl:px-8 rounded-xl lg:rounded-2xl transition-all duration-500 font-extrabold text-xs lg:text-base uppercase tracking-wider group shadow-xl",
                                            credits === 0
                                                ? 'bg-slate-400'
                                                : isPlanProcessing
                                                    ? 'bg-indigo-600'
                                                    : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 animate-gradient-x',
                                            "text-white border-none min-w-[80px] md:min-w-[120px] lg:min-w-[140px] shadow-[0_0_20px_rgba(99,102,241,0)]",
                                            isSettingsChanged && !isPlanProcessing && 'shadow-[0_0_25px_rgba(99,102,241,0.5)]'
                                        )}
                                    >
                                        {!isPlanProcessing && credits !== 0 && (
                                            <div
                                                className="absolute inset-0 opacity-50 group-hover:opacity-80 transition-opacity bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] animate-pulse"/>
                                        )}
                                        {isPlanProcessing && (
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"/>
                                        )}

                                        <div
                                            className="relative z-10 flex items-center justify-center gap-1.5 md:gap-2 text-xs lg:text-sm font-bold tracking-tight">
                                            {isPlanProcessing ? (
                                                <RefreshCcw className="w-4 h-4 animate-spin"/>
                                            ) : (
                                                <Sparkles
                                                    className="w-4 h-4 group-hover:rotate-12 transition-transform"/>
                                            )}
                                            <span
                                                className="hidden xl:inline">{isPlanProcessing ? "Imagining..." : (credits === 0 ? "Out of Credits" : "Generate 3D Plan")}</span>
                                            <span
                                                className="xl:hidden">{isPlanProcessing ? "Wait..." : (credits === 0 ? "Empty" : "Generate")}</span>
                                        </div>
                                    </Button>
                                </Tooltip>
                            </m.div>

                            {/* Credits Badge pinned to Generate */}
                            {credits !== null && (
                                <div
                                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/50 shadow-sm whitespace-nowrap">
                                    <Coins
                                        className={`w-2 h-2 lg:w-2.5 lg:h-2.5 ${credits === 0 ? 'text-rose-500' : 'text-indigo-500'}`}/>
                                    <span>{credits} Credits</span>
                                </div>
                            )}
                        </div>

                        <Popover
                            position="top"
                            trigger={
                                <m.div whileHover={{y: -2}}>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-11 lg:h-12 px-3 lg:px-4 rounded-xl lg:rounded-2xl flex items-center gap-2 transition-all border-[1.5px]",
                                            customInstructions
                                                ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                                                : "bg-white/10 backdrop-blur-md border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200"
                                        )}
                                    >
                                        <Sparkles className={cn("w-4 h-4", customInstructions && "fill-current")}/>
                                        <span
                                            className="hidden xl:inline text-xs font-bold uppercase tracking-wider">Refine</span>
                                    </Button>
                                </m.div>
                            }
                        >
                            <div className="flex flex-col gap-3 w-[340px] sm:w-[380px]">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-500"/>
                                        AI Instructions
                                    </h4>
                                    {customInstructions && (
                                        <button
                                            onClick={() => onCustomInstructionsChange("")}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Prompt Preset Categories */}
                                {PROMPT_PRESETS.map((group) => (
                                    <div key={group.category} className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <ChevronRight className="w-3 h-3"/>
                                            {group.category}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {group.items.map((item) => {
                                                const isActive = customInstructions.includes(item);
                                                return (
                                                    <button
                                                        key={item}
                                                        onClick={() => handlePresetClick(item)}
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border",
                                                            isActive
                                                                ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20"
                                                        )}
                                                    >
                                                        {isActive ? <Check className="w-2.5 h-2.5 shrink-0"/> : <Plus className="w-2.5 h-2.5 shrink-0 opacity-50"/>}
                                                        {item}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div className="h-px bg-slate-100 dark:bg-slate-800"/>

                                <textarea
                                    value={customInstructions}
                                    onChange={(e) => onCustomInstructionsChange(e.target.value)}
                                    placeholder="e.g. Add more indoor plants, Christmas theme, wooden furniture..."
                                    className="w-full min-h-[80px] p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                />
                            </div>
                        </Popover>

                        <Popover
                            position="top"
                            trigger={
                                <m.div whileHover={{y: -2}}>
                                    <Button
                                        variant="outline"
                                        disabled={isPlanProcessing || isIsoProcessing || isUpscaling}
                                        className={cn(
                                            "h-11 lg:h-12 px-3 lg:px-4 rounded-xl lg:rounded-2xl flex items-center gap-2 transition-all border-[1.5px]",
                                            isBatchRunning
                                                ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                                : "bg-white/10 backdrop-blur-md border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200"
                                        )}
                                    >
                                        {isBatchRunning
                                            ? <RefreshCcw className="w-4 h-4 animate-spin"/>
                                            : <LayoutList className="w-4 h-4"/>
                                        }
                                        <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider">
                                            {isBatchRunning
                                                ? `${batchProgress?.current}/${batchProgress?.total}`
                                                : "Batch"
                                            }
                                        </span>
                                    </Button>
                                </m.div>
                            }
                        >
                            <div className="flex flex-col gap-3 w-[280px]">
                                {isBatchRunning ? (
                                    /* Progress view */
                                    <div className="flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <RefreshCcw className="w-4 h-4 text-violet-500 animate-spin"/>
                                            Batch Running...
                                        </h4>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{batchProgress?.label}</span>
                                                <span className="font-bold">{batchProgress?.current}/{batchProgress?.total}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                                                    style={{width: `${((batchProgress?.current ?? 0) / (batchProgress?.total ?? 1)) * 100}%`}}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Each style generates sequentially. Results appear in the gallery as they complete.</p>
                                    </div>
                                ) : (
                                    /* Selection view */
                                    <>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <LayoutList className="w-4 h-4 text-violet-500"/>
                                                Batch Generate
                                            </h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setBatchStyleIds(ROOM_STYLES.map(s => s.id))}
                                                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700 uppercase"
                                                >All</button>
                                                <span className="text-slate-300">|</span>
                                                <button
                                                    onClick={() => setBatchStyleIds([])}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                                                >None</button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 -mt-1">Flooring, mood, and camera apply to all.</p>

                                        <div className="flex flex-col gap-1">
                                            {ROOM_STYLES.map((style) => {
                                                const checked = batchStyleIds.includes(style.id);
                                                return (
                                                    <label
                                                        key={style.id}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border",
                                                            checked
                                                                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300/50 text-violet-700 dark:text-violet-300"
                                                                : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => setBatchStyleIds(prev =>
                                                                e.target.checked
                                                                    ? [...prev, style.id]
                                                                    : prev.filter(id => id !== style.id)
                                                            )}
                                                            className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold">{style.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <button
                                            disabled={batchStyleIds.length === 0}
                                            onClick={() => onBatchGenerate(batchStyleIds)}
                                            className={cn(
                                                "w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                                batchStyleIds.length > 0
                                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                            )}
                                        >
                                            <LayoutList className="w-4 h-4"/>
                                            Generate {batchStyleIds.length > 0 ? `${batchStyleIds.length} Style${batchStyleIds.length > 1 ? 's' : ''}` : 'Styles'}
                                            {batchStyleIds.length > 0 && (
                                                <span className="opacity-70">({batchStyleIds.length} credits)</span>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </Popover>
                    </div>

                    <div className="h-8 w-px bg-slate-200/30 shrink-0"/>

                    {/* Right Group: Utilities */}
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                        <Tooltip content={isInteriorViewsRunning ? `Generating view ${interiorViewsProgress?.current}/4...` : "Generate 4 interior perspective views from your 3D plan (4 credits)"}>
                            <m.div whileHover={{y: -2}}>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onInteriorViewsGenerate();
                                        setTimeout(() => {
                                            document.querySelector('.visualizer-section:last-of-type')?.scrollIntoView({behavior: 'smooth', block: 'start'});
                                        }, 100);
                                    }}
                                    disabled={isInteriorViewsRunning || isPlanProcessing || isUpscaling}
                                    className={cn(
                                        "px-2.5 lg:px-4 h-11 lg:h-12 rounded-xl lg:rounded-2xl border-[1.5px] flex items-center gap-2 font-bold text-[10px] lg:text-xs uppercase tracking-wider transition-all",
                                        isInteriorViewsRunning
                                            ? "bg-indigo-500/10 border-indigo-400/50 text-indigo-600 dark:text-indigo-400"
                                            : "border-indigo-300/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    )}
                                >
                                    {isInteriorViewsRunning
                                        ? <RefreshCcw className="w-4 h-4 animate-spin"/>
                                        : <Compass className="w-4 h-4"/>
                                    }
                                    <span className="hidden xl:inline">
                                        {isInteriorViewsRunning
                                            ? `${interiorViewsProgress?.current}/4`
                                            : "Views"
                                        }
                                    </span>
                                </Button>
                            </m.div>
                        </Tooltip>

                        <Tooltip content="3D Isometric View">
                            <m.div whileHover={{y: -2}}>
                                <Button
                                    variant="outline"
                                    onClick={() => onGenerateWithReset('isometric')}
                                    disabled={true}
                                    className={cn(
                                        "px-2.5 lg:px-4 h-11 lg:h-12 rounded-xl lg:rounded-2xl border-[1.5px] border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold text-[10px] lg:text-xs uppercase tracking-wider",
                                        isIsoProcessing && "bg-slate-900 text-white border-none"
                                    )}
                                >
                                    {isIsoProcessing ? (
                                        <RefreshCcw className="w-4 h-4 animate-spin"/>
                                    ) : (
                                        <Box className="w-4 h-4 text-indigo-500"/>
                                    )}
                                    <span className="hidden xl:inline">3D Isometric</span>
                                </Button>
                            </m.div>
                        </Tooltip>

                        <Tooltip
                            content={isUpscaled ? "This design is already in Ultra HD resolution" : "Enhance to 4K: Sharpen textures and remove AI noise (Cost: 2 Credits)"}>
                            <m.div whileHover={{y: -2}}>
                                <Button
                                    variant="outline"
                                    onClick={onUpscale}
                                    disabled={isPlanProcessing || isIsoProcessing || isUpscaling || !hasCurrentImage || credits === 0 || isUpscaled}
                                    className={cn(
                                        "px-2.5 lg:px-4 h-11 lg:h-12 rounded-xl lg:rounded-2xl flex items-center gap-2 font-bold text-[10px] lg:text-xs uppercase tracking-wider transition-all duration-300",
                                        isUpscaled
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                            : "bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                    )}
                                >
                                    {isUpscaling ? (
                                        <RefreshCcw className="w-4 h-4 animate-spin"/>
                                    ) : isUpscaled ? (
                                        <Check className="w-4 h-4 text-emerald-500"/>
                                    ) : (
                                        <m.div
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [1, 0.8, 1]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <Zap
                                                className={cn("w-4 h-4", credits === 0 ? "text-slate-400" : "text-amber-500 fill-amber-500")}/>
                                        </m.div>
                                    )}
                                    <span className="hidden xl:inline">
                                        {isUpscaled ? "Already 4K" : "4K Upscale"}
                                    </span>
                                </Button>
                            </m.div>
                        </Tooltip>

                        <div className="h-8 w-px bg-slate-200/30 mx-0.5 shrink-0"/>

                        <Tooltip content="Gallery">
                            <m.div whileHover={{y: -2}}>
                                <Button
                                    variant="outline"
                                    onClick={() => onTogglePublic(!isPublic)}
                                    className={cn(
                                        "px-2.5 lg:px-4 h-11 lg:h-12 rounded-xl lg:rounded-2xl border-[1.5px] border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 font-bold text-[10px] lg:text-xs uppercase tracking-wider",
                                        isPublic && "bg-indigo-500/10 border-indigo-500/50 text-indigo-600"
                                    )}
                                >
                                    <Globe className={cn("w-4 h-4", isPublic ? "text-indigo-500" : "text-slate-400")}/>
                                    <span className="hidden xl:inline">Gallery</span>
                                </Button>
                            </m.div>
                        </Tooltip>

                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                onClick={onExport}
                                disabled={!hasCurrentImage || isUpscaling}
                                className="rounded-l-xl lg:rounded-l-2xl rounded-r-none h-11 lg:h-12 px-2.5 lg:px-4 border-slate-200/80 dark:border-slate-700/80 border-r-0 font-bold text-[10px] lg:text-xs uppercase tracking-wider flex items-center"
                            >
                                <Download className="w-4 h-4 xl:mr-2"/>
                                <span className="hidden xl:inline">Export</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onShare}
                                className="rounded-r-xl lg:rounded-r-2xl rounded-l-none h-11 lg:h-12 px-2.5 lg:px-3 border-slate-200/80 dark:border-slate-700/80 font-bold text-[10px] lg:text-xs flex items-center"
                            >
                                <Share2 className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </m.div>
    );
}