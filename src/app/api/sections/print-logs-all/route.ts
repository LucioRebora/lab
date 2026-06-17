import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "5");
        
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || !user.laboratoryId) {
            return NextResponse.json({ error: "No laboratory" }, { status: 403 });
        }

        const logs = await (prisma as any).worksheetPrintLog.findMany({
            where: {
                section: {
                    laboratoryId: user.laboratoryId
                }
            },
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: { select: { name: true } },
                section: { select: { nombre: true } }
            }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching all print logs:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { laboratory: true }
        });

        if (!user || !user.laboratoryId) {
            return NextResponse.json({ error: "No laboratory" }, { status: 403 });
        }

        const { resultIds } = await request.json();
        if (!resultIds || !Array.isArray(resultIds)) {
            return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
        }

        // Get full result data to group by section
        const results = await prisma.result.findMany({
            where: { id: { in: resultIds } },
            include: { 
                determination: { include: { section: true } },
                section: true
            }
        });

        // Map result IDs by effectively used section
        const groupedBySection = new Map<string, string[]>();
        
        results.forEach(r => {
            const section = r.section || r.determination.section;
            if (!section) return;

            if (!groupedBySection.has(section.id)) {
                groupedBySection.set(section.id, []);
            }
            groupedBySection.get(section.id)!.push(r.id);
        });

        // Transaction to update all results as assigned AND create logs
        await prisma.$transaction(async (tx) => {
            // Bulk update results as assigned
            await tx.result.updateMany({
                where: { id: { in: resultIds } },
                data: { asignado: true }
            });

            // Create a log entry for each group of results by section
            for (const [sectionId, ids] of Array.from(groupedBySection.entries())) {
                await (tx as any).worksheetPrintLog.create({
                    data: {
                        sectionId,
                        userId: user.id,
                        resultIds: ids
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating bulk logs:", error);
        return NextResponse.json({ error: "Failed to create logs" }, { status: 500 });
    }
}
