import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const logs = await prisma.worksheetPrintLog.findMany({
            where: { sectionId: id },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching print logs:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const data = await request.json();
        if (!data.resultIds || !Array.isArray(data.resultIds)) {
            return NextResponse.json({ error: "Invalid result IDs" }, { status: 400 });
        }

        const log = await prisma.$transaction(async (tx: any) => {
            // Update results as assigned
            await tx.result.updateMany({
                where: { id: { in: data.resultIds } },
                data: { asignado: true }
            });

            // Create print log
            return await tx.worksheetPrintLog.create({
                data: {
                    sectionId: id,
                    userId: user.id,
                    resultIds: data.resultIds
                },
                include: { user: { select: { name: true, email: true } } }
            });
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error("Error creating print log:", error);
        return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
    }
}
