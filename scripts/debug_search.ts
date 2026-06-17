import { prisma } from "../src/lib/prisma";

async function find92926() {
  console.log("Searching for 92926...");
  
  const patientsByDoc = await (prisma.patient.findMany as any)({
    where: {
      OR: [
        { documento: { contains: "92926" } },
        { apellido: { contains: "92926" } },
        { codigoExterno: { contains: "92926" } }
      ]
    },
    include: { protocols: true }
  });
  
  console.log(`Found ${patientsByDoc.length} patients by document/code/name`);
  patientsByDoc.forEach((p: any) => {
    console.log(`- Patient: ${p.apellido}, ${p.nombre} (ID: ${p.id}, Lab: ${p.laboratoryId})`);
  });

  const protocolsByNum = await (prisma.protocol.findMany as any)({
    where: {
      OR: [
        { numeroSecuencial: { contains: "92926" } },
        { codigoExterno: { contains: "92926" } }
      ]
    },
    include: { patient: true }
  });

  console.log(`Found ${protocolsByNum.length} protocols by number/code`);
  protocolsByNum.forEach((pr: any) => {
    console.log(`- Protocol: ${pr.numeroSecuencial} (Patient: ${pr.patient?.apellido}, Lab: ${pr.laboratoryId})`);
  });
}

find92926()
  .catch(console.error)
  .finally(() => process.exit());
