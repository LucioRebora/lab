import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const data = await request.json();

        const item = await prisma.aspect.update({
            where: { id: params.id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                codigoExterno: data.codigoExterno,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error updating aspect:", error);
        return NextResponse.json({ error: "Failed to update aspect" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        await prisma.aspect.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: "Aspect deleted successfully" });
    } catch (error) {
        console.error("Error deleting aspect:", error);
        return NextResponse.json({ error: "Failed to delete aspect" }, { status: 500 });
    }
}
