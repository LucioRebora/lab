const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.worksheetPrintLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            section: true,
            user: true
        }
    });
    console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
