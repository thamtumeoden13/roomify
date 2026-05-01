"use client";

import Navbar from "@/components/Navbar";
import {ArrowRight, Clock, Layers} from "lucide-react";
import Button from "@/components/ui/Button";
import Upload from "@/components/Upload";
import {useRouter} from "next/navigation";
import {MAX_UPLOAD_BYTES} from "@/lib/constants";
import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";

export default function Home() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        async function fetchProjects() {
            const {data: {user}} = await supabase.auth.getUser();

            let query = supabase
                .from("projects")
                .select("*")
                .order("created_at", {ascending: false});

            if (user) {
                query = query.eq("user_id", user.id);
            }

            const {data, error} = await query;

            if (error) {
                console.error("Error fetching projects:", error);
            } else if (data) {
                setProjects(data);
            }
        }

        fetchProjects();
    }, []);

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
            alert("Failed to create project. Please try again.");
            return;
        }

        // Redirect using the real project_id
        router.push(`/visualizer/${project.id}`);
    };

    return (
        <div className={"home"}>
            <Navbar/>

            <section className={"hero"}>
                <div className={"announce"}>
                    <div className={"dot"}>
                        <div className={"pulse"}></div>
                    </div>
                    <p>Introducing Roomify 2.0</p>
                </div>

                <h1>Build beautiful spaces at the speed of thought with Roomify</h1>

                <p className={"subtitle"}>
                    Roomify is an AI-first design environment that helps you visualize, render, and ship architectural
                    projects faster than ever.
                </p>

                <div className={"actions"}>
                    <a href="#upload" className={"cta"}>
                        Start Building <ArrowRight className={"icon"}/>
                    </a>

                    <Button variant={"outline"} size={"lg"} className={"demo"}>
                        Watch Demo
                    </Button>
                </div>

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

            <section className={"projects"} id="projects">
                <div className={"section-inner"}>
                    <div className={"section-head"}>
                        <div className={"copy"}>
                            <h2>Projects</h2>
                            <p>Your latest work and shared community projects, all in one place.</p>
                        </div>
                    </div>
                    <div className={"projects-grid"}>
                        {projects.map((project: any) => (
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
                                        <ArrowRight size={18}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
