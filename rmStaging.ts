import fs from "fs";

import config from "./config.json"


/**
 * remove the staging folder that was defined in the `config.json` file
 */
export function rmStaging():void {
    console.log('🔃 removing staging dir...');
    fs.rmSync(config.stagingHtmlDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100
    });
    console.log('✅ removed staging dir!');
}

// most likely running directly from console
if (process.env.NODE_ENV == undefined) rmStaging();
