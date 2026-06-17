import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { nombre, manlabId, active } = data;

        const user = await (prisma as any).manlabUser.update({
            where: { id: params.id },
            data: {
                nombre,
                manlabId,
                active
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating Manlab user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // We do a "soft delete" or just remove it
        await (prisma as any).manlabUser.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting Manlab user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
