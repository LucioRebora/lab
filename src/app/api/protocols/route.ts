import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const laboratoryId = searchParams.get("laboratoryId");
        const patientId = searchParams.get("patientId");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const limitParam = searchParams.get("limit");
        const pageParam = searchParams.get("page");
        const pageSizeParam = searchParams.get("pageSize");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const sectionName = searchParams.get("section");

        const page = pageParam ? parseInt(pageParam) : 1;
        const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 50;
        const skip = (page - 1) * pageSize;
        const limit = limitParam ? parseInt(limitParam) : pageSize;



        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === "ADMIN";

        if (!laboratoryId && !isAdmin) {
            return NextResponse.json({ error: "Laboratory ID is required" }, { status: 400 });
        }

        const where: any = {};
        if (laboratoryId) {
            where.laboratoryId = laboratoryId;
        }

        if (patientId) {
            where.patientId = patientId;
        }

        if (status && status !== "ALL") {
            where.status = status;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!startDate.includes('T')) {
                    start.setUTCHours(0, 0, 0, 0);
                }
                where.createdAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!endDate.includes('T')) {
                    end.setUTCHours(23, 59, 59, 999);
                }
                where.createdAt.lte = end;
            }
        }
        if (sectionName) {
            where.results = {
                some: {
                    asignado: false,
                    OR: [
                        { section: { nombre: { equals: sectionName, mode: 'insensitive' } } },
                        { determination: { section: { nombre: { equals: sectionName, mode: 'insensitive' } } } }
                    ]
                }
            };
        }

        const searchField = searchParams.get("searchField");

        if (search) {
            let orFilters: any[] = [];
            
            if (searchField === "numeroSecuencial") {
                orFilters = [
                    { numeroSecuencial: { contains: search, mode: 'insensitive' } }
                ];
            } else {
                orFilters = [
                    { patient: { apellido: { contains: search, mode: 'insensitive' } } },
                    { patient: { nombre: { contains: search, mode: 'insensitive' } } },
                    { patient: { documento: { contains: search, mode: 'insensitive' } } },
                    { doctor: { apellido: { contains: search, mode: 'insensitive' } } },
                    { doctor: { nombre: { contains: search, mode: 'insensitive' } } }
                ];

                // If search has multiple words (e.g. from predictive search), try to match across multiple fields
                if (search.includes(" ") || search.includes(",")) {
                    const parts = search.replace(",", " ").split(" ").filter(p => (p as string).length >= 2);
                    if (parts.length >= 2) {
                        orFilters.push({
                            AND: parts.map(part => ({
                                OR: [
                                    { patient: { apellido: { contains: part, mode: 'insensitive' } } },
                                    { patient: { nombre: { contains: part, mode: 'insensitive' } } }
                                ]
                            }))
                        });
                    }
                }
            }

            where.AND = [
                (startDate || endDate) && searchField !== "numeroSecuencial" ? { createdAt: where.createdAt } : {},
                { OR: orFilters }
            ].filter(v => Object.keys(v).length > 0);
            
            if (startDate || endDate) delete where.createdAt;
        }

        const [protocols, total] = await Promise.all([
            (prisma as any).protocol.findMany({
                where,
                take: limit,
                skip: skip,
                include: {
                    patient: true,
                    doctor: true,
                    results: {
                        include: {
                            determination: {
                                include: {
                                    section: true
                                }
                            },
                            manlabOrder: true,
                            subResults: {
                                include: {
                                    subDetermination: {
                                        include: {
                                            unit: true,
                                            calculatorSteps: true
                                        }
                                    }
                                }
                            },
                            healthInsurance: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
            }),
            (prisma as any).protocol.count({ where })
        ]);

        return NextResponse.json({
            data: protocols,
            pagination: {
                total,
                page,
                pageSize,
                hasMore: total > skip + protocols.length
            }
        });
    } catch (error) {
        console.error("Error fetching protocols:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { patientId, laboratoryId, doctorId, determinationIds, customPrices, assignedFlags, printedFlags, notes } = body;

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!patientId || !laboratoryId) {
            return NextResponse.json({ error: "Patient ID and Laboratory ID are required" }, { status: 400 });
        }

        // New numbering scheme: YYYYMMDD + 4 digits sequence
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${yyyy}${mm}${dd}`;

        // Get protocols from TODAY to determine sequence
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const lastTodayProtocol = await (prisma as any).protocol.findFirst({
            where: {
                laboratoryId,
                createdAt: {
                    gte: startOfToday
                }
            },
            orderBy: {
                numeroSecuencial: 'desc'
            },
            select: {
                numeroSecuencial: true
            }
        });

        let nextSeqNum = 1;
        if (lastTodayProtocol?.numeroSecuencial) {
            // Take the last 4 digits of the previous sequential number of today
            const lastPart = lastTodayProtocol.numeroSecuencial.slice(-4);
            if (!isNaN(parseInt(lastPart))) {
                nextSeqNum = parseInt(lastPart) + 1;
            }
        }

        const protocolNumber = `${datePrefix}${String(nextSeqNum).padStart(4, '0')}`;

        const patient = await (prisma as any).patient.findUnique({
            where: { id: patientId },
            include: { healthInsurances: { include: { healthInsurance: true } } }
        });

        const defaultHI = patient?.healthInsurances?.find((h: any) => h.isDefault) || patient?.healthInsurances?.[0];
        const hiId = defaultHI?.healthInsuranceId;

        const determinations = await (prisma as any).determination.findMany({
            where: { id: { in: determinationIds || [] } },
            include: { subDeterminations: true }
        });

        const protocol = await (prisma as any).protocol.create({
            data: {
                patientId,
                laboratoryId,
                doctorId: doctorId || null,
                numeroSecuencial: protocolNumber,
                status: "NEW",
                results: {
                    create: determinations.map((det: any) => {
                        const customPrice = customPrices?.[det.id];
                        return {
                            determinationId: det.id,
                            sectionId: det.sectionId,
                            laboratoryId,
                            healthInsuranceId: hiId || null,
                            precio: customPrice !== undefined ? customPrice : 0,
                            asignado: assignedFlags?.[det.id] || false,
                            etiquetaImpresa: printedFlags?.[det.id] || false,
                            subResults: {
                                create: (det.subDeterminations || []).map((subDet: any) => ({
                                    subDeterminationId: subDet.id,
                                    laboratoryId,
                                    valor: ""
                                }))
                            }
                        };
                    })
                },
                notes: notes && userId ? {
                    create: {
                        text: notes,
                        userId: userId,
                        laboratoryId: laboratoryId
                    }
                } : undefined
            },
            include: { 
                results: true,
                notes: true
            }
        });

        return NextResponse.json(protocol);
    } catch (error: any) {
        console.error("POST /api/protocols error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

