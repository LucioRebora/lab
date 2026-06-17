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

        const { searchParams } = new URL(request.url);
        const laboratoryId = searchParams.get("laboratoryId") || user.laboratoryId;

        const items = await prisma.abbreviation.findMany({
            where: laboratoryId ? { laboratoryId } : (user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId }),
            orderBy: { resultado: 'asc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error obtaining abbreviations:", error);
        return NextResponse.json({ error: "Failed to fetch abbreviations" }, { status: 500 });
    }
}

import { createAuditLog } from "@/lib/audit";

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
        const laboratoryId = data.laboratoryId || user.laboratoryId;

        const item = await (prisma as any).abbreviation.create({
            data: {
                resultado: data.resultado,
                abreviatura: data.abreviatura,
                codigoExterno: data.codigoExterno,
                laboratoryId,
            }
        });

        await createAuditLog({
            userId: user.id,
            userName: user.name || user.email,
            action: "NUEVA_ABREVIATURA",
            entity: "Abbreviation",
            entityId: item.id,
            details: `Se creó la abreviatura: ${item.resultado} (${item.abreviatura})`,
            laboratoryId: laboratoryId || null
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating abbreviation:", error);
        return NextResponse.json({ error: "Failed to create abbreviation" }, { status: 500 });
    }
}
