import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const labId = searchParams.get("laboratoryId");

        let whereClause = {};

        if (session.user.role !== 'ADMIN') {
            if (!session.user.laboratoryId) {
                return NextResponse.json({ error: "Usuario sin laboratorio asignado" }, { status: 403 });
            }
            whereClause = { laboratoryId: session.user.laboratoryId };
        } else if (labId) {
            whereClause = { laboratoryId: labId };
        }

        const additionals = await prisma.additional.findMany({
            where: whereClause,
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(additionals);
    } catch (error) {
        console.error("Error al obtener los adicionales:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const laboratoryId = session.user.role === 'ADMIN' ? data.laboratoryId : session.user.laboratoryId;

        if (!laboratoryId) {
            return NextResponse.json({ error: "ID de laboratorio requerido" }, { status: 400 });
        }

        const additionalData = {
            ...data,
            laboratoryId
        };

        const newAdditional = await prisma.additional.create({
            data: additionalData,
        });

        return NextResponse.json(newAdditional, { status: 201 });
    } catch (error: any) {
        console.error("Error al crear adicional:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe un adicional con ese nombre en este laboratorio." }, { status: 409 });
        }
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
