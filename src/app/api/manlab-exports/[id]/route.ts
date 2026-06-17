import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // We use (prisma as any) to bypass lint errors caused by the locked Prisma Client generation
        const manlabExport = await (prisma as any).manlabExport.findUnique({
            where: { id: params.id },
            include: {
                orders: {
                    include: {
                        result: {
                            include: {
                                determination: true,
                                protocol: {
                                    include: {
                                        patient: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!manlabExport) {
            return NextResponse.json({ error: "Export not found" }, { status: 404 });
        }

        // Recovery logic: if for some reason the orders relation is empty,
        // we use the resultIds array saved in the export to fetch them manually.
        if (manlabExport.orders.length === 0 && (manlabExport.resultIds || []).length > 0) {
            const recoveredOrders = await (prisma as any).manlabOrder.findMany({
                where: {
                    resultId: { in: manlabExport.resultIds }
                },
                include: {
                    result: {
                        include: {
                            determination: true,
                            protocol: {
                                include: {
                                    patient: true
                                }
                            }
                        }
                    }
                }
            });
            manlabExport.orders = recoveredOrders;
        }

        return NextResponse.json(manlabExport);
    } catch (error) {
        console.error("Error fetching export detail:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
