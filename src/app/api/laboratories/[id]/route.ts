import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const laboratory = await prisma.laboratory.findUnique({
            where: { id },
        });

        if (!laboratory) return new NextResponse("Not found", { status: 404 });

        return NextResponse.json(laboratory);
    } catch (error) {
        console.error("Error fetching laboratory:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        if (session.user.role !== 'ADMIN') {
            if (session.user.role !== 'LAB_ADMIN' || session.user.laboratoryId !== id) {
                return new NextResponse("Unauthorized to update this laboratory", { status: 403 });
            }
        }

        const data = await request.json();

        const laboratory = await prisma.laboratory.update({
            where: { id },
            data: {
                nombre: data.nombre,
                email: data.email || null,
                direccion: data.direccion || null,
                codigoPostal: data.codigoPostal || null,
                ciudad: data.ciudad || null,
                provincia: data.provincia || null,
                pais: data.pais || null,
                telefono: data.telefono || null,
                sitioWeb: data.sitioWeb || null,
                logo: data.logo || null,
            } as any,
        });

        return NextResponse.json(laboratory);
    } catch (error) {
        console.error("Error updating laboratory:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.laboratory.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting laboratory:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
