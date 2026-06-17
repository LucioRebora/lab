"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/libro-de-entradas");
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Iniciando Bio.itia...</p>
    </div>
  );
}

