"use client";

import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import {Clock, ArrowRight} from "lucide-react";
import {useRouter} from "next/navigation";

export default function HistoryPage() {
    const [renders, setRenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchHistory() {
            const {data: {user}} = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const {data, error} = await supabase
                .from("renders")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", {ascending: false});

            if (error) {
                console.error("Error fetching history:", error);
            } else if (data) {
                setRenders(data);
            }
            setLoading(false);
        }

        fetchHistory();
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar/>
            <main className="max-w-6xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Your History</h1>

                {loading ? (
                    <p>Loading your renders...</p>
                ) : renders.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
                        <p className="text-zinc-500 mb-4">No renders found yet.</p>
                        <button
                            onClick={() => router.push("/")}
                            className="text-blue-500 hover:underline"
                        >
                            Start your first project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renders.map((render) => (
                            <div
                                key={render.id}
                                className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
                                onClick={() => router.push(`/visualizer/${render.id}?image=${encodeURIComponent(render.source_image_url)}&name=${encodeURIComponent(render.project_name || "")}`)}
                            >
                                <div className="aspect-video relative overflow-hidden bg-zinc-800">
                                    <img
                                        src={render.rendered_image_url || render.source_image_url}
                                        alt={render.project_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            render.status === 'succeeded' ? 'bg-green-500/20 text-green-400' :
                                                render.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {render.status.charAt(0).toUpperCase() + render.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold truncate max-w-[150px]">{render.project_name}</h3>
                                        <div className="flex items-center text-xs text-zinc-500 mt-1">
                                            <Clock size={12} className="mr-1"/>
                                            {new Date(render.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <ArrowRight size={18}
                                                className="text-zinc-600 group-hover:text-white transition-colors"/>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
