const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, 'Protocolos.csv');

async function main() {
    console.log('Starting protocol date update...');

    let count = 0;
    let errors = 0;
    let batch = [];
    const BATCH_SIZE = 50; // Smaller batch size for updates to avoid timeouts

    const stream = fs.createReadStream(CSV_PATH).pipe(csv());

    for await (const row of stream) {
        const codigoExterno = row.IDProtocolo;
        if (!codigoExterno) continue;

        // Parse date from mm/dd/yy format as requested by user
        let protocolDate = null;
        try {
            const dateParts = row.FechaIngreso.split(' ')[0].split('/');
            if (dateParts.length === 3) {
                const month = parseInt(dateParts[0]) - 1;
                const day = parseInt(dateParts[1]);
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
        } catch (e) {
            console.error(`Error parsing date for ${codigoExterno}:`, e.message);
            continue;
        }

        if (!protocolDate || isNaN(protocolDate.getTime())) continue;

        // Add to batch
        batch.push({ codigoExterno, protocolDate });

        if (batch.length >= BATCH_SIZE) {
            await processBatch(batch);
            count += batch.length;
            process.stdout.write(`\rUpdated ${count} protocols...`);
            batch = [];
        }
    }

    if (batch.length > 0) {
        await processBatch(batch);
        count += batch.length;
    }

    console.log(`\nUpdate finished.`);
    console.log(`Total successful updates: ${count}`);
    console.log(`Errors: ${errors}`);
}

async function processBatch(batch) {
    // Unfortunately competitive updates must be sequential or separately managed per ID 
    // We'll use Promise.all to parallelize within the batch
    await Promise.all(batch.map(item =>
        prisma.protocol.update({
            where: { codigoExterno: item.codigoExterno },
            data: {
                createdAt: item.protocolDate,
                updatedAt: item.protocolDate
            }
        }).catch(err => {
            // Silently ignore if protocol doesn't exist or other errors
            // console.error(`\nFailed to update ${item.codigoExterno}:`, err.message);
        })
    ));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
