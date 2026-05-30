"use client";

import React from "react";
import {m, AnimatePresence} from "framer-motion";
import {Heart, Eye, User, Sparkles} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+ZNPQAIXwM496nefQAAAABJRU5ErkJggg==";

interface ShowcaseCardProps {
    item: any;
    index: number;
    isAdminUser?: boolean;
    onUnapprove?: (itemId: string) => Promise<void>;
}

export default function ShowcaseCard({item, index, isAdminUser, onUnapprove}: ShowcaseCardProps) {
    const render = item.render;
    const initialImageUrl = render.rendered_image_url;
    const highResImageUrl = render.upscaled_image_url;
    const [currentImageUrl, setCurrentImageUrl] = React.useState(initialImageUrl);
    const isTrending = item.view_count > 50 || item.vote_count > 10;

    React.useEffect(() => {
        if (highResImageUrl && highResImageUrl !== initialImageUrl) {
            const img = new Image();
            img.src = highResImageUrl;
            img.onload = () => {
                setCurrentImageUrl(highResImageUrl);
            };
        }
    }, [highResImageUrl, initialImageUrl]);

    return (
        <m.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, delay: index * 0.05}}
            className="h-full group/item relative"
        >
            {isAdminUser && onUnapprove && (
                <div
                    className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button
                        className="bg-white/90 backdrop-blur-md border border-slate-200 text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex items-center justify-center rounded-full shadow-sm"
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Unapprove this item?')) {
                                await onUnapprove(item.id);
                            }
                        }}
                    >
                        <span className="sr-only">Unapprove</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            )}
            <Link href={`/share/${item.id}`} className="block h-full group">
                <div
                    className="relative h-full flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                    {/* Image Container - Dual Split Layout */}
                    <div
                        className="relative aspect-[16/10] overflow-hidden bg-slate-100 flex items-stretch">

                        {/* Left Side: Original 2D Plan */}
                        <div className="relative flex-1 bg-slate-50 overflow-hidden border-r border-slate-200/50">
                            <NextImage
                                src={render.source_image_url}
                                alt="Original 2D Plan"
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-contain transition-all duration-500 group-hover:scale-[1.02] group-hover:opacity-80"
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />
                            <div
                                className="absolute bottom-2 left-2 bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                2D Plan
                            </div>
                        </div>

                        {/* Right Side: 3D Render Result */}
                        <div className="relative flex-1 bg-slate-50 overflow-hidden">
                            {/* Base/Standard Quality Image */}
                            <NextImage
                                src={initialImageUrl}
                                alt={render.project_name || "AI Render"}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-contain transition-all duration-500 group-hover:scale-[1.02]"
                                priority={index < 4}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                            />

                            {/* High Quality/Upscaled Image (fades in when ready) */}
                            <AnimatePresence>
                                {currentImageUrl !== initialImageUrl && (
                                    <m.div
                                        key="high-res"
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        transition={{duration: 0.8}}
                                        className="absolute inset-0"
                                    >
                                        <NextImage
                                            src={currentImageUrl}
                                            alt={render.project_name || "AI Render High Res"}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            className="object-contain"
                                        />
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <div
                                className="absolute bottom-2 right-2 bg-primary/10 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-primary uppercase tracking-wider">
                                3D Render
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div
                            className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-500 pointer-events-none"/>

                        {/* Badges - Repositioned to be less intrusive */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                            {item.is_admin_approved && (
                                <span
                                    className="bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5"/> Staff Pick
                                </span>
                            )}
                            {isTrending && (
                                <span
                                    className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                    🔥 Trending
                                </span>
                            )}
                        </div>

                        <div
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-200 capitalize z-10">
                            {render.style_id || "Japandi"}
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-5 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <User className="w-4 h-4 text-slate-400"/>
                            </div>
                            <span
                                className="text-sm font-bold text-slate-700">User_{item.user_id.substring(0, 4)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Heart className="w-4 h-4"/>
                                <span className="text-xs font-medium">{item.vote_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4"/>
                                <span className="text-xs font-medium">{item.view_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </m.div>
    );
}
