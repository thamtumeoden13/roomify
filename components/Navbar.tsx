"use client";

import React, {useEffect, useState} from 'react'
import {
    User as UserIcon,
    Coins,
    LogIn,
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    ExternalLink,
    ChevronDown,
    Home,
    Sparkles,
    Image as ImageIcon,
    Zap,
    History,
    Plus
} from 'lucide-react'
import RoomifyLogo from './RoomifyLogo'
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {useRouter, usePathname} from "next/navigation";
import {useCredits} from "@/lib/hooks/useCredits";
import {m, AnimatePresence} from "framer-motion";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Button from "@/components/ui/Button";
import {Button as ShadcnButton} from "@/components/ui/shadcn-button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

interface NavbarProps {
    children?: React.ReactNode;
    minimal?: boolean;
}

function Navbar({children, minimal = false}: NavbarProps) {
    const [user, setUser] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
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
        {name: "Gallery", href: "/gallery", icon: ImageIcon},
        {name: "History", href: "/history", icon: History},
        {name: "Features", href: "/#features", icon: Sparkles},
        {name: "How It Works", href: "/#how-it-works", icon: Zap},
    ];

    return (
        <div className="h-[73px] md:h-[89px]">
            <header
                className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
                    isScrolled
                        ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl py-2 border-slate-200/50 shadow-sm"
                        : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 border-transparent"
                }`}
            >
                <m.div
                    initial={{y: -20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{duration: 0.5}}
                    className="container mx-auto px-6 flex items-center justify-between"
                >
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <RoomifyLogo
                                className="w-9 h-9 text-primary transition-transform group-hover:scale-105 duration-300"/>
                            <span
                                className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">Roomify</span>
                        </Link>

                        {/* Desktop Nav */}
                        {!minimal && (
                            <nav className="hidden lg:flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 min-w-28 min-h-[44px] flex items-center justify-center gap-2 group ${
                                                isActive
                                                    ? "text-primary bg-primary/5 shadow-[0_0_20px_rgba(249,115,22,0.05)]"
                                                    : "text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                                            }`}
                                        >
                                            {/*<link.icon*/}
                                            {/*    className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${*/}
                                            {/*        isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"*/}
                                            {/*    }`}/>*/}
                                            {link.name}

                                            {/* Animated border bottom */}
                                            <span
                                                className={`absolute bottom-1.5 left-4 right-4 h-[1.5px] bg-primary transition-all duration-300 origin-left ${
                                                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                                                }`}/>
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {children}
                        {!minimal && (
                            user ? (
                                <div className="flex items-center gap-3">
                                    {/* Create Button */}
                                    <Link href="/" className="hidden md:block">
                                        <m.button
                                            whileHover={{scale: 1.02}}
                                            whileTap={{scale: 0.98}}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs tracking-wider hover:shadow-lg hover:shadow-slate-900/10 transition-all min-h-[44px]"
                                        >
                                            <Plus className="w-4 h-4"/>
                                            CREATE
                                        </m.button>
                                    </Link>

                                    <div
                                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 rounded-xl border border-orange-100/50 font-bold text-xs shadow-sm">
                                        <div
                                            className="flex items-center justify-center w-5 h-5 bg-orange-100 rounded-full">
                                            <Coins className="w-3 h-3 text-orange-600"/>
                                        </div>
                                        <span className="tabular-nums">{credits !== null ? credits : '--'}</span>
                                        <span
                                            className="text-[10px] opacity-60 font-semibold tracking-tighter">CREDITS</span>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 outline-none group min-h-[44px]"
                                                    aria-label="User profile menu">
                                                <Avatar
                                                    className="w-9 h-9 border border-slate-200 transition-all group-hover:ring-2 group-hover:ring-orange-500/20">
                                                    <AvatarImage src={user.user_metadata?.avatar_url}/>
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 uppercase">
                                                        {user.email?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <ChevronDown
                                                    className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors"/>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end"
                                                             className="w-60 p-2 bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-200/40">
                                            <DropdownMenuLabel className="px-3 py-3">
                                                <div className="flex flex-col gap-1">
                                                <span
                                                    className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account</span>
                                                    <span
                                                        className="text-sm font-semibold text-slate-900 truncate leading-none">{user.email}</span>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-slate-100/80 my-1"/>
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard"
                                                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 transition-all group w-full">
                                                    <div
                                                        className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                                                        <LayoutDashboard className="w-4 h-4 text-slate-500"/>
                                                    </div>
                                                    <span className="font-medium text-slate-700">Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/history"
                                                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-slate-50 transition-all group w-full">
                                                    <div
                                                        className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                                                        <History className="w-4 h-4 text-slate-500"/>
                                                    </div>
                                                    <span className="font-medium text-slate-700">History</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="lg:hidden" asChild>
                                                <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                                                    <div className="p-1.5 rounded-lg bg-orange-100">
                                                        <Coins className="w-4 h-4 text-orange-500"/>
                                                    </div>
                                                    <span
                                                        className="font-medium text-slate-700">{credits !== null ? credits : '--'} Credits</span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-100/80 my-1"/>
                                            <DropdownMenuItem
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl text-red-600 hover:bg-red-50 focus:bg-red-50 transition-all group"
                                            >
                                                <div
                                                    className="p-1.5 rounded-lg bg-red-50 group-hover:bg-white transition-colors">
                                                    <LogOut className="w-4 h-4"/>
                                                </div>
                                                <span className="font-medium">Log out</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link href="/login" className="hidden md:block">
                                        <button
                                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px]">
                                            Log in
                                        </button>
                                    </Link>
                                    <Link href="/login">
                                        <m.div
                                            whileHover={{scale: 1.02}}
                                            whileTap={{scale: 0.98}}
                                        >
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all duration-300 font-bold tracking-wide rounded-full px-6"
                                            >
                                                GET STARTED
                                            </Button>
                                        </m.div>
                                    </Link>
                                </div>
                            )
                        )}

                        {/* Mobile Menu with Sheet */}
                        {!minimal && (
                            <div className="lg:hidden">
                                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <button
                                            className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                            aria-label="Toggle mobile menu">
                                            <Menu className="w-6 h-6"/>
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent side="right"
                                                  className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-xl border-l border-slate-200 p-0">
                                        <div className="flex flex-col h-full">
                                            <SheetHeader className="text-left px-6 py-8 border-b border-slate-100">
                                                <SheetTitle className="flex items-center gap-2">
                                                    <RoomifyLogo className="w-8 h-8 text-primary"/>
                                                    <span className="text-xl font-bold tracking-tighter">Roomify</span>
                                                </SheetTitle>
                                            </SheetHeader>

                                            <div className="flex-1 overflow-y-auto px-6 py-8">
                                                {user ? (
                                                    <div
                                                        className="mb-8 p-5 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm">
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <Avatar
                                                                className="w-12 h-12 border-2 border-white shadow-sm">
                                                                <AvatarImage src={user.user_metadata?.avatar_url}/>
                                                                <AvatarFallback
                                                                    className="bg-slate-200 text-slate-600 uppercase text-xs font-bold">
                                                                    {user.email?.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col min-w-0">
                                                            <span
                                                                className="text-sm font-bold text-slate-900 truncate">{user.email}</span>
                                                                <div
                                                                    className="flex items-center gap-1 text-orange-600 font-bold text-[10px] uppercase tracking-wider">
                                                                    <Coins className="w-3 h-3"/>
                                                                    <span>{credits !== null ? credits : '--'} Credits</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                                                            <Button
                                                                className="w-full bg-slate-900 text-white rounded-xl py-3 h-auto font-bold tracking-wide flex items-center justify-center gap-2 min-h-[44px]">
                                                                <Plus className="w-4 h-4"/>
                                                                NEW PROJECT
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="mb-8 p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center">
                                                        <p className="text-sm text-slate-700 mb-4 font-medium">Log in to
                                                            save your designs and unlock 4K upscaling.</p>
                                                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                                            <Button
                                                                className="w-full bg-primary text-white rounded-xl font-bold min-h-[44px]">
                                                                GET STARTED
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-1">
                                                <span
                                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Navigation</span>
                                                    {navLinks.map((link) => {
                                                        const isActive = pathname === link.href;
                                                        return (
                                                            <Link
                                                                key={link.name}
                                                                href={link.href}
                                                                onClick={() => setMobileMenuOpen(false)}
                                                                className={`flex items-center justify-between text-base font-semibold px-4 py-3.5 rounded-2xl transition-all min-h-[44px] ${
                                                                    isActive
                                                                        ? "text-primary bg-primary/5 shadow-sm"
                                                                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <link.icon
                                                                        className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400"}`}/>
                                                                    {link.name}
                                                                </div>
                                                                <ChevronDown
                                                                    className={`w-4 h-4 -rotate-90 transition-colors ${isActive ? "text-primary/50" : "text-slate-300"}`}/>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-10 flex flex-col gap-1">
                                                <span
                                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Account</span>
                                                    {user ? (
                                                        <div className="space-y-1">
                                                            <Link
                                                                href="/dashboard"
                                                                onClick={() => setMobileMenuOpen(false)}
                                                                className={`flex items-center gap-4 text-base font-semibold px-4 py-3.5 rounded-2xl transition-all min-h-[44px] ${pathname === '/dashboard' ? 'text-primary bg-primary/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                                                            >
                                                                <LayoutDashboard
                                                                    className={`w-5 h-5 ${pathname === '/dashboard' ? 'text-primary' : 'text-slate-400'}`}/> Dashboard
                                                            </Link>
                                                            <Link
                                                                href="/history"
                                                                onClick={() => setMobileMenuOpen(false)}
                                                                className={`flex items-center gap-4 text-base font-semibold px-4 py-3.5 rounded-2xl transition-all min-h-[44px] ${pathname === '/history' ? 'text-primary bg-primary/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                                                            >
                                                                <History
                                                                    className={`w-5 h-5 ${pathname === '/history' ? 'text-primary' : 'text-slate-400'}`}/> History
                                                            </Link>
                                                            <button
                                                                onClick={() => {
                                                                    setMobileMenuOpen(false);
                                                                    handleLogout();
                                                                }}
                                                                className="flex items-center gap-4 text-base font-semibold text-red-600 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-all mt-4 min-h-[44px]"
                                                            >
                                                                <div className="p-1 rounded-lg bg-red-100">
                                                                    <LogOut className="w-5 h-5"/>
                                                                </div>
                                                                Log Out
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <Link
                                                            href="/login"
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="flex items-center gap-4 text-base font-bold text-white px-4 py-4 rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
                                                        >
                                                            <LogIn className="w-5 h-5"/> Login / Sign Up
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        )}
                    </div>
                </m.div>
            </header>
        </div>
    )
}

export default Navbar
