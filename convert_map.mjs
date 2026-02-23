import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

console.log(`Converting ${inputPath} to ${outputPath}...`);

sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(outputPath)
    .then(info => {
        console.log('Conversion successful:', info);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error converting file:', err);
        process.exit(1);
    });
