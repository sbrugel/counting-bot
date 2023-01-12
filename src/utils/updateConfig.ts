import { writeFileSync } from "fs";
import { join } from 'path';

export function updateConfig(config) {
    writeFileSync(join(__dirname, '..', 'config.json'), JSON.stringify(config, null, '\t')); // write to config in production
    writeFileSync(join(__dirname, '../../src', 'config.ts'), `export const BOT = ${JSON.stringify(config, null, '\t')};`); // write to config in src (with modifications)
    delete require.cache[require.resolve('../config.json')];
}