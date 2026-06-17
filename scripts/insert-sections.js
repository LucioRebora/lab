const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const laboratoryId = "cmm58sbbt0000xw4pp6ynzgyi";

const rawData = `CM260	Equipo CM260i	Suero/Plasma (S)
COAGULOGRAMA	Incluyendo SubDeterminaciones	Coagulograma (CIT)
CULTIVOS	Ordenada por Determinación	Microbiología (MIC)
DERIVACIONES	Ordenada por Paciente	Derivación (DER)
HEMATOLOGIA	Ordenada por Determinación	Hematología (EDTA)
MICROBIOLOGIA	Ordenada por Paciente	Microbiología (MIC)
ORINAS	Ordenada por Paciente	Orina (O)
SEROLOGIA	Ordenada por Determinación	(ninguna)
VARIOS	Incluyendo SubDeterminaciones	Varios (VAR)`;

async function main() {
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);
    console.log('Total sections to evaluate:', lines.length);

    let insertedCount = 0;
    for (const line of lines) {
        const parts = line.split('\t');
        const nombre = parts[0]?.trim();
        const hojaTrabajo = parts[1]?.trim() || '';
        const etiqueta = parts[2]?.trim() || '';

        if (!nombre) continue;

        try {
            const existing = await prisma.section.findFirst({
                where: {
                    nombre: nombre,
                    laboratoryId: laboratoryId
                }
            });

            if (!existing) {
                await prisma.section.create({
                    data: {
                        nombre,
                        hojaTrabajo,
                        etiqueta,
                        laboratoryId
                    }
                });
                insertedCount++;
            }
        } catch (e) {
            console.error('Error inserting', line, e.message);
        }
    }

    console.log('Successfully inserted ' + insertedCount + ' new sections.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
