import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

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
        const laboratoryId = data.laboratoryId || user.laboratoryId;

        const item = await (prisma as any).abbreviation.update({
            where: { id: params.id },
            data: {
                resultado: data.resultado,
                abreviatura: data.abreviatura,
                codigoExterno: data.codigoExterno,
            }
        });

        await createAuditLog({
            userId: user.id,
            userName: user.name || user.email,
            action: "ACTUALIZAR_ABREVIATURA",
            entity: "Abbreviation",
            entityId: params.id,
            details: `Se actualizó la abreviatura: ${item.resultado} (${item.abreviatura})`,
            laboratoryId: laboratoryId || item.laboratoryId || null
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error updating abbreviation:", error);
        return NextResponse.json({ error: "Failed to update abbreviation" }, { status: 500 });
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

        const item = await prisma.abbreviation.delete({
            where: { id: params.id }
        });

        await createAuditLog({
            userId: user.id,
            userName: user.name || user.email,
            action: "ELIMINAR_ABREVIATURA",
            entity: "Abbreviation",
            entityId: params.id,
            details: `Se eliminó la abreviatura: ${item.resultado}`,
            laboratoryId: item.laboratoryId || null
        });

        return NextResponse.json({ message: "Abbreviation deleted successfully" });
    } catch (error) {
        console.error("Error deleting abbreviation:", error);
        return NextResponse.json({ error: "Failed to delete abbreviation" }, { status: 500 });
    }
}
