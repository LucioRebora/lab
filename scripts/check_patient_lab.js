const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkPatientLab() {
  const p = await prisma.patient.findUnique({
    where: { id: "cmmcxmhki00jh9gl21qzohydi" }
  });
  console.log(`Patient lab: ${p.laboratoryId}`);
}

checkPatientLab().finally(() => prisma.$disconnect());
