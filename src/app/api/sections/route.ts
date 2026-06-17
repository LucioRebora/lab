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

        const items = await prisma.section.findMany({
            where: {
                ...(user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId }),
            },
            include: { tag: true, worksheet: true },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error obtaining sections:", error);
        return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
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

        const item = await prisma.section.create({
            data: {
                nombre: data.nombre,
                hojaTrabajo: data.hojaTrabajo,
                etiqueta: data.etiqueta,
                laboratoryId: user.laboratoryId,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating section:", error);
        return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
    }
}
