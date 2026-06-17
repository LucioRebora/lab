"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                isScrolled ? "bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold tracking-tight">
                    bio.itia
                </Link>
                <div className="flex items-center space-x-4">
                    {session ? (
                        <>
                            <Link href="/admin">
                                <Button size="sm" variant="secondary">Panel Admin</Button>
                            </Link>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="flex items-center gap-2"
                            >
                                <LogOut size={15} />
                                Salir
                            </Button>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button size="sm">Ingresar</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
