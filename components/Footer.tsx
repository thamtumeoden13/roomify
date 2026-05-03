"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import RoomifyLogo from "./RoomifyLogo";

const socials = [
    {
        name: "facebook",
        url: "/facebook.svg",
        href: "https://www.facebook.com/ShjnDo.Hjkaru/",
    },
    {
        name: "linkedin",
        url: "/linkedin.svg",
        href: "https://www.linkedin.com/in/l%C3%AA-ho%C3%A0ng-v%C5%A9-586885169/",
    },
    {
        name: "tiktok",
        url: "/tiktok.svg",
        href: "https://www.tiktok.com/@asapisces",
    },
];

const Footer = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-24 pb-12 relative overflow-hidden">
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                 style={{
                     backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
                     backgroundSize: '40px 40px',
                 }}
            />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Col 1: Brand */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <RoomifyLogo
                                className="w-8 h-8 text-primary transition-transform group-hover:rotate-12"/>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">Roomify</span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                            AI-powered architectural visualization. Transform your 2D plans into stunning 3D renders
                            in seconds.
                        </p>
                        <p className="text-slate-400 text-xs italic">
                            Made with ❤️ for Architects
                        </p>
                        <div className="flex items-center gap-4">
                            {socials.map((social) => (
                                <Link
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary transition-all flex items-center justify-center"
                                >
                                    <Image
                                        src={social.url}
                                        alt={social.name}
                                        width={20}
                                        height={20}
                                        className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Col 2: Product */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                        <ul className="space-y-4">
                            {["Visualizer", "Showcase", "Features", "Pricing"].map((item) => (
                                <li key={item}>
                                    <Link href="#"
                                          className="text-slate-500 hover:text-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3: Support */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Support</h4>
                        <ul className="space-y-4">
                            {["FAQ", "Help Center", "Contact Us"].map((item) => (
                                <li key={item}>
                                    <Link href="#"
                                          className="text-slate-500 hover:text-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 4: Legal */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
                        <ul className="space-y-4">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                                <li key={item}>
                                    <Link href="#"
                                          className="text-slate-500 hover:text-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div
                    className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-slate-400 text-xs">
                        © {new Date().getFullYear()} Roomify AI. All rights reserved.
                    </p>
                    <div
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                            <span className="relative flex h-2 w-2">
                                <span
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        <span className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">Status: All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
