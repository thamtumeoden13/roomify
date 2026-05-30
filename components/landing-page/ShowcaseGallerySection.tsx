import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';

const ShowcaseCard = dynamic(() => import('@/components/ShowcaseCard'), {
    ssr: false,
    loading: () => <div className="aspect-[16/10] rounded-3xl bg-slate-100 animate-pulse"/>
});

interface ShowcaseGallerySectionProps {
    isLoading: boolean;
    trendingItems: any[];
    isAdminUser: boolean;
    setTrendingItems: React.Dispatch<React.SetStateAction<any[]>>;
}

const ShowcaseGallerySection = ({
                                    isLoading,
                                    trendingItems,
                                    isAdminUser,
                                    setTrendingItems
                                }: ShowcaseGallerySectionProps) => {
    return (
        <section id="showcase" className="py-32 md:py-48 bg-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">Community
                            Showcase</h2>
                        <p className="text-lg text-slate-600">Discover the most inspiring AI transformations
                            from our creators.</p>
                    </div>
                    <Link href="/gallery">
                        <Button variant="outline" className="rounded-full px-8">View Full Gallery</Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="aspect-[16/10] rounded-3xl bg-slate-100 animate-pulse"/>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {trendingItems.map((item, i) => (
                            <ShowcaseCard
                                key={item.id}
                                item={item}
                                index={i}
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
                                        setTrendingItems(prev => prev.map(ti => ti.id === itemId ? {
                                            ...ti,
                                            is_admin_approved: false
                                        } : ti));
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ShowcaseGallerySection;
