import type {Metadata} from "next";
import React, {type ReactNode} from "react";
import {Inter, Instrument_Serif, Geist} from "next/font/google";
import "./app.css";
import {cn} from "@/lib/utils";
import {Toaster} from "sonner";
import {CreditProvider} from "@/lib/context/CreditContext";

const geist = Geist({subsets: ['latin'], variable: '--font-sans'});

const instrumentSerif = Instrument_Serif({
    variable: "--font-serif",
    weight: "400",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Roomify - 2D to 3D Architectural Renders",
    description: "Convert your 2D room/house designs into photorealistic 3D renders with AI.",
    icons: {
        icon: "/logo.svg",
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
            <Toaster position="bottom-right" richColors/>
        </CreditProvider>
        </body>
        </html>
    );
}
