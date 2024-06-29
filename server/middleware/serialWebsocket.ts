/*
 * File: serialWebsocket.ts
 * Project: nuxt-webserial
 * Created Date: 2024-06-14 11:55:12
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-29 20:08:00
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */


import { WebSocketServer } from "ws";
import { SerialDevice } from "~/server/serialDevice";


let wsOpened = false;


export default defineEventHandler((event) => {

    // Get IP of visitor
    const ip = String(event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress).replace("::ffff:", "");

    // Ignore favicon.ico and other subpath requests
    if (event.node.req.url != "/") return;


    // TODO: You would need to implement some sort of storage here to support multiple concurrent sessions

    // Create new websocket server if none currently exists
    if (wsOpened) return console.log(`[DEBUG] Ignoring WebSocketServer request from user '${ip}' because there is already a socket open...`);
    wsOpened = true;

    console.log(`[DEBUG] Received WebSocketServer request from user '${ip}' at '${event.node.req.url}'...`);

    let wss = new WebSocketServer({ server: event.node.res.socket?.server });
    let device : SerialDevice | null;


    // Wait for connection
    wss.on("connection", (socket) => {
        console.log(`[DEBUG] WebSocketServer Connection with user '${ip}' established!`);

        // Cleanup this connection
        socket.on("close", () => {
            console.log("[DEBUG] Socket closed, closing SerialDevice...");

            device!.serialProcess.kill();
            device = null;
            socket.close();
        })


        // Function for sending data back from SerialDevice to websocket. `socket.send` cannot be passed directly to SerialDevice, presumably due to context issues(?)
        const socketSend = (data: string) => {
            socket.send(data);
        }

        // Create new virtual SerialDevice for other processes to interface with
        const tempId = Math.random().toString(36).slice(-10); // Generate some random key to differentiate this request from others

        device = new SerialDevice(tempId, socketSend);

        // Listen for incoming messages and forward them to the serial device
        socket.on("message", function (message) {
            console.log("[DEBUG] WebSocketServer Message: " + message);
            device!.writeData(message.toString());
        });
    });

    // Cleanup on disconnect
    wss.on("close", () => {
        console.log("[DEBUG] WebSocketServer closed!");
        wsOpened = false;
    });

});
