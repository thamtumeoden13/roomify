"use client";

import React, {useEffect, useState} from 'react'
import {
    User,
    Coins,
    LogIn,
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    ExternalLink,
    ChevronDown
} from 'lucide-react'
import RoomifyLogo from './RoomifyLogo'
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {useRouter} from "next/navigation";
import {useCredits} from "@/lib/hooks/useCredits";
import {motion, AnimatePresence} from "framer-motion";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Button from "@/components/ui/Button";

function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const {credits} = useCredits();

    useEffect(() => {
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const navLinks = [
        {name: "How It Works", href: "/#how-it-works"},
        {name: "Gallery", href: "/gallery"},
        {name: "Features", href: "/#features"},
        {name: "Showcase", href: "/#showcase"},
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
                isScrolled
                    ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 py-3"
                    : "bg-transparent border-transparent py-5"
            }`}
        >
            <motion.div
                initial={{y: -20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.5}}
                className="container mx-auto px-6 flex items-center justify-between"
            >
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <RoomifyLogo className="w-8 h-8 text-primary transition-transform group-hover:scale-110"/>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Roomify</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all duration-200"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100 font-bold text-xs tracking-wider uppercase">
                                <Coins className="w-3.5 h-3.5"/>
                                <span>{credits !== null ? credits : '--'} Credits</span>
                            </div>

                            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
                                <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]">
                                    {user.email}
                                </span>
                                <Link href="/dashboard">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="bg-linear-to-r from-orange-500 to-orange-600 border-none shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 font-bold tracking-wide"
                                    >
                                        DASHBOARD
                                    </Button>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Log Out"
                                >
                                    <LogOut className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden md:flex gap-2 border-slate-200 text-slate-900 hover:bg-slate-50 rounded-full"
                                >
                                    <LogIn className="w-4 h-4"/> Login
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="bg-linear-to-r from-orange-500 to-orange-600 border-none shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 font-bold tracking-wide"
                                >
                                    GET STARTED
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu with Sheet */}
                    <div className="lg:hidden">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <button
                                    className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Menu className="w-6 h-6"/>
                                </button>
                            </SheetTrigger>
                            <SheetContent side="right"
                                          className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-xl border-l border-slate-200">
                                <SheetHeader className="text-left pb-8 border-b border-slate-100">
                                    <SheetTitle className="flex items-center gap-2">
                                        <RoomifyLogo className="w-8 h-8 text-primary"/>
                                        <span className="text-xl font-bold">Roomify</span>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-6 py-8">
                                    <div
                                        className="flex items-center justify-between px-2 py-3 bg-orange-50 rounded-xl border border-orange-100">
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-5 h-5 text-orange-600"/>
                                            <span className="font-bold text-orange-900">Credits</span>
                                        </div>
                                        <span
                                            className="font-black text-orange-600 text-lg">{credits !== null ? credits : '--'}</span>
                                    </div>

                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-medium text-slate-600 hover:text-primary transition-colors px-2"
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                    <hr className="border-slate-100"/>
                                    {user ? (
                                        <>
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-2 text-lg font-bold text-orange-600 px-2"
                                            >
                                                <LayoutDashboard className="w-5 h-5"/> Dashboard
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="flex items-center gap-2 text-lg font-bold text-slate-900 px-2 mt-auto"
                                            >
                                                <LogOut className="w-5 h-5"/> Log Out
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-2 text-lg font-bold text-slate-900 px-2"
                                        >
                                            <LogIn className="w-5 h-5"/> Login
                                        </Link>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </motion.div>
        </header>
    )
}

export default Navbar
