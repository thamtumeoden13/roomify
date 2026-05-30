import React from 'react';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import Button from '@/components/ui/Button';

const CTASection = () => {
    return (
        <section className="py-24 md:py-40 relative overflow-hidden bg-slate-900 text-white">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                    backgroundSize: '80px 80px'
                }}/>
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to transform your vision?</h2>
                <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
                    Join thousands of architects and designers who are already using Roomify to speed up
                    their workflow.
                </p>
                <Link href="/dashboard">
                    <Button variant="primary" size="lg"
                            className="h-16 px-12 text-lg bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20">
                        Start Your First Project Now <ArrowRight className="ml-2 w-6 h-6"/>
                    </Button>
                </Link>
            </div>
        </section>
    );
};

export default CTASection;
