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
    Zap
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
        {name: "How It Works", href: "/#how-it-works", icon: Zap},
        {name: "Gallery", href: "/gallery", icon: ImageIcon},
        {name: "Features", href: "/#features", icon: Sparkles},
        {name: "Showcase", href: "/#showcase", icon: Home},
    ];

    return (
        <header
            className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-slate-200/50 ${
                isScrolled
                    ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-3"
                    : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4"
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
                        <RoomifyLogo
                            className="w-9 h-9 text-primary transition-transform group-hover:scale-105 duration-300"/>
                        <span
                            className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">Roomify</span>
                    </Link>

                    {/* Desktop Nav */}
                    {!minimal && (
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {children}
                    {!minimal && (
                        user ? (
                            <div className="flex items-center gap-4">
                                <div
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 font-bold text-xs">
                                    <div
                                        className="flex items-center justify-center w-5 h-5 bg-orange-100 rounded-full mr-0.5">
                                        <Coins className="w-3 h-3 text-orange-600"/>
                                    </div>
                                    <span>{credits !== null ? credits : '--'}</span>
                                    <span className="text-[10px] opacity-70">CREDITS</span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 outline-none group">
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
                                                         className="w-56 p-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50">
                                        <DropdownMenuLabel className="px-3 py-2">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-slate-400 font-normal">Signed in as</span>
                                                <span
                                                    className="text-sm font-semibold text-slate-900 truncate">{user.email}</span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-100 my-1"/>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard"
                                                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors w-full">
                                                <LayoutDashboard className="w-4 h-4 text-slate-500"/>
                                                <span className="font-medium text-slate-700">Dashboard</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="lg:hidden">
                                            <div className="flex items-center gap-2.5 px-3 py-2 w-full">
                                                <Coins className="w-4 h-4 text-orange-500"/>
                                                <span
                                                    className="font-medium text-slate-700">{credits !== null ? credits : '--'} Credits</span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-100 my-1"/>
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4"/>
                                            <span className="font-medium">Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="hidden md:block">
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                        Log in
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <motion.div
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
                                    </motion.div>
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
                                        className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
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
                                            {user && (
                                                <div
                                                    className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Avatar className="w-10 h-10 border border-white">
                                                            <AvatarImage src={user.user_metadata?.avatar_url}/>
                                                            <AvatarFallback
                                                                className="bg-slate-200 text-slate-600 uppercase text-xs">
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
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-2">
                                                <span
                                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Navigation</span>
                                                {navLinks.map((link) => (
                                                    <Link
                                                        key={link.name}
                                                        href={link.href}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center justify-between text-base font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-3 rounded-xl hover:bg-slate-50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <link.icon className="w-5 h-5 text-slate-400"/>
                                                            {link.name}
                                                        </div>
                                                        <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300"/>
                                                    </Link>
                                                ))}
                                            </div>

                                            <div className="mt-8 flex flex-col gap-2">
                                                <span
                                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Account</span>
                                                {user ? (
                                                    <>
                                                        <Link
                                                            href="/dashboard"
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="flex items-center gap-3 text-base font-medium text-slate-600 hover:text-slate-900 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                                                        >
                                                            <LayoutDashboard
                                                                className="w-5 h-5 text-slate-400"/> Dashboard
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setMobileMenuOpen(false);
                                                                handleLogout();
                                                            }}
                                                            className="flex items-center gap-3 text-base font-medium text-red-600 px-3 py-3 rounded-xl hover:bg-red-50 transition-colors mt-2"
                                                        >
                                                            <LogOut className="w-5 h-5"/> Log Out
                                                        </button>
                                                    </>
                                                ) : (
                                                    <Link
                                                        href="/login"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center gap-3 text-base font-medium text-slate-900 px-3 py-3 rounded-xl bg-slate-100 transition-colors"
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
            </motion.div>
        </header>
    )
}

export default Navbar
