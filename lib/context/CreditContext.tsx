"use client";

import React, {createContext, useContext, useState, useEffect, useRef, type ReactNode, useCallback} from 'react';
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

    // Sử dụng Ref để luôn truy cập được giá trị credits mới nhất bên trong Callback của Realtime
    const creditsRef = useRef<number | null>(null);
    // Lưu trữ channel vào ref để quản lý cleanup chính xác hơn giữa các lần re-render
    const channelRef = useRef<any>(null);

    useEffect(() => {
        creditsRef.current = credits;
    }, [credits]);

    // Hàm lấy credit - dùng useCallback để có thể tái sử dụng ổn định
    const fetchCredits = useCallback(async (userId: string) => {
        const {data, error} = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .maybeSingle(); // Dùng maybeSingle để tránh báo lỗi nếu chưa có profile

        if (error) {
            console.error('Error fetching credits:', error);
            return;
        }
        if (data) {
            setCredits(data.credits);
        }
    }, []);

    // Hàm thiết lập Subscription
    const setupSubscription = useCallback((userId: string) => {
        // Dọn dẹp channel cũ nếu đang tồn tại trước khi tạo cái mới
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`profile_credits_global_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    const newCredits = payload.new.credits;
                    const oldCredits = creditsRef.current;

                    setCredits(newCredits);

                    // Chỉ hiện toast nếu là bị trừ tiền (giảm xuống)
                    if (oldCredits !== null && newCredits < oldCredits) {
                        toast.success(`Credit used (-${oldCredits - newCredits})`, {
                            icon: '✨',
                            duration: 2500,
                        });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime credits subscribed!');
                }
            });

        channelRef.current = channel;
    }, []);

    useEffect(() => {
        let mounted = true;

        // Xử lý logic Auth và Data khởi tạo
        const initSession = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (session?.user && mounted) {
                await fetchCredits(session.user.id);
                setupSubscription(session.user.id);
            }
            if (mounted) setLoading(false);
        };

        initSession();

        // Lắng nghe thay đổi Auth
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    fetchCredits(session.user.id);
                    setupSubscription(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                setCredits(null);
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                    channelRef.current = null;
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [fetchCredits, setupSubscription]);

    const refreshCredits = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        if (user) await fetchCredits(user.id);
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