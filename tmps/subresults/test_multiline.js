const fs = require('fs');
const readline = require('readline');

function parseCsvLine(text) {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (c === ',' && !inQ) {
            cols.push(cur.trim());
            cur = '';
        } else cur += c;
    }
    cols.push(cur.trim());
    return cols;
}

async function testParsing() {
    const filePath = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv';
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    let lineNum = 0;
    let currentRecord = "";
    let inQuotes = false;
    let recordsFound = 0;

    console.log("Probando nuevo sistema de agrupación de líneas...");

    for await (const line of rl) {
        lineNum++;

        // Count non-escaped quotes to see if the record is complete
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                if (i > 0 && line[i - 1] === '\\') continue;
                if (line[i + 1] === '"') { i++; continue; }
                inQuotes = !inQuotes;
            }
        }

        currentRecord += (currentRecord ? "\n" : "") + line;

        if (!inQuotes) {
            const cols = parseCsvLine(currentRecord);
            // Check if this record is the famous 18279
            if (cols[0] === '18279') {
                console.log("\n[EXITO] Registro 18279 recuperado completo:");
                console.log("- ID:", cols[0]);
                console.log("- Comentario unido:\n", cols[4]);
            }
            if (cols[0] === '35732') {
                console.log("\n[EXITO] Registro 35732 (Bilirrubina) recuperado completo:");
                console.log("- ID:", cols[0]);
                console.log("- Comentario unido:\n", cols[4]);
            }

            currentRecord = "";
            recordsFound++;
        }

        if (lineNum > 40000) break;
    }
}

testParsing();
