const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

function findRouteFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findRouteFiles(filePath, fileList);
        } else if (file === 'route.ts' && filePath.includes('[id]')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const routeFiles = findRouteFiles(apiDir);

let changed = 0;
for (const file of routeFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let updated = false;

    // Pattern to match Next.js 13/14 [id] params
    const paramPattern1 = /({ params }\s*:\s*{\s*params\s*:\s*{\s*id\s*:\s*string\s*}\s*})/g;
    if (paramPattern1.test(content)) {
        content = content.replace(paramPattern1, '{ params }: { params: Promise<{ id: string }> }');
        updated = true;
    }

    // Replace `const id = params.id;` or `const { id } = params;`
    const idPattern1 = /(?:const|let)\s+id\s*=\s*params\.id\s*;/g;
    if (idPattern1.test(content)) {
        content = content.replace(idPattern1, 'const { id } = await params;');
        updated = true;
    }

    const idPattern2 = /(?:const|let)\s+{\s*id\s*}\s*=\s*params\s*;/g;
    if (idPattern2.test(content)) {
        content = content.replace(idPattern2, 'const { id } = await params;');
        updated = true;
    }

    if (updated) {
        // Check if the functions are async. Export async function is standard, but let's just make sure.
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
        changed++;
    }
}

console.log(`Done. Updated ${changed} files.`);
