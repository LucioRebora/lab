import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBudgetHTML } from "@/lib/mailer";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Obtener el presupuesto con sus items y el nombre del plan base
        const budget: any = await prisma.$queryRaw`
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
        `.then((res: any) => res[0]);

        if (!budget) {
            return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        }

        // Obtener los items del presupuesto
        const items = await prisma.$queryRaw`
            SELECT * FROM "budget_item" WHERE "budget_id" = ${id}
        `;
        budget.items = items;

        // Generar el HTML
        const htmlContent = generateBudgetHTML(budget);

        // Crear una respuesta con el HTML
        return new Response(htmlContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": `attachment; filename="Presupuesto_${budget.paciente?.replace(/\s+/g, '_') || 'LB_Lab'}.html"`,
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (error) {
        console.error("GET /api/budgets/[id]/download-pdf Error:", error);
        return NextResponse.json({ error: "Error al generar el archivo HTML" }, { status: 500 });
    }
}
