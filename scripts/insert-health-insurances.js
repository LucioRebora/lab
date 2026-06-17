const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
    { nombre: "ACA Salud", codigo: "", contado: false, cortada: false },
    { nombre: "Acco Salud", codigo: "", contado: false, cortada: false },
    { nombre: "AMEBIC", codigo: "", contado: false, cortada: false },
    { nombre: "AMUR", codigo: "", contado: false, cortada: false },
    { nombre: "avalian", codigo: "", contado: false, cortada: false },
    { nombre: "Bancarios", codigo: "", contado: false, cortada: false },
    { nombre: "Caja Notarial", codigo: "", contado: false, cortada: false },
    { nombre: "CAMIONEROS", codigo: "", contado: false, cortada: false },
    { nombre: "CETROGAR", codigo: "", contado: false, cortada: false },
    { nombre: "CIRME", codigo: "", contado: false, cortada: false },
    { nombre: "CON DESCUENTO", codigo: "", contado: true, cortada: false },
    { nombre: "CONSTRUIR SALUD", codigo: "", contado: false, cortada: false },
    { nombre: "CONTADO", codigo: "", contado: true, cortada: false },
    { nombre: "CONTADO DEBITO", codigo: "", contado: true, cortada: false },
    { nombre: "COOP ARTNO USAR", codigo: "", contado: false, cortada: false },
    { nombre: "COOP EXTERNOS", codigo: "", contado: false, cortada: false },
    { nombre: "COOP GUARDIA", codigo: "", contado: false, cortada: false },
    { nombre: "COOP HOSPITALARIOS", codigo: "", contado: true, cortada: false },
    { nombre: "COOP INTERNADOS", codigo: "", contado: false, cortada: false },
    { nombre: "COOP OS CORTADA", codigo: "", contado: false, cortada: false },
    { nombre: "COOP PAMI INTERNADOS", codigo: "", contado: true, cortada: false },
    { nombre: "COOPERATIVISTAS", codigo: "", contado: true, cortada: false },
    { nombre: "DASUTEN", codigo: "", contado: false, cortada: false },
    { nombre: "DERIVANTE", codigo: "", contado: true, cortada: false },
    { nombre: "DIBA", codigo: "", contado: false, cortada: false },
    { nombre: "Farmacia", codigo: "", contado: false, cortada: false },
    { nombre: "Federada Salud", codigo: "", contado: false, cortada: false },
    { nombre: "FERROVIARIOS", codigo: "", contado: false, cortada: false },
    { nombre: "FUTBOLISTAS", codigo: "", contado: false, cortada: false },
    { nombre: "Galeno", codigo: "", contado: false, cortada: false },
    { nombre: "GASTRONOMICOS", codigo: "", contado: false, cortada: false },
    { nombre: "GERDANA", codigo: "", contado: false, cortada: false },
    { nombre: "Helios Salud", codigo: "", contado: true, cortada: false },
    { nombre: "HOSPITAL DERIVACIONES", codigo: "", contado: true, cortada: false },
    { nombre: "IMESA", codigo: "", contado: false, cortada: false },
    { nombre: "INTEGRAL SALUD", codigo: "", contado: false, cortada: false },
    { nombre: "IOSE", codigo: "", contado: false, cortada: false },
    { nombre: "IOSFA", codigo: "", contado: false, cortada: false },
    { nombre: "ISPICA", codigo: "", contado: false, cortada: false },
    { nombre: "ISSPICA", codigo: "", contado: false, cortada: false },
    { nombre: "JEANNOT", codigo: "", contado: true, cortada: false },
    { nombre: "JERARQUICOS", codigo: "", contado: false, cortada: false },
    { nombre: "JUVENTUD", codigo: "", contado: false, cortada: false },
    { nombre: "La Rotonda", codigo: "", contado: false, cortada: false },
    { nombre: "Ladrilleros", codigo: "", contado: false, cortada: false },
    { nombre: "LUIS PASTEUR", codigo: "", contado: false, cortada: false },
    { nombre: "LUZ Y FUERZA", codigo: "", contado: false, cortada: false },
    { nombre: "Medicus", codigo: "", contado: false, cortada: false },
    { nombre: "MEDIFE", codigo: "", contado: false, cortada: false },
    { nombre: "Metalurgicos", codigo: "", contado: false, cortada: false },
    { nombre: "OMINT", codigo: "", contado: false, cortada: false },
    { nombre: "OPDEA", codigo: "", contado: false, cortada: false },
    { nombre: "OSALARA", codigo: "", contado: false, cortada: false },
    { nombre: "OSAM", codigo: "", contado: false, cortada: false },
    { nombre: "OSBA", codigo: "", contado: false, cortada: false },
    { nombre: "OSDE", codigo: "", contado: false, cortada: false },
    { nombre: "osdec", codigo: "", contado: false, cortada: false },
    { nombre: "OSDOP", codigo: "", contado: false, cortada: false },
    { nombre: "OSECAC", codigo: "", contado: false, cortada: true },
    { nombre: "OSER", codigo: "", contado: false, cortada: false },
    { nombre: "OSFATUN", codigo: "", contado: false, cortada: false },
    { nombre: "OSIAD", codigo: "", contado: false, cortada: false },
    { nombre: "OSIAG", codigo: "", contado: false, cortada: false },
    { nombre: "OSMATA", codigo: "", contado: false, cortada: false },
    { nombre: "OSMEDICA", codigo: "", contado: false, cortada: false },
    { nombre: "OSPA/VIAL", codigo: "", contado: false, cortada: false },
    { nombre: "OSPAG", codigo: "", contado: false, cortada: false },
    { nombre: "OSPAT", codigo: "", contado: false, cortada: false },
    { nombre: "OSPATRONES", codigo: "", contado: false, cortada: false },
    { nombre: "OSPAVIAL", codigo: "", contado: false, cortada: false },
    { nombre: "OSPE", codigo: "", contado: false, cortada: false },
    { nombre: "OSPEC", codigo: "", contado: false, cortada: false },
    { nombre: "OSPECON", codigo: "", contado: false, cortada: false },
    { nombre: "OSPECON MONOTRIBUTO", codigo: "", contado: false, cortada: false },
    { nombre: "OSPEDYC", codigo: "", contado: false, cortada: false },
    { nombre: "OSPEGAP", codigo: "", contado: false, cortada: false },
    { nombre: "Ospep", codigo: "", contado: false, cortada: false },
    { nombre: "OSPERSA", codigo: "", contado: false, cortada: false },
    { nombre: "Ospersaams", codigo: "", contado: false, cortada: false },
    { nombre: "ospersams", codigo: "", contado: false, cortada: false },
    { nombre: "OSPES", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIA", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIDA", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIL", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIM", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIN Madereros", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIP", codigo: "", contado: false, cortada: false },
    { nombre: "ospiqyp", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIQYPZ", codigo: "", contado: false, cortada: false },
    { nombre: "OSPIT", codigo: "", contado: false, cortada: false },
    { nombre: "OSPLAD", codigo: "", contado: false, cortada: false },
    { nombre: "OSPM", codigo: "", contado: false, cortada: false },
    { nombre: "OSPPCYP", codigo: "", contado: false, cortada: false },
    { nombre: "OSPPYFER", codigo: "", contado: false, cortada: false },
    { nombre: "OSPRERA", codigo: "", contado: false, cortada: false },
    { nombre: "OSPSIP", codigo: "", contado: false, cortada: false },
    { nombre: "OSSEG", codigo: "", contado: false, cortada: false },
    { nombre: "OSTCARA", codigo: "", contado: false, cortada: false },
    { nombre: "OSTEL", codigo: "", contado: false, cortada: false },
    { nombre: "OSTRAC", codigo: "", contado: false, cortada: false },
    { nombre: "OSTRAG", codigo: "", contado: false, cortada: false },
    { nombre: "PAMI", codigo: "", contado: false, cortada: false },
    { nombre: "PAMI NO AUTORIZADAS", codigo: "", contado: true, cortada: false },
    { nombre: "PANADEROS", codigo: "", contado: false, cortada: false },
    { nombre: "PEHUAJO SUD", codigo: "", contado: false, cortada: false },
    { nombre: "Plasma", codigo: "", contado: false, cortada: true },
    { nombre: "Poder Judicial", codigo: "", contado: false, cortada: false },
    { nombre: "POLICIA FEDERAL", codigo: "", contado: false, cortada: false },
    { nombre: "PRENSA", codigo: "", contado: false, cortada: false },
    { nombre: "Prevención Salud", codigo: "", contado: false, cortada: false },
    { nombre: "PRONTO", codigo: "", contado: true, cortada: false },
    { nombre: "PSICOFISICO - JEANNOT", codigo: "", contado: true, cortada: false },
    { nombre: "QUIMICOS", codigo: "", contado: false, cortada: false },
    { nombre: "SAMA", codigo: "", contado: false, cortada: false },
    { nombre: "San Pedro", codigo: "", contado: false, cortada: false },
    { nombre: "SANCOR SALUD", codigo: "", contado: false, cortada: false },
    { nombre: "SANIDAD", codigo: "", contado: false, cortada: false },
    { nombre: "SAS", codigo: "", contado: false, cortada: false },
    { nombre: "Scis", "codigo": "", contado: false, cortada: false },
    { nombre: "SEGURO", codigo: "", contado: false, cortada: false },
    { nombre: "SIN CARGO", codigo: "", contado: false, cortada: false },
    { nombre: "SOL", codigo: "", contado: false, cortada: false },
    { nombre: "SOMU", codigo: "", contado: false, cortada: false },
    { nombre: "SWISS MEDICAL", codigo: "", contado: false, cortada: false },
    { nombre: "TV", codigo: "", contado: false, cortada: false },
    { nombre: "UNER", codigo: "", contado: false, cortada: false },
    { nombre: "UNIMEDICA", codigo: "", contado: false, cortada: false },
    { nombre: "UOM", codigo: "", contado: false, cortada: false },
    { nombre: "UP", codigo: "", contado: false, cortada: false },
    { nombre: "UTA", codigo: "", contado: false, cortada: false },
    { nombre: "Veterinaria", codigo: "", contado: true, cortada: false },
    { nombre: "Veterinaria Particulares", codigo: "", contado: true, cortada: false },
    { nombre: "Visitar", "codigo": "", contado: false, cortada: false }
];

const laboratoryId = "cmm58sbbt0000xw4pp6ynzgyi";

async function main() {
    console.log('Inserting ' + data.length + ' health insurances...');

    let count = 0;
    for (const item of data) {
        try {
            await prisma.healthInsurance.upsert({
                where: {
                    nombre_laboratoryId: {
                        nombre: item.nombre,
                        laboratoryId: laboratoryId
                    }
                },
                update: {
                    codigo: item.codigo,
                    contado: item.contado,
                    cortada: item.cortada
                },
                create: {
                    ...item,
                    laboratoryId
                }
            });
            count++;
        } catch (e) {
            console.error(`Error inserting ${item.nombre}:`, e.message);
        }
    }

    console.log(`Successfully inserted/updated ${count} records.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
