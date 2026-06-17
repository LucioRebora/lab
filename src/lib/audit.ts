import { prisma } from "./prisma";

/**
 * Checks if audit logging is enabled for a given laboratory.
 * Defaults to true if the setting is not found.
 */
export async function isAuditEnabled(laboratoryId: string | null): Promise<boolean> {
    if (!laboratoryId) return true;

    try {
        const setting = await prisma.setting.findUnique({
            where: {
                key_laboratoryId: {
                    key: "AUDIT_LOG_ENABLED",
                    laboratoryId: laboratoryId
                }
            }
        });

        return setting?.value !== "false";
    } catch (error) {
        console.error("Error checking audit setting:", error);
        return true; // Default to enabled on error
    }
}

/**
 * Helper to create an audit log only if enabled.
 */
export async function createAuditLog(data: {
    userId?: string | null;
    userName?: string | null;
    action: string;
    entity?: string | null;
    entityId?: string | null;
    details?: string | null;
    metadata?: any;
    laboratoryId: string | null;
}) {
    const enabled = await isAuditEnabled(data.laboratoryId);
    if (!enabled) return null;

    try {
        return await (prisma as any).auditLog.create({
            data: {
                ...data,
                metadata: data.metadata || {},
            }
        });
    } catch (error) {
        console.error("Error creating audit log helper:", error);
        return null;
    }
}
