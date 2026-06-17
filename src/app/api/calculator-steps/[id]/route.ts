import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        const item = await (prisma as any).calculatorStep.update({
            where: { id },
            data: {
                tipoOperacion: data.tipoOperacion,
                argumentoNumerico: data.argumentoNumerico !== undefined ? parseFloat(data.argumentoNumerico) : undefined,
                argumentoIDSubDete: data.argumentoIDSubDete,
                codigoExterno: data.codigoExterno,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await (prisma as any).calculatorStep.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
    }
}
