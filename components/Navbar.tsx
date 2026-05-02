"use client";

import React, {useEffect, useState} from 'react'
import {Box, User} from 'lucide-react'
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {useRouter} from "next/navigation";

function Navbar() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

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
                        <Box className={"logo"}/>
                        <span className={"name"}>
                            Roomify
                        </span>
                    </Link>

                    <ul className={"links"}>
                        <Link href="/#how-it-works">How It Works</Link>
                        {user && <Link href="/dashboard">Dashboard</Link>}
                        <Link href="/#features">Features</Link>
                        <Link href="/#showcase">Showcase</Link>
                    </ul>
                </div>

                <div className={"actions"}>
                    {user ? (
                        <div className="user-profile">
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
