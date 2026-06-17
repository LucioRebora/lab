import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const laboratoryId = searchParams.get("laboratoryId") || (session.user as any).laboratoryId;

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratory ID is required" }, { status: 400 });
        }

        // Default to last 30 days
        const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = to ? new Date(to) : new Date();
        // Shift end date to end of day
        endDate.setHours(23, 59, 59, 999);

        const protocols = await (prisma as any).protocol.findMany({
            where: {
                laboratoryId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                patient: true,
                doctor: true,
                results: {
                    include: {
                        determination: true,
                        healthInsurance: true
                    }
                },
                additionalApplyeds: true
            }
        });

        // Aggregations
        const protocolsOverTime: Record<string, { date: string, count: number, revenue: number }> = {};
        const detMap: Record<string, number> = {};
        const docMap: Record<string, number> = {};
        const hiMap: Record<string, number> = {};
        const patMap: Record<string, { name: string, count: number }> = {};
        let totalRevenue = 0;

        protocols.forEach((p: any) => {
            const dateStr = new Date(p.createdAt).toLocaleDateString('es-AR');
            if (!protocolsOverTime[dateStr]) {
                protocolsOverTime[dateStr] = { date: dateStr, count: 0, revenue: 0 };
            }
            protocolsOverTime[dateStr].count++;
            
            const patName = `${p.patient.apellido}, ${p.patient.nombre}`;
            if (!patMap[p.patientId]) patMap[p.patientId] = { name: patName, count: 0 };
            patMap[p.patientId].count++;

            let pRevenue = 0;
            p.results.forEach((r: any) => {
                pRevenue += r.precio || 0;
                if (r.determination) {
                    detMap[r.determination.nombre] = (detMap[r.determination.nombre] || 0) + 1;
                }
                if (r.healthInsurance) {
                    hiMap[r.healthInsurance.nombre] = (hiMap[r.healthInsurance.nombre] || 0) + 1;
                }
            });

            p.additionalApplyeds?.forEach((a: any) => {
                pRevenue += a.montoFijo || 0;
            });

            protocolsOverTime[dateStr].revenue += pRevenue;
            totalRevenue += pRevenue;

            if (p.doctor) {
                const docName = `${p.doctor.apellido}, ${p.doctor.nombre}`;
                docMap[docName] = (docMap[docName] || 0) + 1;
            } else {
                docMap["PARTICULAR"] = (docMap["PARTICULAR"] || 0) + 1;
            }
        });

        // Transform records to arrays
        const topDeterminations = Object.entries(detMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topDoctors = Object.entries(docMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topHealthInsurances = Object.entries(hiMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 7);

        const timeline = Object.values(protocolsOverTime).sort((a, b) => {
            const d1 = new Date(a.date.split('/').reverse().join('-'));
            const d2 = new Date(b.date.split('/').reverse().join('-'));
            return d1.getTime() - d2.getTime();
        });

        const topPatients = Object.values(patMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return NextResponse.json({
            summary: {
                totalProtocols: protocols.length,
                totalRevenue,
                totalPatients: Object.keys(patMap).length,
                avgRevenue: protocols.length ? totalRevenue / protocols.length : 0
            },
            timeline,
            topDeterminations,
            topDoctors,
            topHealthInsurances,
            topPatients
        });

    } catch (e: any) {
        console.error("GET /api/stats error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
