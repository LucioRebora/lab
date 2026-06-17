import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const url = new URL(req.url);
        const search = url.searchParams.get("q") || "";
        const laboratoryId = session.user.role === 'ADMIN' ? url.searchParams.get("laboratoryId") : session.user.laboratoryId;

        if (!laboratoryId) return NextResponse.json({ error: "ID de laboratorio requerido" }, { status: 400 });

        let whereClause: any = { laboratoryId };

        if (search) {
            if (search.includes(',')) {
                // Búsqueda específica "apellido, nombre"
                const [ape, nom] = search.split(',').map(s => s.trim());
                whereClause.AND = [
                    { apellido: { contains: ape, mode: "insensitive" } },
                    { nombre: { contains: nom || "", mode: "insensitive" } }
                ];
            } else {
                const parts = search.split(/\s+/).filter(Boolean);
                if (parts.length > 1) {
                    // Búsqueda flexible por múltiples términos
                    whereClause.AND = parts.map(part => ({
                        OR: [
                            { apellido: { contains: part, mode: "insensitive" } },
                            { nombre: { contains: part, mode: "insensitive" } },
                            { email: { contains: part, mode: "insensitive" } },
                        ]
                    }));
                } else {
                    // Búsqueda estándar
                    whereClause.OR = [
                        { apellido: { contains: search, mode: "insensitive" } },
                        { nombre: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ];
                }
            }
        }

        const notifiedUsers = await prisma.notifiedUser.findMany({
            where: whereClause,
            orderBy: { apellido: "asc" },
            take: 50
        });

        return NextResponse.json(notifiedUsers);
    } catch (error: any) {
        console.error("Error fetching notified users:", error);
        return NextResponse.json({ error: "Error al cargar usuarios de notificación" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await req.json();
        const laboratoryId = session.user.role === 'ADMIN' ? data.laboratoryId : session.user.laboratoryId;

        if (!laboratoryId) return NextResponse.json({ error: "ID de laboratorio requerido" }, { status: 400 });

        const { email, apellido, nombre, enviarUnaCopia, codigoExterno } = data;

        if (!email || !apellido) {
            return NextResponse.json({ error: "Email y Apellido son requeridos" }, { status: 400 });
        }

        const notifiedUser = await prisma.notifiedUser.create({
            data: {
                email,
                apellido,
                nombre,
                codigoExterno: codigoExterno || null,
                enviarUnaCopia: !!enviarUnaCopia,
                laboratoryId
            }
        });

        return NextResponse.json(notifiedUser);
    } catch (error: any) {
        console.error("Error creating notified user:", error);
        return NextResponse.json({ error: "Error al crear usuario de notificación" }, { status: 500 });
    }
}
