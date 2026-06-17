import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [budget]: any = await prisma.$queryRaw`
            SELECT 
                b."id", 
                b."paciente", 
                b."telefono", 
                b."email", 
                b."total", 
                b."health_insurance_id" as "healthInsuranceId", 
                b."sent_at" as "sentAt",
                b."created_at" as "createdAt", 
                b."updated_at" as "updatedAt",
                hi."nombre" as "healthInsuranceNombre"
            FROM "budget" b
            LEFT JOIN "health_insurance" hi ON b."health_insurance_id" = hi.id
            WHERE b.id = ${id}
            LIMIT 1
        `;

        if (!budget) {
            return NextResponse.json({ error: "No encontrado" }, { status: 404 });
        }

        const items = await prisma.$queryRaw`
            SELECT * FROM "budget_item" WHERE "budget_id" = ${id}
        `;

        return NextResponse.json({ ...budget, items });
    } catch (error) {
        console.error("GET /api/budgets/[id] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // El delete cascade en la DB debería encargarse de los items si está bien configurado en Postgres,
        // pero por seguridad con Raw SQL lo hacemos explícito o confiamos en el esquema.
        await prisma.$executeRaw`DELETE FROM "budget_item" WHERE "budget_id" = ${id}`;
        await prisma.$executeRaw`DELETE FROM "budget" WHERE "id" = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/budgets/[id] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
