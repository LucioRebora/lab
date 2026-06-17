const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.result.count();
    console.log('Results Count:', count);
}
main().finally(() => prisma.$disconnect());
