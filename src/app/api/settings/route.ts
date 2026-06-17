import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const url = new URL(req.url);
        let laboratoryId = session.user.laboratoryId;
        const reqLabId = url.searchParams.get("laboratoryId");

        if (session.user.role === 'ADMIN' && reqLabId) {
            laboratoryId = reqLabId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        const settings: any[] = await prisma.$queryRaw`SELECT * FROM "setting" WHERE "laboratory_id" = ${laboratoryId} ORDER BY "key" ASC`;

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Error al obtener parámetros" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await req.json();
        let laboratoryId = session.user.laboratoryId;

        if (session.user.role === 'ADMIN' && data.laboratoryId) {
            laboratoryId = data.laboratoryId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        const { key, value, description } = data;

        if (!key || !value) {
            return NextResponse.json({ error: "Llave y valor son requeridos" }, { status: 400 });
        }

        const existingList: any[] = await prisma.$queryRaw`SELECT * FROM "setting" WHERE "key" = ${key} AND "laboratory_id" = ${laboratoryId} LIMIT 1`;
        const existing = existingList.length > 0 ? existingList[0] : null;

        if (existing) {
            return NextResponse.json({ error: `El parámetro con llave ${key} ya existe` }, { status: 400 });
        }

        const id = "set_" + Date.now();
        await prisma.$executeRaw`
            INSERT INTO "setting" ("id", "key", "value", "description", "laboratory_id", "updated_at")
            VALUES (${id}, ${key}, ${value}, ${description || null}, ${laboratoryId}, NOW())
        `;
        const setting = { id, key, value, description, laboratoryId };

        revalidatePath("/admin/pacientes");
        revalidatePath("/admin/parametros");

        return NextResponse.json(setting);
    } catch (error: any) {
        console.error("Error creating setting:", error);
        return NextResponse.json({ error: "Error al crear parámetro" }, { status: 500 });
    }
}
