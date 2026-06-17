import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { nombre, active, laboratoryIds } = body;

        const data: any = {};
        if (nombre !== undefined) data.nombre = nombre;
        if (active !== undefined) data.active = active;
        
        if (laboratoryIds && Array.isArray(laboratoryIds)) {
            data.laboratories = {
                set: laboratoryIds.map((id: string) => ({ id }))
            };
        }

        const equipment = await prisma.equipment.update({
            where: { id: params.id },
            data,
            include: {
                laboratories: true
            }
        });
        return NextResponse.json(equipment);
    } catch (error) {
        console.error("Error updating equipment:", error);
        return NextResponse.json({ error: "Error updating equipment" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await prisma.equipment.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error deleting equipment" }, { status: 500 });
    }
}
