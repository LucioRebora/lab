const fs = require('fs');
const path = require('path');

// Función para cargar .env manualmente si no se usa un preloader como dotenv o bun
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
        console.log('✅ .env cargado correctamente');
    } else {
        console.warn('⚠️ No se encontró el archivo .env en: ' + envPath);
    }
}

async function enviarRegistro(nombreTabla, datos, codigoExterno = null) {
    // Si no están las variables, intentamos cargarlas
    if (!process.env.BIOITIA_API_KEY) loadEnv();

    const apiKey = process.env.BIOITIA_API_KEY;
    const serverUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const laboratoryId = 'cmm58sbbt0000xw4pp6ynzgyi'; // O tomar de env si es variable

    if (!apiKey) {
        console.error('❌ Error: BIOITIA_API_KEY no definida en .env');
        return;
    }

    try {
        const response = await fetch(`${serverUrl}/api/envio-datos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                nombreTabla,
                datos,
                codigoExterno: codigoExterno || datos.IDSubResultado,
                laboratoryId
            })
        });

        const result = await response.json();
        if (response.ok) {
            if (result.skipped) {
                console.log(`⏩ Omitido: ${nombreTabla} - ID: ${codigoExterno || datos.IDSubResultado} (Filtro aplicado)`);
            } else {
                console.log(`✅ Enviado con éxito: ${nombreTabla} - ID: ${result.id}`);
            }
        } else {
            console.error(`❌ Error al enviar: ${result.error}`);
        }
    } catch (error) {
        console.error(`❌ Error de conexión: ${error.message}`);
    }
}

// Ejemplo de uso:
// enviarRegistro("PRO SubResultados", { IDSubResultado: 3251277, Resultado: "Positivo" });

module.exports = { enviarRegistro, loadEnv };
