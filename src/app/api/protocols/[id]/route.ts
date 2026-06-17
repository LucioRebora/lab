import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const apiKey = request.headers.get("X-API-KEY") || searchParams.get("key");
        const authToken = searchParams.get("auth_token");
        const session = await getServerSession(authOptions);
        const VALID_API_KEY = process.env.BIOITIA_API_KEY;

        let authorized = !!session;

        // Validar por API KEY
        if (!authorized && apiKey && apiKey.trim() === VALID_API_KEY?.trim()) {
            authorized = true;
        }

        // Validar por AUTH TOKEN (JWT)
        if (!authorized && authToken) {
            try {
                const secret = new TextEncoder().encode(VALID_API_KEY);
                const { payload } = await jwtVerify(authToken, secret);
                
                // Verificar que el token sea para este protocolo específico
                if (payload.protocolId === id) {
                    authorized = true;
                }
            } catch (err) {
                console.error("JWT Verification failed:", err);
            }
        }

        if (!authorized) {
            return NextResponse.json({ 
                error: "No autorizado. Verifique la API Key o el Token.",
                details: {
                    hasApiKey: !!apiKey,
                    hasToken: !!authToken,
                    hasSession: !!session
                }
            }, { status: 401 });
        }

        const protocol = await (prisma as any).protocol.findUnique({
            where: { id: id },
            include: {
                patient: {
                    include: {
                        healthInsurances: {
                            include: {
                                healthInsurance: true
                            }
                        }
                    }
                },
                doctor: true,
                biochemist: true,
                results: {
                    include: {
                        determination: {
                            include: {
                                section: {
                                    include: {
                                        tag: true
                                    }
                                },
                                method: true
                            }
                        },
                        subResults: {
                            include: {
                                subDetermination: {
                                    include: {
                                        unit: true,
                                        referenceValues: true,
                                        calculatorSteps: true
                                    }
                                }
                            },
                            orderBy: {
                                subDetermination: {
                                    codigoExterno: 'asc'
                                }
                            }
                        }
                    }
                },
                notes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!protocol) {
            return NextResponse.json({ error: "Protocolo no encontrado" }, { status: 404 });
        }

        return NextResponse.json(protocol);
    } catch (e: any) {
        console.error("GET /api/protocols/[id] error:", e);
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { doctorId, determinationIds, customPrices, assignedFlags, printedFlags, notes } = await request.json();

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        // Obtener el protocolo actual para ver qué determinaciones tiene
        const currentProtocol = await (prisma as any).protocol.findUnique({
            where: { id: id },
            include: { 
                results: true,
                patient: {
                    include: {
                        healthInsurances: {
                            include: {
                                healthInsurance: true
                            }
                        }
                    }
                }
            }
        });

        if (!currentProtocol) {
            return NextResponse.json({ error: "Protocolo no encontrado" }, { status: 404 });
        }

        const laboratoryId = currentProtocol.laboratoryId;

        // Si se pasaron nuevas determinaciones, sincronizarlas
        let resultsUpdate = {};
        if (determinationIds) {
            const currentResults = currentProtocol.results as any[];
            const currentDetIds = currentResults.map((r: any) => r.determinationId);
            const toAdd = determinationIds.filter((id: string) => !currentDetIds.includes(id));
            const toRemove = currentDetIds.filter((id: string) => !determinationIds.includes(id));

            // Primero, actualizamos los precios de los resultados que SE MANTIENEN si vienen en customPrices
            if (customPrices) {
                for (const res of currentResults) {
                    if (determinationIds.includes(res.determinationId)) {
                        const data: any = {};
                        if (customPrices && customPrices[res.determinationId] !== undefined) {
                            data.precio = customPrices[res.determinationId];
                        }
                        if (assignedFlags && assignedFlags[res.determinationId] !== undefined) {
                            data.asignado = assignedFlags[res.determinationId];
                        }
                        if (printedFlags && printedFlags[res.determinationId] !== undefined) {
                            data.etiquetaImpresa = printedFlags[res.determinationId];
                        }

                        if (Object.keys(data).length > 0) {
                            await (prisma as any).result.update({
                                where: { id: res.id },
                                data
                            });
                        }
                    }
                }
            }

            // Para los nuevos resultados, intentamos calcular el precio si el paciente tiene una OS
            const patient = currentProtocol.patient;
            const defaultHI = patient?.healthInsurances?.find((h: any) => h.isDefault) || patient?.healthInsurances?.[0];
            const hiId = defaultHI?.healthInsuranceId;

            const toAddDets = await (prisma as any).determination.findMany({
                where: { id: { in: toAdd } }
            });

            resultsUpdate = {
                deleteMany: {
                    determinationId: { in: toRemove }
                },
                create: toAddDets.map((det: any) => {
                    const customPrice = customPrices?.[det.id];
                    return {
                        determinationId: det.id,
                        sectionId: det.sectionId,
                        laboratoryId,
                        healthInsuranceId: hiId || null,
                        precio: customPrice !== undefined ? customPrice : 0,
                        asignado: assignedFlags?.[det.id] || false,
                        etiquetaImpresa: printedFlags?.[det.id] || false
                    };
                })
            };
        } else if (customPrices || assignedFlags || printedFlags) {
            // Si no se cambiaron determinaciones pero sí precios o flags
            const currentResults = currentProtocol.results as any[];
            for (const res of currentResults) {
                const data: any = {};
                if (customPrices && customPrices[res.determinationId] !== undefined) {
                    data.precio = customPrices[res.determinationId];
                }
                if (assignedFlags && assignedFlags[res.determinationId] !== undefined) {
                    data.asignado = assignedFlags[res.determinationId];
                }
                if (printedFlags && printedFlags[res.determinationId] !== undefined) {
                    data.etiquetaImpresa = printedFlags[res.determinationId];
                }

                if (Object.keys(data).length > 0) {
                    await (prisma as any).result.update({
                        where: { id: res.id },
                        data
                    });
                }
            }
        }

        const protocol = await (prisma as any).protocol.update({
            where: { id: id },
            data: {
                doctorId: doctorId !== undefined ? (doctorId || null) : undefined,
                results: Object.keys(resultsUpdate).length > 0 ? resultsUpdate : undefined,
                notes: (notes && userId) ? {
                    create: {
                        text: notes,
                        userId: userId,
                        laboratoryId: laboratoryId
                    }
                } : undefined
            },
            include: {
                patient: true,
                doctor: true,
                results: {
                    include: {
                        determination: true
                    }
                }
            }
        });


        return NextResponse.json(protocol);
    } catch (e: any) {
        console.error("PATCH /api/protocols/[id] error:", e);
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        await (prisma as any).protocol.delete({
            where: { id: id }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("DELETE /api/protocols/[id] error:", e);
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
    }
}
