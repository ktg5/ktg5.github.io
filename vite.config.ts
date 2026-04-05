import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

import config from "./config.json";

import { buildStaging } from "./buildStaging";
import { rmStaging } from './rmStaging';


const rootDir = config.stagingHtmlDir;

/**
 * get a list for file entries for Vite to complie (with sub-direcories included)
 */
function getHtmlEntries(dir: string, base = dir, entries: Record<string, string> = {}): Record<string, string> {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) getHtmlEntries(fullPath, base, entries);
        else if (file.endsWith('.html')) {
            if (
                file.startsWith('_template')
            ) continue;

            const name = path
                .relative(base, fullPath)
                .replace(/\\/g, '/')
                .replace(/\.html$/, '');

            entries[name] = '/' + name + '.html';
        }
    }

    return entries;
}


// build staging dir
await buildStaging();
// cleanup when closing (only for building--developemnt process must run the rmStage script)
switch (process.env.NODE_ENV) {
    case "production":
        process.on('exit', () => {
            rmStaging();
            // process.exit(0);
        });
    break;

    case undefined:
        console.log('what.');
    break;

    default:
        console.log(`⚠  staging dir was made--make sure to run "npm run rmStage" to manually remove the staging folder.`);
        ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP', 'exit'].forEach(signal => {
            process.on(signal, () => {
                if (signal != "exit") console.log(`⚠  please run "npm run rmStage" to manually remove the staging folder.`);
                process.exit(0);
            });
        });
    break;
}



// vite config
export default defineConfig({
    root: rootDir,

    build: {
        outDir: path.resolve(__dirname, config.outDir),
        emptyOutDir: true,
        watch: null,

        rollupOptions: {
            input: getHtmlEntries(path.resolve(__dirname, rootDir))
        }
    }
});
