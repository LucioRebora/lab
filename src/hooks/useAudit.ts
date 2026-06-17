"use client";

import { useSession } from "next-auth/react";

export function useAudit() {
    const { data: session } = useSession();

    const logAction = async (params: {
        action: string;
        entity?: string;
        entityId?: string;
        details?: string;
        metadata?: any;
        userId?: string;
        userName?: string;
        laboratoryId?: string;
    }) => {
        try {
            const activeLab = typeof window !== "undefined" ? localStorage.getItem("selectedLaboratoryId") : null;

            const userId = params.userId || session?.user?.id;
            const userName = params.userName || session?.user?.name || session?.user?.email;
            const laboratoryId = params.laboratoryId || activeLab;

            await fetch("/api/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...params,
                    userId,
                    userName,
                    laboratoryId,
                }),
            });
        } catch (error) {
            console.error("Audit logging error:", error);
        }
    };

    return { logAction };
}
