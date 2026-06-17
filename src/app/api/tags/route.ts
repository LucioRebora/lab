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

        const items = await prisma.tag.findMany({
            where: user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error obtaining tags:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
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

        // Verificar duplicados
        const existing = await prisma.tag.findFirst({
            where: {
                etiqueta: data.etiqueta,
                codigo: data.codigo,
                laboratoryId: user.laboratoryId
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Ya existe una etiqueta con este código y abreviatura en el laboratorio." }, { status: 400 });
        }

        const item = await prisma.tag.create({
            data: {
                etiqueta: data.etiqueta,
                codigo: data.codigo,
                nombre: data.nombre,
                laboratoryId: user.laboratoryId,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating tag:", error);
        return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }
}
