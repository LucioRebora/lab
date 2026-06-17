const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
    const receptoresPath = path.join(process.cwd(), 'tmps/usersnotif/receptores.csv');
    const relationPath = path.join(process.cwd(), 'tmps/usersnotif/pacientes-usuariosnotifica.csv');

    console.log("Cargando receptores...");
    const receptoresMap = new Map();

    // Leer receptores.csv
    await new Promise((resolve, reject) => {
        fs.createReadStream(receptoresPath)
            .pipe(csv())
            .on('data', (row) => {
                const id = row.IDReceptor ? row.IDReceptor.trim() : null;
                if (id) {
                    receptoresMap.set(id, {
                        apellido: row.Apellido ? row.Apellido.trim() : '',
                        nombre: row.Nombre ? row.Nombre.trim() : '',
                        email: row.Email ? row.Email.trim() : '',
                        contrasenia: row.Contrasenia ? row.Contrasenia.trim() : '',
                        enviarCopia: row.EnviarUnaCopia === '1'
                    });
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });
    console.log(`Receptores cargados: ${receptoresMap.size}`);

    console.log("Leyendo relaciones paciente-receptor...");
    const relations = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(relationPath)
            .pipe(csv())
            .on('data', (row) => {
                const patientExtCode = row['IDPaciente codigo externo'] ? row['IDPaciente codigo externo'].trim() : null;
                const receptorId = row.IDUsuario ? row.IDUsuario.trim() : null;
                if (patientExtCode && receptorId) {
                    relations.push({ patientExtCode, receptorId });
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });
    console.log(`Relaciones leídas: ${relations.length}`);

    // Cargar mapa de pacientes por external_code para optimizar
    console.log("Cargando pacientes de la DB...");
    const dbPatients = await prisma.patient.findMany({
        select: { id: true, codigoExterno: true },
        where: { codigoExterno: { not: null } }
    });
    const patientMap = new Map();
    dbPatients.forEach(p => patientMap.set(String(p.codigoExterno), p.id));
    console.log(`Pacientes cargados: ${patientMap.size}`);

    let updated = 0;
    let errors = 0;
    let skipped = 0;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < relations.length; i += CHUNK_SIZE) {
        const chunk = relations.slice(i, i + CHUNK_SIZE);
        const operations = [];

        for (const rel of chunk) {
            const patientId = patientMap.get(rel.patientExtCode);
            const receptorData = receptoresMap.get(rel.receptorId);

            if (!patientId) {
                // console.warn(`Paciente no encontrado: ${rel.patientExtCode}`);
                skipped++;
                continue;
            }

            if (!receptorData) {
                // console.warn(`Receptor no encontrado: ${rel.receptorId}`);
                skipped++;
                continue;
            }

            operations.push(
                prisma.patient.update({
                    where: { id: patientId },
                    data: {
                        enviarNotificacionOtro: true,
                        enviarInforme: receptorData.enviarCopia,
                        receptorApellido: receptorData.apellido,
                        receptorNombre: receptorData.nombre,
                        receptorEmail: receptorData.email,
                        clave_informe: receptorData.contrasenia
                    }
                })
            );
        }

        if (operations.length > 0) {
            try {
                await Promise.all(operations);
                updated += operations.length;
            } catch (error) {
                console.error(`Error en bloque ${i}:`, error.message);
                errors += operations.length;
            }
        }

        if (i % 1000 === 0) {
            console.log(`Procesando ${i}/${relations.length}...`);
        }
    }

    console.log(`\nProceso completado.`);
    console.log(`Pacientes actualizados: ${updated}`);
    console.log(`Errores: ${errors}`);
    console.log(`Saltados (no encontrados): ${skipped}`);

    await prisma.$disconnect();
}

run().catch(err => {
    console.error("Error fatal:", err);
    prisma.$disconnect();
});
