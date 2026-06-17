const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.externalRecord.findMany({
    where: { nombreTabla: 'PRO Resultados' },
    take: 5
  });
  
  process.stdout.write('Sample data from PRO Resultados:\n');
  records.forEach(r => {
    process.stdout.write(`ID (codigoExterno): ${r.codigoExterno}, Keys in datos: ${Object.keys(r.datos).join(', ')}\n`);
    process.stdout.write(`Full data: ${JSON.stringify(r.datos)}\n\n`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
