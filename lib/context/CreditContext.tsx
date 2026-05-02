"use client";

import React, {createContext, useContext, useState, useEffect, useRef, type ReactNode} from 'react';
import {supabase} from '@/lib/supabase';
import {toast} from 'sonner';

interface CreditContextType {
    credits: number | null;
    loading: boolean;
    refreshCredits: () => Promise<void>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({children}: { children: ReactNode }) {
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const creditsRef = useRef<number | null>(null);

    useEffect(() => {
        creditsRef.current = credits;
    }, [credits]);

    const fetchCredits = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const {data} = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (data) {
            setCredits(data.credits);
        }
        setLoading(false);
    };

    useEffect(() => {
        let mounted = true;

        // Initial fetch
        fetchCredits();

        // Subscribe to changes
        let channel: any;

        async function setupSubscription() {
            const {data: {user}} = await supabase.auth.getUser();
            if (!user || !mounted) return;

            channel = supabase
                .channel(`profile_credits_global_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload) => {
                        if (mounted) {
                            const newCredits = payload.new.credits;
                            const oldCredits = creditsRef.current;

                            setCredits(newCredits);

                            if (oldCredits !== null && newCredits < oldCredits) {
                                toast.success(`Credit deducted (-${oldCredits - newCredits})`, {
                                    icon: '✨',
                                    duration: 2000,
                                });
                            }
                        }
                    }
                )
                .subscribe();
        }

        setupSubscription();

        // Also listen for auth changes to re-fetch/re-subscribe
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchCredits();
                if (channel) supabase.removeChannel(channel);
                setupSubscription();
            } else if (event === 'SIGNED_OUT') {
                setCredits(null);
                if (channel) supabase.removeChannel(channel);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const refreshCredits = async () => {
        await fetchCredits();
    };

    return (
        <CreditContext.Provider value={{credits, loading, refreshCredits}}>
            {children}
        </CreditContext.Provider>
    );
}

export function useCreditContext() {
    const context = useContext(CreditContext);
    if (context === undefined) {
        throw new Error('useCreditContext must be used within a CreditProvider');
    }
    return context;
}
