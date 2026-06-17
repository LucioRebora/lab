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
        const configs = await (prisma as any).mapperCM260.findMany({
            where: {
                equipmentId,
                laboratoryId: effectiveLabId
            },
            include: {
                subDetermination: {
                    include: {
                        determination: {
                            select: {
                                id: true,
                                nombre: true,
                                codigo: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                subDetermination: {
                    nombre: "asc"
                }
            }
        });
        return NextResponse.json(configs);
    } catch (error) {
        console.error("Error fetching CM260 configs:", error);
        return NextResponse.json({ error: "Error fetching configs" }, { status: 500 });
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
        const { id, codigoExterno, subDeterminationId, tecnica, laboratoryId } = body;

        const effectiveLabId = (session.user as any).role === "ADMIN" ? laboratoryId : (session.user as any).laboratoryId;

        if (id) {
            // Update
            const updated = await (prisma as any).mapperCM260.update({
                where: { id },
                data: {
                    codigoExterno,
                    subDeterminationId,
                    tecnica,
                }
            });
            return NextResponse.json(updated);
        } else {
            // Create
            const created = await (prisma as any).mapperCM260.create({
                data: {
                    codigoExterno,
                    subDeterminationId,
                    tecnica,
                    equipmentId,
                    laboratoryId: effectiveLabId
                }
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        console.error("Error saving CM260 config:", error);
        return NextResponse.json({ error: "Error saving config" }, { status: 500 });
    }
}
