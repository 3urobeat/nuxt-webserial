/*
 * File: handleLinuxSerial.ts
 * Project: platformio-web-flasher
 * Created Date: 2024-06-15 12:26:55
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-16 16:19:08
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import { ChildProcess, spawn } from 'child_process';


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

        this.serialProcess.on("error", (err) => {
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
