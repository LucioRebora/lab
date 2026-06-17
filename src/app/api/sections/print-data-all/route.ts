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

        const { searchParams } = new URL(request.url);
        const idsString = searchParams.get('ids');
        if (!idsString) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        
        const ids = idsString.split(",");

        const results = await prisma.result.findMany({
            where: {
                id: { in: ids }
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
                        section: {
                            include: { worksheet: true }
                        }
                    }
                },
                section: {
                    include: { worksheet: true }
                },
                subResults: {
                    include: {
                        subDetermination: true
                    }
                }
            }
        });

        // Group by effective section
        const sectionMap = new Map<string, any>();
        
        results.forEach((r: any) => {
            const section = r.section || r.determination?.section;
            if (!section) return;

            if (!sectionMap.has(section.id)) {
                sectionMap.set(section.id, {
                    info: section,
                    results: []
                });
            }
            sectionMap.get(section.id).results.push(r);
        });

        return NextResponse.json(Array.from(sectionMap.values()));
    } catch (error) {
        console.error("Error fetching print data all:", error);
        return NextResponse.json({ error: "Failed to fetch print data" }, { status: 500 });
    }
}
