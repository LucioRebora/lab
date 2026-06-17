"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import {
    Home,
    Users,
    ChevronLeft,
    ChevronRight,
    LogOut,
    CreditCard,
    Receipt,
    UserCircle,
    Settings,
    ChevronDown,
    Menu,
    X,
    Building2,
    Pencil,
    Database,
    FileText,
    Stethoscope,
    Microscope,
    ListOrdered,
    LayoutGrid,
    Beaker,
    Cpu,
    Type,
    FilePlus,
    LayoutPanelLeft,
    History,
    ShieldAlert,
    ShieldCheck,
    Activity,
    BarChart3,
    Monitor,
    RefreshCw,
    Play,
    BookOpen,
    FileStack,
    PackageOpen,
    Sun,
    Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditUserModal, type User } from "@/components/admin/EditUserModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const navItems = [
    {
        label: "Nuevo Ingreso",
        href: "/admin/nuevo-ingreso",
        icon: FilePlus
    },
    {
        label: "Libro de Entradas",
        href: "/admin/libro-de-entradas",
        icon: BookOpen,
    },
    {
        label: "Manlab",
        icon: RefreshCw,
        subItems: [
            {
                label: "Derivaciones",
                href: "/admin/manlab",
                icon: Beaker,
            },
            {
                label: "Envíos",
                href: "/admin/manlab/envios",
                icon: History,
            },
            {
                label: "Recepción",
                href: "/admin/manlab/recepcion",
                icon: PackageOpen,
            },
            {
                label: "Configuraciones",
                href: "/admin/manlab/configuracion",
                icon: Settings,
            },
        ],
    },
    {
        label: "Postanalítica",
        icon: Microscope,
        subItems: [
            {
                label: "General",
                href: "/admin/post-analiticas",
                icon: History,
            },
            {
                label: "Por Sección",
                href: "/admin/post-analiticas/por-seccion",
                icon: LayoutGrid,
            },
            {
                label: "Por Determinación",
                href: "/admin/post-analiticas/por-determinacion",
                icon: Beaker,
            },
            {
                label: "Equipos",
                href: "/admin/post-analiticas/equipos",
                icon: Cpu,
            },
            {
                label: "Hojas de Trabajo",
                href: "/admin/post-analiticas/hojas-de-trabajo",
                icon: FileStack,
            },
        ],
    },
    {
        label: "Protocolos",
        href: "/admin/protocolos",
        icon: ListOrdered,
        adminOnly: true,
    },
    {
        label: "Informes",
        href: "/admin/informes",
        icon: FileText
    },
    {
        label: "Pacientes",
        href: "/admin/pacientes",
        icon: Users,
    },
    {
        label: "Presupuestos",
        href: "/admin/presupuestos",
        icon: Receipt,
    },

    {
        label: "Laboratorios",
        href: "/admin/laboratorios",
        icon: Building2,
        adminOnly: true,
    },
    {
        label: "Estadísticas",
        href: "/admin/estadisticas",
        icon: BarChart3,
    },
    {
        label: "Configuraciones",
        icon: Settings,
        subItems: [
            {
                label: "Laboratorio",
                href: "/admin/perfil-laboratorio",
                icon: Building2,
            },
            {
                label: "OS / Prepagas",
                href: "/admin/obras-sociales",
                icon: ShieldAlert,
            },
            {
                label: "Lista de Precios",
                href: "/admin/lista-precios",
                icon: Receipt,
            },
            {
                label: "Bioquímicos",
                href: "/admin/bioquimicos",
                icon: Users,
            },
            {
                label: "Portadas",
                href: "/admin/portadas",
                icon: FileText,
            },
            {
                label: "Médicos",
                href: "/admin/medicos",
                icon: Stethoscope,
            },
            {
                label: "Secciones",
                href: "/admin/secciones",
                icon: LayoutGrid,
            },
            {
                label: "Métodos",
                href: "/admin/metodos",
                icon: Microscope,
            },
            {
                label: "Aspectos",
                href: "/admin/aspectos",
                icon: LayoutPanelLeft,
            },
            {
                label: "Abreviaturas",
                href: "/admin/abreviaturas",
                icon: Type,
            },
            {
                label: "Adicionales",
                href: "/admin/adicionales",
                icon: FilePlus,
            },
            {
                label: "Unidades",
                href: "/admin/unidades",
                icon: ListOrdered,
            },
            {
                label: "Determinaciones",
                href: "/admin/determinaciones",
                icon: Beaker,
            },

            {
                label: "Sub-Determinaciones",
                href: "/admin/sub-determinaciones",
                icon: LayoutPanelLeft,
            },
            {
                label: "Calculadora",
                href: "/admin/calculadora",
                icon: Activity,
            },
            {
                label: "Usuarios",
                href: "/admin/users",
                icon: Users,
            },
            {
                label: "Parámetros",
                href: "/admin/parametros",
                icon: Settings,
            },
            {
                label: "Configuracion Equipos",
                href: "/admin/configuracion-equipos",
                icon: Microscope,
            },
            {
                label: "Etiquetas",
                href: "/admin/etiquetas",
                icon: LayoutPanelLeft,
            },
        ],
    },
    {
        label: "Procesos",
        icon: RefreshCw,
        subItems: [
            {
                label: "Ejecutar Procesos",
                href: "/admin/procesos/ejecutar",
                icon: Play,
            },
        ],
    },
    {
        label: "Administración",
        icon: Database,
        adminOnly: true,
        subItems: [
            {
                label: "Auditoria",
                href: "/admin/auditoria",
                icon: History,
            },
            {
                label: "Equipos",
                href: "/admin/equipos",
                icon: Monitor,
            }
        ]
    }
];


