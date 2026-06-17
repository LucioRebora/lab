import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") ?? "";
        const date = searchParams.get("date") ?? "";
        const requestedLabId = searchParams.get("labId");
        const query = `%${q}%`;

        // Obtener presupuestos
        let budgets;

        const isAdmin = session.user.role === "ADMIN";
        const targetLabId = (isAdmin && requestedLabId) ? requestedLabId : session.user.laboratoryId;

        if (!targetLabId) {
            return new NextResponse("Unauthorized / No laboratory selected", { status: 400 });
        }

        const labFilter = `AND (b."laboratory_id" = '${targetLabId}')`;

        if (date) {
            budgets = await prisma.$queryRawUnsafe(`
                SELECT 
                    b."id", b."paciente", b."telefono", b."email", b."total", b."health_insurance_id" as "healthInsuranceId", b."sent_at" as "sentAt", b."created_at" as "createdAt", b."updated_at" as "updatedAt",
                    hi."nombre" as "healthInsuranceNombre"
                FROM "budget" b
                LEFT JOIN "health_insurance" hi ON b."health_insurance_id" = hi.id
                WHERE (b."paciente" ILIKE $1 OR hi."nombre" ILIKE $1)
                AND b."created_at"::date = $2::date
                ${labFilter}
                ORDER BY b."created_at" DESC
            `, query, date);
        } else {
            budgets = await prisma.$queryRawUnsafe(`
                SELECT 
                    b."id", b."paciente", b."telefono", b."email", b."total", b."health_insurance_id" as "healthInsuranceId", b."sent_at" as "sentAt", b."created_at" as "createdAt", b."updated_at" as "updatedAt",
                    hi."nombre" as "healthInsuranceNombre"
                FROM "budget" b
                LEFT JOIN "health_insurance" hi ON b."health_insurance_id" = hi.id
                WHERE (b."paciente" ILIKE $1 OR hi."nombre" ILIKE $1)
                ${labFilter}
                ORDER BY b."created_at" DESC
            `, query);
        }

        return NextResponse.json(budgets);
    } catch (error) {
        console.error("GET /api/budgets Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { paciente, telefono, email, healthInsuranceId, total, items, labId } = body;

        const isAdmin = session.user.role === "ADMIN";
        const targetLabId = (isAdmin && labId) ? labId : session.user.laboratoryId;

        if (!targetLabId) {
            return new NextResponse("Unauthorized / Laboratory required", { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Se requieren items para el presupuesto" }, { status: 400 });
        }

        const newBudget = await prisma.budget.create({
            data: {
                paciente: paciente || null,
                telefono: telefono || null,
                email: email || null,
                total: Number(total),
                healthInsuranceId: healthInsuranceId || null,
                laboratoryId: targetLabId,
                items: {
                    create: items.map((item: any) => ({
                        determinationId: item.isAdditional ? null : item.determinationId,
                        additionalId: item.isAdditional ? item.additionalId : null,
                        healthInsuranceId: item.healthInsuranceId,
                        healthInsuranceNombre: item.healthInsuranceNombre,
                        codigo: item.codigo,
                        nombre: item.nombre,
                        ub: item.ub,
                        valor: item.valor
                    }))
                }
            }
        });

        return NextResponse.json({ id: newBudget.id }, { status: 201 });
    } catch (error) {
        console.error("POST /api/budgets Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
