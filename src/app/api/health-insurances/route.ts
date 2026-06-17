import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const laboratoryId = (session.user as any).laboratoryId;
        const isAdmin = (session.user as any).role === "ADMIN";
        const url = new URL(request.url);
        const labIdQuery = url.searchParams.get('laboratoryId') || url.searchParams.get('labId');
        const isBudget = url.searchParams.get('filter') === 'budget';

        let defaultLabId = laboratoryId;
        if (isAdmin && labIdQuery) {
            defaultLabId = labIdQuery;
        }

        if (!defaultLabId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        // Check for budget filter setting
        let allowedIds: string[] | null = null;
        if (isBudget) {
            const setting = await prisma.setting.findUnique({
                where: {
                    key_laboratoryId: {
                        key: 'PRESUPUESTO_OBRAS_SOCIALES',
                        laboratoryId: defaultLabId
                    }
                }
            });

            if (setting && setting.value.trim()) {
                allowedIds = setting.value.split(',').map(id => id.trim());
            }
        }

        const healthInsurances = await prisma.healthInsurance.findMany({
            where: {
                laboratoryId: defaultLabId,
                id: allowedIds ? { in: allowedIds } : undefined
            },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(healthInsurances);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener obras sociales" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await request.json();
        const isAdmin = (session.user as any).role === "ADMIN";
        const laboratoryId = isAdmin ? (data.laboratoryId || (session.user as any).laboratoryId) : (session.user as any).laboratoryId;

        if (!laboratoryId) {
            return NextResponse.json({ error: "Se requiere un laboratorio." }, { status: 400 });
        }

        const healthInsurance = await prisma.healthInsurance.create({
            data: {
                nombre: data.nombre,
                contado: data.contado,
                cortada: data.cortada,
                laboratoryId,
            }
        });

        return NextResponse.json(healthInsurance, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe una obra social con este nombre para este laboratorio." }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al crear obra social" }, { status: 500 });
    }
}
