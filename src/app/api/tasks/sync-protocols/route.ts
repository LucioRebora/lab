import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { limit, updateExisting, laboratoryId: reqLabId } = body;

        const laboratoryId = session.user.laboratoryId || reqLabId;
        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        const SUB_BATCH_SIZE = 2000;
        const takeLimit = limit && limit > 0 ? limit : 10000;

        const allRecords = await prisma.externalRecord.findMany({
            where: {
                nombreTabla: 'PRO Protocolos',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: takeLimit,
            orderBy: { createdAt: 'asc' }
        });

        if (allRecords.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        // Prep lookups for all records at once
        const patientExtIds = [...new Set(allRecords.map(r => String((r.datos as any).IDPaciente)))];
        const doctorExtIds = [...new Set(allRecords.map(r => String((r.datos as any).IDDoctor)).filter(id => id !== 'null' && id !== 'undefined'))];
        const bioExtIds = [...new Set(allRecords.map(r => String((r.datos as any).IDBioquimicoFirmante)).filter(id => id !== 'null' && id !== 'undefined'))];
        const userExtIds = [...new Set([
            ...allRecords.map(r => String((r.datos as any).IDUsuarioPublicado)).filter(id => id !== 'null'),
            ...allRecords.map(r => String((r.datos as any).IDUsuarioPortadaPublicado)).filter(id => id !== 'null')
        ])];
        const protExtIds = allRecords.map(r => String((r.datos as any).IDProtocolo || r.codigoExterno));

        const [patients, doctors, biochemists, users, existingProts] = await Promise.all([
            prisma.patient.findMany({ where: { codigoExterno: { in: patientExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.doctor.findMany({ where: { codigoExterno: { in: doctorExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.biochemist.findMany({ where: { codigoExterno: { in: bioExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.notifiedUser.findMany({ where: { codigoExterno: { in: userExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.protocol.findMany({ where: { codigoExterno: { in: protExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
        ]);

        const patMap = new Map(patients.map(p => [p.codigoExterno, p.id]));
        const docMap = new Map(doctors.map(d => [d.codigoExterno, d.id]));
        const bioMap = new Map(biochemists.map(b => [b.codigoExterno, b.id]));
        const userMap = new Map(users.map(u => [u.codigoExterno, u.id]));
        const existingMap = new Map(existingProts.map(e => [e.codigoExterno, e.id]));

        let totalCreated = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;

        for (let i = 0; i < allRecords.length; i += SUB_BATCH_SIZE) {
            const lot = allRecords.slice(i, i + SUB_BATCH_SIZE);
            const processedIdsInLot: string[] = [];
            const CONCURRENCY = 50;

            for (let j = 0; j < lot.length; j += CONCURRENCY) {
                const subChunk = lot.slice(j, j + CONCURRENCY);
                await Promise.all(subChunk.map(async (record) => {
                    try {
                        const d = record.datos as any;
                        const codigoExt = String(d.IDProtocolo || record.codigoExterno);
                        const patId = patMap.get(String(d.IDPaciente));

                        if (!patId) throw new Error(`Paciente IDExterno ${d.IDPaciente} no encontrado`);

                        const protoData = {
                            codigoExterno: codigoExt,
                            numeroSecuencial: String(d.NumProtocolo || d.NumeroDelDia || codigoExt),
                            patientId: patId,
                            doctorId: docMap.get(String(d.IDDoctor)) || null,
                            biochemistId: bioMap.get(String(d.IDBioquimicoFirmante)) || null,
                            notifiedUserId: userMap.get(String(d.IDUsuarioPublicado)) || null,
                            notifiedUserPortadaId: userMap.get(String(d.IDUsuarioPortadaPublicado)) || null,
                            laboratoryId,
                            status: d.Publicado ? "PUBLISHED" : (d.Firmado ? "SIGNED" : "NEW"),
                            // New fields mapping
                            etiquetaImpresa: !!d.EtiquetaImpresa,
                            notaEncabezado: d.NotaEncabezado || null,
                            notaPie: d.NotaPie || null,
                            imprimirPortada: !!d.ImprimirPortada,
                            paraRevisar: !!d.ParaRevisar,
                            completo: !!d.Completo,
                            firmado: !!d.Firmado,
                            paraImprimir: !!d.ParaImprimir,
                            paraCrear: !!d.ParaCrear,
                            impreso: !!d.Impreso,
                            creado: !!d.Creado,
                            publicado: !!d.Publicado,
                            sena: parseFloat(d.Seña || d.Sena || 0),
                            muestraMRY: d.MuestraMRY || null,
                            contadorPCD: !!d.ContadorPCD,
                            paraPublicar: !!d.ParaPublicar,
                            createdAt: (() => {
                                const baseDate = d.FechaIngreso ? new Date(d.FechaIngreso) : new Date();
                                if (d.HoraIngreso) {
                                    const timePart = new Date(d.HoraIngreso);
                                    baseDate.setUTCHours(timePart.getUTCHours());
                                    baseDate.setUTCMinutes(timePart.getUTCMinutes());
                                }
                                return baseDate;
                            })(),
                        };

                        const existingId = existingMap.get(codigoExt);
                        let protocolId = existingId;

                        if (existingId) {
                            if (updateExisting) {
                                await prisma.protocol.update({ where: { id: existingId }, data: { ...protoData, updatedAt: new Date() } });
                                totalUpdated++;
                            } else {
                                totalSkipped++;
                                processedIdsInLot.push(record.id);
                                return;
                            }
                        } else {
                            const newProtocol = await prisma.protocol.create({ data: protoData });
                            protocolId = newProtocol.id;
                            totalCreated++;
                        }

                        // Notes sync
                        if (d.Observaciones && String(d.Observaciones).trim()) {
                            const obsText = String(d.Observaciones).trim();
                            const existingNote = await (prisma as any).protocolNote.findFirst({
                                where: { protocolId: protocolId!, text: obsText }
                            });
                            if (!existingNote) {
                                await (prisma as any).protocolNote.create({
                                    data: { protocolId: protocolId!, userId: session.user.id, text: obsText, laboratoryId }
                                });
                            }
                        }

                        processedIdsInLot.push(record.id);

                    } catch (err: any) {
                        totalErrors++;
                        await prisma.externalRecord.update({ 
                            where: { id: record.id }, 
                            data: { error: err.message, intentos: { increment: 1 } } 
                        });
                    }
                }));
            }

            // Commit status updates for this lot
            if (processedIdsInLot.length > 0) {
                const chunkIdSize = 100;
                for (let k = 0; k < processedIdsInLot.length; k += chunkIdSize) {
                    await prisma.externalRecord.updateMany({
                        where: { id: { in: processedIdsInLot.slice(k, k + chunkIdSize) } },
                        data: { procesado: 1, error: null }
                    });
                }
            }
        }

        const processedCount = totalCreated + totalUpdated;
        await createAuditLog({ 
            action: "SYNC_PROTOCOLS_LOTE_2000", 
            entity: "Procesos", 
            details: `Protocols sync complete (Lots of 2000): ${processedCount} Success (C:${totalCreated}, U:${totalUpdated}), ${totalErrors} Errors, ${totalSkipped} Skipped`, 
            laboratoryId, 
            userId: session.user.id, 
            userName: session.user.name 
        });
        
        return NextResponse.json({ 
            success: true, 
            summary: { 
                totalRecords: allRecords.length,
                processed: processedCount, 
                created: totalCreated, 
                updated: totalUpdated, 
                skipped: totalSkipped,
                errors: totalErrors
            } 
        });

    } catch (error: any) {
        console.error("Critical error in sync-protocols lot processing:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar protocolos por lotes" }, { status: 500 });
    }
}
