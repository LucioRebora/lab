import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { id } = await params;

        // Additional security check if not ADMIN
        if (session.user.role !== 'ADMIN') {
            const additional = await prisma.additional.findUnique({
                where: { id }
            });
            if (!additional || additional.laboratoryId !== session.user.laboratoryId) {
                return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
            }
        }

        const updatedAdditional = await prisma.additional.update({
            where: { id },
            data: {
                nombre: data.nombre,
                abreviatura: data.abreviatura,
                codigo: data.codigo,
                agregarSiempre: data.agregarSiempre,
                agregarEnUrgencia: data.agregarEnUrgencia
            },
        });

        return NextResponse.json(updatedAdditional);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe un adicional con ese nombre en este laboratorio." }, { status: 409 });
        }
        console.error("Error al actualizar adicional:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        // Additional security check if not ADMIN
        if (session.user.role !== 'ADMIN') {
            const additional = await prisma.additional.findUnique({
                where: { id }
            });
            if (!additional || additional.laboratoryId !== session.user.laboratoryId) {
                return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
            }
        }

        await prisma.additional.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al eliminar adicional:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
