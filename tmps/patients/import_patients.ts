import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function run() {
    console.log("Obteniendo laboratorio...");
    const lab = await prisma.laboratory.findFirst();
    const labId = lab ? lab.id : null;

    const results: any[] = [];
    console.log("Leyendo CSV...");
    fs.createReadStream('tmps/HMB Pacientes.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Leidos ${results.length} pacientes. Iniciando segunda pasada (OPTIMIZADA)...`);

            const assignedDocs = new Set<string>();
            const allPatients = await prisma.patient.findMany({ select: { id: true, documento: true, codigoExterno: true } });

            const docOwnerMap = new Map<string, string>();
            const externalToIdMap = new Map<string, string>();
            allPatients.forEach(p => {
                if (p.documento) docOwnerMap.set(p.documento, p.id);
                if (p.codigoExterno) externalToIdMap.set(p.codigoExterno, p.id);
            });

            const CHUNK_SIZE = 100;
            for (let i = 0; i < results.length; i += CHUNK_SIZE) {
                const chunk = results.slice(i, i + CHUNK_SIZE);
                const operations: any[] = [];

                for (const row of chunk) {
                    const codigoExt = row.codigoexterno ? String(row.codigoexterno) : null;

                    let fechaNacimiento: Date | null = null;
                    if (row.FechaNacimiento && row.FechaNacimiento.trim() !== "") {
                        const datePart = row.FechaNacimiento.split(' ')[0];
                        if (datePart) {
                            const parts = datePart.split('/');
                            if (parts.length === 3) {
                                let m = parseInt(parts[0], 10);
                                let d = parseInt(parts[1], 10);
                                let y = parseInt(parts[2], 10);
                                if (y < 100) y = y > 26 ? 1900 + y : 2000 + y;
                                if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
                                    if (y !== 1900) fechaNacimiento = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                                }
                            }
                        }
                    }

                    let documento: string | null = (row.NumDocumento || '').replace(/[^\d]/g, '');
                    if (!documento) documento = null;

                    const t1 = row.TelefonoCasa || '';
                    const t2 = row.TelefonoTrabajo || '';
                    const t3 = row.TelefonoOtro || '';
                    const tels = [t1, t2, t3].filter(t => t.trim().length > 0);
                    let selectedTel = null;
                    if (tels.length > 0) {
                        selectedTel = tels.find(t => String(t).includes('15')) || tels[0];
                        selectedTel = selectedTel.replace(/\D/g, '');
                        if (selectedTel.length > 20) selectedTel = selectedTel.substring(0, 20);
                    }

                    let sexo = 'O';
                    if (row.Sexo) {
                        const s = row.Sexo.toUpperCase().trim();
                        if (s === 'M' || s === 'F') sexo = s;
                    }

                    const patientId = codigoExt ? externalToIdMap.get(codigoExt) : null;

                    let safeDoc = documento;
                    if (safeDoc) {
                        const originalDoc = safeDoc;
                        let dupCounter = 1;
                        while (docOwnerMap.has(safeDoc) && docOwnerMap.get(safeDoc) !== (patientId || 'NEW')) {
                            safeDoc = `${originalDoc}-${dupCounter}`;
                            dupCounter++;
                        }
                        while (assignedDocs.has(safeDoc)) {
                            safeDoc = `${originalDoc}-${dupCounter}`;
                            dupCounter++;
                        }
                        assignedDocs.add(safeDoc);
                    }

                    const patientData = {
                        apellido: row.Apellido || 'Sin apellido',
                        nombre: row.Nombre || 'Sin nombre',
                        sexo: sexo,
                        tipoDocumento: row.TipoDocumento || 'DNI',
                        fechaNacimiento: fechaNacimiento,
                        direccion: row.Direccion || null,
                        entreCalles: row.EntreCalles || null,
                        ciudad: row.Ciudad || null,
                        provincia: row.Provincia || null,
                        codigoPostal: row.CodigoPostal || null,
                        telefono: selectedTel,
                        codigoExterno: codigoExt,
                        documento: safeDoc,
                        laboratoryId: labId
                    };

                    if (patientId) {
                        operations.push(prisma.patient.update({
                            where: { id: patientId },
                            data: patientData
                        }));
                        if (safeDoc) docOwnerMap.set(safeDoc, patientId);
                    } else {
                        // We skip creation in optimized pass to be safer, 
                        // but if we want it:
                        // operations.push(prisma.patient.create({ data: patientData }));
                        // Usually first pass created them all.
                    }
                }

                if (operations.length > 0) {
                    try {
                        await prisma.$transaction(operations);
                    } catch (e) {
                        console.error(`Error in chunk starting at ${i}:`, e);
                        // If transaction fails, fallback to sequential for this chunk
                        for (const op of operations) {
                            try { await op; } catch (err) { console.error("Fallback op failed:", err); }
                        }
                    }
                }

                if (i % 1000 === 0) {
                    console.log(`Processed ${i}/${results.length}`);
                }
            }
            console.log("Limpieza y actualizacion OPTIMIZADA completada");
            await prisma.$disconnect();
        });
}

run().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
