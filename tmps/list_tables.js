const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.externalRecord.groupBy({
    by: ['nombreTabla'],
    _count: true
  });
  console.log(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
