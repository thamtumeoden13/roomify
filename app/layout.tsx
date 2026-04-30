import type {Metadata} from "next";
import {Inter, Instrument_Serif} from "next/font/google";
import "./app.css";

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
    variable: "--font-serif",
    weight: "400",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Roomify - 2D to 3D Architectural Renders",
    description: "Convert your 2D room/house designs into photorealistic 3D renders with AI.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
        <body className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
        {children}
        </body>
        </html>
    );
}
