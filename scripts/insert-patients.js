const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function main() {
    const filePath = path.join(__dirname, 'patients.txt');
    let rawData = '';

    try {
        rawData = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading the file ${filePath}. Please make sure it exists and contains your list of patients.`);
        return;
    }

    // Parse lines, ignoring empty or irrelevant ones
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l && !l.toLowerCase().includes('columna:'));

    const patientsToInsert = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by the first comma to get Apellido, Nombre
        const parts = line.split(',');

        if (parts.length >= 2) {
            const apellido = parts[0].trim();
            // Join the rest back in case the name contains a comma
            const nombre = parts.slice(1).join(',').trim();

            patientsToInsert.push({
                apellido: apellido,
                nombre: nombre,
                sexo: '',
                tipoDocumento: '',
                documento: `TEMP-${Date.now()}-${i}`, // Unique constraint requires distinct values
                fechaNacimiento: new Date(0).toISOString(), // Need a valid Date for Prisma
                edad: 0,
                email: '',
                direccion: '',
                entreCalles: '',
                ciudad: '',
                provincia: '',
                codigoPostal: '',
                telefonoCasa: '',
                telefonoTrabajo: '',
                otroTelefono: '',
                notasClinicas: '',
                laboratoryId: LAB_ID,
            });
        } else {
            // If there's no comma, assume the whole string is the last name or name
            patientsToInsert.push({
                apellido: line,
                nombre: '',
                sexo: '',
                tipoDocumento: '',
                documento: `TEMP-${Date.now()}-${i}`,
                fechaNacimiento: new Date(0).toISOString(),
                edad: 0,
                email: '',
                direccion: '',
                entreCalles: '',
                ciudad: '',
                provincia: '',
                codigoPostal: '',
                telefonoCasa: '',
                telefonoTrabajo: '',
                otroTelefono: '',
                notasClinicas: '',
                laboratoryId: LAB_ID,
            });
        }
    }

    console.log(`Parsed ${patientsToInsert.length} patients. Starting insertion...`);

    let successCount = 0;
    let failCount = 0;

    for (const patient of patientsToInsert) {
        try {
            await prisma.patient.create({
                data: patient
            });
            successCount++;
        } catch (e) {
            failCount++;
            console.error(`Failed to insert patient: ${patient.apellido}, ${patient.nombre}. Error:`, e.message);
        }
    }

    console.log('--- DONE ---');
    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Failed to insert: ${failCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
