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

        const covers = await prisma.cover.findMany({
            where: user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(covers);
    } catch (error) {
        console.error("Error obtaining covers:", error);
        return NextResponse.json({ error: "Failed to fetch covers" }, { status: 500 });
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

        const cover = await prisma.cover.create({
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
                laboratoryId: user.laboratoryId,
            }
        });

        return NextResponse.json(cover);
    } catch (error) {
        console.error("Error creating cover:", error);
        return NextResponse.json({ error: "Failed to create cover" }, { status: 500 });
    }
}
