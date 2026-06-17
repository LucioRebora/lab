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

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const userToUpdate = await prisma.user.findUnique({ where: { id } });
        if (!userToUpdate) return new NextResponse("Not found", { status: 404 });

        if (session.user.role !== "ADMIN") {
            if (userToUpdate.role === "ADMIN") {
                return new NextResponse("Unauthorized to modify ADMIN user", { status: 403 });
            }
            if (userToUpdate.laboratoryId !== session.user.laboratoryId) {
                return new NextResponse("Unauthorized to modify this user", { status: 403 });
            }
        }

        const body = await req.json();
        const { name, email, role, password, active, laboratoryId, image, telefono } = body;

        if (role === "ADMIN" && session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized to assign ADMIN role", { status: 403 });
        }

        const data: Record<string, string | boolean | null> = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (role !== undefined) data.role = role;
        if (active !== undefined) data.active = Boolean(active);
        if (image !== undefined) data.image = image;
        if (telefono !== undefined) data.telefono = telefono;

        if (session.user.role === "ADMIN" && laboratoryId !== undefined) {
            data.laboratoryId = laboratoryId || null;
        }

        if (data.role === "ADMIN") {
            data.laboratoryId = null;
        } else if (data.role && data.role !== "ADMIN") {
            const userLabId = data.laboratoryId !== undefined ? data.laboratoryId : userToUpdate.laboratoryId;
            if (!userLabId) {
                return new NextResponse("Laboratory is required for non-ADMIN users", { status: 400 });
            }
        }
        if (password && String(password).length > 0) {
            data.password = await bcrypt.hash(password, 12);
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: USER_SELECT,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("PATCH /api/users/:id Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        // ensure LAB_ADMIN can only delete their own lab's users and cannot delete ADMINs
        if (session.user.role !== "ADMIN") {
            const userToDelete = await prisma.user.findUnique({ where: { id } });
            if (!userToDelete || userToDelete.laboratoryId !== session.user.laboratoryId) {
                return new NextResponse("Unauthorized to delete this user", { status: 403 });
            }
            if (userToDelete.role === "ADMIN") {
                return new NextResponse("Unauthorized to delete ADMIN user", { status: 403 });
            }
        }

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/users/:id Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
