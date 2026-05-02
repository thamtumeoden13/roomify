"use client";

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {supabase} from "@/lib/supabase";
import {Sparkles, ArrowRight} from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function SharePage() {
    const {id} = useParams();
    const [project, setProject] = useState<any>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    useEffect(() => {
        async function fetchProjectData() {
            if (!id) return;

            // Fetch project details
            const {data: projectData, error: projectError} = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();

            if (projectError) {
                console.error("Error fetching project:", projectError);
                setLoading(false);
                return;
            }

            setProject(projectData);

            // Fetch successful variants
            const {data: variantsData, error: variantsError} = await supabase
                .from("renders")
                .select("*")
                .eq("project_id", id)
                .eq("status", "succeeded")
                .order("created_at", {ascending: false});

            if (variantsError) {
                console.error("Error fetching variants:", variantsError);
            } else if (variantsData) {
                setVariants(variantsData);
                if (variantsData.length > 0) {
                    setSelectedVariant(variantsData[0]);
                }
            }

            setLoading(false);
        }

        fetchProjectData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading design...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Project Not Found</h1>
                    <p className="text-slate-600 mb-8">This project might have been removed or the link is
                        incorrect.</p>
                    <Link href="/">
                        <Button variant="primary">Go to Homepage</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white"/>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">Roomify</span>
                    </Link>
                    <div className="text-right">
                        <h1 className="text-sm font-semibold text-slate-900">{project.name}</h1>
                        <p className="text-xs text-slate-500">Shared Design</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left side: Slider and Variants */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Comparison Slider */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
                            {selectedVariant ? (
                                <ReactCompareSlider
                                    itemOne={<ReactCompareSliderImage src={project.source_image_url}
                                                                      alt="Original Plan"/>}
                                    itemTwo={<ReactCompareSliderImage
                                        src={selectedVariant.upscaled_image_url || selectedVariant.rendered_image_url}
                                        alt="3D Render"/>}
                                    className="aspect-[4/3] md:aspect-video"
                                />
                            ) : (
                                <div
                                    className="aspect-[4/3] md:aspect-video bg-slate-100 flex items-center justify-center">
                                    <img src={project.source_image_url} alt="Original Plan"
                                         className="max-h-full object-contain"/>
                                </div>
                            )}
                        </div>

                        {/* Description / Title */}
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h2>
                            <p className="text-slate-600">
                                Experience this 2D to 3D architectural transformation powered by AI.
                            </p>
                        </div>
                    </div>

                    {/* Right side: Variant Picker & Details */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Design
                                Variants</h3>
                            {variants.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                                selectedVariant?.id === variant.id ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-transparent hover:border-slate-200"
                                            }`}
                                        >
                                            <img
                                                src={variant.rendered_image_url}
                                                alt="Variant preview"
                                                className="w-full h-full object-cover"
                                            />
                                            {selectedVariant?.id === variant.id && (
                                                <div
                                                    className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                                                    <div className="bg-indigo-600 text-white p-1 rounded-full">
                                                        <Sparkles className="w-3 h-3"/>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">No 3D variants available yet.</p>
                            )}
                        </div>

                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                            <h3 className="font-bold text-indigo-900 mb-2">About this project</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-600/70">Source</span>
                                    <span className="font-medium text-indigo-900">2D Floor Plan</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-600/70">Style</span>
                                    <span
                                        className="font-medium text-indigo-900 capitalize">{selectedVariant?.style_id || "Modern"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-600/70">Status</span>
                                    <span
                                        className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Conversion Banner */}
            <footer className="mt-auto p-6 md:p-12">
                <div
                    className="max-w-5xl mx-auto bg-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-center shadow-2xl">
                    <div
                        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                            Inspired by this design?
                        </h2>
                        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                            Transform your own floor plans into stunning photorealistic 3D visualizations in seconds
                            with Roomify.
                        </p>
                        <Link href="/">
                            <Button
                                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 h-auto text-lg font-bold rounded-2xl group">
                                Create your own with Roomify
                                <ArrowRight
                                    className="ml-2 w-5 h-5 inline transition-transform group-hover:translate-x-1"/>
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="text-center mt-12 text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Roomify AI. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
