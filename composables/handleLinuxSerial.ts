/*
 * File: handleLinuxSerial.ts
 * Project: nuxt-webserial
 * Created Date: 2024-06-15 12:26:55
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-20 10:43:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */


import { ChildProcess, spawn } from "child_process";


// Handles spawning a new serialService process and interfaces with it
export class SerialDevice {
    serialProcess: ChildProcess;


    /**
     * Creates a new serial device
     * @param id UUID of the device to create
     * @param write Function used to send back data read from device
     */
    constructor(id: string, write: (data: string) => void) {
        console.log(`[DEBUG] Spawning new serialService for id '${id}'...`);

        // Spawn new service
        this.serialProcess = spawn('node', ['./data/mounts/serialService.mjs', id], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });


        // Attach event handlers for listening and handling errors
        this.serialProcess.on("message", (message: { type: string, data: string }) => {
            console.log(`[DEBUG] SerialProcess-${id} Message: ${JSON.stringify(message)}`);

            if (message.type == "data") write(message.data);
        });

        this.serialProcess.on("error", (err: any) => {
            console.log(`[DEBUG] SerialProcess-${id} Error: ${JSON.stringify(err)}`);
        });
    }


    /**
     * Writes data to the device
     * @param data Data to write
     */
    writeData(data: string) {
        if (!this.serialProcess) throw("SerialService is not running, cannot write!");

        this.serialProcess.send({ type: "write", data });
    }
}
