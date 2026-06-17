import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const patient = await prisma.patient.findUnique({
            where: { id: params.id },
            include: {
                healthInsurances: {
                    include: {
                        healthInsurance: true
                    }
                },
                protocols: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        results: {
                            include: {
                                determination: true
                            }
                        },
                        doctor: true
                    }
                }
            }
        });

        if (!patient) {
            return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
        }

        return NextResponse.json(patient);
    } catch (error: any) {
        console.error("Error fetching patient:", error);
        return NextResponse.json({ error: "Error al obtener paciente" }, { status: 500 });
    }
}


export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawData = await req.json();
        const { healthInsurances, laboratoryId: reqLabId, ...data } = rawData;
        const isAdmin = session.user.role === 'ADMIN';

        let laboratoryId = session.user.laboratoryId;
        if (isAdmin && reqLabId) {
            laboratoryId = reqLabId;
        }

        // Si no es admin y no tiene laboratorio, error
        if (!isAdmin && !laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no asignado" }, { status: 403 });
        }

        const where: any = { id: params.id };
        if (!isAdmin) {
            where.laboratoryId = laboratoryId;
        } else if (laboratoryId) {
            // Un admin puede opcionalmente filtrar por lab para extra seguridad si se provee
            where.laboratoryId = laboratoryId;
        }

        const patient = await prisma.patient.update({
            where,
            data: {
                ...data,
                documento: data.documento || null,
                fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
                ...(data.edad !== undefined && { edad: data.edad ? parseInt(data.edad) : null }),
                ...(healthInsurances !== undefined && {
                    healthInsurances: {
                        deleteMany: {},
                        create: healthInsurances.map((hi: any) => ({
                            healthInsuranceId: hi.healthInsuranceId,
                            nroAfiliado: hi.nroAfiliado || null,
                            isDefault: !!hi.isDefault
                        }))
                    }
                }),
                notifiedUserId: data.notifiedUserId || null
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

        // Auditar actualización de paciente
        await createAuditLog({
            userId: session.user.id || null,
            userName: session.user.name || session.user.email || null,
            action: "ACTUALIZAR_PACIENTE",
            entity: "Patient",
            entityId: (patient as any).id,
            details: `Se actualizó la información del paciente: ${(patient as any).apellido}, ${(patient as any).nombre}`,
            laboratoryId: patient.laboratoryId || laboratoryId || null
        });

        return NextResponse.json(patient);
    } catch (error: any) {
        console.error("Error updating patient:", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "No se encontró el paciente o no tiene permisos para editarlo" }, { status: 404 });
        }
        return NextResponse.json({ error: "Error al actualizar paciente" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        
        const isAdmin = session.user.role === 'ADMIN';
        const laboratoryId = session.user.laboratoryId;

        const where: any = { id: params.id };
        if (!isAdmin) {
            if (!laboratoryId) return NextResponse.json({ error: "Laboratorio no asignado" }, { status: 403 });
            where.laboratoryId = laboratoryId;
        }

        await prisma.patient.delete({ where });

        // Auditar eliminación de paciente
        await createAuditLog({
            userId: session.user.id || null,
            userName: session.user.name || session.user.email || null,
            action: "ELIMINAR_PACIENTE",
            entity: "Patient",
            entityId: params.id,
            details: `Se eliminó al paciente con ID: ${params.id}`,
            laboratoryId: laboratoryId || null
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting patient:", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "No se encontró el paciente o no tiene permisos para eliminarlo" }, { status: 404 });
        }
        return NextResponse.json({ error: "Error al eliminar paciente" }, { status: 500 });
    }
}

