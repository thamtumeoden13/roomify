"use client";

import React, {useEffect, useState} from 'react'
import {User, Coins} from 'lucide-react'
import RoomifyLogo from './RoomifyLogo'
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {useRouter} from "next/navigation";
import {useCredits} from "@/lib/hooks/useCredits";

function Navbar() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const {credits} = useCredits();

    useEffect(() => {
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <header className={"navbar"}>
            <nav className={"inner"}>
                <div className={"left"}>
                    <Link href="/" className={"brand"}>
                        <RoomifyLogo className={"logo drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"}/>
                        <span className={"name"}>
                            Roomify
                        </span>
                    </Link>

                    <ul className={"links"}>
                        <Link href="/#how-it-works">How It Works</Link>
                        {user && <Link href="/dashboard">Dashboard</Link>}
                        <Link href="/gallery">Gallery</Link>
                        <Link href="/#features">Features</Link>
                        <Link href="/#showcase">Showcase</Link>
                    </ul>
                </div>

                <div className={"actions"}>
                    {user ? (
                        <div className="user-profile">
                            <div
                                className="credits-badge mr-4 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-medium text-sm">
                                <Coins className="w-4 h-4"/>
                                <span>{credits !== null ? credits : '--'}</span>
                            </div>
                            <span className="email">{user.email}</span>
                            <button className={"btn btn--ghost btn--sm"} onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className={"btn btn--ghost btn--sm"}>
                                Log In
                            </Link>
                            <a href="#upload" className={"cta"}>Get Started</a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    )
}

export default Navbar
