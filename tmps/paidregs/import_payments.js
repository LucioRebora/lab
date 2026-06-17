const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\paidregs\\Pagos.csv';

function parseDate(dateStr) {
    if (!dateStr) return null;
    // Formato: 12/29/24 00:00:00 (MM/DD/YY)
    const [datePart] = dateStr.split(' ');
    const [m, d, y] = datePart.split('/');
    const year = parseInt(y) < 50 ? 2000 + parseInt(y) : 1900 + parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d));
}

async function main() {
    console.log('Iniciando importación de Pagos...');

    console.log('Cargando mapeo de pacientes...');
    const patients = await prisma.patient.findMany({
        where: { laboratoryId: LAB_ID },
        select: { id: true, codigoExterno: true }
    });

    const patientMap = new Map();
    patients.forEach(p => {
        if (p.codigoExterno) patientMap.set(p.codigoExterno, p.id);
    });

    console.log(`Mapeo listo: ${patientMap.size} pacientes.`);

    const results = [];
    let count = 0;
    let skipped = 0;

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        const patientId = patientMap.get(row.IDPaciente);

        if (!patientId) {
            skipped++;
            continue;
        }

        results.push({
            codigoExterno: row.IDPago,
            patientId: patientId,
            fecha: parseDate(row.Fecha),
            concepto: row.Concepto,
            importe: row.Importe ? parseFloat(row.Importe) : 0,
            laboratoryId: LAB_ID
        });

        count++;

        if (results.length >= 1000) {
            await prisma.payment.createMany({
                data: results,
                skipDuplicates: true
            });
            results.length = 0;
            console.log(`Procesados: ${count}...`);
        }
    }

    if (results.length > 0) {
        await prisma.payment.createMany({
            data: results,
            skipDuplicates: true
        });
    }

    console.log(`Importación finalizada.`);
    console.log(`- Procesados: ${count}`);
    console.log(`- Saltados (Paciente no encontrado): ${skipped}`);

    await prisma.$disconnect();
}

main().catch(console.error);
