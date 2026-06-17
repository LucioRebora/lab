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

        const items = await prisma.aspect.findMany({
            where: user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error obtaining aspects:", error);
        return NextResponse.json({ error: "Failed to fetch aspects" }, { status: 500 });
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

        const item = await prisma.aspect.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                codigoExterno: data.codigoExterno,
                laboratoryId: user.laboratoryId,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating aspect:", error);
        return NextResponse.json({ error: "Failed to create aspect" }, { status: 500 });
    }
}
