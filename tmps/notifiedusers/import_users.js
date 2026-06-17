const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = path.join(process.cwd(), "tmps", "notifiedusers", "Usuarios.csv");
    const results = [];
    const targetLaboratoryId = 'cmm58sbbt0000xw4pp6ynzgyi';

    console.log(`Importing notified users to laboratory ID: ${targetLaboratoryId}`);

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            console.log(`Found ${results.length} users to import.`);

            for (const row of results) {
                try {
                    // IDUsuario,Email,EmailRegistrado,Apellido,Nombre,Contrasenia,EnviarUnaCopia
                    const email = row.Email ? row.Email.trim() : "";
                    if (!email) {
                        console.log(`Skipping row without email: IDUsuario ${row.IDUsuario}`);
                        continue;
                    }

                    const existing = await prisma.notifiedUser.findFirst({
                        where: {
                            email: email,
                            laboratoryId: targetLaboratoryId
                        }
                    });

                    if (existing) {
                        console.log(`Skipping existing email: ${email}`);
                        continue;
                    }

                    await prisma.notifiedUser.create({
                        data: {
                            codigoExterno: row.IDUsuario,
                            email: email,
                            apellido: row.Apellido || "",
                            nombre: row.Nombre || "",
                            enviarUnaCopia: row.EnviarUnaCopia === '1',
                            laboratoryId: targetLaboratoryId
                        }
                    });
                    console.log(`Imported: ${row.Apellido}, ${row.Nombre} (${email})`);
                } catch (e) {
                    // Handle unique constraint if multiple rows have same email
                    if (e.code === 'P2002') {
                        console.log(`Duplicate email in CSV: ${row.Email}`);
                    } else {
                        console.error(`Error importing ${row.Email}:`, e);
                    }
                }
            }
            console.log("Import finished.");
            await prisma.$disconnect();
        });
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
