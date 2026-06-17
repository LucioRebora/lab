import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resultIds, cliente, filename, count } = await request.json();

        if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
            return NextResponse.json({ error: "Result IDs are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Use a transaction to ensure both export log and order updates are consistent
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create the Export Log with an explicit list of resultIds
            const manlabExport = await tx.manlabExport.create({
                data: {
                    filename,
                    cliente: Number(cliente),
                    count: Number(count),
                    userId: user.id,
                    resultIds: resultIds 
                }
            });

            // 2. Update all associated orders
            await tx.manlabOrder.updateMany({
                where: {
                    resultId: { in: resultIds }
                },
                data: {
                    cliente: Number(cliente),
                    enviado: true,
                    fechaEnviado: new Date(),
                    manlabExportId: manlabExport.id,
                    updatedAt: new Date()
                }
            });

            // 3. Mark Results as assigned so they disappear from the pending list
            await tx.result.updateMany({
                where: {
                    id: { in: resultIds }
                },
                data: {
                    asignado: true,
                    updatedAt: new Date()
                }
            });

            return manlabExport;
        });

        return NextResponse.json({ success: true, exportId: result.id });
    } catch (error) {
        console.error("Error in bulk update ManlabOrders:", error);
        return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
    }
}
