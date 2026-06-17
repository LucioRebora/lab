import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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

        // Ensure key uniqueness if updating key
        if (data.key) {
            const existingList: any[] = await prisma.$queryRaw`SELECT * FROM "setting" WHERE "key" = ${data.key} AND "laboratory_id" = ${laboratoryId} AND "id" != ${params.id} LIMIT 1`;
            const existing = existingList.length > 0 ? existingList[0] : null;

            if (existing) {
                return NextResponse.json({ error: `La llave ${data.key} ya existe` }, { status: 400 });
            }
        }

        await prisma.$executeRaw`
            UPDATE "setting" 
            SET "key" = ${data.key || null}, "value" = ${data.value || null}, "description" = ${data.description || null}, "updated_at" = NOW()
            WHERE "id" = ${params.id} AND "laboratory_id" = ${laboratoryId}
        `;
        const setting = { id: params.id, ...data };

        revalidatePath("/admin/pacientes");
        revalidatePath("/admin/parametros");

        return NextResponse.json(setting);
    } catch (error: any) {
        console.error("Error updating setting:", error);
        return NextResponse.json({ error: "Error al actualizar parámetro" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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

        await prisma.$executeRaw`DELETE FROM "setting" WHERE "id" = ${params.id} AND "laboratory_id" = ${laboratoryId}`;

        revalidatePath("/admin/pacientes");
        revalidatePath("/admin/parametros");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting setting:", error);
        return NextResponse.json({ error: "Error al eliminar parámetro" }, { status: 500 });
    }
}
