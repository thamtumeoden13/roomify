"use client";

import React, {useState, useEffect} from 'react';
import {supabase} from '@/lib/supabase';
import {Check, X, Trash2, ExternalLink} from 'lucide-react';
import {toast} from "sonner";
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function ModerationPage() {
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPendingItems();
    }, []);

    const fetchPendingItems = async () => {
        setIsLoading(true);
        const {data, error} = await supabase
            .from('showcase')
            .select('*, render:renders(*)')
            .eq('is_admin_approved', false)
            .order('created_at', {ascending: false});

        if (data) {
            setPendingItems(data);
        }
        setIsLoading(false);
    };

    const handleAction = async (showcaseId: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({showcaseId, action}),
            });

            if (res.ok) {
                setPendingItems(prev => prev.filter(item => item.id !== showcaseId));
                toast.success(`Successfully ${action}d`);
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to perform action');
            }
        } catch (error) {
            console.error('Action failed:', error);
            toast.error('An error occurred');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">Admin Moderation</h1>

            {pendingItems.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-12 text-center">
                    <p className="text-slate-600 text-lg">No pending items for moderation.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {pendingItems.map((item) => (
                        <div key={item.id}
                             className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm">
                            <div className="md:w-1/3 relative h-64 md:h-auto bg-slate-100">
                                {item.render?.rendered_image_url ? (
                                    <Image
                                        src={item.render.rendered_image_url}
                                        alt="Render"
                                        fill
                                        className="object-cover"
                                        loading="eager"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">No
                                        Image</div>
                                )}
                            </div>

                            <div className="md:w-1/4 relative h-64 md:h-auto border-l border-slate-100 bg-slate-50">
                                {item.render?.source_image_url && (
                                    <Image
                                        src={item.render.source_image_url}
                                        alt="Original"
                                        fill
                                        className="object-cover opacity-80"
                                        loading="eager"
                                    />
                                )}
                                <div
                                    className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Original
                                </div>
                            </div>

                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold mb-2">{item.render?.project_name || 'Untitled Project'}</h3>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                                        <span className="font-semibold">Style:</span> {item.render?.style_id || 'N/A'}
                                        <br/>
                                        <span className="font-semibold">Prompt:</span> {item.render?.prompt || 'N/A'}
                                    </p>
                                    <div
                                        className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">
                                        User: {item.user_id}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleAction(item.id, 'approve')}
                                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                    >
                                        <Check className="w-4 h-4 mr-2"/> Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(item.id, 'reject')}
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2"/> Reject
                                    </Button>
                                    <a
                                        href={`/share/${item.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-12 h-10 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 text-slate-600"/>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
