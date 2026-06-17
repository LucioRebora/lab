import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
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

        const { searchParams } = new URL(request.url);
        const healthInsuranceId = searchParams.get("healthInsuranceId");
        const type = searchParams.get("type") || "determinations";
        const laboratoryIdParam = searchParams.get("laboratoryId");

        const laboratoryId = user.role === "ADMIN" ? (laboratoryIdParam || user.laboratoryId) : user.laboratoryId;

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratory ID is required" }, { status: 400 });
        }

        if (!healthInsuranceId) {
            return NextResponse.json({ error: "Health Insurance ID is required" }, { status: 400 });
        }

        if (type === "additionals") {
            const prices = await (prisma as any).additionalPricesOSConfig.findMany({
                where: {
                    healthInsuranceId,
                    laboratoryId
                }
            });
            return NextResponse.json(prices);
        } else {
            const prices = await (prisma as any).pricesOSConfig.findMany({
                where: {
                    healthInsuranceId,
                    laboratoryId
                }
            });
            return NextResponse.json(prices);
        }
    } catch (error) {
        console.error("Error fetching prices:", error);
        return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
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
        const { healthInsuranceId, type, laboratoryId: laboratoryIdBody } = data;

        const laboratoryId = user.role === "ADMIN" ? (laboratoryIdBody || user.laboratoryId) : user.laboratoryId;

        if (!laboratoryId) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        if (type === "additionals") {
            const { additionalId, montoFijo, porcentajeSP, enLista } = data;
            const config = await (prisma as any).additionalPricesOSConfig.upsert({
                where: {
                    healthInsuranceId_additionalId_laboratoryId: {
                        healthInsuranceId,
                        additionalId,
                        laboratoryId
                    }
                },
                update: {
                    montoFijo: parseFloat(montoFijo) || 0,
                    porcentajeSP: parseFloat(porcentajeSP) || 0,
                    enLista: enLista ?? true
                },
                create: {
                    healthInsuranceId,
                    additionalId,
                    laboratoryId,
                    montoFijo: parseFloat(montoFijo) || 0,
                    porcentajeSP: parseFloat(porcentajeSP) || 0,
                    enLista: enLista ?? true
                }
            });
            return NextResponse.json(config);
        } else {
            const { determinationId, precio, cantidadNBU, montoFijo, enLista } = data;
            const priceConfig = await (prisma as any).pricesOSConfig.upsert({
                where: {
                    healthInsuranceId_determinationId_laboratoryId: {
                        healthInsuranceId,
                        determinationId,
                        laboratoryId
                    }
                },
                update: {
                    precio: parseFloat(precio) || 0,
                    cantidadNBU: parseFloat(cantidadNBU) || 0,
                    montoFijo: parseFloat(montoFijo) || 0,
                    enLista: enLista ?? true
                },
                create: {
                    healthInsuranceId,
                    determinationId,
                    laboratoryId,
                    precio: parseFloat(precio) || 0,
                    cantidadNBU: parseFloat(cantidadNBU) || 0,
                    montoFijo: parseFloat(montoFijo) || 0,
                    enLista: enLista ?? true
                }
            });
            return NextResponse.json(priceConfig);
        }
    } catch (error) {
        console.error("Error saving price config:", error);
        return NextResponse.json({ error: "Failed to save price config" }, { status: 500 });
    }
}
