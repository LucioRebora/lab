import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: equipmentId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const labId = searchParams.get("labId");

    const isAdmin = session.user.role === "ADMIN";
    const effectiveLabId = isAdmin ? labId : (session.user as any).laboratoryId;

    if (!effectiveLabId) {
        return NextResponse.json({ error: "Laboratory ID is required" }, { status: 400 });
    }

    try {
        const config = await (prisma as any).equipmentConfig.findUnique({
            where: {
                equipmentId_laboratoryId: {
                    equipmentId,
                    laboratoryId: effectiveLabId
                }
            }
        });
        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching equipment config:", error);
        return NextResponse.json({ error: "Error fetching config" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: equipmentId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { config, laboratoryId } = body;

        const effectiveLabId = (session.user as any).role === "ADMIN" ? laboratoryId : (session.user as any).laboratoryId;

        if (!effectiveLabId) {
            return NextResponse.json({ error: "Laboratory ID is required" }, { status: 400 });
        }

        const updated = await (prisma as any).equipmentConfig.upsert({
            where: {
                equipmentId_laboratoryId: {
                    equipmentId,
                    laboratoryId: effectiveLabId
                }
            },
            update: {
                config
            },
            create: {
                equipmentId,
                laboratoryId: effectiveLabId,
                config
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error saving equipment config:", error);
        return NextResponse.json({ error: "Error saving config" }, { status: 500 });
    }
}
