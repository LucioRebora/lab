import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const hiId = searchParams.get("hiId");
        const requestedLabId = searchParams.get("labId");
        const additionalId = params.id;

        if (!hiId) return NextResponse.json({ error: "Health Insurance ID required" }, { status: 400 });

        const isAdmin = session.user.role === "ADMIN";
        const targetLabId = (isAdmin && requestedLabId) ? requestedLabId : session.user.laboratoryId;

        if (!targetLabId) {
            return NextResponse.json({ error: "Unauthorized / No laboratory selected" }, { status: 400 });
        }

        // 1. Check for specific config for this additional
        const config = await prisma.additionalPricesOSConfig.findFirst({
            where: {
                additionalId: additionalId,
                healthInsuranceId: hiId,
                laboratoryId: targetLabId
            }
        });

        if (config) {
            return NextResponse.json({
                price: config.montoFijo || 0,
                percentage: config.porcentajeSP || 0,
                fromConfig: true
            });
        }

        // 2. Default price or 0
        return NextResponse.json({
            price: 0,
            fromConfig: false
        });

    } catch (error) {
        console.error("Additional Price calculate error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
