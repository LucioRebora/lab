"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area 
} from "recharts";
import { 
    Calendar, TrendingUp, Users, DollarSign, Activity, 
    Filter, ArrowRight, Stethoscope, Briefcase, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function StatisticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [dates, setDates] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedLab = localStorage.getItem('selectedLaboratoryId');
        if (savedLab) {
            setActiveLabId(savedLab);
        }
        const handleLabChange = () => {
            const freshLab = localStorage.getItem('selectedLaboratoryId');
            if (freshLab) setActiveLabId(freshLab);
        };
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const fetchStats = useCallback(async (labId = activeLabId, from = dates.from, to = dates.to) => {
        if (!labId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/stats?laboratoryId=${labId}&from=${from}&to=${to}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                toast.error("Error al cargar estadísticas");
            }
        } catch (error) {
            console.error("Fetch stats error:", error);
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    }, [activeLabId, dates]);

    useEffect(() => {
        if (activeLabId) fetchStats();
    }, [activeLabId, fetchStats]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats();
    };

    if (!isMounted) return null;

    if (!stats && loading) {
        return (
            <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-medium font-sans">Calculando métricas...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                        <TrendingUp className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Análisis detallado de actividad y rendimiento</p>
                    </div>
                </div>

                <form onSubmit={handleFilter} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <div className="flex items-center gap-2 px-3">
                        <Calendar size={16} className="text-zinc-400" />
                        <input
                            type="date"
                            value={dates.from}
                            onChange={(e) => setDates({ ...dates, from: e.target.value })}
                            className="text-sm bg-transparent border-none outline-none focus:ring-0 font-medium"
                        />
                    </div>
                    <div className="w-px h-6 bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex items-center gap-2 px-3">
                        <Calendar size={16} className="text-zinc-400" />
                        <input
                            type="date"
                            value={dates.to}
                            onChange={(e) => setDates({ ...dates, to: e.target.value })}
                            className="text-sm bg-transparent border-none outline-none focus:ring-0 font-medium"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-10 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ml-1"
                    >
                        <Filter size={16} />
                        Filtrar
                    </button>
                </form>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Protocolos", value: stats?.summary?.totalProtocols, icon: FileText, color: "emerald" },
                    { label: "Pacientes Únicos", value: stats?.summary?.totalPatients, icon: Users, color: "blue" },
                    { label: "Recaudación Total", value: `$ ${stats?.summary?.totalRevenue.toLocaleString('es-AR')}`, icon: DollarSign, color: "amber" },
                    { label: "Promedio p/Protocolo", value: `$ ${Math.round(stats?.summary?.avgRevenue).toLocaleString('es-AR')}`, icon: Activity, color: "rose" }
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
                    >
                        <div className={`p-3 rounded-2xl w-fit mb-4 bg-${card.color}-50 dark:bg-${card.color}-500/10 text-${card.color}-500`}>
                            <card.icon size={20} />
                        </div>
                        <h3 className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">{card.label}</h3>
                        <div className="text-2xl font-black">{card.value}</div>
                        <div className={`absolute -right-2 -bottom-2 opacity-[0.03] text-${card.color}-500 group-hover:scale-110 transition-transform`}>
                            <card.icon size={100} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Protocol Timeline */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold">Evolución de Ingresos</h2>
                            <p className="text-xs text-zinc-400">Volumen de protocolos por día</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.timeline}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorCount)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Health Insurance Distribution */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
                    <div>
                        <h2 className="text-lg font-bold">Obras Sociales</h2>
                        <p className="text-xs text-zinc-400 mb-6">Distribución de coberturas</p>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.topHealthInsurances}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {stats?.topHealthInsurances.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center"
                                    layout="horizontal"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Determinations */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
                    <div className="mb-8">
                        <h2 className="text-lg font-bold">Análisis más Solicitados</h2>
                        <p className="text-xs text-zinc-400">Top 10 determinaciones con mayor volumen</p>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.topDeterminations} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tick={{fontSize: 10, fill: '#64748b'}} 
                                    width={140}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar 
                                    dataKey="count" 
                                    fill="#3b82f6" 
                                    radius={[0, 8, 8, 0]} 
                                    barSize={20}
                                    label={{ position: 'right', fontSize: 10, fill: '#64748b' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Lists */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold">Top Médicos</h2>
                        <p className="text-xs text-zinc-400">Profesionales con mayor derivación</p>
                    </div>
                    <div className="space-y-4">
                        {stats?.topDoctors?.map((doc: any, i: number) => (
                            <div key={doc.name} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100/50 dark:border-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-[10px] text-zinc-500 shadow-sm">
                                        {i + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold truncate max-w-[120px]">{doc.name}</span>
                                        <span className="text-[10px] text-zinc-400 font-medium tracking-tight">MÉDICO</span>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    {doc.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Patients */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold">Pacientes Frecuentes</h2>
                        <p className="text-xs text-zinc-400">Pacientes con mayor cantidad de ingresos</p>
                    </div>
                    <div className="space-y-4">
                        {stats?.topPatients?.map((pat: any, i: number) => (
                            <div key={pat.name} className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/20 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-[10px] text-zinc-500 shadow-sm">
                                        {i + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold truncate max-w-[120px]">{pat.name}</span>
                                        <span className="text-[10px] text-zinc-400 font-medium tracking-tight">PACIENTE</span>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                                    {pat.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
