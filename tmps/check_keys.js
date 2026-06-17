const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.externalRecord.findMany({
    where: { nombreTabla: 'RLB Usuarios' },
    take: 10
  });
  
  process.stdout.write('Sample data from RLB Usuarios:\n');
  records.forEach(r => {
    process.stdout.write(`ID: ${r.codigoExterno}, Keys in datos: ${Object.keys(r.datos).join(', ')}\n`);
    if (r.datos.enciarunacopia !== undefined) process.stdout.write(`Found enciarunacopia: ${r.datos.enciarunacopia}\n`);
    if (r.datos.enviar_una_copia !== undefined) process.stdout.write(`Found enviar_una_copia: ${r.datos.enviar_una_copia}\n`);
    if (r.datos.EnviarUnaCopia !== undefined) process.stdout.write(`Found EnviarUnaCopia: ${r.datos.EnviarUnaCopia}\n`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
