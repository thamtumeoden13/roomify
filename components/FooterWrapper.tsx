"use client";

import {usePathname} from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();

    // Hide footer on visualizer page as it is a full-screen tool
    if (pathname?.startsWith("/visualizer/")) {
        return null;
    }

    return <Footer/>;
}
