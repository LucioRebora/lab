"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Pencil, Trash2, PowerOff, Power, Plus } from "lucide-react";
import { EditUserModal, type User } from "@/components/admin/EditUserModal";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [labs, setLabs] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            const url = savedLab ? `/api/users?laboratoryId=${savedLab}` : "/api/users";
            const [usersRes, labsRes] = await Promise.all([
                fetch(url),
                fetch("/api/laboratories")
            ]);
            const usersData = await usersRes.json();
            const labsData = await labsRes.json();
            setUsers(usersData);
            setLabs(Array.isArray(labsData) ? labsData : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSaved = (saved: User) => {
        setUsers((prev) => {
            const exists = prev.some((u) => u.id === saved.id);
            if (exists) {
                return prev.map((u) => (u.id === saved.id ? saved : u));
            }
            return [saved, ...prev];
        });
    };

    const toggleActive = async (user: User) => {
        setActionLoading(user.id + "-toggle");
        const res = await fetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !user.active }),
        });
        if (res.ok) {
            const updated = await res.json();
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        }
        setActionLoading(null);
    };

    const handleDelete = async (user: User) => {
        setActionLoading(user.id + "-delete");
        const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
        if (res.ok) {
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
        }
        setActionLoading(null);
        setConfirmDelete(null);
    };

    return (
        <>
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Users size={22} className="text-zinc-400" />
                        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
                        <span className="text-sm text-zinc-400">({users.length})</span>
                    </div>
                    <button
                        onClick={() => { setEditingUser(null); setModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        <Plus size={16} /> Nuevo usuario
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-4xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    {loading ? (
                        <div className="p-20 text-center text-zinc-400 text-sm">Cargando usuarios...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="px-8 py-4 font-semibold text-zinc-500">Nombre</th>
                                    <th className="px-8 py-4 font-semibold text-zinc-500">Email</th>
                                    <th className="px-8 py-4 font-semibold text-zinc-500">Rol</th>
                                    <th className="px-8 py-4 font-semibold text-zinc-500">Estado</th>
                                    <th className="px-8 py-4 font-semibold text-zinc-500">Laboratorio</th>
                                    <th className="px-8 py-4 font-semibold text-zinc-500">Fecha</th>
                                    <th className="px-8 py-4 font-semibold text-zinc-500 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className={`border-b border-zinc-50 dark:border-zinc-800/50 transition-colors ${!user.active ? "opacity-50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                                }`}
                                        >
                                            <td className="px-8 py-4">{user.name || "—"}</td>
                                            <td className="px-8 py-4 font-medium">{user.email}</td>
                                            <td className="px-8 py-4">
                                                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold uppercase tracking-wider">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.active
                                                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                                                    {user.active ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-zinc-500 font-medium">
                                                {user.laboratory?.nombre || "—"}
                                            </td>
                                            <td className="px-8 py-4 text-zinc-500">
                                                {new Date(user.createdAt).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Editar */}
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        title="Editar"
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    {/* Activar / Inactivar */}
                                                    <button
                                                        onClick={() => toggleActive(user)}
                                                        disabled={actionLoading === user.id + "-toggle"}
                                                        title={user.active ? "Inactivar" : "Activar"}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${user.active
                                                            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                            : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                                            }`}
                                                    >
                                                        {user.active ? <PowerOff size={14} /> : <Power size={14} />}
                                                    </button>
                                                    {/* Eliminar */}
                                                    <button
                                                        onClick={() => setConfirmDelete(user)}
                                                        title="Eliminar"
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center text-zinc-400">
                                            No hay usuarios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <EditUserModal
                user={editingUser}
                laboratories={labs}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
            />

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <>
                        <motion.div
                            key="del-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            key="del-modal"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed inset-0 flex items-center justify-center z-50 px-4"
                        >
                            <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm p-8 text-center">
                                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-5">
                                    <Trash2 size={22} className="text-rose-500" />
                                </div>
                                <h2 className="text-lg font-bold mb-2">¿Eliminar usuario?</h2>
                                <p className="text-sm text-zinc-500 mb-8">
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{confirmDelete.email}</span> será eliminado permanentemente.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="flex-1 h-11 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(confirmDelete)}
                                        disabled={actionLoading === confirmDelete.id + "-delete"}
                                        className="flex-1 h-11 bg-rose-500 text-white rounded-2xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
