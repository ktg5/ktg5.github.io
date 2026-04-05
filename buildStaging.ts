import path from 'path';
import { fileURLToPath } from "url";
import fs from "fs";
import { rmStaging } from './rmStaging';

import config from "./config.json";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * copy files so that linux moment doesn't happen
 */
async function copyFileStream(src: string, dest: string) {
    await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(src);
        const writeStream = fs.createWriteStream(dest);

        readStream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("close", resolve);

        readStream.pipe(writeStream);
    });
}

/**
 * copy directory to new directory
 */
async function copyDir(sourceDir: string, newDir: string):Promise<void> {
    // Get dirs in the project folder.
    var dirs = fs.readdirSync(sourceDir, { withFileTypes: true });
    fs.mkdirSync(newDir);
    
    // now we finna do something with all of these dirs
    for (let entry of dirs) {
        // Folders & files that we AIN'T ALLOWIN'!
        if (
            entry.name === '.git' ||
            entry.name === '.github' ||
            entry.name === 'psds' ||
            entry.name === 'node_modules' ||
            entry.name === 'build.js' ||
            entry.name === 'package-lock.json' ||
            entry.name === 'package.json'
        ) continue;

        // Paths
        var sourcePath = path.join(sourceDir, entry.name);
        var newPath = path.join(newDir, entry.name);
        switch (entry.name) {
            case "tobethereadme":
                newPath = path.join(newDir, "README");
            break;
        }

        // If the files passed the vibe check, we go.
        if (entry.isDirectory()) {
            await copyDir(sourcePath, newPath);
        } else {
            await copyFileStream(sourcePath, newPath);
        }
    }
}


export async function buildStaging():Promise<void> {
    return new Promise<void>((resolve) => {
        function replaceMatches(match: string, tag: string) {
            switch (tag) {
                // nav & footer
                case "nav":
                    return fs.readFileSync('./html/defs/nav.html', { encoding: 'utf-8' });
                case "footer":
                    return fs.readFileSync('./html/defs/footer.html', { encoding: 'utf-8' });
        
                    
                // default error message
                default:
                    return `<kbd>buildStaging.ts:replaceMatches :: unknown match: ${match}</kbd>`;
            }
        }
        
        
        // for replacing HTML stuff with our own
        function replaceHtml(dir: string, base = dir):Promise<void> {
            return new Promise<void>((resolve) => {
                for (const file of fs.readdirSync(dir)) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
            
                    // run in dir if is a dir
                    // + ignore defaults dir
                    if (
                        stat.isDirectory()
                        && file !== "defs"
                    ) replaceHtml(fullPath, base);
                    else if (file.endsWith('.html')) {
                        const fileText = fs.readFileSync(fullPath, { encoding: 'utf-8' });
                        const output = fileText.replaceAll(/<\*--\s*(.*?)\s*--\*>/g, replaceMatches);
                        fs.writeFileSync(fullPath, output, { encoding: 'utf-8' });
                    }
                }
                resolve();
            });
        };
        
        
        // copy current html folder
        console.log(`🔃 copying current "${config.baseHtmlDir}" folder to a "${config.stagingHtmlDir}" for Vite to compile...`);
        if (fs.existsSync(config.stagingHtmlDir)) rmStaging();
        copyDir(config.baseHtmlDir, config.stagingHtmlDir).then(async () => {
            console.log('✅ copy complete!');
        
            // replace the html within the staging folder
            console.log('🔃 looking for & replacing all lines that want some html...');
            await replaceHtml(path.resolve(__dirname, config.stagingHtmlDir));

            // end
            console.log('✅ replaced html lines!');
            resolve();
        });
    });
}
