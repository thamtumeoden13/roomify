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
} from 'lucide-react';
import {Select} from '@/components/ui/Select';
import {Tooltip} from '@/components/ui/Tooltip';
import {Popover} from '@/components/ui/Popover';
import Button from '@/components/ui/Button';
import {ROOM_STYLES, PROJECT_CONTEXTS, FLOORING_MATERIALS, LIGHTING_MOODS, CAMERA_VIEWS} from '@/lib/constants';
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
                                              onCustomInstructionsChange
                                          }: VisualizerToolbarProps) {
    const {credits} = useCredits();
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

                {/* Left Group: Configuration (Always 2x2 Grid) */}
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
                            <div className="flex flex-col gap-3">
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
                                <textarea
                                    value={customInstructions}
                                    onChange={(e) => onCustomInstructionsChange(e.target.value)}
                                    placeholder="e.g. Add more indoor plants, Christmas theme, wooden furniture..."
                                    className="w-full min-h-[100px] p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                />
                            </div>
                        </Popover>
                    </div>

                    <div className="h-8 w-px bg-slate-200/30 shrink-0"/>

                    {/* Right Group: Utilities */}
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
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