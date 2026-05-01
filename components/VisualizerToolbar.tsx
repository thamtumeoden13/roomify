"use client";

import React from 'react';
import {motion} from 'framer-motion';
import {
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
    Building
} from 'lucide-react';
import {Select} from '@/components/ui/Select';
import {Tooltip} from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import {ROOM_STYLES, PROJECT_CONTEXTS} from '@/lib/constants';

interface VisualizerToolbarProps {
    onGenerate: (style?: any, context?: any, isVariant?: boolean) => void;
    onUpscale: () => void;
    onExport: () => void;
    selectedStyle: any;
    selectedContext: any;
    isProcessing: boolean;
    isUpscaling: boolean;
    hasCurrentImage: boolean;
}

const contextIcons: Record<string, React.ReactNode> = {
    'full-apartment': <Home className="w-4 h-4"/>,
    'luxury-villa': <Castle className="w-4 h-4"/>,
    'studio-suite': <Layout className="w-4 h-4"/>,
    'single-room': <Square className="w-4 h-4"/>,
    'commercial-space': <Building className="w-4 h-4"/>,
};

const styleIcons: Record<string, React.ReactNode> = {
    'modern': <Layout className="w-4 h-4"/>,
    'vintage': <Palette className="w-4 h-4"/>,
    'japandi': <Sparkles className="w-4 h-4"/>,
    'industrial': <Building className="w-4 h-4"/>,
};

export default function VisualizerToolbar({
                                              onGenerate,
                                              onUpscale,
                                              onExport,
                                              selectedStyle,
                                              selectedContext,
                                              isProcessing,
                                              isUpscaling,
                                              hasCurrentImage
                                          }: VisualizerToolbarProps) {

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

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
            <div
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/50 rounded-3xl shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">

                {/* Left Group: Configuration */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Select
                        label="Space"
                        value={selectedContext.id}
                        onValueChange={(val) => {
                            const context = PROJECT_CONTEXTS.find(c => c.id === val);
                            onGenerate(undefined, context);
                        }}
                        options={contextOptions}
                        icon={contextIcons[selectedContext.id]}
                        disabled={isProcessing || isUpscaling}
                        position="top"
                    />
                    <Select
                        label="Theme"
                        value={selectedStyle.id}
                        onValueChange={(val) => {
                            const style = ROOM_STYLES.find(s => s.id === val);
                            onGenerate(style);
                        }}
                        options={styleOptions}
                        icon={<Palette className="w-4 h-4"/>}
                        disabled={isProcessing || isUpscaling}
                        position="top"
                    />
                </div>

                {/* Center Group: Primary Action */}
                <div className="flex-1 flex justify-center">
                    <motion.div
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.95}}
                    >
                        <Button
                            onClick={() => onGenerate(undefined, undefined, true)}
                            disabled={isProcessing || isUpscaling}
                            className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full px-8 py-6 h-auto shadow-lg shadow-indigo-500/25 border-none group transition-all min-w-[200px]"
                        >
                            <div className="flex items-center gap-2 text-base font-bold tracking-tight">
                                {isProcessing ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin"/>
                                ) : (
                                    <Sparkles className="w-5 h-5 group-hover:animate-pulse"/>
                                )}
                                {isProcessing ? "Imagining..." : "Generate 3D"}
                            </div>
                            <div
                                className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                        </Button>
                    </motion.div>
                </div>

                {/* Right Group: Utilities */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Tooltip content="Enhance to ultra-high resolution">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onUpscale}
                            disabled={isProcessing || isUpscaling || !hasCurrentImage}
                            className="rounded-xl h-10 px-4 border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            {isUpscaling ? (
                                <RefreshCcw className="w-4 h-4 mr-2 animate-spin"/>
                            ) : (
                                <Zap className="w-4 h-4 mr-2 text-amber-500 fill-amber-500"/>
                            )}
                            {isUpscaling ? "Enhancing..." : "4K Upscale"}
                        </Button>
                    </Tooltip>

                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"/>

                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            disabled={!hasCurrentImage || isUpscaling}
                            className="rounded-l-xl rounded-r-none h-10 px-4 border-slate-200 hover:bg-slate-50 border-r-0"
                        >
                            <Download className="w-4 h-4 mr-2"/>
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="rounded-r-xl rounded-l-none h-10 px-4 border-slate-200 hover:bg-slate-50"
                        >
                            <Share2 className="w-4 h-4"/>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
