"use client";

import React, {type ReactNode} from 'react';
import {motion, useScroll, useMotionValueEvent} from 'framer-motion';
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
} from 'lucide-react';
import {Select} from '@/components/ui/Select';
import {Tooltip} from '@/components/ui/Tooltip';
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
    currentPlanExists: boolean;
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
                                              currentPlanExists
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
        <motion.div
            variants={{
                visible: {y: 0, opacity: 1},
                hidden: {y: "120%", opacity: 0}
            }}
            initial="visible"
            animate={hidden ? "hidden" : "visible"}
            transition={{duration: 0.3, ease: "easeInOut"}}
            className="fixed bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] lg:w-auto max-w-[98%] lg:max-w-[95%]"
        >
            <div
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-1.5 md:p-2 lg:p-4 flex flex-row items-center justify-between gap-1 md:gap-2 lg:gap-6 transition-all px-2 md:px-4">

                {/* Left Group: Configuration */}
                <div
                    className="flex flex-row items-center gap-1 md:gap-2 lg:gap-4 w-auto justify-start lg:pr-6 shrink-0">
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

                <div className="hidden lg:block h-10 w-px bg-slate-200/30 mx-2 shrink-0"/>

                {/* Center Group: Primary Action */}
                <div
                    className="flex-1 flex flex-col items-center gap-1 lg:gap-2 py-0 lg:px-6 min-w-0 shrink-0">
                    <motion.div
                        animate={isSettingsChanged && !isPlanProcessing ? {scale: [1, 1.02, 1]} : {}}
                        transition={isSettingsChanged ? {duration: 2, repeat: Infinity, ease: "easeInOut"} : {}}
                        whileHover={{y: -2}}
                        whileTap={{scale: 0.98}}
                        className="w-auto shrink-0"
                    >
                        <Tooltip
                            content={isPlanProcessing ? "Imagining..." : (credits === 0 ? "Out of Credits" : "Generate 3D Plan")}>
                            <Button
                                onClick={() => onGenerateWithReset('plan')}
                                disabled={isPlanProcessing || isUpscaling || credits === 0}
                                className={`relative overflow-hidden w-11 h-11 sm:w-auto aspect-square sm:aspect-auto sm:px-6 lg:px-10 md:py-3 lg:py-4 md:h-11 lg:h-14 rounded-xl lg:rounded-[1.5rem] transition-all duration-500 font-extrabold text-xs lg:text-lg uppercase tracking-wider group shadow-xl ${
                                    credits === 0
                                        ? 'bg-slate-400'
                                        : isPlanProcessing
                                            ? 'bg-indigo-600'
                                            : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 animate-gradient-x'
                                } text-white transition-all duration-500 border-none sm:min-w-[140px] md:min-w-[180px] lg:min-w-[220px] shadow-[0_0_20px_rgba(99,102,241,0)] ${
                                    isSettingsChanged && !isPlanProcessing ? 'shadow-[0_0_25px_rgba(99,102,241,0.5)]' : ''
                                }`}
                            >
                                {/* Mesh Gradient Animation Overlay */}
                                {!isPlanProcessing && credits !== 0 && (
                                    <div
                                        className="absolute inset-0 opacity-50 group-hover:opacity-80 transition-opacity bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] animate-pulse"/>
                                )}

                                {/* Shimmer effect for processing */}
                                {isPlanProcessing && (
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"/>
                                )}

                                <div
                                    className="relative z-10 flex items-center justify-center gap-2 lg:gap-3 text-xs lg:text-base font-bold tracking-tight">
                                    {isPlanProcessing ? (
                                        <RefreshCcw className="w-4 h-4 lg:w-5 h-5 animate-spin"/>
                                    ) : (
                                        <Sparkles
                                            className="w-4 h-4 lg:w-5 h-5 group-hover:rotate-12 transition-transform"/>
                                    )}
                                    <span
                                        className="hidden sm:inline">{isPlanProcessing ? "Imagining..." : (credits === 0 ? "Out of Credits" : "Generate 3D Plan")}</span>
                                    {!isPlanProcessing && credits !== 0 && (
                                        <span className="sm:hidden text-[10px] absolute -bottom-2 font-black">
                                            {credits}
                                        </span>
                                    )}
                                </div>
                            </Button>
                        </Tooltip>
                    </motion.div>

                    {credits !== null && (
                        <div
                            className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <Coins className={`w-3.5 h-3.5 ${credits === 0 ? 'text-rose-500' : 'text-indigo-500'}`}/>
                            <span>Credits: <span
                                className={credits === 0 ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}>{credits}</span></span>
                        </div>
                    )}
                </div>

                <div className="hidden lg:block h-10 w-px bg-slate-200/30 mx-2 shrink-0"/>

                {/* Right Group: Utilities */}
                <div
                    className="flex items-center gap-1 md:gap-2 lg:gap-3 w-auto justify-end lg:pl-6 shrink-0">
                    <Tooltip
                        content={!currentPlanExists ? "Please generate the 3D Plan view first to unlock the Isometric model." : "3D Isometric View"}>
                        <motion.div whileHover={{y: -2}}>
                            <Button
                                variant="outline"
                                onClick={() => onGenerateWithReset('isometric')}
                                disabled={isIsoProcessing || isUpscaling || !currentPlanExists || (credits !== null && credits === 0)}
                                className={cn(
                                    "relative overflow-hidden px-2.5 md:px-3 lg:px-5 py-2.5 h-10 lg:h-11 rounded-xl lg:rounded-2xl transition-all duration-300 font-bold text-[10px] lg:text-xs uppercase tracking-wider flex items-center gap-1.5 lg:gap-2",
                                    isIsoProcessing
                                        ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white border-none shadow-lg"
                                        : "bg-white/10 backdrop-blur-md border-[1.5px] border-slate-200/80 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 shadow-sm"
                                )}
                            >
                                {isIsoProcessing ? (
                                    <RefreshCcw className="w-3.5 h-3.5 lg:w-4 h-4 animate-spin"/>
                                ) : (
                                    <Box className="w-3.5 h-3.5 lg:w-4 h-4 text-indigo-500"/>
                                )}
                                <span
                                    className="hidden lg:inline">{isIsoProcessing ? "Creating..." : "3D Isometric"}</span>
                                <span
                                    className="hidden sm:inline lg:hidden">{isIsoProcessing ? "Creating..." : "3D"}</span>

                                {isIsoProcessing && (
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"/>
                                )}
                            </Button>
                        </motion.div>
                    </Tooltip>

                    <Tooltip content="4K Upscale & Enhance">
                        <motion.div whileHover={{y: -2}}>
                            <Button
                                variant="outline"
                                onClick={onUpscale}
                                disabled={isPlanProcessing || isIsoProcessing || isUpscaling || !hasCurrentImage || credits === 0}
                                className="rounded-xl lg:rounded-2xl h-10 lg:h-11 px-2.5 md:px-3 lg:px-5 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-[10px] lg:text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 lg:gap-2"
                            >
                                {isUpscaling ? (
                                    <RefreshCcw className="w-3.5 h-3.5 lg:w-4 h-4 animate-spin"/>
                                ) : (
                                    <Zap
                                        className={`w-3.5 h-3.5 lg:w-4 h-4 ${credits === 0 ? 'text-slate-400 fill-slate-400' : 'text-amber-500 fill-amber-500'}`}/>
                                )}
                                <span className="hidden lg:inline">{isUpscaling ? "Enhancing..." : "4K Upscale"}</span>
                                <span
                                    className="hidden sm:inline lg:hidden">{isUpscaling ? "Enhancing..." : "4K"}</span>
                            </Button>
                        </motion.div>
                    </Tooltip>

                    <div className="h-8 w-px bg-slate-200/30 mx-1 hidden lg:block shrink-0"/>

                    <div className="flex items-center gap-0.5">
                        <Tooltip content="Export Image">
                            <motion.div whileHover={{y: -2}}>
                                <Button
                                    variant="outline"
                                    onClick={onExport}
                                    disabled={!hasCurrentImage || isUpscaling}
                                    className="rounded-l-xl lg:rounded-l-2xl rounded-r-none h-10 lg:h-11 px-2.5 md:px-3 lg:px-5 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-r-0 font-bold text-[10px] lg:text-xs uppercase tracking-wider transition-all shadow-sm flex items-center"
                                >
                                    <Download className="w-3.5 h-3.5 lg:w-4 h-4 sm:mr-2"/>
                                    <span className="hidden sm:inline">Export</span>
                                </Button>
                            </motion.div>
                        </Tooltip>
                        <Tooltip content="Share Result">
                            <motion.div whileHover={{y: -2}}>
                                <Button
                                    variant="outline"
                                    onClick={onShare}
                                    className="rounded-r-xl lg:rounded-r-2xl rounded-l-none h-10 lg:h-11 px-2.5 md:px-3 lg:px-4 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-[10px] lg:text-xs transition-all shadow-sm flex items-center"
                                >
                                    <Share2 className="w-3.5 h-3.5 lg:w-4 h-4"/>
                                </Button>
                            </motion.div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}