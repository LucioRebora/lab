import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const requestedLabId = searchParams.get("labId");

        const isAdmin = session.user.role === "ADMIN";
        const targetLabId = (isAdmin && requestedLabId) ? requestedLabId : session.user.laboratoryId;

        if (!targetLabId) {
            return NextResponse.json({ error: "Unauthorized / No laboratory selected" }, { status: 400 });
        }

        const terms = q.split(/\s+/).filter(t => t.length > 0);

        let searchCondition = {};
        if (terms.length > 0) {
            searchCondition = {
                AND: terms.map(term => ({
                    OR: [
                        { nombre: { contains: term, mode: 'insensitive' } },
                        { codigo: { contains: term, mode: 'insensitive' } },
                        { abreviatura: { contains: term, mode: 'insensitive' } }
                    ]
                }))
            };
        }

        const determinations = await (prisma as any).determination.findMany({
            where: {
                laboratoryId: targetLabId,
                activa: true,
                ...searchCondition
            },
            take: 15,
            orderBy: { nombre: 'asc' }
        });

        const additionals = await (prisma as any).additional.findMany({
            where: {
                laboratoryId: targetLabId,
                ...searchCondition
            },
            take: 10,
            orderBy: { nombre: 'asc' }
        });

        const mappedDets = determinations.map((d: any) => ({
            id: d.id,
            codigo: d.codigo ? (parseInt(d.codigo, 10) || d.codigo) : 0,
            determinacion: d.nombre,
            abreviatura: d.abreviatura,
            ub: d.ub || 0,
            isAdditional: false
        }));

        const mappedAdd = additionals.map((a: any) => ({
            id: a.id,
            codigo: a.codigo ? (parseInt(a.codigo, 10) || a.codigo) : 0,
            determinacion: a.nombre,
            abreviatura: a.abreviatura,
            ub: 0,
            isAdditional: true
        }));

        const result = [...mappedDets, ...mappedAdd].sort((a, b) => a.determinacion.localeCompare(b.determinacion));

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/determinations/search Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
