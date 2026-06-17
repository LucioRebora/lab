import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const laboratories = await prisma.laboratory.findMany({
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(laboratories);
    } catch (error) {
        console.error("Error fetching laboratories:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const data = await request.json();

        // Validaciones básicas
        if (!data.nombre) {
            return new NextResponse("El nombre es requerido", { status: 400 });
        }

        const laboratory = await prisma.laboratory.create({
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
            },
        });

        return NextResponse.json(laboratory);
    } catch (error) {
        console.error("Error creating laboratory:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
