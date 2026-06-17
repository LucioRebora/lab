import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const data = await request.json();

        const cover = await prisma.cover.update({
            where: { id: params.id },
            data: {
                nombre: data.nombre,
                abreviatura: data.abreviatura,
                direccion: data.direccion,
                ciudad: data.ciudad,
                provincia: data.provincia,
                codigoPostal: data.codigoPostal,
                telefono: data.telefono,
                fax: data.fax,
                celular: data.celular,
                email: data.email,
                comentario1: data.comentario1,
                comentario2: data.comentario2,
                comentario3: data.comentario3,
                comentario4: data.comentario4,
                comentario5: data.comentario5,
            }
        });

        return NextResponse.json(cover);
    } catch (error) {
        console.error("Error updating cover:", error);
        return NextResponse.json({ error: "Failed to update cover" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        await prisma.cover.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: "Cover deleted successfully" });
    } catch (error) {
        console.error("Error deleting cover:", error);
        return NextResponse.json({ error: "Failed to delete cover" }, { status: 500 });
    }
}
