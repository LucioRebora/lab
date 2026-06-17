const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = path.join(process.cwd(), 'tmps', 'integracion_cm260', 'CM260Configuracion.csv');
    const results = [];

    // IDs hardcodeados según el entorno actual
    const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi'; // ID de laboratorio LB Lab
    const EQUIPMENT_ID = 'cmmmfcspa0003fn38pnttc4tp'; // ID de equipo CM260

    console.log('--- Iniciando migración de CM260 Mapper ---');

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (const row of results) {
                const codigoExterno = row.IDConfiguracion;
                const subDetCodigoExterno = row.IDSubDeterminacion;
                const tecnica = row.Tecnica;

                // Buscar la sub-determinación por su propio codigo_externo
                const subDet = await prisma.subDetermination.findFirst({
                    where: {
                        codigoExterno: subDetCodigoExterno,
                        laboratoryId: LAB_ID
                    }
                });

                if (subDet) {
                    await prisma.mapperCM260.upsert({
                        where: {
                            subDeterminationId_equipmentId_laboratoryId: {
                                subDeterminationId: subDet.id,
                                equipmentId: EQUIPMENT_ID,
                                laboratoryId: LAB_ID
                            }
                        },
                        update: {
                            codigoExterno,
                            tecnica
                        },
                        create: {
                            codigoExterno,
                            tecnica,
                            subDeterminationId: subDet.id,
                            equipmentId: EQUIPMENT_ID,
                            laboratoryId: LAB_ID
                        }
                    });
                    console.log(`✅ Mapeado: ${subDetCodigoExterno} -> ${tecnica}`);
                } else {
                    console.warn(`⚠️ No se encontró SubDetermination con código externo: ${subDetCodigoExterno}`);
                }
            }
            console.log('--- Migración finalizada ---');
            await prisma.$disconnect();
        });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
