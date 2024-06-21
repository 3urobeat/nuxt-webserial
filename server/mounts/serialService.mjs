/*
 * File: serialService.mjs
 * Project: nuxt-webserial
 * Created Date: 2024-06-16 14:18:34
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-21 11:09:35
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */


// This file gets spawned by a parent process and emulates a serial device.
// The service reads data from it, passes it back to the parent process and allows writing to it.
// This cannot directly be done from Nuxt because it causes a V8 engine missing lock exception


import { exec } from "child_process";
import { SerialPort } from "serialport";
import fs from "fs";


const id        = process.argv[2];          // The argv[2] parameter contains the device ID which this service should handle
const logPrefix = `[SerialService-${id}] `;

process.title = `SerialService-${id}`;      // Make this process identifiable in process monitors


// Create folder for ID if it doesn't exist yet
if (!fs.existsSync(`./server/mounts/${id}`)) {
    console.log(logPrefix + "Creating new mount point for ID " + id);
    fs.mkdirSync(`./server/mounts/${id}`);
}


// Create raw virtual serial ports VIRT0 & VIRT1
console.log(logPrefix + "Opening virtual serial ports...");

exec(`socat pty,rawer,echo=0,nonblock,ignoreof,mode=660,link=./server/mounts/${id}/ttyVIRT0 pty,rawer,echo=0,nonblock,ignoreof,mode=660,link=./server/mounts/${id}/ttyVIRT1`, (err) => {
    if (err) {
        console.log(logPrefix + "Failed to create virtual serial port using 'socat'!\n" + err);
        process.exit(1);
    }
});


// Start handling serial ports after 2.5 seconds. We cannot run this from the callback as socat does not exit and therefore the callback will never happen
setTimeout(() => {
    console.log(logPrefix + "Starting to listen to virtual serial ports...");

    // Open the serial port
    const port = new SerialPort({
        path: `./server/mounts/${id}/ttyVIRT1`,
        baudRate: 9600,
        autoOpen: false
    });

    port.open((err) => {
        if (err) {
            console.error(logPrefix + "Error opening port: " + err.message);
            process.send({ type: "error", data: err.message });
            return;
        }

        console.log(logPrefix + "Port opened successfully");
        process.send({ type: "open", data: "Port opened successfully" });
    });

    port.on("error", (err) => {
        process.send({ type: "error", data: err.message });
    });


    // Handle data received from the serial port and send it to the parent process
    let dataBuffer = "";

    port.on("data", (data) => {
        dataBuffer += data.toString();

        const lines = dataBuffer.split("\n");

        // Process all lines except the last one (could be incomplete)
        for (let i = 0; i < lines.length - 1; i++) {
            process.send({ type: "data", data: lines[i] });
        }

        // Keep the last (potentially incomplete) line in the buffer
        dataBuffer = lines[lines.length - 1];
    });


    // Receive data from the parent process and forward it to the SerialDevice
    process.on("message", (message) => {
        if (message.type != "write") return; // Ignore messages that are not of type write

        port.write(message.data, (err) => {
            if (err) process.send({ type: "error", data: err.message });
        });
    });


    // Close port on exit
    process.on("SIGINT", () => {
        if (fs.existsSync(`./server/mounts/${id}`)) {
            console.log(logPrefix + "Removing mount point for ID " + id);
            fs.rmdirSync(`./server/mounts/${id}`);
        }

        port.close((err) => {
            if (err) {
                process.send({ type: "error", data: err.message });
            } else {
                process.send({ type: "close", data: "Port closed successfully" });
            }

            process.exit();
        });
    });
}, 2500);
