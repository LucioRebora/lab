const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = path.join(process.cwd(), "tmps", "usersnotif", "pacientes-usuariosnotifica.csv");
    const laboratoryId = 'cmm58sbbt0000xw4pp6ynzgyi';
    const results = [];

    console.log(`Reading CSV: ${csvFilePath}`);

    if (!fs.existsSync(csvFilePath)) {
        console.error(`File not found: ${csvFilePath}`);
        return;
    }

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            console.log(`Processing ${results.length} mappings...`);

            let updatedCount = 0;
            let patientNotFound = 0;
            let userNotFound = 0;
            let skippedCount = 0;
            let errorCount = 0;

            // Load all patients and notified users for this lab into memory for speed if possible, 
            // but 28k rows might be okay one by one if we use a cache of IDs.

            console.log("Loading existing patients and notified users mapping maps...");
            const patients = await prisma.patient.findMany({
                where: { laboratoryId, codigoExterno: { not: null } },
                select: { id: true, codigoExterno: true, notifiedUserId: true }
            });
            const patientMap = new Map(patients.map(p => [p.codigoExterno, p]));

            const notifiedUsers = await prisma.notifiedUser.findMany({
                where: { laboratoryId, codigoExterno: { not: null } },
                select: { id: true, codigoExterno: true }
            });
            const userMap = new Map(notifiedUsers.map(u => [u.codigoExterno, u.id]));

            console.log(`Loaded ${patientMap.size} patients and ${userMap.size} notified users with external codes.`);

            const updates = [];

            for (const row of results) {
                const patientExtId = row.IDPaciente;
                const userExtId = row.IDUsuario;

                if (!patientExtId || !userExtId) continue;

                const patient = patientMap.get(patientExtId);
                const userId = userMap.get(userExtId);

                if (!patient) {
                    patientNotFound++;
                    continue;
                }

                if (!userId) {
                    userNotFound++;
                    continue;
                }

                if (patient.notifiedUserId === userId) {
                    skippedCount++;
                    continue;
                }

                updates.push({
                    patientId: patient.id,
                    userId: userId
                });
            }

            console.log(`Identified ${updates.length} patients to update.`);
            console.log(`Patients not found: ${patientNotFound}`);
            console.log(`Users not found: ${userNotFound}`);
            console.log(`Already mapped: ${skippedCount}`);

            let current = 0;
            for (const update of updates) {
                try {
                    await prisma.patient.update({
                        where: { id: update.patientId },
                        data: { notifiedUserId: update.userId }
                    });
                    updatedCount++;
                    if (updatedCount % 100 === 0) {
                        console.log(`Updated ${updatedCount}/${updates.length} patients...`);
                    }
                } catch (e) {
                    errorCount++;
                    console.error(`Error updating patient ${update.patientId}:`, e.message);
                }
            }

            console.log("Migration finished.");
            console.log(`Total updated: ${updatedCount}`);
            console.log(`Errors: ${errorCount}`);
            await prisma.$disconnect();
        });
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
