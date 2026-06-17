const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function find92926() {
  console.log("Searching for 92926...");
  
  const patientsByDoc = await prisma.patient.findMany({
    where: {
      OR: [
        { documento: { contains: "92926" } },
        { apellido: { contains: "92926", mode: "insensitive" } },
        { codigoExterno: { contains: "92926", mode: "insensitive" } }
      ]
    },
    include: { protocols: true }
  });
  
  console.log(`Found ${patientsByDoc.length} patients by document/code/name`);
  patientsByDoc.forEach((p) => {
    console.log(`- Patient: ${p.apellido}, ${p.nombre} (ID: ${p.id}, Lab: ${p.laboratoryId})`);
  });

  const protocolsByNum = await prisma.protocol.findMany({
    where: {
      OR: [
        { numeroSecuencial: { contains: "92926", mode: "insensitive" } },
        { codigoExterno: { contains: "92926", mode: "insensitive" } }
      ]
    },
    include: { patient: true }
  });

  console.log(`Found ${protocolsByNum.length} protocols by number/code`);
  protocolsByNum.forEach((pr) => {
    console.log(`- Protocol: ${pr.numeroSecuencial} (Patient: ${pr.patient?.apellido}, Lab: ${pr.laboratoryId})`);
  });
}

find92926()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
