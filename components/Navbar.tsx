"use client";

import React from 'react'
import {Box} from 'lucide-react'
import Link from "next/link";

function Navbar() {
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
                        <Link href="/#upload">Product</Link>
                        <Link href="#">Pricing</Link>
                        <Link href="/#projects">Community</Link>
                        <Link href="#">Enterprise</Link>
                    </ul>
                </div>

                <div className={"actions"}>
                    <button className={"btn btn--ghost btn--sm"}>
                        Log In
                    </button>
                    <a href="#upload" className={"cta"}>Get Started</a>
                </div>
            </nav>
        </header>
    )
}

export default Navbar
