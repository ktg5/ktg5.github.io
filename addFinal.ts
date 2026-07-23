import fs from 'fs';
import { parseHTML } from 'linkedom';

import config from "./config.json";


function checkDistfromHtml(targetDir: string) {
    const distTarget = `${config.outDir}/${targetDir}`;
    const distTargetList = fs.readdirSync(distTarget);
    const htmlTarget = `${config.baseHtmlDir}/${targetDir}`;
    const htmlTargetList = fs.readdirSync(htmlTarget);

    console.log(`🔃 checking "${distTarget}"`);

    htmlTargetList.forEach((file) => {
        const filefromHtmltoDist = distTargetList.find((distFile) => distFile === file);
        if (filefromHtmltoDist === undefined) {
            try {
                console.log(` - found file not in dist: "${htmlTarget}/${file}"`);

                const fileFromHtmlDir = `${htmlTarget}/${file}`;
                const fileFromDistDir = `${distTarget}/${file}`;

                fs.copyFileSync(fileFromHtmlDir, fileFromDistDir);

                // check just to make sure
                const fileFromHtml = fs.statSync(fileFromHtmlDir);
                const fileFromDist = fs.statSync(fileFromDistDir);
                if (fileFromHtml.size !== fileFromDist.size) console.warn(`⚠ file copied does not match the size from the html dir. you've been warned.....`);
            } catch (error) {
                console.error(error);
                throw new Error('❌️ Error occured when copying files! Issue reported above.');
            }
        }
    });

    console.log(`✅ files copied!`);
}


export function addFinal() {
    fs.copyFileSync('CNAME', `${config.outDir}/CNAME`);

    checkDistfromHtml('downloads');

    console.log(`🔃 fixing "link[rel="stylesheet"]" divs for webkit browsers...`);
    const appxHtmlRoot = `${config.outDir}/html`;
    const appxHtmlDir = fs.readdirSync(appxHtmlRoot);
    appxHtmlDir.forEach((appxHtml) => {
        try {
            // make a html parser
            const appxRoot = `${appxHtmlRoot}/${appxHtml}`;
            const appxHtmlSync = fs.readFileSync(appxRoot, { encoding: 'utf-8' });
            const { document } = parseHTML(appxHtmlSync);

            // get all 'link[rel="stylesheet"]' divs
            document.querySelectorAll('link[rel="stylesheet"]').forEach((stylesheet) => {
                stylesheet.setAttribute('type', 'text/css');
                console.log(` - <link href="${stylesheet.getAttribute('href')}" rel="stylesheet"> fixed in "${appxRoot}"`)
            });

            // set back to file
            fs.writeFileSync(appxRoot, document.toString(), { encoding: 'utf-8' });
        } catch (error) {
            console.error(error);
            throw new Error('❌️ Error occured when fixing link elements! Issue reported above.');
        }
    });
    console.log(`✅ fixed stylesheet links!`);
}
