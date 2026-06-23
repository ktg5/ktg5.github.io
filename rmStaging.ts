import fs from "fs";
import path from "path";

import config from "./config.json"


/**
 * remove the staging folder that was defined in the `config.json` file
 */
export function rmStaging():void {
    console.log('🔃 removing staging dir...');
    try {
        // Read all items inside the directory
        const files = fs.readdirSync(config.stagingHtmlDir);
        
        // Loop through and delete the contents, not the parent folder
        for (const file of files) {
            fs.rmSync(path.join(config.stagingHtmlDir, file), { 
                recursive: true, 
                force: true,
                maxRetries: 10,
                retryDelay: 100
            });
        }
        console.log('✅ staging dir emptied!');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('✅ staging dir does not exist yet, safe to proceed.');
        } else {
            console.error('❌ Failed to empty directory:', error.message);
        }
    }
}

// most likely running directly from console
if (process.env.NODE_ENV == undefined) rmStaging();
