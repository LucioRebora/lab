const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
    const csvPath = path.join(process.cwd(), 'tmps/healthinsuranse/ObrasSociales.csv');

    console.log("Obteniendo el primer laboratorio disponible...");
    const lab = await prisma.laboratory.findFirst();
    const labId = lab ? lab.id : null;

    if (!labId) {
        console.error("No se encontró ningún laboratorio en la base de datos. Abortando.");
        await prisma.$disconnect();
        return;
    }

    console.log(`Usando Laboratory ID: ${labId}`);

    const results = [];

    console.log(`Leyendo CSV desde: ${csvPath}`);

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Se leyeron ${results.length} filas del CSV.`);

            let processed = 0;
            let errors = 0;

            for (const row of results) {
                if (!row.Nombre || row.Nombre.trim() === '') {
                    continue;
                }

                const nombre = row.Nombre.trim().toUpperCase();
                const codigoExterno = row.externalcode ? String(row.externalcode).trim() : null;
                const contado = row.Contado === '1';
                const cortada = row.Cortada === '1';
                const valorNBU = parseFloat(String(row.ValorNBU).replace(',', '.')) || 0;
                const selectorRTR = parseInt(row.SelectorRTR, 10) || 0;

                try {
                    if (codigoExterno) {
                        await prisma.healthInsurance.upsert({
                            where: { codigoExterno: codigoExterno },
                            update: {
                                nombre,
                                contado,
                                cortada,
                                valorNBU,
                                selectorRTR,
                                laboratoryId: labId,
                                updatedAt: new Date()
                            },
                            create: {
                                nombre,
                                codigoExterno,
                                contado,
                                cortada,
                                valorNBU,
                                selectorRTR,
                                laboratoryId: labId
                            }
                        });
                    } else {
                        await prisma.healthInsurance.upsert({
                            where: {
                                nombre_laboratoryId: {
                                    nombre: nombre,
                                    laboratoryId: labId
                                }
                            },
                            update: {
                                contado,
                                cortada,
                                valorNBU,
                                selectorRTR,
                                updatedAt: new Date()
                            },
                            create: {
                                nombre,
                                contado,
                                cortada,
                                valorNBU,
                                selectorRTR,
                                laboratoryId: labId
                            }
                        });
                    }
                    processed++;
                } catch (error) {
                    console.error(`Error procesando [${codigoExterno}] ${nombre}:`, error);
                    errors++;
                }

                if (processed % 20 === 0) {
                    console.log(`Procesadas ${processed} filas...`);
                }
            }

            console.log(`\nCarga terminada.`);
            console.log(`Total procesado: ${processed}`);
            console.log(`Total errores: ${errors}`);

            await prisma.$disconnect();
        });
}

run().catch(err => {
    console.error("Error fatal en el script:", err);
    prisma.$disconnect();
});
