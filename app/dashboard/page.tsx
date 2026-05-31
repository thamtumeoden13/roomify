"use client";

import Navbar from "@/components/Navbar";
import {m} from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    Clock,
    Layers
} from "lucide-react";
import Button from "@/components/ui/Button";
import Upload from "@/components/Upload";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {MAX_UPLOAD_BYTES} from "@/lib/constants";
import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";
import NextImage from "next/image";
import {ProjectService} from "@/lib/services/projects";
import type {Project} from "@/lib/services/types";

export default function Dashboard() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 12;

    const [isFetching, setIsFetching] = useState(false);

    const fetchProjects = async (pageNum: number, isInitial = false) => {
        if (isFetching) return;
        setIsFetching(true);
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        const {data: {user}} = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        const {data, error} = await ProjectService.getUserProjects(supabase, user.id, {
            page: pageNum,
            pageSize: ITEMS_PER_PAGE
        });

        if (error || !data) {
            console.error("Error fetching projects:", error);
            setHasMore(false);
            setLoading(false);
            setLoadingMore(false);
            setIsFetching(false);
            return;
        }

        if (isInitial) {
            setProjects(data);
        } else {
            setProjects(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newProjects = data.filter(p => !existingIds.has(p.id));
                return [...prev, ...newProjects];
            });
        }

        setHasMore(data.length === ITEMS_PER_PAGE);
        setLoading(false);
        setLoadingMore(false);
        setIsFetching(false);
    };

    useEffect(() => {
        setPage(0);
        fetchProjects(0, true);
    }, [router]);

    useEffect(() => {
        const handleScroll = () => {
            if (loading || loadingMore || !hasMore || isFetching) return;

            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 800) {
                setPage(prev => {
                    const nextPage = prev + 1;
                    fetchProjects(nextPage);
                    return nextPage;
                });
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore, page, isFetching]);

    const handleUploadComplete = async (imageUrl: string) => {
        const {data: {user}} = await supabase.auth.getUser();

        const name = `Residence ${Date.now().toString().slice(-4)}`;

        const {data: project, error} = await supabase
            .from("projects")
            .insert({
                name,
                source_image_url: imageUrl,
                user_id: user?.id
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating project:", error);
            toast.error("Failed to create project. Please try again.");
            return;
        }

        // Redirect using the real project_id
        router.push(`/visualizer/${project.id}`);
    };

    if (loading) {
        return <div
            className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-slate-900">Loading...</div>;
    }

    return (
        <div className={"home bg-[#F9FAFB]"}>
            {/* Slide Down Animation for Page Load */}
            <m.div
                initial={{y: -100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.8, ease: "easeOut"}}
                className="fixed inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent z-60"
            />
            <Navbar/>

            <section className={"hero pt-12!"}>
                <div className={"announce"}>
                    <div className={"dot"}>
                        <div className={"pulse"}></div>
                    </div>
                    <p>Dashboard</p>
                </div>

                <h1>Your Projects</h1>

                <p className={"subtitle"}>
                    Upload a new floor plan or continue working on your existing projects.
                </p>

                <div id={"upload"} className={"upload-shell"}>
                    <div className={"grid-overlay"}/>

                    <div className={"upload-card"}>
                        <div className={"upload-card-inner"}>
                            <div className={"upload-head"}>
                                <div className={"upload-icon"}>
                                    <Layers className={"icon"}/>
                                </div>

                                <h3>Upload your floor plan</h3>
                                <p>Supports JPG, PNG, formats up to {MAX_UPLOAD_BYTES / (1024 * 1024)}MB</p>
                            </div>

                            <Upload onComplete={handleUploadComplete}/>
                        </div>
                    </div>
                </div>
            </section>

            <section className={"projects pt-0 md:pt-0"} id="projects">
                <div className={"section-inner"}>
                    <div className={"section-head"}>
                        <div className={"copy"}>
                            <h2>My Projects</h2>
                            <p>Your architectural visualizations.</p>
                        </div>
                    </div>
                    <div className={"projects-grid"}>
                        {projects.length === 0 ? (
                            <div
                                className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                <p className="text-white/40">No projects found. Upload a floor plan to get started.</p>
                            </div>
                        ) : (
                            <>
                                {projects.map((project: any) => (
                                    <div key={project.id} className={"project-card group"}
                                         onClick={() => router.push(`/visualizer/${project.id}`)}>
                                        <div className="preview relative overflow-hidden aspect-[4/3]">
                                            <NextImage
                                                src={project.display_image_url || project.source_image_url || "https://placehold.co/600x400/f3f4f6/94a3b8?text=Floor+Plan"}
                                                alt={project.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover"
                                            />

                                            <div className="badge">
                                                <span>{project.display_image_url !== project.source_image_url ? (project.is_upscaled ? "4K Render" : "Rendered") : "Original"}</span>
                                            </div>
                                            {project.is_upscaled && (
                                                <div
                                                    className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 bg-amber-500 rounded-lg shadow-lg border border-amber-400/50">
                                                    <span className="text-[10px] font-black text-white">4K</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-body">
                                            <div>
                                                <h3>{project.name}</h3>
                                                <div className="meta">
                                                    <Clock size={12}/>
                                                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                                    <span>By You</span>
                                                </div>
                                            </div>
                                            <div className={"arrow"}>
                                                <ArrowUpRight size={18}/>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loadingMore && (
                                    <div className="col-span-full py-8 flex justify-center">
                                        <div
                                            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
