"use client";

import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import {Clock, ArrowRight, Loader2} from "lucide-react";
import {useRouter} from "next/navigation";

const ITEMS_PER_PAGE = 12;

export default function HistoryPage() {
    const [renders, setRenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();

    const fetchHistory = async (pageNumber: number) => {
        const {data: {user}} = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        const from = pageNumber * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const {data, error} = await supabase
            .from("renders")
            .select("*")
            .eq("user_id", user.id)
            .is("upscale_prediction_id", null) // Do not show image upscale 4k
            .order("created_at", {ascending: false})
            .range(from, to);

        if (error) {
            console.error("Error fetching history:", error);
        } else if (data) {
            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }
            if (pageNumber === 0) {
                setRenders(data);
            } else {
                setRenders(prev => [...prev, ...data]);
            }
        }
        setLoading(false);
        setLoadingMore(false);
    }

    useEffect(() => {
        fetchHistory(0);
    }, [router]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 800 &&
                !loadingMore &&
                hasMore &&
                !loading
            ) {
                setLoadingMore(true);
                const nextPage = page + 1;
                setPage(nextPage);
                fetchHistory(nextPage);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loadingMore, hasMore, page, loading]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar/>
            <main className="max-w-6xl mx-auto p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Your History</h1>
                        <p className="text-slate-500 mt-1">View and manage your previous room transformations</p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        New Project
                        <ArrowRight size={18}/>
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4"/>
                        <p className="text-slate-500 animate-pulse">Loading your renders...</p>
                    </div>
                ) : renders.length === 0 ? (
                    <div
                        className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
                        <div
                            className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-300"/>
                        </div>
                        <p className="text-slate-500 mb-6 text-lg">No renders found yet.</p>
                        <button
                            onClick={() => router.push("/")}
                            className="text-primary font-semibold hover:underline bg-primary/5 px-6 py-2 rounded-lg transition-colors"
                        >
                            Start your first project
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renders.map((render) => (
                                <div
                                    key={render.id}
                                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col"
                                    onClick={() => router.push(`/visualizer/${render.id}?image=${encodeURIComponent(render.source_image_url)}&name=${encodeURIComponent(render.project_name || "")}`)}
                                >
                                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                        <img
                                            src={render.rendered_image_url || render.source_image_url}
                                            alt={render.project_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-4 right-4">
                                            <span
                                                className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-sm ${
                                                    render.status === 'succeeded' ? 'bg-green-500/10 text-green-600 border border-green-200' :
                                                        render.status === 'failed' ? 'bg-red-500/10 text-red-600 border border-red-200' :
                                                            'bg-blue-500/10 text-blue-600 border border-blue-200'
                                                }`}>
                                                {render.status.charAt(0).toUpperCase() + render.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex justify-between items-center bg-white">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{render.project_name || "Untitled Project"}</h3>
                                            <div
                                                className="flex items-center text-xs text-slate-400 mt-1.5 font-medium">
                                                <Clock size={14} className="mr-1.5 text-slate-300"/>
                                                {new Date(render.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div
                                            className="ml-4 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                                            <ArrowRight size={18}/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center py-12">
                                <div
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm transition-all ${loadingMore ? 'opacity-100' : 'opacity-0'}`}>
                                    <Loader2 className="w-5 h-5 text-primary animate-spin"/>
                                    <span className="text-sm font-medium text-slate-600">Loading more designs...</span>
                                </div>
                            </div>
                        )}

                        {!hasMore && renders.length > 0 && (
                            <div className="text-center py-12">
                                <p className="text-slate-400 text-sm font-medium italic">You've reached the end of your
                                    history</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
