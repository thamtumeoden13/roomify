"use client";

import React, {useState, useEffect, useRef, useCallback} from "react";
import {supabase} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import {motion, AnimatePresence} from "framer-motion";
import {Heart, Eye, Sparkles, User, ArrowUp, Loader2} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
import ShowcaseCard from "@/components/ShowcaseCard";

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
    const [items, setItems] = useState<any[]>([]);
    const [selectedStyle, setSelectedStyle] = useState("All");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const pageRef = useRef(0);

    const fetchItems = useCallback(async (style: string, page: number, append = false) => {
        try {
            if (page === 0) setLoading(true);
            else setLoadingMore(true);

            let query = supabase
                .from("showcase")
                .select("*, render:renders(*)")
                .order("created_at", {ascending: false});

            if (style !== "All") {
                // Since we are filtering by render style_id, we need to handle this.
                // Supabase allows filtering on joined tables using dot notation.
                query = query.eq("render.style_id", style.toLowerCase());
            }

            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const {data, error} = await query.range(from, to);

            if (error) throw error;

            // Filter out items where render join failed (if filtering by style)
            const validData = data?.filter(item => item.render !== null) || [];

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
            setShowBackToTop(window.scrollY > 400);

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

    const scrollToTop = () => {
        window.scrollTo({top: 0, behavior: "smooth"});
    };

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
                                            ? "bg-orange-600 text-slate-900 shadow-lg shadow-orange-600/20 hover:bg-orange-700"
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
                                <ShowcaseCard key={item.id} item={item} index={index % PAGE_SIZE}/>
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

            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 20}}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-colors z-50"
                    >
                        <ArrowUp className="w-6 h-6"/>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
