import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const exports = await prisma.manlabExport.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // Last 100 exports
        });

        return NextResponse.json(exports);
    } catch (error) {
        console.error("Error fetching manlab exports:", error);
        return NextResponse.json({ error: "Failed to fetch exports" }, { status: 500 });
    }
}
