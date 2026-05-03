"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {motion} from "framer-motion";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Button from "@/components/ui/Button";
import Upload from "@/components/Upload";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {MAX_UPLOAD_BYTES} from "@/lib/constants";
import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";

export default function Dashboard() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjects() {
            const {data: {user}} = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            let query = supabase
                .from("projects")
                .select("*")
                .order("created_at", {ascending: false});

            query = query.eq("user_id", user.id);

            const {data, error} = await query;

            if (error) {
                console.error("Error fetching projects:", error);
            } else if (data) {
                setProjects(data);
            }
            setLoading(false);
        }

        fetchProjects();
    }, [router]);

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
            <motion.div
                initial={{y: -100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.8, ease: "easeOut"}}
                className="fixed inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent z-[60]"
            />
            <Navbar/>

            <section className={"hero !pt-40"}>
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
                        ) : projects.map((project: any) => (
                            <div key={project.id} className={"project-card group"}
                                 onClick={() => router.push(`/visualizer/${project.id}`)}>
                                <div className="preview">
                                    <img src={project.rendered_image_url || project.source_image_url}
                                         alt="project preview"/>

                                    <div id="badge">
                                        <span>{project.rendered_image_url ? "Rendered" : "Original"}</span>
                                    </div>
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
                    </div>
                </div>
            </section>
            <Footer/>
        </div>
    );
}
