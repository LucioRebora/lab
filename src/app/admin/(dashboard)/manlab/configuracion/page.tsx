"use client";

import React, { useState, useEffect } from "react";
import { Settings, ArrowLeft, User, Database, Lock, Save, Loader2, Globe, Plus, Trash2, Edit2, X, Check, Code, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ManlabUser {
    id: string;
    nombre: string;
    manlabId: string;
}

export default function ManlabConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    
    // Config States
    const [ftpConfig, setFtpConfig] = useState({ url: "", user: "", pass: "" });
    const [users, setUsers] = useState<ManlabUser[]>([]);
    const [rawSettings, setRawSettings] = useState<any[]>([]);

    // Form States
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({ nombre: "", manlabId: "" });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<string[]>([]);

    useEffect(() => {
        fetchAllSettings();
    }, []);

    const fetchAllSettings = async () => {
        try {
            const res = await fetch("/api/manlab-settings");
            if (res.ok) {
                const data = await res.json();
                const config = data.config || {};
                
                setRawSettings(data.raw || []);
                
                setFtpConfig({
                    url: config.ftp_url || "",
                    user: config.ftp_user || "",
                    pass: config.ftp_pass || ""
                });

                if (config.manlab_users) {
                    try {
                        setUsers(JSON.parse(config.manlab_users));
                    } catch (e) {
                        setUsers([]);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = (key: string) => {
        setVisibleKeys(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const saveKey = async (key: string, value: string) => {
        setSaving(key);
        try {
            const res = await fetch("/api/manlab-settings", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (!res.ok) throw new Error("Failed to save " + key);
            fetchAllSettings(); // Refresh raw list
            return true;
        } catch (error) {
            toast.error("Error al guardar " + key);
            return false;
        } finally {
            setSaving(null);
        }
    };

    const deleteKey = async (key: string) => {
        if (!confirm(`¿Eliminar permanentemente el parámetro "${key}"?`)) return;
        setDeleting(key);
        try {
            const res = await fetch("/api/manlab-settings", {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            if (res.ok) {
                toast.success(`Parámetro "${key}" eliminado`);
                fetchAllSettings();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setDeleting(null);
        }
    };

    const handleSaveFtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const results = await Promise.all([
            saveKey('ftp_url', ftpConfig.url),
            saveKey('ftp_user', ftpConfig.user),
            saveKey('ftp_pass', ftpConfig.pass)
        ]);
        if (results.every(r => r)) toast.success("Configuración FTP actualizada");
    };

    const handleAddUser = async () => {
        if (!newUser.nombre || !newUser.manlabId) {
            toast.error("Completa todos los campos");
            return;
        }
        const updatedUsers = [...users, { ...newUser, id: Math.random().toString(36).substr(2, 9) }];
        const success = await saveKey('manlab_users', JSON.stringify(updatedUsers));
        if (success) {
            setUsers(updatedUsers);
            setNewUser({ nombre: "", manlabId: "" });
            setIsAddingUser(false);
            toast.success("Usuario añadido");
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("¿Eliminar este usuario?")) return;
        const updatedUsers = users.filter(u => u.id !== id);
        const success = await saveKey('manlab_users', JSON.stringify(updatedUsers));
        if (success) {
            setUsers(updatedUsers);
            toast.success("Usuario eliminado");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase flex items-center gap-3">
                        <Settings className="text-indigo-600" />
                        Configuración Manlab
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1">Gestión avanzada de parámetros y perfiles autorizados.</p>
                </div>
                <Link 
                    href="/admin/manlab"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-600 font-bold transition-all"
                >
                    <ArrowLeft size={18} />
                    Volver
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Users Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                            <User size={22} className="text-indigo-500" />
                            Usuarios Autorizados
                        </h2>
                        <button 
                            onClick={() => setIsAddingUser(true)}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isAddingUser && (
                            <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 rounded-[2rem] p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase ml-1">Nombre Completo</p>
                                        <input 
                                            type="text"
                                            value={newUser.nombre}
                                            onChange={e => setNewUser({...newUser, nombre: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-100 dark:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                            placeholder="Ej: Juan Perez"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase ml-1">ID Manlab</p>
                                        <input 
                                            type="text"
                                            value={newUser.manlabId}
                                            onChange={e => setNewUser({...newUser, manlabId: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-100 dark:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                            placeholder="Cod. 4 digitos"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setIsAddingUser(false)} className="text-xs font-bold text-zinc-500 uppercase">Cancelar</button>
                                    <button 
                                        onClick={handleAddUser}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    >
                                        <Check size={14} /> Guardar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {users.length === 0 ? (
                                <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 shadow-inner rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-zinc-500 font-medium italic">No hay usuarios configurados</p>
                                </div>
                            ) : (
                                users.map(user => (
                                    <div 
                                        key={user.id}
                                        className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-[2.5rem] hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-indigo-500 font-black">
                                                {user.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{user.nombre}</h3>
                                                <p className="text-xs text-zinc-500 font-mono italic">Manlab ID: {user.manlabId}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* FTP Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight px-2 flex items-center gap-2">
                        <Globe size={22} className="text-emerald-500" />
                        Conexión FTP
                    </h2>
                    
                    <form onSubmit={handleSaveFtp} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 pl-1">Servidor (Host)</label>
                            <input 
                                type="text"
                                value={ftpConfig.url}
                                onChange={e => setFtpConfig({...ftpConfig, url: e.target.value})}
                                className="w-full px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                                placeholder="ftp.manlab.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 pl-1">Usuario</label>
                            <input 
                                type="text"
                                value={ftpConfig.user}
                                onChange={e => setFtpConfig({...ftpConfig, user: e.target.value})}
                                className="w-full px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                                placeholder="usuario"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 pl-1">Password</label>
                            <input 
                                type="password"
                                value={ftpConfig.pass}
                                onChange={e => setFtpConfig({...ftpConfig, pass: e.target.value})}
                                className="w-full px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!!saving}
                            className="w-full py-4 bg-zinc-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Guardar FTP
                        </button>
                    </form>
                </div>
            </div>

            {/* Advanced Section: Managing Raw Settings */}
            <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-lg">
                            <Code size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Zona de Depuración</h2>
                            <p className="text-xs text-zinc-500 font-medium">Gestión directa de la Base de Datos Key-Value.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs font-black uppercase text-amber-600 hover:tracking-widest transition-all"
                    >
                        {showAdvanced ? "Ocultar Parámetros" : "Ver Parámetros CRUD"}
                    </button>
                </div>

                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {rawSettings.map((s) => (
                            <div 
                                key={s.key}
                                className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl group relative"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-950">
                                        CLAVE: {s.key}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => toggleVisibility(s.key)}
                                            className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                                        >
                                            {visibleKeys.includes(s.key) ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        <button 
                                            onClick={() => deleteKey(s.key)}
                                            disabled={deleting === s.key}
                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            {deleting === s.key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700 min-h-[60px] overflow-hidden">
                                    <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 break-all">
                                        {visibleKeys.includes(s.key) ? s.value : (s.key === "ftp_pass" || s.key.includes('pass') ? "••••••••" : s.value.substring(0, 15) + "...") }
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
