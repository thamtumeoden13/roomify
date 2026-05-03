import type {Metadata, Viewport} from "next";
import React, {type ReactNode} from "react";
import {Instrument_Serif, Geist} from "next/font/google";
import "./app.css";
import {cn} from "@/lib/utils";
import {Toaster} from "sonner";
import {CreditProvider} from "@/lib/context/CreditContext";
import {Analytics} from "@vercel/analytics/react";
import {ContactButton} from "@/components/ContactButton";

const geist = Geist({subsets: ['latin'], variable: '--font-sans'});

const instrumentSerif = Instrument_Serif({
    variable: "--font-serif",
    weight: "400",
    subsets: ["latin"],
});

export const viewport: Viewport = {
    themeColor: "#000000",
};

export const metadata: Metadata = {
    title: {
        default: "Roomify | AI 2D to 3D Architectural Renders",
        template: "%s | Roomify",
    },
    description:
        "Transform your 2D floor plans into stunning photorealistic 3D visualizations in seconds with Roomify AI. The ultimate tool for architects and real estate agents.",
    keywords: [
        "AI Architecture",
        "2D to 3D Floor Plan",
        "Roomify",
        "Real Estate AI",
        "Interior Design AI",
        "3D Rendering",
    ],
    metadataBase: new URL("https://roomify-iota-two.vercel.app"),
    alternates: {
        canonical: "/",
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
        type: "website",
        siteName: "Roomify",
        locale: "en_US",
        url: "https://roomify-iota-two.vercel.app",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 640,
                alt: "Roomify - AI 2D to 3D Architectural Renders",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        site: "@roomify",
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
        <body className={`${geist.variable} ${instrumentSerif.variable} antialiased`}>
        <CreditProvider>
            {children}
            <ContactButton/>
            <Analytics/>
            <Toaster position="bottom-right" richColors/>
        </CreditProvider>
        </body>
        </html>
    );
}
