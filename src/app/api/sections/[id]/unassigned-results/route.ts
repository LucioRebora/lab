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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const laboratoryId = user.laboratoryId;

        // Fetch results for this section where asignado is false
        // We look at results that belong to this section directly
        // Or results of determinations that belong to this section
        const { searchParams } = new URL(request.url);
        const idsString = searchParams.get('ids');
        const ids = idsString ? idsString.split(",") : null;

        const results = await prisma.result.findMany({
            where: {
                OR: [
                    { sectionId: id },
                    { determination: { sectionId: id } }
                ],
                protocol: { laboratoryId: laboratoryId },
                ...(ids ? { id: { in: ids } } : { asignado: false })
            },
            include: {
                protocol: {
                    include: {
                        patient: true,
                        doctor: true
                    }
                },
                determination: {
                    include: {
                        section: true
                    }
                },
                section: true,
                subResults: {
                    include: {
                        subDetermination: {
                            include: {
                                unit: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                protocol: {
                    numeroSecuencial: 'asc'
                }
            }
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching unassigned results:", error);
        return NextResponse.json({ error: "Failed to fetch unassigned results" }, { status: 500 });
    }
}
