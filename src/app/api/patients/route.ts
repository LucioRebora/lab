import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const url = new URL(req.url);
        const search = url.searchParams.get("q")?.trim() || "";
        const reqLabId = url.searchParams.get("laboratoryId");

        let whereClause: any = {};
        if (session.user.role !== 'ADMIN') {
            if (!session.user.laboratoryId) {
                return NextResponse.json({ error: "Usuario sin laboratorio asignado" }, { status: 403 });
            }
            whereClause.laboratoryId = session.user.laboratoryId;
        } else if (reqLabId) {
            whereClause.laboratoryId = reqLabId;
        }

        if (search) {
            if (search.includes(',')) {
                // Búsqueda específica "apellido, nombre"
                const [ape, nom] = search.split(',').map(s => s.trim());
                whereClause.AND = [
                    { apellido: { contains: ape, mode: "insensitive" } },
                    { nombre: { contains: nom || "", mode: "insensitive" } }
                ];
            } else {
                const parts = search.split(/\s+/).filter(Boolean);
                if (parts.length > 1) {
                    // Búsqueda flexible por múltiples términos (ej: "Juan Perez")
                    whereClause.AND = parts.map(part => ({
                        OR: [
                            { id: { contains: part, mode: "insensitive" } },
                            { apellido: { contains: part, mode: "insensitive" } },
                            { nombre: { contains: part, mode: "insensitive" } },
                            { documento: { contains: part, mode: "insensitive" } },
                            { email: { contains: part, mode: "insensitive" } },
                            { codigoExterno: { contains: part, mode: "insensitive" } },
                            { protocols: { some: { 
                                OR: [
                                    { id: { contains: part, mode: "insensitive" } },
                                    { numeroSecuencial: { contains: part, mode: "insensitive" } },
                                    { codigoExterno: { contains: part, mode: "insensitive" } }
                                ]
                            } } }
                        ]
                    }));
                } else {
                    // Búsqueda estándar de un solo término
                    whereClause.OR = [
                        { id: { contains: search, mode: "insensitive" } },
                        { apellido: { contains: search, mode: "insensitive" } },
                        { nombre: { contains: search, mode: "insensitive" } },
                        { documento: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { codigoExterno: { contains: search, mode: "insensitive" } },
                        { protocols: { some: { 
                            OR: [
                                { id: { contains: search, mode: "insensitive" } },
                                { numeroSecuencial: { contains: search, mode: "insensitive" } },
                                { codigoExterno: { contains: search, mode: "insensitive" } }
                            ]
                        } } }
                    ];
                }
            }
        }

        const param: any = {
            where: whereClause,
            take: 100, // LIMITE DE SEGURIDAD PARA LISTAS GRANDES
            orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
            include: {
                healthInsurances: {
                    include: {
                        healthInsurance: true
                    }
                },
                notifiedUser: true,
                protocols: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        };
        const patients = await (prisma.patient.findMany as any)(param);

        return NextResponse.json(patients);
    } catch (error: any) {
        console.error("Error fetching patients:", error);
        return NextResponse.json({ error: "Error al cargar pacientes" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await req.json();
        const reqLabId = data.laboratoryId;

        let laboratoryId = session.user.laboratoryId;
        if (session.user.role === 'ADMIN' && reqLabId) {
            laboratoryId = reqLabId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "ID de laboratorio requerido" }, { status: 400 });
        }

        const {
            apellido, nombre, sexo, tipoDocumento, documento, fechaNacimiento, edad, telefono, email, direccion,
            entreCalles, ciudad, provincia, codigoPostal,
            healthInsurances,
            notifiedUserId,
            codigoExterno
        } = data;

        if (!apellido || !nombre || !sexo || !tipoDocumento) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        // Removed legacy document validation as per user request to allow duplicates.


        const patient = await prisma.patient.create({
            data: {
                apellido,
                nombre,
                sexo,
                tipoDocumento,
                documento: documento || null,
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
                edad: edad ? parseInt(edad) : null,
                telefono: telefono || null,
                email: email || null,
                direccion: direccion || null,
                entreCalles: entreCalles || null,
                ciudad: ciudad || null,
                provincia: provincia || null,
                codigoPostal: codigoPostal || null,
                healthInsurances: healthInsurances && healthInsurances.length > 0 ? {
                    create: healthInsurances.map((hi: any) => ({
                        healthInsuranceId: hi.healthInsuranceId,
                        nroAfiliado: hi.nroAfiliado || null,
                        isDefault: !!hi.isDefault
                    }))
                } : undefined,
                notifiedUserId: notifiedUserId || null,
                codigoExterno: codigoExterno || null,
                laboratory: {
                    connect: { id: laboratoryId }
                }
            },
            include: {
                healthInsurances: {
                    include: {
                        healthInsurance: true
                    }
                },
                notifiedUser: true
            }
        });
        // Auditar creación de paciente
        await createAuditLog({
            userId: session.user.id,
            userName: session.user.name || session.user.email,
            action: "NUEVO_PACIENTE",
            entity: "Patient",
            entityId: (patient as any).id,
            details: `Se registró un nuevo paciente: ${(patient as any).apellido}, ${(patient as any).nombre} (DNI: ${(patient as any).documento})`,
            laboratoryId: laboratoryId || null
        });

        return NextResponse.json(patient);
    } catch (error: any) {
        console.error("Error creating patient:", error);
        return NextResponse.json({ error: error.message || "Error al crear paciente" }, { status: 500 });
    }
}
