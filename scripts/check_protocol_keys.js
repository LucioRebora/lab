const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkProtocolData() {
  const record = await prisma.externalRecord.findFirst({
    where: { nombreTabla: "PRO Protocolos" }
  });
  if (record) {
    console.log("Keys in PRO Protocolos data:", Object.keys(record.datos));
    console.log("Full data sample:", JSON.stringify(record.datos, null, 2));
  } else {
    console.log("No records found for PRO Protocolos");
  }
}

checkProtocolData().finally(() => prisma.$disconnect());
