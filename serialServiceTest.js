/*
 * File: serialTest.js
 * Project: platformio-web-flasher
 * Created Date: 2024-06-16 14:41:35
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-16 15:54:30
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



const { spawn, fork } = require("child_process");


// Test ID; make sure mount directory already exists
const id = "123456";


// Spawn serialService process for this ID
console.log(`[DEBUG] Spawning new serialService for id '${id}'...`);

let serialProcess = spawn('node', ['./data/mounts/serialService.mjs', id], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});


// Log messages received from service and handle errors
serialProcess.on("message", (message) => {
    console.log("SerialProcess Message: " + JSON.stringify(message));
});

serialProcess.on("error", (err) => {
    console.log("SerialProcess Error: " + err);
});


// Provide function to write to serial device
const writeData = (data) => {
    if (serialProcess) {
        serialProcess.send({ type: "write", data });
    }
};


// Send some test data after 5 seconds
setTimeout(() => {
    writeData("+ResourceMonitorClient-v0.8.0#")
}, 5000);
