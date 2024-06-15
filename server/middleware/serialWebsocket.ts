/*
 * File: serialWebsocket.ts
 * Project: platformio-web-flasher
 * Created Date: 2024-06-14 11:55:12
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-15 19:59:49
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


import { WebSocketServer } from "ws";
import { addStoredWebSocket, getStoredWebSocket } from "~/stores/storeSockets";


let tempId = "123456"; // TODO: Temp id for testing


export default defineEventHandler((event) => {

    const ip = String(event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress).replace("::ffff:", ""); // Get IP of visitor

    if (event.node.req.url != "/") return; // Ignore favicon.ico and other subpath requests

    console.log(`[DEBUG] Received WebSocketServer request from user '${ip}' at '${event.node.req.url}'...`);


    // Attempt to get existing WebSocket from storage
    let wss = getStoredWebSocket(tempId)?.wss;

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

        // Listen for incoming messages and log them
        socket.on("message", function (message) {
            console.log("WebSocket Message: " + message);
        });

        // Example: Send dummy data after 5 seconds
        setTimeout(() => {
            socket.send("+ResourceMonitorLinuxServer-v0.8.0#");
        }, 5000);

    });

});
