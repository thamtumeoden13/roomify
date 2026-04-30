"use client";

import Navbar from "@/components/Navbar";
import {ArrowRight, Clock, Layers} from "lucide-react";
import Button from "@/components/ui/Button";
import Upload from "@/components/Upload";
import {useRouter} from "next/navigation";
import {MAX_UPLOAD_BYTES} from "@/lib/constants";
import {useState} from "react";

export default function Home() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);

    const handleUploadComplete = async (imageUrl: string) => {
        const newId = Date.now().toString();
        const name = `Residence ${newId}`;

        const newItem = {
            id: newId,
            name,
            sourceImage: imageUrl,
            timestamp: Date.now(),
        };

        setProjects((prev) => [newItem, ...prev]);
        router.push(`/visualizer/${newId}?image=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(name)}`);
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
                        {projects.map(({id, name, renderedImage, sourceImage, timestamp}: any) => (
                            <div key={id} className={"project-card group"}
                                 onClick={() => router.push(`/visualizer/${id}?image=${encodeURIComponent(sourceImage)}&name=${encodeURIComponent(name || "")}`)}>
                                <div className="preview">
                                    <img src={renderedImage || sourceImage} alt="project preview"/>

                                    <div id="badge">
                                        <span>Community</span>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div>
                                        <h3>{name}</h3>
                                        <div className="meta">
                                            <Clock size={12}/>
                                            <span>{new Date(timestamp).toLocaleDateString()}</span>
                                            <span>By BlackCat 13</span>
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
