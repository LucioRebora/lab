const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\doctors\\doctors.csv';

async function main() {
    console.log('Iniciando importación de Doctores (Refinado)...');

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());
    let count = 0;
    let updated = 0;
    let created = 0;

    for await (const row of stream) {
        const codigoExterno = row.IDDoctor;
        const apellido = (row.Apellido || '').trim();
        const nombre = (row.Nombre || '').trim();

        if (!apellido && !nombre) continue;

        const doctorData = {
            apellido: apellido,
            nombre: nombre,
            tratamiento: row.Tratamiento || null,
            matriculaProvincial: row.MatriculaProvincial || null,
            direccion: row.Direccion || null,
            ciudad: row.Ciudad || null,
            provincia: row.Provincia || null,
            codigoPostal: row.CodigoPostal || null,
            telefono: row.Telefono || null,
            celular: row.Celular || null,
            notas: row.Notas || null,
            codigoExterno: codigoExterno,
            laboratoryId: LAB_ID
        };

        // 1. Buscar por codigoExterno
        let existing = await prisma.doctor.findUnique({
            where: { codigoExterno: codigoExterno }
        });

        if (existing) {
            await prisma.doctor.update({
                where: { id: existing.id },
                data: doctorData
            });
            updated++;
        } else {
            // 2. Buscar por nombre si no hay match por ID
            const byName = await prisma.doctor.findFirst({
                where: {
                    apellido: { equals: apellido, mode: 'insensitive' },
                    nombre: { equals: nombre, mode: 'insensitive' },
                    laboratoryId: LAB_ID,
                    codigoExterno: null // Solo si no tiene ID asignado aún
                }
            });

            if (byName) {
                await prisma.doctor.update({
                    where: { id: byName.id },
                    data: doctorData
                });
                updated++;
            } else {
                // 3. Crear nuevo
                await prisma.doctor.create({
                    data: doctorData
                });
                created++;
            }
        }

        count++;
        if (count % 100 === 0) console.log(`Procesados: ${count}...`);
    }

    console.log('Importación de Doctores finalizada.');
    console.log(`- Total procesados: ${count}`);
    console.log(`- Actualizados: ${updated}`);
    console.log(`- Creados: ${created}`);

    await prisma.$disconnect();
}

main().catch(console.error);
