/*
 * File: serialService.mjs
 * Project: platformio-web-flasher
 * Created Date: 2024-06-16 14:18:34
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-16 16:02:02
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// This file gets spawned by a parent process and emulates a serial device.
// The service reads data from it, passes it back to the parent process and allows writing to it.


import { exec } from "child_process";
import { SerialPort } from "serialport";


const id        = process.argv[2];          // The argv[2] parameter contains the device ID which this service should handle
const logPrefix = `[SerialService-${id}] `;

process.title = `SerialService-${id}`;


// Create virtual serial ports VIRT0 & VIRT1
console.log(logPrefix + "Opening virtual serial ports...");

exec(`socat PTY,link=./data/mounts/${id}/ttyVIRT0,mode=666 PTY,link=./data/mounts/${id}/ttyVIRT1,mode=666`, (err) => {
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
        path: `./data/mounts/${id}/ttyVIRT1`,
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
