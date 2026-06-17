const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

async function main() {
    console.log('Fetching patients with date of birth...');
    const patients = await prisma.patient.findMany({
        where: {
            fechaNacimiento: {
                not: null
            }
        },
        select: {
            id: true,
            fechaNacimiento: true,
            edad: true
        }
    });

    console.log(`Found ${patients.length} patients to process.`);
    let updatedCount = 0;
    let skippedCount = 0;

    // Process in batches of 100 for efficiency
    const batchSize = 100;
    for (let i = 0; i < patients.length; i += batchSize) {
        const batch = patients.slice(i, i + batchSize);
        const updates = batch.map(p => {
            const newAge = calculateAge(p.fechaNacimiento);
            if (newAge !== p.edad) {
                return prisma.patient.update({
                    where: { id: p.id },
                    data: { edad: newAge }
                });
            }
            return null;
        }).filter(u => u !== null);

        if (updates.length > 0) {
            await Promise.all(updates);
            updatedCount += updates.length;
        }
        skippedCount += (batch.length - updates.length);

        if (i % 1000 === 0) {
            console.log(`Processed ${i} patients...`);
        }
    }

    // Also handle nulling age for patients with no birth date
    console.log('Nulling age for patients with no birth date...');
    const noBirthDateUpdate = await prisma.patient.updateMany({
        where: {
            fechaNacimiento: null,
            edad: { not: null }
        },
        data: {
            edad: null
        }
    });

    console.log('Update complete!');
    console.log(`- Updated ages for: ${updatedCount} patients`);
    console.log(`- Already correct/skipped: ${skippedCount} patients`);
    console.log(`- Nulled ages for: ${noBirthDateUpdate.count} patients without birth date`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
