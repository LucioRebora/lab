const fs = require('fs');
const csv = require('csv-parser');

const names = new Map();
const duplicates = [];

fs.createReadStream('c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\determinations\\determinations.csv')
    .pipe(csv({ headers: false }))
    .on('data', (row) => {
        const name = row[1];
        if (!name) return;
        if (names.has(name)) {
            names.get(name).push(row[0]);
        } else {
            names.set(name, [row[0]]);
        }
    })
    .on('end', () => {
        for (const [name, ids] of names.entries()) {
            if (ids.length > 1) {
                duplicates.push({ name, count: ids.length, ids });
            }
        }
        console.log(JSON.stringify(duplicates, null, 2));
    });
