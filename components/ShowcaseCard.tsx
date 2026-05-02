"use client";

import React from "react";
import {motion} from "framer-motion";
import {Heart, Eye, User, Sparkles} from "lucide-react";
import Link from "next/link";

interface ShowcaseCardProps {
    item: any;
    index: number;
}

export default function ShowcaseCard({item, index}: ShowcaseCardProps) {
    const render = item.render;
    const imageUrl = render.upscaled_image_url || render.rendered_image_url;
    const isTrending = item.view_count > 50 || item.vote_count > 10;

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: index * 0.1}}
            className="break-inside-avoid mb-6"
        >
            <Link href={`/share/${item.id}`} className="block group relative">
                <div
                    className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl ring-1 ring-black/5">
                    {/* Image Layer */}
                    <div className="relative aspect-auto overflow-hidden">
                        <motion.img
                            src={imageUrl}
                            alt={render.project_name || "AI Render"}
                            className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />

                        {/* 2D Plan Overlay (Faint on hover) */}
                        <div
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500"/>
                        <img
                            src={render.source_image_url}
                            alt="Original"
                            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-30 pointer-events-none"
                        />
                    </div>

                    {/* Badges - Glassmorphism */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                        {item.is_admin_approved && (
                            <div
                                className="bg-black/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                                <Sparkles className="w-3 h-3 text-amber-400"/>
                                STAFF PICK
                            </div>
                        )}
                        {isTrending && (
                            <div
                                className="bg-black/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                                <span className="animate-pulse">🔥</span> TRENDING
                            </div>
                        )}
                    </div>

                    <div
                        className="absolute top-3 right-3 bg-black/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 capitalize z-10 shadow-lg">
                        {render.style_id}
                    </div>

                    {/* Hover Overlay Content */}
                    <div
                        className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        {/* User Info & Stats */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <User className="w-3.5 h-3.5 text-white"/>
                                </div>
                                <span className="text-[11px] font-medium text-white/90 tracking-tight">
                  User_{item.user_id.substring(0, 4)}
                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5 text-white/70"/>
                                    <span className="text-[10px] font-bold text-white">{item.vote_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5 text-white/70"/>
                                    <span className="text-[10px] font-bold text-white">{item.view_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-xl shadow-xl hover:bg-slate-100 transition-colors">
                            View Project
                        </button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
