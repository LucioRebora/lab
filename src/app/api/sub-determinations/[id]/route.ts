import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            nombre,
            codigoExterno,
            determinationId,
            unitId,
            formato,
            calcular,
            informar,
            informar2C,
            informarTextoAntes,
            informarCorteDespues,
            informarVR,
            valorMinimo,
            valorMaximo,
            laboratoryId,
            activa,
            codManlab
        } = body;

        const subDetermination = await (prisma as any).subDetermination.update({
            where: { id },
            data: {
                nombre,
                codigoExterno,
                determinationId,
                unitId: unitId || null,
                formato,
                calcular: !!calcular,
                informar: !!informar,
                informar2C: !!informar2C,
                informarTextoAntes,
                informarCorteDespues: !!informarCorteDespues,
                informarVR: !!informarVR,
                valorMinimo,
                valorMaximo,
                activa: typeof activa === "boolean" ? activa : true,
                codManlab: codManlab || null,
            },
            include: {
                determination: true
            }
        });

        await createAuditLog({
            userId: session.user.id,
            userName: session.user.name || session.user.email,
            action: "ACTUALIZAR_SUBDETERMINACION",
            entity: "SubDetermination",
            entityId: id,
            details: `Se actualizó la sub-determinación: ${subDetermination.nombre}`,
            laboratoryId: laboratoryId || (subDetermination as any).laboratoryId || null
        });

        return NextResponse.json(subDetermination);
    } catch (error: any) {
        console.error("Update sub-determination error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const subDetermination = await (prisma as any).subDetermination.delete({
            where: { id }
        });

        await createAuditLog({
            userId: session.user.id,
            userName: session.user.name || session.user.email,
            action: "ELIMINAR_SUBDETERMINACION",
            entity: "SubDetermination",
            entityId: id,
            details: `Se eliminó la sub-determinación: ${subDetermination.nombre}`,
            laboratoryId: (subDetermination as any).laboratoryId || null
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete sub-determination error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
