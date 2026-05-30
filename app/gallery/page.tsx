"use client";

import React, {useState, useEffect, useRef, useCallback} from "react";
import {supabase} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import {motion, AnimatePresence} from "framer-motion";
import {Loader2} from "lucide-react";
import Button from "@/components/ui/Button";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
import ShowcaseCard from "@/components/ShowcaseCard";
import {ShowcaseService} from "@/lib/services/showcase";
import type {ShowcaseItem} from "@/lib/services/types";

const STYLES = [
    "All",
    "Modern",
    "Japandi",
    "Indochine",
    "Industrial",
    "Neoclassic",
    "Minimalist",
];

const PAGE_SIZE = 12;

export default function GalleryPage() {
    const [items, setItems] = useState<ShowcaseItem[]>([]);
    const [selectedStyle, setSelectedStyle] = useState("All");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const pageRef = useRef(0);

    const fetchItems = useCallback(async (style: string, page: number, append = false) => {
        try {
            if (page === 0) setLoading(true);
            else setLoadingMore(true);

            const {data, error} = await ShowcaseService.getGalleryItems(supabase, {
                style,
                page,
                pageSize: PAGE_SIZE
            });

            if (error) throw error;

            const validData = data || [];

            if (append) {
                setItems((prev) => [...prev, ...validData]);
            } else {
                setItems(validData);
            }

            setHasMore(validData.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching gallery items:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        pageRef.current = 0;
        fetchItems(selectedStyle, 0);
    }, [selectedStyle, fetchItems]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 500
            ) {
                if (!loading && !loadingMore && hasMore) {
                    pageRef.current += 1;
                    fetchItems(selectedStyle, pageRef.current, true);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [selectedStyle, loading, loadingMore, hasMore, fetchItems]);

    useEffect(() => {
        const checkAdmin = async () => {
            const {data: {user}} = await supabase.auth.getUser();
            if (user) {
                const {data} = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setIsAdminUser(data?.role === 'admin');
            }
        };
        checkAdmin();
    }, []);

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
            <Navbar/>

            <main className="container mx-auto px-6 pt-32 pb-20">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900">
                        Community Showcase
                    </h1>
                    <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                        Explore breathtaking AI-powered architectural transformations from our global community.
                    </p>

                    <div
                        className="sticky top-20 z-30 flex justify-center mb-12 overflow-x-auto pb-4 no-scrollbar bg-[#F9FAFB]/80 backdrop-blur-lg -mx-6 px-6">
                        <ToggleGroup
                            type="single"
                            value={selectedStyle}
                            onValueChange={(value) => value && setSelectedStyle(value)}
                            className="flex gap-2 p-1.5 bg-slate-100/50 rounded-full border border-slate-200/50"
                        >
                            {STYLES.map((style) => (
                                <ToggleGroupItem
                                    key={style}
                                    value={style}
                                    className={`px-8 py-3 rounded-full transition-all duration-300 text-base font-semibold ${
                                        selectedStyle === style
                                            ? "bg-primary text-primary shadow-lg shadow-primary/20 hover:bg-primary-dark"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                >
                                    {style}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                </header>

                {loading && items.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin"/>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-xl text-slate-500 mb-4">No results found for this style.</p>
                        <Button variant="outline" onClick={() => setSelectedStyle("All")}>
                            View All Styles
                        </Button>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        <AnimatePresence mode="popLayout">
                            {items.map((item, index) => (
                                <ShowcaseCard
                                    key={item.id}
                                    item={item}
                                    index={index % PAGE_SIZE}
                                    isAdminUser={isAdminUser}
                                    onUnapprove={async (itemId) => {
                                        const res = await fetch('/api/admin/approve', {
                                            method: 'POST',
                                            headers: {'Content-Type': 'application/json'},
                                            body: JSON.stringify({
                                                showcaseId: itemId,
                                                action: 'unapprove'
                                            }),
                                        });
                                        if (res.ok) {
                                            setItems(prev => prev.map(ti => ti.id === itemId ? {
                                                ...ti,
                                                is_admin_approved: false
                                            } : ti));
                                        }
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {loadingMore && (
                    <div className="flex justify-center mt-12">
                        <Loader2 className="w-8 h-8 text-primary animate-spin"/>
                    </div>
                )}

                {!hasMore && items.length > 0 && (
                    <p className="text-center text-slate-400 mt-12 text-sm font-medium italic">
                        That's all for now. Ready to create your own masterpiece?
                    </p>
                )}
            </main>
        </div>
    );
}
