import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await req.json();
        const notifiedUser = await prisma.notifiedUser.update({
            where: { id: params.id },
            data: {
                ...data
            }
        });

        return NextResponse.json(notifiedUser);
    } catch (error: any) {
        console.error("Error updating notified user:", error);
        return NextResponse.json({ error: "Error al actualizar usuario de notificación" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        await prisma.notifiedUser.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting notified user:", error);
        return NextResponse.json({ error: "Error al eliminar usuario de notificación" }, { status: 500 });
    }
}
