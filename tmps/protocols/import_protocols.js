const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, 'Protocolos.csv');
const LABORATORY_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function main() {
    console.log('Starting protocol import...');

    // 1. Fetch all mappings to memory for fast lookup
    console.log('Fetching mappings...');

    const [patients, doctors, biochemists, notifiedUsers] = await Promise.all([
        prisma.patient.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
        prisma.doctor.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
        prisma.biochemist.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
        prisma.notifiedUser.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
    ]);

    const patientMap = new Map(patients.filter(p => p.codigoExterno).map(p => [p.codigoExterno, p.id]));
    const doctorMap = new Map(doctors.filter(d => d.codigoExterno).map(d => [d.codigoExterno, d.id]));
    const biochemistMap = new Map(biochemists.filter(b => b.codigoExterno).map(b => [b.codigoExterno, b.id]));
    const notifiedUserMap = new Map(notifiedUsers.filter(u => u.codigoExterno).map(u => [u.codigoExterno, u.id]));

    console.log(`Mappings loaded: 
        Patients: ${patientMap.size}
        Doctors: ${doctorMap.size}
        Biochemists: ${biochemistMap.size}
        NotifiedUsers: ${notifiedUserMap.size}`);

    let count = 0;
    let skipped = 0;
    let batch = [];
    const BATCH_SIZE = 1000;

    const stream = fs.createReadStream(CSV_PATH).pipe(csv());

    for await (const row of stream) {
        const codigoExterno = row.IDProtocolo;
        if (!codigoExterno) continue;

        const patientId = patientMap.get(row.IDPaciente);
        if (!patientId) {
            skipped++;
            continue;
        }

        // Parse date. FechaIngreso is 03/02/26 (DD/MM/YY)
        // HoraIngreso is 12/30/99 10:51:12 (we only care about the time)
        let protocolDate = new Date();
        const dateParts = row.FechaIngreso.split(' ')[0].split('/');
        if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            let year = parseInt(dateParts[2]);
            if (year < 100) year += 2000;

            const timeParts = row.HoraIngreso.split(' ');
            if (timeParts.length === 2) {
                const hourParts = timeParts[1].split(':');
                const hour = parseInt(hourParts[0]);
                const min = parseInt(hourParts[1]);
                const sec = parseInt(hourParts[2]);
                protocolDate = new Date(year, month, day, hour, min, sec);
            } else {
                protocolDate = new Date(year, month, day);
            }
        }

        batch.push({
            codigoExterno: codigoExterno,
            numeroSecuencial: row.NumProtocolo,
            patientId: patientId,
            doctorId: doctorMap.get(row.IDDoctor) || null,
            biochemistId: biochemistMap.get(row.IDBioquimicoFirmante) || null,
            notifiedUserId: notifiedUserMap.get(row.IDUsuarioPublicado) || null,
            notifiedUserPortadaId: notifiedUserMap.get(row.IDUsuarioPortadaPublicado) || null,
            laboratoryId: LABORATORY_ID,
            createdAt: protocolDate,
            updatedAt: protocolDate
        });

        if (batch.length >= BATCH_SIZE) {
            try {
                await prisma.protocol.createMany({
                    data: batch,
                    skipDuplicates: true
                });
                count += batch.length;
                process.stdout.write(`\rImported ${count} protocols... (Skipped ${skipped} without patient mapping)`);
            } catch (err) {
                console.error('\nError in batch:', err.message);
            }
            batch = [];
        }
    }

    if (batch.length > 0) {
        await prisma.protocol.createMany({
            data: batch,
            skipDuplicates: true
        });
        count += batch.length;
    }

    console.log(`\nMigration finished.`);
    console.log(`Total created: ${count}`);
    console.log(`Skipped (no patient): ${skipped}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
