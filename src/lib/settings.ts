import { prisma } from "./prisma";

/**
 * Checks if the laboratory is in OFF_LINE mode.
 */
export async function isOfflineMode(laboratoryId: string | null): Promise<boolean> {
    if (!laboratoryId) return false;

    try {
        const setting = await prisma.setting.findUnique({
            where: {
                key_laboratoryId: {
                    key: "OFF_LINE",
                    laboratoryId: laboratoryId
                }
            }
        });

        return setting?.value === "true";
    } catch (error) {
        console.error("Error checking OFF_LINE setting:", error);
        return false; // Default to online on error
    }
}
