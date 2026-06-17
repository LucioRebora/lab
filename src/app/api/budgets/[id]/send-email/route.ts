import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBudgetEmail } from "@/lib/mailer";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Obtener el presupuesto con sus items y el nombre del plan base
        const [budget]: any = await prisma.$queryRaw`
            SELECT 
                b."id", 
                b."paciente", 
                b."telefono", 
                b."email", 
                b."total", 
                b."created_at" as "createdAt",
                hi."nombre" as "healthInsuranceNombre"
            FROM "budget" b
            LEFT JOIN "health_insurance" hi ON b."health_insurance_id" = hi.id
            WHERE b.id = ${id}
            LIMIT 1
        `;

        if (!budget) {
            return NextResponse.json({ error: "No encontrado" }, { status: 404 });
        }

        if (!budget.email) {
            return NextResponse.json({ error: "El presupuesto no tiene un email asociado" }, { status: 400 });
        }

        const items: any[] = await prisma.$queryRaw`
            SELECT * FROM "budget_item" WHERE "budget_id" = ${id}
        `;

        // Enviar el email
        await sendBudgetEmail({ ...budget, items });

        // Registrar fecha de envío
        const now = new Date();
        now.setHours(now.getHours() - 3);

        await prisma.budget.update({
            where: { id },
            data: { sentAt: now }
        });

        return NextResponse.json({ success: true, sentAt: new Date() });
    } catch (error: any) {
        console.error("POST /api/budgets/[id]/send-email Error:", error);
        return NextResponse.json({ error: error.message || "Error al enviar el email" }, { status: 500 });
    }
}
