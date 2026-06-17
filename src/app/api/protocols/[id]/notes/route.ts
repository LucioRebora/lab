import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const notes = await (prisma as any).protocolNote.findMany({
            where: { protocolId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(notes);
    } catch (e: any) {
        console.error("GET /api/protocols/[id]/notes error:", e);
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { text } = await request.json();
        if (!text) {
            return NextResponse.json({ error: "El texto de la nota es requerido" }, { status: 400 });
        }

        const note = await (prisma as any).protocolNote.create({
            data: {
                protocolId: id,
                userId: (session.user as any).id,
                text,
                laboratoryId: (session.user as any).laboratoryId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json(note);
    } catch (e: any) {
        console.error("POST /api/protocols/[id]/notes error:", e);
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
    }
}
