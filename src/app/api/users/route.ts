import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const USER_SELECT = {
    id: true,
    email: true,
    name: true,
    role: true,
    active: true,
    image: true,
    telefono: true,
    createdAt: true,
    laboratory: {
        select: {
            id: true,
            nombre: true,
        },
    },
} as const;

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const labId = searchParams.get("laboratoryId");

        let whereClause: any = {};

        if (session.user.role === "ADMIN") {
            if (labId) {
                whereClause = {
                    OR: [
                        { laboratoryId: labId },
                        { role: "ADMIN" }
                    ]
                };
            }
        } else {
            whereClause = { laboratoryId: session.user.laboratoryId, role: { not: "ADMIN" } };
        }

        const users = await prisma.user.findMany({
            where: whereClause as any,
            select: USER_SELECT,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("Users GET Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { email, name, role, password, laboratoryId, image, telefono } = body;

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
        }

        if (role === "ADMIN" && session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized to assign ADMIN role", { status: 403 });
        }

        // Use the user's laboratoryId unless they are ADMIN specifying one
        let assignedLaboratoryId = session.user.role === "ADMIN" && laboratoryId
            ? laboratoryId
            : session.user.laboratoryId;

        if (role === "ADMIN") {
            assignedLaboratoryId = null;
        }

        if (role !== "ADMIN" && !assignedLaboratoryId) {
            return new NextResponse("Laboratory is required for non-ADMIN users", { status: 400 });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, name, role: role || "USER", password: hashed, laboratoryId: assignedLaboratoryId, image, telefono } as any,
            select: USER_SELECT,
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Users POST Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
