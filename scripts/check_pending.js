const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkPending() {
  const pendingCount = await prisma.externalRecord.count({
    where: { nombreTabla: "PRO SubResultados", procesado: 0 }
  });
  const processedCount = await prisma.externalRecord.count({
    where: { nombreTabla: "PRO SubResultados", procesado: 1 }
  });
  console.log(`Pending: ${pendingCount}`);
  console.log(`Processed: ${processedCount}`);
  
  const sampleError = await prisma.externalRecord.findFirst({
    where: { nombreTabla: "PRO SubResultados", error: { not: null } },
    select: { error: true }
  });
  if (sampleError) console.log(`Sample error: ${sampleError.error}`);
}

checkPending().finally(() => prisma.$disconnect());
