import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const labId = searchParams.get("labId");

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    
    // For non-admins, always filter by their laboratoryId
    let effectiveLabId = labId;
    if (!isAdmin) {
        effectiveLabId = (session.user as any).laboratoryId;
        if (!effectiveLabId) return NextResponse.json([]); 
    }

    try {
        const where = effectiveLabId ? {
            laboratories: {
                some: {
                    id: effectiveLabId
                }
            }
        } : {};
        
        const equipments = await prisma.equipment.findMany({
            where,
            include: {
                laboratories: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: { nombre: "asc" }
        });
        return NextResponse.json(equipments);
    } catch (error) {
        console.error("Error fetching equipments:", error);
        return NextResponse.json({ error: "Error fetching equipments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { nombre, laboratoryIds } = body;

        if (!nombre || !laboratoryIds || !Array.isArray(laboratoryIds)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const equipment = await prisma.equipment.create({
            data: {
                nombre,
                active: true,
                laboratories: {
                    connect: laboratoryIds.map((id: string) => ({ id }))
                }
            },
            include: {
                laboratories: true
            }
        });

        return NextResponse.json(equipment);
    } catch (error) {
        console.error("Error creating equipment:", error);
        return NextResponse.json({ error: "Error creating equipment" }, { status: 500 });
    }
}
