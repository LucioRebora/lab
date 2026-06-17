const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\additional\\Adicionales.csv';

async function main() {
    console.log('Actualizando tabla Additional con codigoExterno...');

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        const nombre = row.Nombre;
        const codigoExterno = row.IDAdicional;

        // Intentamos buscar por nombre y laboratorio para actualizar
        const existing = await prisma.additional.findFirst({
            where: {
                nombre: nombre,
                laboratoryId: LAB_ID
            }
        });

        if (existing) {
            await prisma.additional.update({
                where: { id: existing.id },
                data: { codigoExterno: codigoExterno }
            });
            console.log(`Actualizado: ${nombre} -> ${codigoExterno}`);
        } else {
            // Si no existe, lo creamos
            await prisma.additional.create({
                data: {
                    nombre: nombre,
                    abreviatura: row.Abreviatura || null,
                    codigo: row.Codigo || null,
                    agregarSiempre: row.AgregarSiempre === '1',
                    agregarEnUrgencia: row.AgregarEnUrgencia === '1',
                    laboratoryId: LAB_ID,
                    codigoExterno: codigoExterno
                }
            });
            console.log(`Creado: ${nombre} -> ${codigoExterno}`);
        }
    }

    console.log('Proceso de actualización de Additional finalizado.');
    await prisma.$disconnect();
}

main().catch(console.error);
