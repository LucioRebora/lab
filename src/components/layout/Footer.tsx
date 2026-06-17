import React from "react";
import { Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-zinc-50 dark:bg-zinc-950 px-6 py-10 border-t border-zinc-100 dark:border-zinc-900">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-400">
                <p>&copy; {new Date().getFullYear()} bio.itia Software. Todos los derechos reservados.</p>

                <p className="flex items-center gap-1">
                    Hecho con <Heart size={14} className="text-rose-500" /> en
                    <a href="https://itia.ar" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors">
                        itia.ar
                    </a>
                </p>

            </div>
        </footer>
    );
}
