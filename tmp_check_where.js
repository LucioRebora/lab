const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const labId = "cmm58sbbt0000xw4pp6ynzgyi";
    const startDate = "2026-03-18";
    const endDate = "2026-03-18";

    const where = { laboratoryId: labId };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            where.createdAt.gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    console.log("WHERE:", JSON.stringify(where, null, 2));

    const protocols = await prisma.protocol.findMany({
        where,
        include: {
            patient: true,
            doctor: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log("COUNT:", protocols.length);
    if (protocols.length > 0) {
        console.log("FIRST:", protocols[0].numeroSecuencial, protocols[0].createdAt);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
