/*
 * File: serialWebsocket.ts
 * Project: nuxt-webserial
 * Created Date: 2024-06-14 11:55:12
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


import { WebSocketServer } from "ws";
import { SerialDevice } from "~/composables/handleLinuxSerial";
import { addStoredWebSocket, getStoredWebSocket } from "~/stores/storeSockets";


let tempId = "123456"; // TODO: Temp id for testing


export default defineEventHandler((event) => {

    // Get IP of visitor
    const ip = String(event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress).replace("::ffff:", "");

    // Ignore favicon.ico and other subpath requests
    if (event.node.req.url != "/") return;

    console.log(`[DEBUG] Received WebSocketServer request from user '${ip}' at '${event.node.req.url}'...`);


    // Attempt to get existing WebSocket from storage
    let wss = getStoredWebSocket(tempId)?.wss;

    // Create new websocket if none exists yet
    if (!wss) {
        console.log(`[DEBUG] No WebSocketServer stored for user '${ip}', creating a new one...`);

        // Create a new WebSocketServer and add it to the storage
        wss = new WebSocketServer({ server: event.node.res.socket?.server });
        addStoredWebSocket(tempId, wss);

    } else {

        console.log(`[DEBUG] Existing WebSocketServer found for user '${ip}', reusing it...`);
        return; // Do not attach another event listener
    }


    // Wait for connection
    wss.on("connection", function (socket) {

        console.log(`[DEBUG] WebSocketServer Connection with user '${ip}' established!`);

        // Function for sending data back from SerialDevice to websocket. `socket.send` cannot be passed directly to SerialDevice, presumably due to context issues(?)
        const socketSend = (data: string) => {
            socket.send(data);
        }

        // Create new virtual SerialDevice for other processes to interface with
        const device = new SerialDevice(tempId, socketSend);

        // Listen for incoming messages and forward them to the serial device
        socket.on("message", function (message) {
            console.log("[DEBUG] WebSocketServer Message: " + message);
            device.writeData(message.toString());
        });

    });

});
