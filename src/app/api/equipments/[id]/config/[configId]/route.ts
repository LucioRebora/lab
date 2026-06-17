import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string; configId: string }> }
) {
    const { configId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await (prisma as any).mapperCM260.delete({
            where: { id: configId }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting CM260 config:", error);
        return NextResponse.json({ error: "Error deleting config" }, { status: 500 });
    }
}
