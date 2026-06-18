import fs from 'fs';

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
            console.log(`ℹ found file not in dist! ${file}`);

            const fileFromHtmlDir = `${htmlTarget}/${file}`;
            const fileFromDistDir = `${distTarget}/${file}`;

            fs.copyFileSync(fileFromHtmlDir, fileFromDistDir);

            // check just to make sure
            const fileFromHtml = fs.statSync(fileFromHtmlDir);
            const fileFromDist = fs.statSync(fileFromDistDir);
            if (fileFromHtml.size !== fileFromDist.size) console.warn(`⚠ file copied does not match the size from the html dir. you've been warned.....`);

            console.log(`✅ file copied!`);
        }
    });
}

export function addFinal() {
    checkDistfromHtml('downloads');
}
