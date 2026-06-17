import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { laboratory: true }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const biochemists = await prisma.biochemist.findMany({
            where: user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId },
            orderBy: { apellido: 'asc' },
        });

        return NextResponse.json(biochemists);
    } catch (error) {
        console.error("Error obtaining biochemists:", error);
        return NextResponse.json({ error: "Failed to fetch biochemists" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
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

        const biochemist = await prisma.biochemist.create({
            data: {
                apellido: data.apellido,
                nombre: data.nombre,
                tratamiento: data.tratamiento,
                codigo: data.codigo,
                direccion: data.direccion,
                ciudad: data.ciudad,
                provincia: data.provincia,
                codigoPostal: data.codigoPostal,
                telefono: data.telefono,
                celular: data.celular,
                email: data.email,
                notas: data.notas,
                firmante: data.firmante || false,
                laboratoryId: user.laboratoryId,
            }
        });

        return NextResponse.json(biochemist);
    } catch (error) {
        console.error("Error creating biochemist:", error);
        return NextResponse.json({ error: "Failed to create biochemist" }, { status: 500 });
    }
}
