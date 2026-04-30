"use client";

import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";
import {useRouter, useSearchParams} from "next/navigation";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const errorMsg = searchParams.get("error");
        if (errorMsg) {
            setError(errorMsg);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const {error} = await supabase.auth.signInWithPassword({email, password});
        if (error) setError(error.message);
        else router.push("/");
        setLoading(false);
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);
        const {error} = await supabase.auth.signUp({email, password});
        if (error) setError(error.message);
        else alert("Check your email for confirmation!");
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const redirectTo = `${window.location.origin}/api/auth/callback`;
        console.log('Logging in with Google, redirecting to:', redirectTo);
        const {data, error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
            },
        });
        if (error) setError(error.message);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar/>
            <div className="max-w-md mx-auto mt-20 p-8 border border-zinc-800 rounded-xl bg-zinc-900/50">
                <h1 className="text-2xl font-bold mb-6">Login to Roomify</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-black border border-zinc-800 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-black border border-zinc-800 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Loading..." : "Log In"}
                    </Button>
                </form>
                <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={handleSignUp} className="flex-1" disabled={loading}>
                        Sign Up
                    </Button>
                </div>
                <div className="mt-6">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase"><span
                            className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span></div>
                    </div>
                    <Button variant="outline" onClick={handleGoogleLogin} className="w-full">
                        Google
                    </Button>
                </div>
            </div>
        </div>
    );
}
