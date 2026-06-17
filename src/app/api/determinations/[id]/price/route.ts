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
        let hiId = searchParams.get("hiId");
        const requestedLabId = searchParams.get("labId");
        const detId = params.id;

        const isAdmin = session.user.role === "ADMIN";
        const targetLabId = (isAdmin && requestedLabId) ? requestedLabId : session.user.laboratoryId;

        if (!targetLabId) {
            return NextResponse.json({ error: "Unauthorized / No laboratory selected" }, { status: 400 });
        }

        // If no hiId is provided, try to find "PARTICULAR" for this lab
        if (!hiId) {
            const particularHI = await prisma.healthInsurance.findFirst({
                where: {
                    nombre: { contains: 'PARTICULAR', mode: 'insensitive' },
                    laboratoryId: targetLabId
                }
            });
            if (particularHI) {
                hiId = particularHI.id;
            } else {
                return NextResponse.json({ error: "Health Insurance ID required and PARTICULAR not found" }, { status: 400 });
            }
        }

        // 1. Get health insurance for its valorNBU (fallback)
        const hi = await prisma.healthInsurance.findUnique({ where: { id: hiId } });
        if (!hi) return NextResponse.json({ error: "Health Insurance not found" }, { status: 404 });
        const valorNBU = hi.valorNBU || 0;

        // 2. Try to find a direct price in PricesOSConfig (The "Join" association)
        const directConfig = await prisma.pricesOSConfig.findFirst({
            where: {
                determinationId: detId,
                healthInsuranceId: hiId,
                laboratoryId: targetLabId
            }
        });

        if (directConfig && directConfig.precio && directConfig.precio > 0) {
            return NextResponse.json({
                price: directConfig.precio,
                ub: directConfig.cantidadNBU || 0,
                fromConfig: true
            });
        }

        // 3. Fallback to sub-determinations (components) or NBU calculation
        const subDets = await prisma.subDetermination.findMany({
            where: { determinationId: detId }
        });

        let totalUB = 0;
        let hasComponents = false;

        if (subDets.length > 0) {
            for (const sub of subDets) {
                const cleanName = sub.nombre.replace(/[:]/g, '').trim();
                const subDetMatch = await (prisma as any).determination.findFirst({
                    where: {
                        laboratoryId: targetLabId,
                        OR: [
                            { nombre: { equals: cleanName, mode: 'insensitive' } },
                            { codigo: sub.codigoExterno || undefined },
                            { codigoExterno: sub.codigoExterno || undefined }
                        ]
                    }
                });

                if (subDetMatch) {
                    hasComponents = true;
                    const subConfig = await (prisma as any).pricesOSConfig.findFirst({
                        where: {
                            determinationId: subDetMatch.id,
                            healthInsuranceId: hiId,
                            laboratoryId: targetLabId
                        }
                    });

                    if (subConfig && subConfig.cantidadNBU !== null) {
                        totalUB += subConfig.cantidadNBU;
                    }
                }
            }
        }

        if (!hasComponents || totalUB === 0) {
            if (directConfig && directConfig.cantidadNBU !== null) {
                totalUB = directConfig.cantidadNBU;
            } else {
                totalUB = 0;
            }
        }

        const finalPrice = totalUB * valorNBU;

        return NextResponse.json({
            price: finalPrice,
            ub: totalUB,
            fromComponents: hasComponents && totalUB > 0
        });

    } catch (error) {
        console.error("Price calculate error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
