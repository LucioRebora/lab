const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting header propagation...');

    // Get all determinations that have at least one sub-determination with a header
    const determinations = await prisma.determination.findMany({
        where: {
            subDeterminations: {
                some: {
                    informarTextoAntes: { not: null }
                }
            }
        },
        include: {
            subDeterminations: {
                orderBy: {
                    codigoExterno: 'asc'
                }
            }
        }
    });

    console.log(`Found ${determinations.length} determinations to process.`);

    let totalUpdates = 0;

    for (const det of determinations) {
        let lastHeader = null;

        for (const subDet of det.subDeterminations) {
            if (subDet.informarTextoAntes) {
                lastHeader = subDet.informarTextoAntes;
            } else if (lastHeader) {
                // If this is one of the known "Grouped" items but missing header, update it
                // We specifically want to target items like Hematocrito, Hemoglobina, etc.
                // But generally, any item without a header following one WITH a header should inherit it
                // and we limit this to common patterns to avoid over-propagation if needed.
                // For now, let's propagate within the determination context.

                await prisma.subDetermination.update({
                    where: { id: subDet.id },
                    data: { informarTextoAntes: lastHeader }
                });
                totalUpdates++;
            }
        }
    }

    console.log(`Propagated headers to ${totalUpdates} sub-determinations.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