export function Sidebar() {
    const { data: session, update } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const [mobileOpen, setMobileOpen] = useState(false);
    const [labs, setLabs] = useState<any[]>([]);
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [meModalOpen, setMeModalOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Initialize theme
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else if (saved === 'light') {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!session?.user) return;

        const fetchLabs = async () => {
            try {
                const res = await fetch('/api/laboratories');
                const data = await res.json();
                setLabs(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching labs:", error);
            }
        };

        const fetchMe = async () => {
            try {
                const res = await fetch('/api/users/me');
                const data = await res.json();
                if (data?.image) setAvatarUrl(data.image);
            } catch (error) {
                console.error("Error fetching me:", error);
            }
        }

        fetchLabs();
        fetchMe();

        // Load initially selected laboratory for Admin, or set the default one
        const savedLab = localStorage.getItem('selectedLaboratoryId');
        if (session.user.role === 'ADMIN') {
            if (savedLab) {
                setActiveLabId(savedLab);
            } else if (session.user.laboratoryId) {
                // If it's a first-time login for Admin, save their default lab
                setActiveLabId(session.user.laboratoryId);
                localStorage.setItem('selectedLaboratoryId', session.user.laboratoryId);
            }
        } else {
            const labId = (session.user as any).laboratoryId || "";
            setActiveLabId(labId);
            // Si es un usuario normal, forzar su labId en el localStorage al iniciar sesión
            if (labId) {
                localStorage.setItem('selectedLaboratoryId', labId);
            }
        }
    }, [session]);

    const handleLabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setActiveLabId(val);
        localStorage.setItem('selectedLaboratoryId', val);
        window.dispatchEvent(new Event('laboratoryChanged'));
        // Optional: reload the page to refresh data in other components
        window.location.reload();
    };

    const isAdmin = session?.user?.role === 'ADMIN';
    const userLab = labs.find((l) => l.id === (isAdmin ? activeLabId : session?.user?.laboratoryId));

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden shrink-0 flex items-center justify-between h-16 px-5 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 relative z-30">
                <Link href="/admin" className="font-bold text-lg tracking-tight whitespace-nowrap text-emerald-500 flex items-center gap-0">
                    <motion.img 
                        src="/img/logos/logito.png" 
                        alt="" 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ 
                            scale: 1.1,
                        }}
                        transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                        }}
                        className="w-5 h-5 object-contain"
                    />
                    <span>bio.itia</span>
                </Link>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-1.5 -mr-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                animate={{ width: collapsed ? 72 : 240 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                    "flex flex-col h-[100dvh] bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 shrink-0 overflow-hidden",
                    "fixed md:relative inset-y-0 left-0 z-50 md:z-auto",
                    "transition-transform duration-300 md:!transform-none",
                    mobileOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Mobile Close Button */}
                <div className="md:hidden absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 bg-white dark:bg-zinc-950 rounded-full border border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white shadow-sm"
                    >
                        <X size={16} />
                    </button>
                </div>
                {/* Logo */}
                <div className="flex items-center h-16 px-5 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
                    <Link href="/admin" className="flex items-center min-h-[2rem]">
                        <AnimatePresence mode="wait">
                            {!collapsed ? (
                                <motion.div
                                    key="full-logo"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="font-bold text-xl tracking-tight whitespace-nowrap text-emerald-500 flex items-center gap-0"
                                >
                                    <motion.img 
                                        src="/img/logos/logito.png" 
                                        alt="" 
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        whileHover={{ 
                                            scale: 1.1,
                                        }}
                                        transition={{ 
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20
                                        }}
                                        className="w-6 h-6 object-contain"
                                    />
                                    <span>bio.itia</span>
                                </motion.div>
                            ) : (
                                <motion.span
                                    key="small-logo"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-bold text-xl text-emerald-500"
                                >
                                    b.
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>

                {/* Laboratory Selector / Info */}
                {session?.user && (
                    <div className={cn("px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 shrink-0", collapsed && "hidden md:block px-2 text-center")}>
                        {collapsed ? (
                            <div className="w-8 h-8 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center text-xs font-bold text-zinc-500 overflow-hidden" title={userLab?.nombre || "N/A"}>
                                {userLab?.logo ? (
                                    <img src={userLab.logo} alt={userLab.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    userLab?.nombre?.charAt(0) || <Building2 size={14} />
                                )}
                            </div>
                        ) : isAdmin ? (
                            <div className="flex flex-col gap-1.5">
                                <select
                                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 font-medium cursor-pointer"
                                    value={activeLabId}
                                    onChange={handleLabChange}
                                >
                                    <option value="" disabled>Seleccionar laboratorio...</option>
                                    {labs.map((lab) => (
                                        <option key={lab.id} value={lab.id}>{lab.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    {userLab?.logo ? (
                                        <img src={userLab.logo} alt="Logo" className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-800 object-cover shrink-0" />
                                    ) : (
                                        <Building2 size={14} className="text-zinc-500 shrink-0" />
                                    )}
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 truncate">
                                        {userLab?.nombre || "Sin Asignar"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item: any) => {
                        if (item.adminOnly && session?.user?.role !== 'ADMIN') return null;

                        const hasSubItems = !!item.subItems;
                        const isActive = item.href ? pathname === item.href : false;
                        const isAnySubItemActive = item.subItems?.some((si: any) => pathname === si.href);

                        if (hasSubItems) {
                            const isExpanded = !!expandedMenus[item.label];
                            return (
                                <div key={item.label} className="space-y-1">
                                    <button
                                        onClick={() => !collapsed && setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 group cursor-pointer",
                                            isAnySubItemActive && collapsed
                                                ? "bg-black dark:bg-white text-white dark:text-black"
                                                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                                        )}
                                    >
                                        <item.icon size={19} className="shrink-0" />
                                        {!collapsed && (
                                            <>
                                                <span className="text-sm font-medium flex-1 text-left whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown size={14} className="opacity-50" />
                                                </motion.div>
                                            </>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {!collapsed && isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden flex flex-col gap-1 pl-4"
                                            >
                                                {item.subItems?.map((sub: any) => {
                                                    const isSubActive = pathname === sub.href;
                                                    return (
                                                        <Link key={sub.href} href={sub.href}>
                                                            <div
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-150 cursor-pointer",
                                                                    isSubActive
                                                                        ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                                                                        : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                                                                )}
                                                            >
                                                                <sub.icon size={16} className="shrink-0" />
                                                                <span className="text-sm whitespace-nowrap">
                                                                    {sub.label}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }

                        return (
                            <Link key={item.href} href={item.href!}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 group cursor-pointer",
                                        isActive
                                            ? "bg-black dark:bg-white text-white dark:text-black"
                                            : item.variant === "blue"
                                                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                                                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                                    )}
                                >
                                    <item.icon size={19} className="shrink-0" />
                                    <AnimatePresence>
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.1 }}
                                                className="text-sm font-medium whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-3 pb-6 shrink-0 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                    <div className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50",
                        collapsed ? "flex-col py-4 gap-4" : "flex-row"
                    )}>
                        {/* User Info */}
                        <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-xl transition-colors group"
                            onClick={() => setMeModalOpen(true)}
                            title="Editar mi perfil"
                        >
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle size={20} className="text-zinc-500" />
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-700 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Pencil size={9} className="text-zinc-500" />
                                </div>
                            </div>
                            {!collapsed && (
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {session?.user?.name || "Usuario"}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 truncate">
                                        {session?.user?.email}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => setConfirmLogout(true)}
                            title="Cerrar sesión"
                            className={cn(
                                "flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-150",
                                collapsed ? "w-full" : "shrink-0"
                            )}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>



                    <div className={cn("mt-2 px-1 flex items-center", collapsed ? "justify-center" : "justify-between")}>
                        {!collapsed && (
                            <span className="text-[9px] font-mono text-zinc-400 opacity-40">
                                v1.1.14
                            </span>
                        )}
                        
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all duration-300 border shadow-sm select-none",
                                isDark 
                                    ? "bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700" 
                                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            {isDark ? <Moon size={9} fill="currentColor" /> : <Sun size={9} />}
                            {!collapsed && (
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest",
                                    isDark ? "text-zinc-300" : "text-zinc-500"
                                )}>
                                    {isDark ? "Noche" : "Día"}
                                </span>
                            )}
                        </button>

                        {collapsed && (
                            <div className="absolute -top-1 left-0 right-0 h-[1px] bg-zinc-100 dark:bg-zinc-800 opacity-50" />
                        )}
                    </div>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
                >
                    {collapsed ? (
                        <ChevronRight size={12} className="text-zinc-500" />
                    ) : (
                        <ChevronLeft size={12} className="text-zinc-500" />
                    )}
                </button>
            </motion.aside>

            {/* Profile Edit Modal */}
            <EditUserModal
                user={session?.user && (session.user as any).id ? {
                    id: (session.user as any).id,
                    email: session.user.email || "",
                    name: session.user.name || null,
                    role: (session.user as any).role || "USER",
                    active: true,
                    image: avatarUrl,
                    createdAt: new Date().toISOString(),
                    laboratory: userLab
                } : null}
                laboratories={labs}
                open={meModalOpen}
                isProfile={true}
                onClose={() => setMeModalOpen(false)}
                onSaved={async (updated) => {
                    setMeModalOpen(false);
                    // Force session update
                    if (updated.image) setAvatarUrl(updated.image);
                    await update({ name: updated.name });
                    // Give it a small delay for cookie to sync, though mostly local state handles it now
                    setTimeout(() => window.location.reload(), 150);
                }}
            />

            <ConfirmModal
                open={confirmLogout}
                onClose={() => setConfirmLogout(false)}
                onConfirm={() => signOut({ callbackUrl: "/login" })}
                title="¿Cerrar Sesión?"
                description="¿Estás seguro de que deseas salir del sistema?"
                confirmLabel="Salir"
                cancelLabel="Volver"
                variant="danger"
            />
        </>
    );
}
