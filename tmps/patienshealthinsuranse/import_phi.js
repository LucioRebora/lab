const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
    const csvPath = path.join(process.cwd(), 'tmps/patienshealthinsuranse/patienshealthinsur.csv');

    console.log("Cargando mapas de referencia (pacientes y obras sociales)...");

    // Cargar pacientes
    const patients = await prisma.patient.findMany({
        select: { id: true, codigoExterno: true },
        where: { codigoExterno: { not: null } }
    });
    const patientMap = new Map();
    patients.forEach(p => patientMap.set(String(p.codigoExterno), p.id));
    console.log(`Mapa de pacientes cargado: ${patientMap.size} registros.`);

    // Cargar obras sociales
    const healthInsurances = await prisma.healthInsurance.findMany({
        select: { id: true, codigoExterno: true },
        where: { codigoExterno: { not: null } }
    });
    const hiMap = new Map();
    healthInsurances.forEach(hi => hiMap.set(String(hi.codigoExterno), hi.id));
    console.log(`Mapa de obras sociales cargado: ${hiMap.size} registros.`);

    const results = [];
    console.log(`Leyendo CSV desde: ${csvPath}`);

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Se leyeron ${results.length} filas del CSV.`);

            let processed = 0;
            let skipped = 0;
            let errors = 0;

            const CHUNK_SIZE = 100;
            for (let i = 0; i < results.length; i += CHUNK_SIZE) {
                const chunk = results.slice(i, i + CHUNK_SIZE);
                const operations = [];

                for (const row of chunk) {
                    const extCode = row.external_code ? String(row.external_code).trim() : null;
                    const patientExtCode = row.IDPaciente_external_code ? String(row.IDPaciente_external_code).trim() : null;
                    // Notar el espacio en la columna del CSV: "ObraSocial external_code"
                    const hiExtCode = row['ObraSocial external_code'] ? String(row['ObraSocial external_code']).trim() : null;
                    const nroAfiliado = row.NumAfiliado ? String(row.NumAfiliado).trim() : null;

                    if (!extCode || !patientExtCode || !hiExtCode) {
                        skipped++;
                        continue;
                    }

                    const patientId = patientMap.get(patientExtCode);
                    const healthInsuranceId = hiMap.get(hiExtCode);

                    if (!patientId || !healthInsuranceId) {
                        // console.warn(`No se encontró relación para Paciente: ${patientExtCode} u Obra Social: ${hiExtCode}`);
                        skipped++;
                        continue;
                    }

                    operations.push(
                        prisma.patientHealthInsurance.upsert({
                            where: { codigoExterno: extCode },
                            update: {
                                patientId,
                                healthInsuranceId,
                                nroAfiliado,
                                updatedAt: new Date()
                            },
                            create: {
                                codigoExterno: extCode,
                                patientId,
                                healthInsuranceId,
                                nroAfiliado
                            }
                        })
                    );
                }

                if (operations.length > 0) {
                    try {
                        // Ejecutamos secuencialmente o en batches controlados para evitar saturar la conexión
                        // Upsert no se puede usar con createMany de forma directa para idempotencia por campo codigoExterno
                        await Promise.all(operations);
                        processed += operations.length;
                    } catch (error) {
                        console.error(`Error en bloque ${i}:`, error.message);
                        errors += operations.length;
                    }
                }

                if (i % 1000 === 0) {
                    console.log(`Procesadas ${i}/${results.length} filas...`);
                }
            }

            console.log(`\nCarga terminada.`);
            console.log(`Total procesado: ${processed}`);
            console.log(`Total ignorado/no encontrado: ${skipped}`);
            console.log(`Total errores: ${errors}`);

            await prisma.$disconnect();
        });
}

run().catch(err => {
    console.error("Error fatal en el script:", err);
    prisma.$disconnect();
});
