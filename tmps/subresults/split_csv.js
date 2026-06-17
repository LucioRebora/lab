const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inputFilePath = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv';
const outputDir = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults';
const parts = 4;

async function splitCSV() {
    console.log(`Starting to split ${inputFilePath} into ${parts} parts...`);

    // First, let's count total lines to determine chunk size
    console.log('Counting total lines...');
    const rlCount = readline.createInterface({
        input: fs.createReadStream(inputFilePath),
        crlfDelay: Infinity
    });

    let totalLines = 0;
    let header = '';

    for await (const line of rlCount) {
        if (totalLines === 0) {
            header = line;
        }
        totalLines++;
    }

    console.log(`Total lines (including header): ${totalLines}`);

    // Calculate lines per file (excluding header)
    const dataLines = totalLines - 1;
    const linesPerPart = Math.ceil(dataLines / parts);

    console.log(`Lines per part: ~${linesPerPart}`);

    // Now perform the actual split
    const rlSplit = readline.createInterface({
        input: fs.createReadStream(inputFilePath),
        crlfDelay: Infinity
    });

    let currentPart = 1;
    let currentLine = 0;
    let currentLinesInPart = 0;
    let writeStream = createWriteStream(currentPart);

    for await (const line of rlSplit) {
        currentLine++;

        if (currentLine === 1) {
            // First file needs header, already added in createWriteStream
            continue;
        }

        if (currentLinesInPart >= linesPerPart && currentPart < parts) {
            writeStream.end();
            console.log(`Finished Part ${currentPart}`);
            currentPart++;
            currentLinesInPart = 0;
            writeStream = createWriteStream(currentPart);
        }

        writeStream.write(line + '\n');
        currentLinesInPart++;

        if (currentLine % 500000 === 0) {
            console.log(`Processed ${currentLine} lines...`);
        }
    }

    writeStream.end();
    console.log(`Finished Part ${currentPart}`);
    console.log('Split complete!');
}

function createWriteStream(partNumber) {
    const outputPath = path.join(outputDir, `SubResultados_part${partNumber}.csv`);
    const stream = fs.createWriteStream(outputPath);
    console.log(`Creating ${outputPath}`);
    // Assume header is "IDSubResultado,IDResultado,IDSubDeterminacion,Resultado,Comentario"
    const header = "IDSubResultado,IDResultado,IDSubDeterminacion,Resultado,Comentario\n";
    stream.write(header);
    return stream;
}

splitCSV().catch(console.error);
