const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSubResultData() {
  const record = await prisma.externalRecord.findFirst({
    where: { nombreTabla: "PRO SubResultados" }
  });
  if (record) {
    console.log("Keys in PRO SubResultados data:", Object.keys(record.datos));
    console.log("Full data sample:", JSON.stringify(record.datos, null, 2));
  } else {
    console.log("No records found for PRO SubResultados");
  }
}

checkSubResultData().finally(() => prisma.$disconnect());
