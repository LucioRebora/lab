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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const laboratoryId = user.laboratoryId;

        const { searchParams } = new URL(request.url);
        const idsString = searchParams.get('ids');
        const ids = idsString ? idsString.split(",") : null;

        const results = await prisma.result.findMany({
            where: {
                protocol: { laboratoryId: laboratoryId },
                ...(ids ? { id: { in: ids } } : { asignado: false }),
                // Filter by worksheet presence in the section
                OR: [
                    { section: { hojaTrabajo: { not: null } } },
                    { determination: { section: { hojaTrabajo: { not: null } } } }
                ]
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
            orderBy: [
                { determination: { section: { nombre: 'asc' } } },
                { protocol: { numeroSecuencial: 'asc' } }
            ]
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching all unassigned results:", error);
        return NextResponse.json({ error: "Failed to fetch all unassigned results" }, { status: 500 });
    }
}
