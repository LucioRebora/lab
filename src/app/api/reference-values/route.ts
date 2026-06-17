import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const subDeterminationId = searchParams.get("subDeterminationId");
        const laboratoryId = searchParams.get("laboratoryId");

        if (!subDeterminationId || !laboratoryId) {
            return NextResponse.json({ error: "IDs are required" }, { status: 400 });
        }

        const values = await (prisma as any).referenceValue.findMany({
            where: {
                subDeterminationId,
                laboratoryId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(values);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
